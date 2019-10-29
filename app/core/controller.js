'use strict';

const Controller = require('egg').Controller;

class BaseController extends Controller {
    get log() {
        return this.app.log;
    }

    get GitServerConfig() {
        return this.app.config.GitServer;
    }

    validate(schema, data, options = { allowUnknown: true }) {
        return this.ctx.validate(schema, data, options);
    }

    authenticated() {
        const user = this.ctx.state.user;
        if (!user || !user.uid) this.throw(411, 'unauthenticated');

        return user;
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
