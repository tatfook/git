
const _path = require("path");
const _fs = require("fs");
const _ = require("lodash");
const Git = require("nodegit");
const base64 = require('js-base64').Base64;

class GitStore {
	constructor(opts) {
		this.storePath = opts.storePath || "data";
	}


}

module.exports = GitStore;
