const api = require('../../../utils/api')
const { showError, showToast } = require('../../../utils/util')
const app = getApp()

const HOURS = 14 // 8:00 ~ 21:00
const START_HOUR = 8

Page({
  data: {
    loading: true,
    allSchedules: [],
    weekStart: null, // Date object
    weekLabel: '',
    dayHeaders: [],
    // 生成时间段 ["08:00","09:00",...,"21:00"]
    timeSlots: Array.from({ length: HOURS }, (_, i) => {
      const h = START_HOUR + i
      return (h < 10 ? '0' : '') + h + ':00'
    }),
    colWidth: 180,
    // 暖色系颜色循环
    colors: ['#e8f5e9', '#e3f2fd', '#fff3e0', '#fce4ec', '#f3e5f5', '#e0f7fa', '#fff8e1', '#fbe9e7']
  },

  onShow() {
    this.loadSchedules()
  },

  // 计算周一到周日
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

  // 获取当前周一的日期
  getMonday(date) {
    const d = new Date(date)
    const day = d.getDay() // 0=Sun
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

    this.setData({
      weekLabel,
      dayHeaders: this.getWeekDays(monday)
    })
  },

  async loadSchedules() {
    this.setData({ loading: true })
    try {
      const now = this.data.weekStart || new Date()
      this.initWeek(now)

      const res = await api.getSchedules({})
      const schedules = (res.data || []).map((s, i) => ({
        ...s,
        color: this.data.colors[i % this.data.colors.length]
      }))
      this.setData({ allSchedules: schedules, loading: false })
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

  goToday() {
    this.initWeek(new Date())
  },

  // 获取某个单元格的排课
  getCellSchedules(colIdx, rowIdx) {
    const dayOfWeek = colIdx + 1 // 周一到周日: 1-7
    const slotTime = this.data.timeSlots[rowIdx]
    const nextSlot = this.data.timeSlots[rowIdx + 1] || '22:00'

    return this.data.allSchedules.filter(s => {
      if (s.day_of_week !== dayOfWeek) return false
      // 排课的开始时间在当前时间段内
      return s.start_time >= slotTime && s.start_time < nextSlot
    })
  },

  getCellClass(colIdx, rowIdx) {
    const day = this.data.dayHeaders[colIdx]
    return day && day.isToday ? 'today-cell' : ''
  },

  showScheduleDetail(e) {
    const id = e.currentTarget.dataset.id
    const s = this.data.allSchedules.find(item => item.id === id)
    if (!s) return
    wx.showActionSheet({
      itemList: ['查看学生详情', '删除排课'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.navigateTo({ url: '/pages/teacher/student-detail/student-detail?id=' + s.student_id })
        } else if (res.tapIndex === 1) {
          this.deleteSchedule(id)
        }
      }
    })
  },

  async deleteSchedule(id) {
    try {
      await api.deleteSchedule(id)
      showToast('已删除')
      this.loadSchedules()
    } catch (err) { showError(err.message) }
  },

  // 导航
  goDashboard() { wx.navigateTo({ url: '/pages/teacher/dashboard/dashboard' }) },
  goStudents() { wx.navigateTo({ url: '/pages/teacher/students/students' }) },
  goRecords() { wx.navigateTo({ url: '/pages/teacher/records/records' }) },
  goSettings() { wx.navigateTo({ url: '/pages/teacher/settings/settings' }) }
})
