const assert = require("assert");
const _ = require("lodash");
const base64 = require('js-base64').Base64;
const Service = require('egg').Service;

class RedisService extends Service {
	get helper() {
		return this.ctx.helper;
	}

	get redis() {
		return this.app.redis;
	}
	
	getRedisKey(key) {
		const prefix = this.config.GitServer.redisPrefix;
		return `${prefix}_${key}`;
	}

	hostname() {
		return this.config.GitServer.hostname || os.hostname();
	}

	async lock({repopath}) {
		const repostr = base64.encode(repopath);
		// 过期时间为 30 min
		this.redis.multi()
			.setnx(this.getRedisKey(`repo_lock_${repostr}`), this.hostname, "EX", 60 * 30)
			.get(this.getRedisKey(`repo_info_${repostr}`))
			.get(this.getRedisKey(`slaves_info`)).exec(); 
	

	}

	async unlock({repopath}) {

	}
}

module.exports = RedisService;
