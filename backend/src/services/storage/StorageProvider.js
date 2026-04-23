class StorageProvider {
  async uploadFile(_fileBuffer, _folder, _filename, _mimeType) {
    throw new Error('Not implemented');
  }

  async createFolderIfNotExists(_folderName) {
    throw new Error('Not implemented');
  }

  async listFiles(_folder) {
    throw new Error('Not implemented');
  }
}

module.exports = StorageProvider;
