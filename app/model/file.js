'use strict';

// const _ = require('lodash');

module.exports = app => {
    const {
        BIGINT,
        // INTEGER,
        STRING,
        TEXT,
        // BOOLEAN,
        // JSON,
        // DECIMAL,
    } = app.Sequelize;

    const repopathLength = 128;
    const filepathLength = 256;
    const model = app.model.define('file', {
        id: {
            type: BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },

        repopath: {
            type: STRING(repopathLength),
        },

        filepath: {
            type: STRING(filepathLength),
        },

        content: {
            type: TEXT,
        },

        ref: {
            type: STRING,
        },

    }, {
        charset: 'utf8mb4',
        collate: 'utf8mb4_bin',

        indexes: [
            {
                unique: true,
                fields: [ 'repopath', 'filepath' ],
            },
        ],
    });

    // model.sync({force:true}).then(() => {
    // console.log("create table successfully");
    // });

    return model;
};

