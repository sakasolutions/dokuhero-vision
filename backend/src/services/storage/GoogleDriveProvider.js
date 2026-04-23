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

  async createFolderIfNotExists(folderName) {
    const listResponse = await this.drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
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
      },
      fields: 'id',
    });

    return createResponse.data.id;
  }

  async uploadFile(fileBuffer, folder, filename, mimeType) {
    const folderId = await this.createFolderIfNotExists(folder);
    const stream = Readable.from(fileBuffer);

    const uploadResponse = await this.drive.files.create({
      resource: {
        name: `${filename}.pdf`,
        parents: [folderId],
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
    };
  }

  async listFiles(folder) {
    const folderId = await this.createFolderIfNotExists(folder);
    const listResponse = await this.drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, createdTime, size, webViewLink)',
      orderBy: 'createdTime desc',
    });

    return listResponse.data.files || [];
  }
}

module.exports = GoogleDriveProvider;
