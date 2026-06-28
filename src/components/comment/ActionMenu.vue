<template>
	<u-popup
		mode="bottom"
		:show="value"
		@close="$emit('input', false)"
		round="10"
		:overlay="true"
		:close-on-click-overlay="true"
		:safe-area-inset-bottom="true"
	>
		<view class="menu">
			<view class="menu-grid" :class="'grid-' + menuCount">
				<view v-if="showComment" class="menu-item" @click="onComment">
					<view class="menu-icon comment-icon">
						<u-icon name="edit-pen-fill" size="28" color="#ffffff"></u-icon>
					</view>
					<text class="menu-text">评论</text>
				</view>

				<view v-if="showAccept" class="menu-item" @click="$emit('accept')">
					<view class="menu-icon accept-icon">
						<u-icon name="checkmark" size="28" color="#ffffff"></u-icon>
					</view>
					<text v-if="acceptStatus === 'accepted'" class="menu-text">已采纳</text>
					<text v-else-if="acceptStatus === 'resolved'" class="menu-text">已解决</text>
					<text v-else class="menu-text" @click.stop="$emit('accept')">采纳</text>
				</view>

				<view v-if="showDelete" class="menu-item" @click="$emit('delete')">
					<view class="menu-icon delete-icon">
						<u-icon name="trash-fill" size="28" color="#ffffff"></u-icon>
					</view>
					<text class="menu-text">删除</text>
				</view>
			</view>
			<u-button
				:customStyle="{ color: '#0173de', border: '2rpx solid #0173de', backgroundColor: '#fff' }"
				shape="circle"
				text="取消"
				@click="$emit('input', false)"
			></u-button>
		</view>
	</u-popup>
</template>

<script>
export default {
	name: 'ActionMenu',

	props: {
		value: {
			type: Boolean,
			default: false
		},
		showComment: {
			type: Boolean,
			default: false
		},
		showAccept: {
			type: Boolean,
			default: false
		},
		showDelete: {
			type: Boolean,
			default: false
		},
		acceptStatus: {
			type: String,
			default: '',
			validator(val) {
				return ['', 'accepted', 'resolved'].includes(val)
			}
		}
	},

	computed: {
		menuCount() {
			return (this.showComment ? 1 : 0) + (this.showAccept ? 1 : 0) + (this.showDelete ? 1 : 0)
		}
	},

	methods: {
		onComment() {
			this.$emit('input', false)
			this.$emit('comment')
		}
	}
}
</script>

<style lang="scss" scoped>
.menu {
	padding: 20rpx 30rpx 16rpx;
}

.menu-grid {
	display: flex;
	margin-bottom: 20rpx;
}

.grid-1 {
	justify-content: center;
}
.grid-2 {
	justify-content: space-evenly;
}
.grid-3 {
	justify-content: space-evenly;
}

.menu-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
	padding: 16rpx 32rpx;
}

.menu-icon {
	width: 76rpx;
	height: 76rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
}

.comment-icon {
	background: linear-gradient(135deg, #0173de, #4cd964);
}

.accept-icon {
	background: linear-gradient(135deg, #19be6b, #4cd964);
}

.delete-icon {
	background: linear-gradient(135deg, #ed4014, #ff4d4f);
}

.menu-text {
	font-size: 26rpx;
	color: #303133;
	font-weight: 500;
}
</style>
