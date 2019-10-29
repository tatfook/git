
const fs = require('fs');
const path = require('path');
const GitStore = require('git-history-store');
// const GitStore = require("../git-store/index.js");

module.exports = app => {
    const config = app.config.GitServer;

    const storePath = config.storePath;

    app.gitStore = GitStore.create({ storePath, gitPath: path.join(storePath, 'git'), lockPath: path.join(storePath, 'gitLock') });
    app.objectStore = GitStore.create({ storePath, gitPath: path.join(storePath, 'object'), lockPath: path.join(storePath, 'objectLock') });
};
