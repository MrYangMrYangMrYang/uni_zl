module.exports = {
	// 测试环境：工具函数无需 DOM
	testEnvironment: 'node',

	// 测试文件匹配规则
	testMatch: ['**/__tests__/**/*.test.{js,ts}'],

	// JS + TS 转换
	transform: {
		'^.+\\.js$': 'babel-jest',
		'^.+\\.ts$': ['babel-jest', { presets: ['@babel/preset-typescript'] }]
	},

	// 收集覆盖率范围：工具函数 + 状态管理 + 混入
	collectCoverageFrom: [
		'src/utils/**/*.{js,ts}',
		'src/store/**/*.{js,ts}',
		'src/mixins/**/*.js',
		'!src/utils/error-handler.js'
	],

	// 模块名映射，支持 @ 别名
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1'
	},

	// 不转换 node_modules（除 uview-ui 等需要转的）
	transformIgnorePatterns: ['/node_modules/(?!(uview-ui)/)'],

	// 清除 mock 调用记录
	clearMocks: true
}
