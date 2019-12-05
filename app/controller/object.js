'use strict';

const _path = require('path');

const Controller = require('../core/controller.js');

class Object_ extends Controller {
    get gitStore() {
        return this.app.gitStore;
    }

    parseParams(rule = {}) {
        const params = this.validate({ ...rule, path: 'string' });
        const obj = _path.parse(params.path);
        params.repopath = obj.dir;
        params.filepath = obj.base;
        return params;
    }

    async show() {
        const params = this.parseParams({
            commitId: 'string_optional',
        });

        const file = await this.gitStore.getFile(params).catch(() => undefined);
        if (!file) return this.fail('Not Found', 404);

        file.rawcontent = undefined;

        return this.success(file);
    }

    async save() {
        const params = this.parseParams({
            path: 'string',
            content: 'string_optional',
            committer: 'object_optional',
            message: 'string_optional',
        });

        const data = await this.gitStore.saveFile(params);

        return this.success(data);
    }

    async destroy() {
        const params = this.parseParams({
            path: 'string',
            committer: 'object_optional',
            message: 'string_optional',
        });

        const data = await this.gitStore.deleteFile(params);

        return this.success(data);
    }

    async history() {
        const params = this.parseParams({
            path: 'string',
            commitId: 'string_optional',
            maxCount: 'number_optional',
        });

        const list = await this.gitStore.history(params);

        return this.success(list);
    }
}

module.exports = Object_;
