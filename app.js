
const fs = require("fs");
const path = require("path")
const AsyncQueue = require("@wxaxiaoyao/async-queue");

module.exports = app => {
	const config = app.config.GitServer;
	//AsyncQueue.setFileLock(true, config.fileStorePath);
	
	const storePath = config.storePath;
	config.gitPath = path.join(storePath, "git");
	if (!fs.existsSync(config.gitPath)) {
		fs.mkdirSync(config.gitPath);
	}
	config.lockPath = path.join(storePath, "lock");
	if (!fs.existsSync(config.lockPath)) {
		fs.mkdirSync(config.lockPath);
	}
}
