module.exports = {
	extends: ['@commitlint/config-conventional'],
	rules: {
		'type-enum': [
			2,
			'always',
			[
				'feat', // 新功能
				'fix', // 修复 Bug
				'docs', // 文档变更
				'style', // 代码风格（不影响功能）
				'refactor', // 重构
				'perf', // 性能优化
				'test', // 测试相关
				'chore', // 构建/工具变更
				'ci', // CI 配置
				'revert' // 回滚
			]
		],
		'subject-case': [0] // 不强制 subject 大小写
	}
}
