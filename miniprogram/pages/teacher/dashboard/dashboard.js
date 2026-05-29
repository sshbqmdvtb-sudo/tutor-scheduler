const api = require('../../../utils/api')
const { formatMoney, formatMinutes, showError } = require('../../../utils/util')
const app = getApp()

Page({
  data: {
    stats: {},
    teacherInfo: {}
  },

  onShow() {
    const info = app.globalData.teacherInfo || wx.getStorageSync('teacherInfo')
    if (!info) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    this.setData({ teacherInfo: info })
    this.loadStats()
  },

  async loadStats() {
    const now = new Date()
    const month = now.toISOString().slice(0, 7)
    try {
      const res = await api.getTeacherStats({ month })
      this.setData({ stats: res.data })
    } catch (err) {
      showError(err.message || '加载失败')
    }
  },

  formatMoney(v) { return formatMoney(v) },
  formatMinutes(m) { return formatMinutes(m) },

  goAddStudent() { wx.navigateTo({ url: '/pages/teacher/students/students' }) },
  goRecords() { wx.navigateTo({ url: '/pages/teacher/records/records' }) },
  goStats() { wx.navigateTo({ url: '/pages/teacher/stats/stats' }) },
  goSchedule() { wx.navigateTo({ url: '/pages/teacher/schedule/schedule' }) },
  goStudents() { wx.navigateTo({ url: '/pages/teacher/students/students' }) },
  goSettings() { wx.navigateTo({ url: '/pages/teacher/settings/settings' }) },
  goDashboard() { /* already here */ },

  goStudentDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/teacher/student-detail/student-detail?id=' + id })
  },

  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout('teacher')
          wx.redirectTo({ url: '/pages/login/login' })
        }
      }
    })
  }
})
