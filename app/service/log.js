'use strict';

const Service = require('egg').Service;

// const NODE = 0;
const DEBUG = 1;
const INFO = 2;
const WARN = 3;
const ERROR = 4;

class LogService extends Service {

    async log(level, description, data) {
        return await this.app.model.Log.create({
            level,
            description,
            data,
        });
    }

    async error(description, data = {}) {
        return await this.log(ERROR, description, data);
    }

    async warn(description, data = {}) {
        return await this.log(WARN, description, data);
    }

    async info(description, data = {}) {
        return await this.log(INFO, description, data);
    }

    async debug(description, data = {}) {
        return await this.log(DEBUG, description, data);
    }
}

module.exports = LogService;
