/**
 * 应用全局常量配置
 * 集中管理项目中散布的魔法数字和默认值，便于维护和修改
 * 使用 module.exports（CommonJS）确保 H5 webpack chunk 加载兼容
 */

module.exports = {
	// ====== 认证 & 存储 ======

	/** Token 过期时间（秒） */
	TOKEN_EXPIRE: 7 * 24 * 3600,

	/** 安全存储编码前缀 */
	STORAGE_PREFIX: 'enc:',

	/** 过期标记键后缀 */
	STORAGE_EXPIRE_SUFFIX: '_expire',

	// ====== Toast 提示 ======

	TOAST_DURATION: {
		SUCCESS: 1200,
		ERROR: 1500,
		DEFAULT: 1000,
		INFO: 2000
	},

	// ====== 错误处理 ======

	MAX_ERROR_LOG_SIZE: 50,

	// ====== API & HTTP ======

	API_BASE: {
		H5: '/wc',
		NATIVE: 'http://www.fastadmin.com/index.php/wc'
	},

	DEFAULT_DOMAIN: 'http://www.fastadmin.com',

	IMAGE_FIELDS: [
		'image',
		'images',
		'avatar',
		'thumb',
		'icon',
		'logo',
		'pic',
		'cover',
		'photo',
		'img',
		'headimg',
		'head_img',
		'avatar_text'
	],

	// ====== 列表分页 ======

	DEFAULT_PAGE_SIZE: 10
}
