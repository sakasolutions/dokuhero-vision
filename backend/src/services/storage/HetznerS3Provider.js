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

  /** S3-Pfad: userId/year/category/filename */
  _buildPath(folder, filename) {
    const year = new Date().getFullYear();
    return `${this.userId}/${year}/${folder}/${filename}`;
  }

  _normalizePdfFilename(filename) {
    const base = String(filename || 'document').replace(/\.pdf$/i, '');
    return `${base}.pdf`;
  }

  _isNotFound(err) {
    return err?.name === 'NotFound' || err?.$metadata?.httpStatusCode === 404;
  }

  async uploadFile(fileBuffer, folder, filename, mimeType, force = false) {
    const fullFilename = this._normalizePdfFilename(filename);
    const path = this._buildPath(folder, fullFilename);

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
          fileName: fullFilename,
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
      fileName: fullFilename,
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

    const folders = {};

    for (const obj of objects) {
      if (!obj.Key) continue;
      const parts = obj.Key.split('/');
      if (parts.length >= 4) {
        const category = parts[2];
        if (!folders[category]) {
          folders[category] = {
            name: category,
            count: 0,
            modifiedTime: obj.LastModified,
            files: [],
          };
        }
        folders[category].count += 1;
        if (obj.LastModified && folders[category].modifiedTime && obj.LastModified > folders[category].modifiedTime) {
          folders[category].modifiedTime = obj.LastModified;
        }
        folders[category].files.push({
          id: obj.Key,
          name: parts[parts.length - 1],
          size: obj.Size,
          modifiedTime: obj.LastModified,
        });
      }
    }

    return Object.values(folders);
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
