/**
 * Tab 切换缓存 Mixin
 *
 * 职责：封装 Tab 标签切换时的缓存逻辑
 * 消除 index.vue / follow.vue / user.vue 中 CateToggle + tabCache 的重复代码
 *
 * @module mixins/tabCacheMixin
 *
 * @example
 * import { tabCacheMixin } from '@/mixins/tabCacheMixin'
 * export default {
 *   mixins: [tabCacheMixin],
 *   created() {
 *     this.initTabCache(['0', '1', '2'])
 *   },
 *   methods: {
 *     onTabCacheHit(tabId) {
 *       this.listA = this.tabCache['0'] || []
 *       this.listB = this.tabCache['1'] || []
 *     },
 *     async loadTabData(tabId) {
 *       if (tabId === '0') await this.loadDataA()
 *       if (tabId === '1') await this.loadDataB()
 *     }
 *   }
 * }
 */

export const tabCacheMixin = {
	data() {
		return {
			active: '',
			switchingTab: false,
			tabCache: {}
		}
	},
	methods: {
		/**
		 * 初始化 Tab 缓存（设置各标签初始值为 null）
		 * @param {Array<string|number>} tabIds - 标签ID数组
		 */
		initTabCache(tabIds) {
			const cache = {}
			tabIds.forEach(id => { cache[id] = null })
			this.tabCache = cache
		},

		/**
		 * 处理 Tab 切换（带缓存优化）
		 * 有缓存直接恢复，无缓存则调用 loadTabData 请求数据
		 * @param {object} item - 被点击的标签对象 {name, id}
		 */
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

		/**
		 * 缓存命中时的回调（组件内覆盖实现）
		 * @param {string|number} tabId - 命中的标签ID
		 */
		onTabCacheHit(tabId) {},

		/**
		 * 缓存未命中时的数据加载方法（组件内覆盖实现）
		 * @param {string|number} tabId - 需要加载的标签ID
		 */
		async loadTabData(tabId) {}
	}
}
