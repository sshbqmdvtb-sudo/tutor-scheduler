const api = require('../../utils/api')
const { showToast, showError } = require('../../utils/util')
const app = getApp()

Page({
  data: {
    loading: false,
    teacherForm: { username: 'admin', password: 'admin123' },
    studentForm: { phone: '', password: '123456' }
  },

  onTeacherUserInput(e) {
    this.setData({ 'teacherForm.username': e.detail.value })
  },
  onTeacherPassInput(e) {
    this.setData({ 'teacherForm.password': e.detail.value })
  },
  onStudentPhoneInput(e) {
    this.setData({ 'studentForm.phone': e.detail.value })
  },
  onStudentPassInput(e) {
    this.setData({ 'studentForm.password': e.detail.value })
  },

  async teacherLogin() {
    const { username, password } = this.data.teacherForm
    if (!username || !password) return showToast('请输入用户名和密码')
    this.setData({ loading: true })
    try {
      const res = await api.teacherLogin({ username, password })
      app.setTeacherInfo(res.data.teacher, res.data.token)
      wx.reLaunch({ url: '/pages/teacher/dashboard/dashboard' })
    } catch (err) {
      showError(err.message || '登录失败')
    }
    this.setData({ loading: false })
  },

  async studentLogin() {
    const { phone, password } = this.data.studentForm
    if (!phone) return showToast('请输入手机号')
    this.setData({ loading: true })
    try {
      const res = await api.studentLogin({ phone, password })
      app.setStudentInfo(res.data.student, res.data.token)
      wx.reLaunch({ url: '/pages/student/schedule/schedule' })
    } catch (err) {
      showError(err.message || '登录失败')
    }
    this.setData({ loading: false })
  }
})
