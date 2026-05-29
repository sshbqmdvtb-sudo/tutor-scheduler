const api = require('../../../utils/api')
const { formatMoney, formatMinutes, showError } = require('../../../utils/util')
const app = getApp()

Page({
  data: {
    stats: {},
    payments: [],
    loading: true,
    studentInfo: {}
  },

  onShow() {
    const info = app.globalData.studentInfo || wx.getStorageSync('studentInfo') || {}
    this.setData({ studentInfo: info })
    this.load()
  },

  async load() {
    try {
      const [statsRes, payRes] = await Promise.all([api.getStudentStats(), api.getMyPayments()])
      this.setData({
        stats: statsRes.data || {},
        payments: payRes.data || [],
        loading: false
      })
    } catch (err) {
      showError(err.message || '加载失败')
      this.setData({ loading: false })
    }
  },

  formatMoney(v) { return formatMoney(v) },
  formatMinutes(m) { return formatMinutes(m) },

  goSchedule() { wx.navigateTo({ url: '/pages/student/schedule/schedule' }) },
  goRecords() { wx.navigateTo({ url: '/pages/student/records/records' }) },

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
