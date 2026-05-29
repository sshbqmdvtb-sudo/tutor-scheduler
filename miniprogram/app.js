App({
  globalData: {
    teacherInfo: null,
    studentInfo: null,
    teacherToken: '',
    studentToken: '',
    baseUrl: 'http://localhost:3000' // 开发环境，上线改成服务器地址
  },

  setTeacherInfo(info, token) {
    this.globalData.teacherInfo = info
    this.globalData.teacherToken = token
    wx.setStorageSync('teacherInfo', info)
    wx.setStorageSync('teacherToken', token)
  },

  setStudentInfo(info, token) {
    this.globalData.studentInfo = info
    this.globalData.studentToken = token
    wx.setStorageSync('studentInfo', info)
    wx.setStorageSync('studentToken', token)
  },

  logout(type) {
    if (type === 'teacher') {
      this.globalData.teacherInfo = null
      this.globalData.teacherToken = ''
      wx.removeStorageSync('teacherInfo')
      wx.removeStorageSync('teacherToken')
    } else {
      this.globalData.studentInfo = null
      this.globalData.studentToken = ''
      wx.removeStorageSync('studentInfo')
      wx.removeStorageSync('studentToken')
    }
  },

  onLaunch() {
    // 恢复登录状态
    const teacherToken = wx.getStorageSync('teacherToken')
    const teacherInfo = wx.getStorageSync('teacherInfo')
    const studentToken = wx.getStorageSync('studentToken')
    const studentInfo = wx.getStorageSync('studentInfo')
    if (teacherToken && teacherInfo) {
      this.globalData.teacherToken = teacherToken
      this.globalData.teacherInfo = teacherInfo
    }
    if (studentToken && studentInfo) {
      this.globalData.studentToken = studentToken
      this.globalData.studentInfo = studentInfo
    }
  }
})
