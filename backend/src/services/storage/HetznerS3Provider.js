const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  HeadObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const StorageProvider = require('./StorageProvider');

class HetznerS3Provider extends StorageProvider {
  constructor(userId) {
    super();
    this.userId = String(userId || 'anonymous');
    this.bucket = process.env.HETZNER_S3_BUCKET;
    this.client = new S3Client({
      endpoint: process.env.HETZNER_S3_ENDPOINT,
      region: process.env.HETZNER_S3_REGION || 'eu-central-1',
      credentials: {
        accessKeyId: process.env.HETZNER_S3_ACCESS_KEY,
        secretAccessKey: process.env.HETZNER_S3_SECRET_KEY,
      },
      forcePathStyle: true,
    });
  }

  /** Gleiche Pfadlogik wie GoogleDriveProvider: userId/Kategorie/[Anbieter/]Dateiname.pdf */
  _buildPath(folder, filename, force = false) {
    const filenameParts = (filename || '').split('_').filter(Boolean);
    const anbieter = filenameParts.length >= 3 ? filenameParts[filenameParts.length - 1] : '';

    const normalizedBaseName = force ? `${filename}_${Date.now()}` : filename;
    const targetFileName = `${normalizedBaseName}.pdf`;

    if (anbieter) {
      return `${this.userId}/${folder}/${anbieter}/${targetFileName}`;
    }
    return `${this.userId}/${folder}/${targetFileName}`;
  }

  /**
   * @param {string} key
   * @returns {{ kategorie: string; anbieter: string | null; dateiname: string } | null}
   */
  _parseObjectKey(key) {
    const parts = key.split('/');
    const uid = parts[0];
    if (uid !== this.userId || parts.length < 3) {
      return null;
    }

    if (parts.length === 4 && /^\d{4}$/.test(parts[1])) {
      return {
        kategorie: parts[2],
        anbieter: null,
        dateiname: parts[3],
      };
    }

    if (parts.length === 4) {
      return {
        kategorie: parts[1],
        anbieter: parts[2],
        dateiname: parts[3],
      };
    }

    if (parts.length === 3) {
      return {
        kategorie: parts[1],
        anbieter: null,
        dateiname: parts[2],
      };
    }

    return null;
  }

  _isNotFound(err) {
    return err?.name === 'NotFound' || err?.$metadata?.httpStatusCode === 404;
  }

  async uploadFile(fileBuffer, folder, filename, mimeType, force = false) {
    const path = this._buildPath(folder, filename, force);
    const fileName = path.split('/').pop() || `${filename}.pdf`;

    if (!force) {
      try {
        await this.client.send(
          new HeadObjectCommand({
            Bucket: this.bucket,
            Key: path,
          })
        );
        const signedUrl = await getSignedUrl(
          this.client,
          new GetObjectCommand({ Bucket: this.bucket, Key: path }),
          { expiresIn: 3600 }
        );
        return {
          fileId: path,
          fileName,
          webViewLink: signedUrl,
          storagePath: path,
          duplicate: true,
        };
      } catch (e) {
        if (!this._isNotFound(e)) {
          throw e;
        }
      }
    }

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: path,
        Body: fileBuffer,
        ContentType: mimeType || 'application/pdf',
        Metadata: {
          userid: this.userId,
          folder: String(folder || ''),
          filename: String(filename || ''),
        },
      })
    );

    const signedUrl = await getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: path }),
      { expiresIn: 3600 }
    );

    return {
      fileId: path,
      fileName,
      webViewLink: signedUrl,
      storagePath: path,
      duplicate: false,
    };
  }

  async createFolderIfNotExists(folderName) {
    return `${this.userId}/${folderName}`;
  }

  async listFiles(_folder) {
    const prefix = `${this.userId}/`;

    const objects = [];
    let continuationToken;
    do {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        })
      );
      objects.push(...(response.Contents || []));
      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);

    /** @type {Record<string, { name: string; modifiedTime: Date | null; subFolders: Record<string, { name: string; files: unknown[]; modifiedTime: Date | null }>; directFiles: unknown[]; directModified: Date | null }>} */
    const categories = {};

    for (const obj of objects) {
      if (!obj.Key) continue;
      const parsed = this._parseObjectKey(obj.Key);
      if (!parsed) continue;

      const { kategorie, anbieter, dateiname } = parsed;

      if (!categories[kategorie]) {
        categories[kategorie] = {
          name: kategorie,
          modifiedTime: obj.LastModified || null,
          subFolders: {},
          directFiles: [],
          directModified: null,
        };
      }
      const cat = categories[kategorie];

      const touchCatTime = () => {
        if (obj.LastModified && (!cat.modifiedTime || obj.LastModified > cat.modifiedTime)) {
          cat.modifiedTime = obj.LastModified;
        }
      };

      const fileMeta = {
        id: obj.Key,
        name: dateiname,
        size: obj.Size,
        modifiedTime: obj.LastModified,
      };

      if (anbieter) {
        if (!cat.subFolders[anbieter]) {
          cat.subFolders[anbieter] = {
            name: anbieter,
            files: [],
            modifiedTime: obj.LastModified || null,
          };
        }
        const sub = cat.subFolders[anbieter];
        sub.files.push(fileMeta);
        if (obj.LastModified && (!sub.modifiedTime || obj.LastModified > sub.modifiedTime)) {
          sub.modifiedTime = obj.LastModified;
        }
      } else {
        cat.directFiles.push(fileMeta);
        if (obj.LastModified && (!cat.directModified || obj.LastModified > cat.directModified)) {
          cat.directModified = obj.LastModified;
        }
      }
      touchCatTime();
    }

    const DIRECT_LABEL = '(ohne Anbieter)';

    return Object.values(categories)
      .map((cat) => {
        /** @type {Array<{ name: string; count: number; modifiedTime: Date | null; files: unknown[] }>} */
        const subFolders = Object.values(cat.subFolders).map((sub) => ({
          name: sub.name,
          count: sub.files.length,
          modifiedTime: sub.modifiedTime,
          files: sub.files,
        }));

        if (cat.directFiles.length > 0) {
          subFolders.push({
            name: DIRECT_LABEL,
            count: cat.directFiles.length,
            modifiedTime: cat.directModified,
            files: cat.directFiles,
          });
        }

        subFolders.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de', { sensitivity: 'base' }));

        const count = subFolders.reduce((sum, s) => sum + (Number(s.count) || 0), 0);

        return {
          name: cat.name,
          count,
          modifiedTime: cat.modifiedTime,
          subFolders,
        };
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de', { sensitivity: 'base' }));
  }

  async getSignedDownloadUrl(storagePath, expiresIn = 3600) {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: storagePath }),
      { expiresIn }
    );
  }

  async deleteFile(storagePath) {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: storagePath,
      })
    );
    return true;
  }
}

module.exports = HetznerS3Provider;
