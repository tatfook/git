'use strict';

const Controller = require('../core/controller.js');

class Index extends Controller {
    async index() {
        this.ctx.body = 'hello world';
    }
}

module.exports = Index;
