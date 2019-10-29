'use strict';

// const _ = require('lodash');

module.exports = app => {
    const {
        BIGINT,
        INTEGER,
        // STRING,
        TEXT,
        // BOOLEAN,
        JSON,
        // DECIMAL,
    } = app.Sequelize;

    const model = app.model.define('log', {
        id: {
            type: BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },

        level: { // NONE - 0  DEBUG - 1 INFO - 2  WARN - 3  ERROR - 4
            type: INTEGER,
            defaultValue: 0,
        },

        description: {
            type: TEXT,
        },

        data: {
            type: JSON,
        },

    }, {
        charset: 'utf8mb4',
        collate: 'utf8mb4_bin',
    });

    // model.sync({force:true}).then(() => {
    // console.log("create table successfully");
    // });

    model.getByPath = async function({ repopath }) {
        return await app.model.repository.findOne({ where: { repopath } }).then(o => o && o.toJson());
    };

    return model;
};

