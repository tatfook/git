
exports.keys = "git";

exports.security = {
	xframe: {
		enable: false,
	},
	csrf: {
		enable: false,
	},
}

exports.middleware = ['authenticated'];

