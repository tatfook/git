
const fs = require("fs");
const path = require("path")
const GitStore = require("git-history-store");

module.exports = app => {
	const config = app.config.GitServer;
	
	const storePath = config.storePath;

	app.gitStore = GitStore.create({storePath});
}
