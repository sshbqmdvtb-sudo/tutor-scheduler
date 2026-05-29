function call(type, data = {}) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('teacherToken') || wx.getStorageSync('studentToken') || ''
    wx.cloud.callFunction({
      name: 'api',
      data: { type, token, ...data }
    }).then(res => {
      const result = res.result
      if (result && result.success) {
        resolve(result)
      } else {
        reject(result || { message: '请求失败' })
      }
    }).catch(err => {
      reject({ message: '网络错误，请检查云开发环境' })
    })
  })
}

module.exports = {
  // 登录
  teacherLogin(data) { return call('teacherLogin', data) },
  studentLogin(data) { return call('studentLogin', data) },
  verify() { return call('verify') },

  // 学生管理
  getStudents() { return call('getStudents') },
  getStudent(id) { return call('getStudent', { id }) },
  addStudent(data) { return call('addStudent', data) },
  updateStudent(id, data) { return call('updateStudent', { id, ...data }) },
  deleteStudent(id) { return call('deleteStudent', { id }) },

  // 上课记录
  getRecords(params) { return call('getRecords', params) },
  addRecord(data) { return call('addRecord', data) },
  updateRecord(id, data) { return call('updateRecord', { id, ...data }) },
  deleteRecord(id) { return call('deleteRecord', { id }) },
  getMyRecords() { return call('getMyRecords') },

  // 缴费
  getPayments(params) { return call('getPayments', params) },
  addPayment(data) { return call('addPayment', data) },
  deletePayment(id) { return call('deletePayment', { id }) },
  getMyPayments() { return call('getMyPayments') },

  // 排课
  getSchedules(params) { return call('getSchedules', params) },
  addSchedule(data) { return call('addSchedule', data) },
  deleteSchedule(id) { return call('deleteSchedule', { id }) },
  getMySchedules() { return call('getMySchedules') },

  // 统计
  getTeacherStats(params) { return call('getTeacherStats', params) },
  getStudentStats() { return call('getStudentStats') }
}
