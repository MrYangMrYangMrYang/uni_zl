// vue.config.js，如没有此文件则手动创建
module.exports = {
	// 作用：告诉 Vue CLI 将 uview-ui 这个依赖也进行转译
	// 为什么需要：默认情况下，Vue CLI 不会转译 node_modules 中的代码
	// 特殊情况：有些库（如 uview-ui）可能使用了 ES6+ 语法，但未提供 ES5 版本，需要手动指定转译
	// 适用场景：兼容低版本浏览器或某些小程序环境
	transpileDependencies: ['uview-ui'],

	// 以下为接口代理设置,但是仅在H5模式下面支持，如需要配置其他小程序的接口地址，请移步到 services/request.js
	devServer: {
		port: 7070, //设置端口
		proxy: {
			// 配置代理规则，所有以 /wc 开头的请求都会被代理
			'/wc': {
				// 目标服务器地址，实际请求会被转发到这个地址
				target: 'http://www.fastadmin.com/index.php/wc',
				// 开启跨域支持，将请求头中的 Host 改为目标地址的 host，绕过跨域限制
				changeOrigin: true,
				// 路径重写规则
				pathRewrite: {
					// ^/wc 表示开头的 /wc 会被替换成空字符串
					// 例如：/wc/api/login → http://www.fastadmin.com/index.php/wc/api/login
					'^/wc': ''
				}
			},
			// 代理图片上传目录
			'/uploads': {
				target: 'http://www.fastadmin.com',
				changeOrigin: true
			},
			// 代理静态资源目录
			'/assets': {
				target: 'http://www.fastadmin.com',
				changeOrigin: true
			}
		}
	}
}