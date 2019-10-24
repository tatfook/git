const fs = require("fs");
const path = require("path");

function rmdir(dir){
    if (fs.existsSync(dir)) {
		if (fs.statSync(dir).isDirectory()) {
			fs.readdirSync(dir).forEach(filename => {
				const curpath = path.join(dir, filename);
				if(fs.statSync(curpath).isDirectory()){
					rmdir(curpath); //递归删除文件夹
				} else {
					fs.unlinkSync(curpath); //删除文件
				}
			});
			fs.rmdirSync(dir);
		} else {
			fs.unlinkSync(dir); //删除文件
		}
    }
}

module.exports = {
	rm(path) {
		rmdir(path);
	},

	toJson(obj = {}) {
		try {
			return JSON.stringify(obj);
		} catch(e) {
			console.log(e);
			throw e;
		}
	},

	fromJson(jsonStr) {
		if (typeof(jsonStr) !== "string") return jsonStr;

		try {
			return JSON.parse(jsonStr);
		} catch(e) {
			console.log(e);
		}

		return ;
	},

	// wait function 
	sleep: async (ms = 0) => {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve(true);
			}, ms);
		});
	}
}
