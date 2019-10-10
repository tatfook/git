
const _path = require("path");
const _fs = require("fs");
const _ = require("lodash");
const Service = require('egg').Service;
const Git = require("nodegit");
const base64 = require('js-base64').Base64;

class GitService extends Service {
}

module.exports = GitService;
