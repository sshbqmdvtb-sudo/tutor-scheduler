const app = getApp()

Page({
  data: {
    teacherInfo: {},
    baseUrl: 'http://localhost:3000'
  },

  onShow() {
    const info = app.globalData.teacherInfo || wx.getStorageSync('teacherInfo') || {}
    const url = wx.getStorageSync('baseUrl') || app.globalData.baseUrl
    this.setData({ teacherInfo: info, baseUrl: url })
  },

  onUrlInput(e) { this.setData({ baseUrl: e.detail.value }) },

  saveUrl() {
    const url = this.data.baseUrl.replace(/\/+$/, '')
    if (!url) return wx.showToast({ title: '请输入地址', icon: 'none' })
    app.globalData.baseUrl = url
    wx.setStorageSync('baseUrl', url)
    wx.showToast({ title: '保存成功', icon: 'success' })
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
