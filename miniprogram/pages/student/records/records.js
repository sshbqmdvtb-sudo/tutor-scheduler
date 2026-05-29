const api = require('../../../utils/api')
const { formatMinutes, showError } = require('../../../utils/util')
const app = getApp()

Page({
  data: {
    records: [],
    totalStats: {},
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
      const res = await api.getMyRecords()
      const records = res.data || []
      const totalStats = {
        class_count: records.length,
        total_minutes: records.reduce((a, r) => a + (r.duration_minutes || 0), 0)
      }
      this.setData({ records, totalStats, loading: false })
    } catch (err) {
      showError(err.message || '加载失败')
      this.setData({ loading: false })
    }
  },

  formatMinutes(m) { return formatMinutes(m) },
  goSchedule() { wx.navigateTo({ url: '/pages/student/schedule/schedule' }) },
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
