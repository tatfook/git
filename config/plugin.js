'use strict';

const config = require("./config.js");

exports.redis = {
    enable: config.cluster.enable,
    package: 'egg-redis',
};

exports.sequelize = {
    enable: config.cluster.enable,
    package: 'egg-sequelize',
};

//console.log(exports.redis, exports.sequelize);
