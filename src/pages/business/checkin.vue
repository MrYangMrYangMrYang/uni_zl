<template>
	<view class="content">
		<!-- 滚动信息 -->
		<u-notice-bar :text="message"></u-notice-bar>

		<JCalendar 
			:yearMonth="current"
			:dataSource="list"
			@dateChange="getData"
			@clickChange="clickSign"
		>
		</JCalendar>

		 <view class='count'>
			<view>本月累积打卡<text class="sum">{{list.length}}</text>天，请再接再厉，继续努力!</view>
		</view>

		<!-- 提醒组件 -->
		<u-toast ref="notice"></u-toast>
	</view>
</template>

<script>
	import JCalendar from '@/components/calendar/j-calendar.vue';
	export default {
		components: {
            JCalendar
        },
		created()
		{
			//获取当前用户当前任务的签到状态
			this.getData(this.current);
		},
		data()
		{
			return {
				message: '每日签到可以获得超值优惠大奖，并且会获得相应积分',
				current: parseInt(new Date().getFullYear())+"-"+parseInt(new Date().getMonth() + 1), //本月
				list: [
					"2023-07-01",
					"2023-07-02",
					"2023-07-03",
					"2023-07-04",
					"2023-07-18",
					"2023-07-19"
				]
			}
		},
		methods: {
			// 点击签到或补签事件，回调参格式“YYYY-MM-DD”
			clickSign(day) 
			{
				this.list.push(day);
			},
			//切换月份事件，获取当前用户该任务的签到数组
			getData(date)
			{
				let y=date.split('-')[0];
				let m=date.split('-')[1];
				
				//模拟数据 只给当前月份添加数据 可以通过后台接口去获取你的打卡数据
				if(date==this.current)
				{
					const num=["01","04","07","13","14","15"],
					newSign = [],
					today = new Date().getDate();
					for(let i=0;i<6;i++)
					{
						newSign.push(this.current+"-"+num[i])
					}
					this.list = newSign
				}else
				{
					this.list = [];
				}
			},
		}
	}
</script>

<style>
	.count {
		margin: 10px;
		padding: 10px;
		display: flex;
		text-align: center;
		border-radius: 10px;
		flex-direction: column;
		justify-content: center;
		background-color: #fff;
		align-items: center;
	}

	.sum {
		color: red;
		font-size: 20px;
	}

	.count text {
		margin: 5px;
	}
</style>
