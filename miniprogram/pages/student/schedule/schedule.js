const api = require('../../../utils/api')
const { showError } = require('../../../utils/util')
const app = getApp()

const HOURS = 14
const START_HOUR = 8

Page({
  data: {
    loading: true,
    schedules: [],
    weekStart: null,
    weekLabel: '',
    dayHeaders: [],
    timeSlots: Array.from({ length: HOURS }, (_, i) => {
      const h = START_HOUR + i
      return (h < 10 ? '0' : '') + h + ':00'
    }),
    colWidth: 180,
    studentInfo: {},
    colors: ['#e8f5e9', '#e3f2fd', '#fff3e0', '#fce4ec', '#f3e5f5', '#e0f7fa']
  },

  onShow() {
    const info = app.globalData.studentInfo || wx.getStorageSync('studentInfo') || {}
    if (!info.id) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    this.setData({ studentInfo: info })
    this.loadSchedules()
  },

  getWeekDays(startDate) {
    const days = []
    const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate)
      d.setDate(startDate.getDate() + i)
      const dateStr = d.toISOString().slice(0, 10)
      days.push({
        name: weekDays[i],
        date: d.getDate(),
        fullDate: dateStr,
        isToday: dateStr === todayStr
      })
    }
    return days
  },

  getMonday(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    return d
  },

  initWeek(date) {
    const monday = this.getMonday(date)
    this.data.weekStart = monday
    const weekEnd = new Date(monday)
    weekEnd.setDate(monday.getDate() + 6)
    const weekLabel = (monday.getMonth() + 1) + '月' + monday.getDate() + '日 - ' +
      (weekEnd.getMonth() + 1) + '月' + weekEnd.getDate() + '日'
    this.setData({ weekLabel, dayHeaders: this.getWeekDays(monday) })
  },

  async loadSchedules() {
    this.setData({ loading: true })
    try {
      const now = this.data.weekStart || new Date()
      this.initWeek(now)
      const res = await api.getMySchedules()
      const schedules = (res.data || []).map((s, i) => ({
        ...s,
        subject: this.data.studentInfo.subject || '上课',
        color: this.data.colors[i % this.data.colors.length]
      }))
      this.setData({ schedules, loading: false })
    } catch (err) {
      showError(err.message || '加载失败')
      this.setData({ loading: false })
    }
  },

  prevWeek() {
    const d = new Date(this.data.weekStart)
    d.setDate(d.getDate() - 7)
    this.initWeek(d)
  },

  nextWeek() {
    const d = new Date(this.data.weekStart)
    d.setDate(d.getDate() + 7)
    this.initWeek(d)
  },

  goToday() { this.initWeek(new Date()) },

  getCellSchedules(colIdx, rowIdx) {
    const dayOfWeek = colIdx + 1
    const slotTime = this.data.timeSlots[rowIdx]
    const nextSlot = this.data.timeSlots[rowIdx + 1] || '22:00'
    return this.data.schedules.filter(s => {
      if (s.day_of_week !== dayOfWeek) return false
      return s.start_time >= slotTime && s.start_time < nextSlot
    })
  },

  getCellClass(colIdx, rowIdx) {
    const day = this.data.dayHeaders[colIdx]
    return day && day.isToday ? 'today-cell' : ''
  },

  goRecords() { wx.navigateTo({ url: '/pages/student/records/records' }) },
  goFees() { wx.navigateTo({ url: '/pages/student/fees/fees' }) },

  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout('student')
          wx.redirectTo({ url: '/pages/login/login' })
        }
      }
    })
  }
})
