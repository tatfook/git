
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
    jsonLimit: '10mb',
    formLimit: '10mb',
};

exports.middleware = [ 'authenticated' ];

