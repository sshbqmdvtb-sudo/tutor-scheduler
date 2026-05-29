const app = getApp()

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const token = options.role === 'student'
      ? (app.globalData.studentToken || wx.getStorageSync('studentToken'))
      : (app.globalData.teacherToken || wx.getStorageSync('teacherToken'))

    wx.request({
      url: app.globalData.baseUrl + url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {})
      },
      success(res) {
        if (res.data && res.data.success) {
          resolve(res.data)
        } else {
          reject(res.data || { message: '请求失败' })
        }
      },
      fail(err) {
        reject({ message: '网络错误，请检查网络连接' })
      }
    })
  })
}

module.exports = {
  // 登录
  teacherLogin(data) { return request('/api/auth/teacher/login', { method: 'POST', data }) },
  studentLogin(data) { return request('/api/auth/student/login', { method: 'POST', data }) },

  // 学生管理
  getStudents() { return request('/api/students', { role: 'teacher' }) },
  getStudent(id) { return request('/api/students/' + id, { role: 'teacher' }) },
  addStudent(data) { return request('/api/students', { method: 'POST', data, role: 'teacher' }) },
  updateStudent(id, data) { return request('/api/students/' + id, { method: 'PUT', data, role: 'teacher' }) },
  deleteStudent(id) { return request('/api/students/' + id, { method: 'DELETE', role: 'teacher' }) },

  // 上课记录
  getRecords(params) { return request('/api/records?' + objToQuery(params), { role: 'teacher' }) },
  addRecord(data) { return request('/api/records', { method: 'POST', data, role: 'teacher' }) },
  updateRecord(id, data) { return request('/api/records/' + id, { method: 'PUT', data, role: 'teacher' }) },
  deleteRecord(id) { return request('/api/records/' + id, { method: 'DELETE', role: 'teacher' }) },
  getMyRecords() { return request('/api/records/my', { role: 'student' }) },

  // 缴费
  getPayments(params) { return request('/api/payments?' + objToQuery(params), { role: 'teacher' }) },
  addPayment(data) { return request('/api/payments', { method: 'POST', data, role: 'teacher' }) },
  deletePayment(id) { return request('/api/payments/' + id, { method: 'DELETE', role: 'teacher' }) },
  getMyPayments() { return request('/api/payments/my', { role: 'student' }) },

  // 排课
  getSchedules(params) { return request('/api/schedule?' + objToQuery(params), { role: 'teacher' }) },
  addSchedule(data) { return request('/api/schedule', { method: 'POST', data, role: 'teacher' }) },
  deleteSchedule(id) { return request('/api/schedule/' + id, { method: 'DELETE', role: 'teacher' }) },
  getMySchedules() { return request('/api/schedule/my', { role: 'student' }) },

  // 统计
  getTeacherStats(params) { return request('/api/stats/teacher?' + objToQuery(params), { role: 'teacher' }) },
  getStudentStats() { return request('/api/stats/student', { role: 'student' }) }
}

function objToQuery(obj) {
  if (!obj) return ''
  return Object.keys(obj).filter(k => obj[k] !== undefined && obj[k] !== '').map(k => k + '=' + encodeURIComponent(obj[k])).join('&')
}
