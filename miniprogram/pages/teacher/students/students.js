const api = require('../../../utils/api')
const { showError } = require('../../../utils/util')

Page({
  data: { students: [], loading: true },

  onShow() { this.load() },

  async load() {
    this.setData({ loading: true })
    try {
      const res = await api.getStudents()
      this.setData({ students: res.data, loading: false })
    } catch (err) {
      showError(err.message || '加载失败')
      this.setData({ loading: false })
    }
  },

  goAddStudent() {
    wx.navigateTo({ url: '/pages/teacher/students/students' })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/teacher/student-detail/student-detail?id=' + id })
  }
})
