'use strict';

const path = require('path');
const GitStore = require('./app/lib/store');

module.exports = app => {
    const config = app.config.GitServer;
    const storePath = config.storePath;

    app.gitStore = new GitStore({
        storePath,
        gitPath: path.join(storePath, 'git'),
        lockPath: path.join(storePath, 'lock'),
    });
};
