<script>
/**
 * App.vue - 应用根组件
 *
 * 功能说明：
 * - 全局生命周期管理（启动、前台、后台切换）
 * - 引入 uView UI 全局样式
 * - 定义全局公共 CSS 样式
 */
export default {
	/**
	 * 应用启动时触发（仅一次）
	 * 可用于：初始化全局配置、检查更新、预加载数据
	 */
	onLaunch: function() {
	},
	/**
	 * 应用进入前台时触发（每次从后台切回都会触发）
	 * 可用于：刷新数据、恢复状态、检查登录有效性
	 */
	onShow: function() {
	},
	/**
	 * 应用进入后台时触发
	 * 可用于：保存临时状态、暂停定时器、释放资源
	 */
	onHide: function() {
	}
}
</script>

<style lang="scss">
   /* 引入 uView UI 组件库全局样式 */
   @import "uview-ui/index.scss";
</style>
