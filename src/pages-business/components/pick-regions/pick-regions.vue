<template>
	<view v-if="loaded">
		<picker
			mode="multiSelector"
			:value="multiIndex"
			:range="multiArray"
			@change="handleValueChange"
			@columnchange="handleColumnChange"
		>
			<slot></slot>
		</picker>
	</view>
	<view v-else>
		<slot></slot>
	</view>
</template>

<script>
let CHINA_REGIONS = null
let loadPromise = null

function loadRegions() {
	if (loadPromise) return loadPromise

	loadPromise = new Promise(resolve => {
		try {
			const data = require('./regions.json')
			CHINA_REGIONS = data
			resolve(data)
		} catch (e) {
			console.warn('[pick-regions] 地区数据加载失败:', e.message)
			CHINA_REGIONS = []
			resolve([])
		}
	})

	return loadPromise
}

export default {
	props: {
		defaultRegions: {
			type: Array,
			default() {
				return []
			}
		},
		defaultRegionCode: {
			type: String
		},
		defaultRegion: [String, Array]
	},
	data() {
		return {
			cityArr: [],
			districtArr: [],
			multiIndex: [0, 0, 0],
			isInitMultiArray: true,
			loaded: false
		}
	},
	watch: {
		defaultRegion: {
			handler(region) {
				if (!this.loaded) return
				this.initRegion(region)
			},
			immediate: true
		}
	},
	computed: {
		multiArray() {
			if (!this.loaded || !CHINA_REGIONS || CHINA_REGIONS.length === 0) {
				return [['加载中...'], [''], ['']]
			}
			return this.pickedArr.map(arr => arr.map(item => item.name))
		},
		pickedArr() {
			if (!this.loaded || !CHINA_REGIONS || CHINA_REGIONS.length === 0) {
				return [[{ name: '加载中...' }], [{ name: '' }], [{ name: '' }]]
			}
			if (this.isInitMultiArray) {
				return [
					CHINA_REGIONS,
					CHINA_REGIONS[0].childs || [],
					CHINA_REGIONS[0].childs && CHINA_REGIONS[0].childs[0] && CHINA_REGIONS[0].childs[0].childs
						? CHINA_REGIONS[0].childs[0].childs
						: []
				]
			}
			return [CHINA_REGIONS, this.cityArr, this.districtArr]
		}
	},
	async created() {
		try {
			await loadRegions()

			if (CHINA_REGIONS && CHINA_REGIONS.length > 0) {
				this.cityArr = CHINA_REGIONS[0].childs || []
				this.districtArr =
					CHINA_REGIONS[0].childs && CHINA_REGIONS[0].childs[0] && CHINA_REGIONS[0].childs[0].childs
						? CHINA_REGIONS[0].childs[0].childs
						: []
			}

			this.loaded = true

			if (this.defaultRegion) {
				this.$nextTick(() => {
					this.initRegion(this.defaultRegion)
				})
			}
		} catch (e) {
			console.error('[pick-regions] 初始化失败:', e)
			this.loaded = true
		}
	},
	methods: {
		initRegion(region) {
			if (!CHINA_REGIONS || CHINA_REGIONS.length === 0) return

			const isCode = !Array.isArray(region)
			this.isInitMultiArray = false
			let children = CHINA_REGIONS

			for (let i = 0; i < 3; i++) {
				for (let j = 0; j < children.length; j++) {
					const condition = isCode
						? children[j].code == region.slice(0, (i + 1) * 2)
						: children[j].name.includes(region[i])

					if (condition) {
						children = children[j].childs
						if (i == 0) {
							this.cityArr = children || []
						} else if (i == 1) {
							this.districtArr = children || []
						}
						this.$set(this.multiIndex, i, j)
						break
					} else {
						if (i == 0 && j == children.length - 1) {
							this.isInitMultiArray = true
						}
					}
				}
			}
		},

		handleColumnChange(e) {
			if (!this.loaded || !CHINA_REGIONS || CHINA_REGIONS.length === 0) return

			this.isInitMultiArray = false
			const that = this
			const col = e.detail.column
			const row = e.detail.value
			that.multiIndex[col] = row

			try {
				switch (col) {
					case 0: {
						const prov = CHINA_REGIONS[that.multiIndex[0]]
						if (!prov.childs || prov.childs.length == 0) {
							that.cityArr = that.districtArr = [prov]
							break
						}
						that.cityArr = prov.childs
						that.districtArr =
							prov.childs[that.multiIndex[1]] && prov.childs[that.multiIndex[1]].childs
								? prov.childs[that.multiIndex[1]].childs
								: []
						break
					}
					case 1: {
						const city = CHINA_REGIONS[that.multiIndex[0]].childs[that.multiIndex[1]]
						that.districtArr = city && city.childs ? city.childs : []
						break
					}
					case 2:
						break
				}
			} catch (err) {
				console.error('handleColumnChange error:', err)
				try {
					that.districtArr = CHINA_REGIONS[that.multiIndex[0]].childs[0].childs || []
				} catch (e2) {
					that.districtArr = []
				}
			}
		},

		handleValueChange(e) {
			if (!this.loaded || !CHINA_REGIONS || CHINA_REGIONS.length === 0) return

			const [index0, index1, index2] = e.detail.value
			const [arr0, arr1, arr2] = this.pickedArr

			if (arr0[index0] && arr1[index1] && arr2[index2]) {
				const address = [arr0[index0], arr1[index1], arr2[index2]]
				this.$emit('getRegion', address)
			}
		}
	}
}
</script>
