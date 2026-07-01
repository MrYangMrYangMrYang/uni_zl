export const listMixin = {
	data() {
		return {
			list: [],
			page: 1,
			pagesize: 10,
			total: 0,
			loadStatus: 'loadmore',
			isLoading: false,
			extraParams: {}
		}
	},

	onPullDownRefresh() {
		this.refreshList()
	},

	onReachBottom() {
		this.loadMore()
	},

	methods: {
		async refreshList() {
			this.page = 1
			this.total = 0
			this.list = []
			this.loadStatus = 'loadmore'
			await this.getListData()
			uni.stopPullDownRefresh()
		},

		async loadMore() {
			// 正在请求或已无更多数据时直接返回
			if (this.isLoading || this.loadStatus === 'nomore') return

			// 已加载数据量达到总条数，标记为无更多
			if (this.list.length >= this.total && this.total > 0) {
				this.loadStatus = 'nomore'
				return
			}

			this.page++
			await this.getListData()
		},

		// 抽象方法：子组件必须实现以调用具体接口
		async getListData() {
			console.warn('请在页面组件中实现 getListData 方法')
		},

		handleResponse(result) {
			this.isLoading = false

			if (result.code === 1) {
				const newData = result.data || []
				this.list = [...this.list, ...newData]

				// 计算总条数：优先后端返回值，否则根据数据量估算
				this.total = result.total || this.list.length + (newData.length < this.pagesize ? 0 : 1)

				if (this.list.length >= this.total || newData.length < this.pagesize) {
					this.loadStatus = 'nomore'
				} else {
					this.loadStatus = 'loadmore'
				}

				// 钩子：子组件可覆写以在响应成功后执行额外逻辑（如更新 tabCache）
				this.afterResponseSuccess(newData)
			} else {
				if (this.page > 1) {
					this.page--
					this.loadStatus = 'nomore'
				} else {
					this.loadStatus = 'loadmore'
				}
				uni.$u.toast(result.msg || '数据加载失败')
			}
		},

		// 钩子方法：响应成功后调用，子组件可覆写
		// eslint-disable-next-line no-unused-vars
		afterResponseSuccess(newData) {}
	}
}
