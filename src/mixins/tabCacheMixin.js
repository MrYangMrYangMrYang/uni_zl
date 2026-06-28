export const tabCacheMixin = {
	data() {
		return {
			active: '',
			switchingTab: false,
			tabCache: {}
		}
	},
	methods: {
		initTabCache(tabIds) {
			const cache = {}
			tabIds.forEach(id => {
				cache[id] = null
			})
			this.tabCache = cache
		},

		handleTabSwitch(item) {
			const newActive = item.id
			if (this.active === newActive) return

			this.active = newActive

			if (this.tabCache[newActive] != null) {
				this.onTabCacheHit(newActive)
			} else {
				this.switchingTab = true
				this.loadTabData(newActive)
			}
		},

		// 抽象方法：缓存命中时由组件覆盖实现
		// eslint-disable-next-line no-unused-vars
		onTabCacheHit(tabId) {},

		// 抽象方法：缓存未命中时由组件覆盖实现
		// eslint-disable-next-line no-unused-vars
		async loadTabData(tabId) {}
	}
}
