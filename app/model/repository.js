'use strict';

// const _ = require('lodash');

module.exports = app => {
    const {
        BIGINT,
        // INTEGER,
        STRING,
        // TEXT,
        // BOOLEAN,
        // JSON,
        // DECIMAL,
    } = app.Sequelize;

    const model = app.model.define('repository', {
        id: {
            type: BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },

        repopath: { // 仓库路径
            type: STRING,
            unique: true,
            allowNull: false,
        },

        cacheHostname: { // 仓库缓存主机
            type: STRING,
        },

        fixedHostname: { // 仓库缓存且未推送主机  该字段值只能为null或cacheHostname
            type: STRING,
        },

    }, {
        charset: 'utf8mb4',
        collate: 'utf8mb4_bin',
    });

    // model.sync({force:true}).then(() => {
    // console.log("create table successfully");
    // });

    model.getByPath = async function({ repopath }) {
        // return await app.model.Repository.findOne({where: {repopath}}).then(o => o && o.toJson());
        return await app.model.Repository.findOne({ where: { repopath } }).then(o => o && o.get({ plain: true }));
    };

    // app.model.repository = model;

    return model;
};

