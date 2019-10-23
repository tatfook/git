

module.exports = {

	toJson(obj = {}) {
		return JSON.stringify(obj);
	},

	fromJson(jsonStr) {
		try {
			return JSON.parse(jsonStr);
		} catch(e) {
			console.log(e);
		}

		return ;
	}
}
