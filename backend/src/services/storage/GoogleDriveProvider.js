const { Readable } = require('stream');
const { google } = require('googleapis');

const StorageProvider = require('./StorageProvider');

class GoogleDriveProvider extends StorageProvider {
  constructor(accessToken) {
    super();
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    this.drive = google.drive({ version: 'v3', auth: oauth2Client });
  }

  async getOrCreateMainFolder() {
    const listResponse = await this.drive.files.list({
      q: `name='DokuHero' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false`,
      fields: 'files(id, name)',
    });

    const existingFolder = listResponse.data.files?.[0];
    if (existingFolder) {
      return existingFolder.id;
    }

    const createResponse = await this.drive.files.create({
      resource: {
        name: 'DokuHero',
        mimeType: 'application/vnd.google-apps.folder',
        parents: ['root'],
      },
      fields: 'id',
    });

    return createResponse.data.id;
  }

  async createFolderIfNotExists(folderName, parentId) {
    const listResponse = await this.drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
      fields: 'files(id, name)',
    });

    const existingFolder = listResponse.data.files?.[0];
    if (existingFolder) {
      return existingFolder.id;
    }

    const createResponse = await this.drive.files.create({
      resource: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      },
      fields: 'id',
    });

    return createResponse.data.id;
  }

  async uploadFile(fileBuffer, folder, filename, mimeType, force = false) {
    const mainFolderId = await this.getOrCreateMainFolder();
    const categoryFolderId = await this.createFolderIfNotExists(folder, mainFolderId);
    const filenameParts = (filename || '').split('_').filter(Boolean);
    const anbieter = filenameParts.length >= 3 ? filenameParts[filenameParts.length - 1] : '';
    const providerFolderId = anbieter
      ? await this.createFolderIfNotExists(anbieter, categoryFolderId)
      : categoryFolderId;
    const normalizedBaseName = force ? `${filename}_${Date.now()}` : filename;
    const targetFileName = `${normalizedBaseName}.pdf`;

    if (!force) {
      const existingFileResponse = await this.drive.files.list({
        q: `name='${targetFileName}' and '${providerFolderId}' in parents and trashed=false`,
        fields: 'files(id, name, webViewLink)',
        pageSize: 1,
      });

      const existingFile = existingFileResponse.data.files?.[0];
      if (existingFile) {
        return {
          fileId: existingFile.id,
          fileName: existingFile.name,
          webViewLink: existingFile.webViewLink,
          duplicate: true,
        };
      }
    }

    const stream = Readable.from(fileBuffer);

    const uploadResponse = await this.drive.files.create({
      resource: {
        name: targetFileName,
        parents: [providerFolderId],
      },
      media: {
        mimeType,
        body: stream,
      },
      fields: 'id, name, webViewLink',
    });

    return {
      fileId: uploadResponse.data.id,
      fileName: uploadResponse.data.name,
      webViewLink: uploadResponse.data.webViewLink,
      duplicate: false,
    };
  }

  async listFiles(_folderName) {
    // Schritt 1: DokuHero Hauptordner finden
    const mainFolderId = await this.getOrCreateMainFolder();

    // Schritt 2: Rekursiv alle Dateien sammeln
    const allFiles = await this.listFilesRecursive(mainFolderId, null);

    // Sortierung: neueste zuerst
    allFiles.sort((a, b) => {
      const tb = new Date(b.modifiedTime || b.createdTime || 0).getTime();
      const ta = new Date(a.modifiedTime || a.createdTime || 0).getTime();
      return tb - ta;
    });

    return allFiles;
  }

  /**
   * @param {string} folderId
   * @param {string | null} categoryName — erster Ordner unter DokuHero (= Kategorie), bleibt für tiefer liegende Ordner gleich
   */
  async listFilesRecursive(folderId, categoryName) {
    const allFiles = [];

    let pageToken = null;
    do {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'nextPageToken, files(id, name, mimeType, createdTime, modifiedTime, size, webViewLink)',
        orderBy: 'modifiedTime desc',
        pageSize: 100,
        pageToken: pageToken || undefined,
      });

      const items = response.data.files || [];

      for (const item of items) {
        if (item.mimeType === 'application/vnd.google-apps.folder') {
          const childCategory = categoryName == null ? item.name : categoryName;
          const subFiles = await this.listFilesRecursive(item.id, childCategory);
          allFiles.push(...subFiles);
        } else {
          allFiles.push({
            id: item.id,
            name: item.name,
            mimeType: item.mimeType,
            createdTime: item.createdTime,
            modifiedTime: item.modifiedTime,
            size: item.size,
            webViewLink: item.webViewLink,
            category: categoryName || 'Allgemein',
          });
        }
      }

      pageToken = response.data.nextPageToken || null;
    } while (pageToken);

    return allFiles;
  }
}

module.exports = GoogleDriveProvider;
