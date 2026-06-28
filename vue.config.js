module.exports = {
	// 转译 uview-ui 依赖以兼容低版本浏览器/小程序
	transpileDependencies: ['uview-ui'],

	// 接口代理仅在H5模式下支持，其他小程序请配置 services/request.js
	devServer: {
		port: 7070,
		proxy: {
			// /wc 开头的请求代理到 fastadmin 后端接口
			'/wc': {
				target: 'http://www.fastadmin.com/index.php/wc',
				changeOrigin: true,
				// 去除 /wc 前缀，由 target 末尾的 /wc 补全
				pathRewrite: {
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
