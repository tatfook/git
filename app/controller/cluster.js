'use strict';

const Controller = require('../core/controller.js');

class Cluster extends Controller {

    async pull() {
        const params = this.validate({
            repopath: 'string',
            ref: 'string_optional',
        });

        const ok = await this.ctx.service.cluster.pull(params);

        this.success(ok);
    }


    async push() {
        const params = this.validate({
            repopath: 'string',
            ref: 'string_optional',
        });

        const ok = await this.ctx.service.cluster.push(params);

        return this.success(ok);
    }
}

module.exports = Cluster;

