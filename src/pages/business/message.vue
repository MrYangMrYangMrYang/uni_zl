<template>
	<view class="content">
		<view class='header'>
			<view class='search'>
				<u-search :showAction="false" placeholder="搜索你想知道的用户..." v-model="keywords" @search="search"></u-search>
			</view>
		</view>

		<!-- 侧滑列表 -->
		<view class="list">
			<view class="swipe-action u-border-top u-border-bottom">
				<view class="item">
					<view class="business">
						<view class="avatar">
							<image mode="aspectFit" src="/static/avatar.png"></image>
						</view>
					</view>
					
					<view class="info">
						<navigator url="/pages/post/info" class="nickname">RickyFlex</navigator>
						<view class="desc">这家伙儿很懒，什么也没写！这家伙儿很懒，什么也没写！</view>
						<view class="action">
							<view class="btn">
								<u-button type="primary" text="发私信" size="mini" shape="circle"></u-button>
							</view>
							<view class="btn">
								<u-button type="warning" :plain="true" text="已读" size="mini" shape="circle"></u-button>
							</view>
							<view class="btn">
								<u-button type="error" text="删除" size="mini" shape="circle"></u-button>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 提醒组件 -->
		<u-toast ref="notice"></u-toast>
	</view>
</template>

<script>
	export default {
		data()
		{
			return {
				keywords: '',
				
			}
		},
		methods:{
			
		}
	}
</script>

<style>
	.content{
		width:100%;
		overflow-x: hidden;
	}
	.search {
		height: 238rpx;
		background-image: url("/static/titlebg.png");
		background-repeat: no-repeat;
		background-size: 100% 100%;
		background-position: center;
		padding: 0 28rpx;
		display: flex;
		align-items: center;
		align-content: center;
	}

	.search-area {
		width: 100%;
		height: 88rpx;
		background-color: #fff;
		background-image: url("/static/search.png");
		background-repeat: no-repeat;
		background-size: 30rpx 30rpx;
		background-position: 35rpx 30rpx;
		border-radius: 11rpx;
		line-height: 88rpx;
		text-indent: 78rpx;
		color: #2f2e2e;
		font-size: 30rpx;
	}

	.list .item{
		display: flex;
		width:95%;
		margin:10px auto;
	}

	.business{
		width:20%;
		flex-shrink: 0;
		overflow: hidden;
		border-radius: 10px;
		margin-right:10px;
	}

	.avatar{
		width:100%;
		height:5em;
	}

	.avatar image{
		width:100%;
		height:100%;
	}

	.info{
		font-size:.9em;
		color:#999;
	}

	.info .nickname, .info .desc{
		margin-bottom:2px;
	}

	.info .nickname{
		font-size:1.1em;
		width:95%;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		color:#000;
		font-weight: bold;
	}

	.info .desc{
		font-size:.8em;
		width:100%;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		margin-bottom:.5em;
		/* 改成你需要的行数 */
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.info .action{
		display: flex;
		width:100%;
		justify-content: flex-end;
	}

	.info .action .btn{
		margin-right:10px;
	}
</style>
