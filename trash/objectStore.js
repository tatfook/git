const _path = require('path');
const _fs = require('fs');
const _ = require('lodash');
const assert = require('assert');
const Git = require('nodegit');
const base64 = require('js-base64').Base64;
const AsyncQueue = require('@wxaxiaoyao/async-queue');

const Store = require('./store.js');

class ObjectStore extends Store {
    // 构造函数
    constructor(opts = {}) {
        opts.storeMode = Store.STORE_MODE_GIT;

        super(opts);
    }

    // 解析路径
    parsePath(path) {
        path = _.trim(path, ' ' + _path.sep);
        if (path.indexOf(_path.sep) < 0) throw new Error(`无效路径: ${path}`);

        const fullpath = _path.join(this.gitPath, path);

        const obj = _path.parse(fullpath);
        obj.filename = obj.base || ''; // 文件名
        obj.dirname = obj.dir; // 目录名
        obj.repopath = (obj.dir || '') + '.git';
        obj.fullpath = fullpath; // 全路径
        obj.path = path; // 路径

        return obj;
    }

    // 格式化引用
    formatRef({ ref, filename }) {
        return ref
            ? `refs/heads/self/${ref}`
            : `refs/heads/sys/${base64.encode(filename)}`;
    }

    // 保存文件
    async saveFile({ path = '', content = '', message, ref, committer = {} }) {
        const { repopath, filename } = this.parsePath(path);
        ref = this.formatRef(ref, filename);

        return await super.saveFile({
            repopath,
            filename,
            ref,
            content,
            message,
            ref,
            committer,
        });
    }

    // 删除文件
    async deleteFile({ path = '', ref, message, committer = {} }) {
        const { repopath, filename } = this.parsePath(path);
        ref = this.formatRef(ref, filename);

        return await super.deleteFile(
            repopath,
            filename,
            ref,
            message,
            committer
        );
    }

    // 获取文件
    async getFile({ path, commitId, ref }) {
        const { repopath, filename } = this.parsePath(path);
        // 格式化引用
        ref = this.formatRef({ ref, filename });

        return await super.getFile(repopath, filename, commitId, ref);
    }

    // 获取文件内容
    async getFileContent({ path, commitId, ref }) {
        const file = await this.getFile({ path, commitId, ref });

        return (file || {}).content;
    }

    // 文件历史记录
    async history({ path, commitId, maxCount = 100, ref }) {
        const { repopath, filename } = this.parsePath(path);
        // 格式化引用
        ref = this.formatRef({ ref, filename });

        return await super.history(repopath, commitId, maxCount, ref);
    }
}

module.exports = ObjectStore;
