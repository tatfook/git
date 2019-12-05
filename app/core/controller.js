'use strict';

const Controller = require('egg').Controller;

class BaseController extends Controller {
    get GitServerConfig() {
        return this.app.config.GitServer;
    }

    validate(schema, data, options = { allowUnknown: true }) {
        return this.ctx.validate(schema, data, options);
    }

    success(body = 'success', status = 200) {
        this.ctx.status = status;
        this.ctx.body = body;
    }

    fail(body = 'fail', status = 400) {
        this.ctx.status = status;
        this.ctx.body = body;
    }

    throw(...args) {
        return this.ctx.throw(...args);
    }
}

module.exports = BaseController;
