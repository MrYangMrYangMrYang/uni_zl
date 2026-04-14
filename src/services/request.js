// 此vm参数为页面的实例，可以通过它引用vuex中的变量
module.exports = (vm) => {
	// 初始化请求配置
	uni.$u.http.setConfig((config) => {
		/* config 为默认全局配置 */
		//域名前缀

		// 如果为H5模式下可以仅配置前缀然后用反向代理来执行域名配置 (下面的注释是条件编译不要删除)!!!!
		// #ifdef H5
		config.baseURL = '/wc'
		// #endif

		// 如果为小程序模式，需配置完整域名路径 (下面的注释是条件编译不要删除)!!!!
		// #ifdef MP-WEIXIN || APP-PLUS
		config.baseURL = 'http://www.fastadmin.com/index.php/wc'
		// #endif

		//请求头
		config.header = {
			'X-Requested-With': 'XMLHttpRequest'
		}

		return config
	})

	// 请求拦截
	uni.$u.http.interceptors.request.use((config) => {
		// 可使用async await 做异步操作
		// 初始化请求拦截器时，会执行此方法，此时data为undefined，赋予默认{}
		config.data = config.data || {}
		// 根据custom参数中配置的是否需要token，添加对应的请求头
		// if(config?.custom?.auth) {
		// 	// 可以在此通过vm引用vuex中的变量，具体值在vm.$store.state中
		// 	config.header.token = vm.$store.state.userInfo.token
		// }
		return config
	}, config => { // 可使用async await 做异步操作
		return Promise.reject(config)
	})

	// ================== 新增：递归处理图片路径的函数 ==================
	function processImages(data) {
		if (!data || typeof data !== 'object') return data;
		
		// 处理数组
		if (Array.isArray(data)) {
			data.forEach((item, index) => {
				data[index] = processImages(item);
			});
			return data;
		}
		
		// 处理对象
		Object.keys(data).forEach(key => {
			const value = data[key];
			
			// 处理字符串类型的值
			if (typeof value === 'string') {
				// 常见的图片字段名列表
				const imageFields = [
					'image', 'images', 'avatar', 'thumb', 'icon', 'logo', 
					'pic', 'cover', 'photo', 'img', 'headimg', 'head_img',
					'avatar_text'  // 加上你的 avatar_text 字段
				];
				
				// 判断是否是图片字段
				if (imageFields.includes(key) || key.includes('image') || key.includes('img') || key.includes('avatar')) {
					if (value.includes('www.fastadmin.com')) {
						data[key] = value.replace('http://www.fastadmin.com', '');
						// #ifdef H5
						console.log(`H5替换图片路径: ${value} -> ${data[key]}`); // 调试用，可删除
						// #endif
					}
				}
				
				// 处理富文本内容中的图片
				if (key === 'content' && value.includes('www.fastadmin.com')) {
					data[key] = value.replace(/http:\/\/www\.fastadmin\.com/g, '');
				}
			}
			
			// 递归处理嵌套的对象或数组
			if (value && typeof value === 'object') {
				data[key] = processImages(value);
			}
		});
		
		return data;
	}
	// ================== 新增函数结束 ==================

	// 响应拦截
	uni.$u.http.interceptors.response.use((response) => {
		/* 对响应成功做点什么 可使用async await 做异步操作*/
		const data = response.data

		// ================== 新增：处理图片路径 ==================
		// 只在 H5 模式下处理，小程序不需要（因为小程序用的是完整域名）
		// #ifdef H5
		if (data && data.data) {
			data.data = processImages(data.data);
		}
		// #endif
		// ================== 新增结束 ==================

		// 自定义参数
		// const custom = response.config?.custom
		// if (data.code !== 200) { 
		// 	// 如果没有显式定义custom的toast参数为false的话，默认对报错进行toast弹出提示
		// 	if (custom.toast !== false) {
		// 		uni.$u.toast(data.message)
		// 	}

		// 	// 如果需要catch返回，则进行reject
		// 	if (custom?.catch) {
		// 		return Promise.reject(data)
		// 	} else {
		// 		// 否则返回一个pending中的promise，请求不会进入catch中
		// 		return new Promise(() => { })
		// 	}
		// }
		return data
	}, (response) => {
		// 对响应错误做点什么 （statusCode !== 200）
		return Promise.reject(response)
	})
}