'use strict';

exports.keys = 'git';

exports.security = {
    xframe: {
        enable: false,
    },
    csrf: {
        enable: false,
    },
};

exports.bodyParser = {
    jsonLimit: '100mb',
    formLimit: '100mb',
};
