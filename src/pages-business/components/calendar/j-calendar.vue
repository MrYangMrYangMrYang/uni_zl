<template>
	<view class="all">
		<view class="bar">
			<view class="previous" @click="changeMonth(-1)">
				<button class="barbtn">{{ validLangType == 'ch' ? '上一月' : 'Last' }}</button>
			</view>
			<view class="date">{{ nowYear || '--' }} 年 {{ nowMonth || '--' }} 月</view>
			<view class="next" @click="changeMonth(1)">
				<button class="barbtn">{{ validLangType == 'ch' ? '下一月' : 'Nex/' }}</button>
			</view>
		</view>

		<view class="week-area">
			<view class="week-txt" v-for="(item, index) in weeksTxt[validLangType]" :key="index">{{ item }}</view>
		</view>

		<view class="myDateTable">
			<view v-for="(item, j) in calendarDays" :key="j" class="dateCell">
				<view v-if="item.date == undefined || item.date == null" class="cell"></view>

				<template v-else>
					<view v-if="item.isSign == true" class="cell greenColor bgWhite">
						{{ item.date }}
					</view>

					<view
						@click="clickSign(item.date, 0)"
						class="cell outSignStyle"
						v-else-if="item.isBeforeToday && item.isThisMonth"
					>
						{{ item.date }}
						<view class="redDot"></view>
					</view>

					<view
						@click="clickSign(item.date, 1)"
						class="cell whiteColor bgBlue"
						v-else-if="item.date == today && nowMonth == toMonth && nowYear == toYear"
					>
						签到
					</view>

					<view class="whiteColor cell" v-else>
						{{ item.date }}
					</view>
				</template>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			calendarDays: [],
			SignData: [],
			nowYear: 0,
			nowMonth: 0,
			today: parseInt(new Date().getDate()),
			toMonth: parseInt(new Date().getMonth() + 1),
			toYear: parseInt(new Date().getFullYear()),
			weeksTxt: {
				ch: ['日', '一', '二', '三', '四', '五', '六'],
				en: ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat']
			}
		}
	},

	props: {
		isReplenishSign: {
			type: Boolean,
			default: false
		},
		isFullCalendar: {
			type: Boolean,
			default: true
		},
		yearMonth: {
			type: String,
			default: new Date().getFullYear() + '-' + new Date().getMonth() + 1
		},
		dataSource: {
			type: Array,
			default: () => {
				return []
			}
		},
		langType: {
			type: String,
			default: 'ch'
		}
	},

	computed: {
		validLangType() {
			return /en|ch/g.test(this.langType) ? this.langType : 'ch'
		}
	},

	created() {
		const ymArr = this.yearMonth.split('-')
		this.buildCalendar(ymArr[0], ymArr[1])
		this.onSignDataChange(this.dataSource)
	},

	watch: {
		dataSource: 'onSignDataChange'
	},

	methods: {
		clickSign(date, type) {
			if (type == 0 && !this.isReplenishSign) {
				console.log('————补签功能未开启————')
				return
			}
			this.$emit('clickChange', this.nowYear + '-' + this.nowMonth + '-' + date)
		},

		// 构建整月日历：空格补位 + 当月天数 + 补全前后相邻月日期
		buildCalendar(y, m) {
			this.nowYear = y
			this.nowMonth = m
			this.calculateEmptyGrids(y, m)
			this.calculateDays(y, m)
			if (this.isFullCalendar) {
				this.fullCell()
			}
		},

		onSignDataChange(newData) {
			this.SignData = newData
			this.matchSign()
		},

		// 将签到数据与日历天数按时间戳匹配，标记已签到日期
		matchSign() {
			const signs = this.SignData
			const daysArr = this.calendarDays

			for (let i = 0; i < signs.length; i++) {
				const current = new Date(this.toIOSDate(signs[i])).getTime()

				for (let j = 0; j < daysArr.length; j++) {
					if (current == new Date(this.toIOSDate(daysArr[j].fullDate)).getTime()) {
						daysArr[j].isSign = true
					}
				}
			}
			this.calendarDays = daysArr
		},

		// 计算月初前的空白格子（对齐星期），保证1号出现在正确的星期列
		calculateEmptyGrids(year, month) {
			this.calendarDays = []
			const firstDayOfWeek = this.getFirstDayOfWeek(year, month)
			if (firstDayOfWeek > 0) {
				for (let i = 0; i < firstDayOfWeek; i++) {
					this.calendarDays.push({
						date: null,
						fullDate: null,
						isBeforeToday: true,
						isSign: false,
						isThisMonth: false
					})
				}
			}
		},

		calculateDays(year, month) {
			const thisMonthDays = this.getMonthDayLength(year, month)
			const toDate = new Date(this.toYear + '/' + this.toMonth + '/' + this.today)

			for (let i = 1; i <= thisMonthDays; i++) {
				const fullDate = year + '-' + month + '-' + i
				const isBeforeToday = new Date(this.toIOSDate(fullDate)) < toDate

				this.calendarDays.push({
					date: i,
					fullDate,
					isBeforeToday,
					isSign: false,
					isThisMonth: true
				})
			}
		},

		changeMonth(type) {
			const nowYear = parseInt(this.nowYear)
			const nowMonth = parseInt(this.nowMonth)
			const newObj = this.getOperateMonthDate(nowYear, nowMonth, type)
			this.buildCalendar(newObj.year, newObj.month)
			this.$emit('dateChange', this.nowYear + '-' + this.nowMonth)
		},

		// 获取某月天数：传入 month 而非 month-1，利用 Date(year, month, 0) 返回上月最后一天
		getMonthDayLength(year, month) {
			return new Date(year, month, 0).getDate()
		},

		getFirstDayOfWeek(year, month, day = 1) {
			return new Date(Date.UTC(year, month - 1, day)).getDay()
		},

		// 日期字符串转IOS格式：部分平台不支持 yyyy-mm-dd，需替换为 yyyy/mm/dd
		toIOSDate(strDate) {
			return strDate ? strDate.replace(/-/g, '/') : strDate
		},

		// 补全日历前后空缺：用上月末尾日期和下月开头日期填充，使日历呈完整的6行网格
		fullCell() {
			const endDay = this.getMonthDayLength(this.nowYear, this.nowMonth)
			const beforeEmptyLength = this.getFirstDayOfWeek(this.nowYear, this.nowMonth)
			const afterEmptyLength = 6 - this.getFirstDayOfWeek(this.nowYear, this.nowMonth, endDay)

			const last = this.getOperateMonthDate(this.nowYear, this.nowMonth, -1)
			const lastMonthEndDay = this.getMonthDayLength(last.year, last.month)

			for (let i = 0; i < beforeEmptyLength; i++) {
				const date = lastMonthEndDay - beforeEmptyLength + i + 1
				this.calendarDays[i].date = date
				this.calendarDays[i].fullDate = last.year + '-' + last.month + '-' + date
			}

			const next = this.getOperateMonthDate(this.nowYear, this.nowMonth, 1)
			for (let i = 1; i <= afterEmptyLength; i++) {
				this.calendarDays.push({
					date: i,
					fullDate: next.year + '-' + next.month + '-' + i,
					isBeforeToday: false,
					isSign: false,
					isThisMonth: false
				})
			}
		},

		// 月份加减运算，处理跨年进位
		getOperateMonthDate(yy, mm, num) {
			let month = parseInt(mm) + parseInt(num)
			let year = parseInt(yy)

			if (month > 12) {
				month = 1
				year++
			} else if (month < 1) {
				month = 12
				year--
			}

			return {
				month,
				year
			}
		}
	}
}
</script>

<style>
.all {
	margin-top: 20rpx;
}

.all .bar {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	margin: 30rpx 20rpx;
	padding: 10rpx;
}

.bar .barbtn {
	height: 30px;
	line-height: 30px;
	font-size: 12px;
}

.all .week-area {
	display: flex;
	justify-content: space-between;
	padding: 10px 0;
	box-sizing: border-box;
	width: 91vw;
	margin: 10px auto;
	border-radius: 10px;
}

.all .week-txt {
	text-align: center;
	width: 13vw;
}

.myDateTable {
	margin: 0 auto;
	width: 91vw;
	padding: 2vw;
	border-radius: 10px;
	background: linear-gradient(#74aada, #94db98);
}

.myDateTable .dateCell {
	width: 13vw;
	padding: 1vw;
	display: inline-block;
	text-align: center;
	font-size: 16px;
	box-sizing: border-box;
	overflow: hidden;
}

.dateCell .cell {
	display: flex;
	border-radius: 50%;
	height: 11vw;
	justify-content: center;
	align-items: center;
	box-sizing: border-box;
	flex-direction: column;
}

.whiteColor {
	color: #fff;
}
.greenColor {
	color: #01b90b;
	font-weight: bold;
}

.bgWhite {
	background-color: #fff;
}
.bgGray {
	background-color: rgba(255, 255, 255, 0.42);
}
.bgBlue {
	font-size: 14px;
	background-color: #4b95e6;
}
.redColor {
	color: #ff0000;
}

.outSignStyle {
	border: 1px solid #ffffff;
	color: #ffffff;
}

.redDot {
	width: 3px;
	height: 3px;
	border-radius: 50%;
	background-color: red;
}
</style>
