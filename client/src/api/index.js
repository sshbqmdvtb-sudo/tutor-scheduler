const BASE = '/api'

function getToken(role) {
  return localStorage.getItem(role === 'student' ? 'student_token' : 'teacher_token')
}

async function request(url, options = {}) {
  const token = getToken(options.role) || getToken('teacher') || getToken('student')
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  const res = await fetch(BASE + url, { ...options, headers })
  return res.json()
}

export const api = {
  // 登录
  teacherLogin: (data) => request('/auth/teacher/login', { method: 'POST', body: JSON.stringify(data) }),
  studentLogin: (data) => request('/auth/student/login', { method: 'POST', body: JSON.stringify(data) }),

  // 学生管理
  getStudents: () => request('/students', { role: 'teacher' }),
  getStudent: (id) => request(`/students/${id}`, { role: 'teacher' }),
  addStudent: (data) => request('/students', { method: 'POST', body: JSON.stringify(data), role: 'teacher' }),
  updateStudent: (id, data) => request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data), role: 'teacher' }),
  deleteStudent: (id) => request(`/students/${id}`, { method: 'DELETE', role: 'teacher' }),

  // 上课记录
  getRecords: (params) => request('/records?' + new URLSearchParams(params), { role: 'teacher' }),
  addRecord: (data) => request('/records', { method: 'POST', body: JSON.stringify(data), role: 'teacher' }),
  updateRecord: (id, data) => request(`/records/${id}`, { method: 'PUT', body: JSON.stringify(data), role: 'teacher' }),
  deleteRecord: (id) => request(`/records/${id}`, { method: 'DELETE', role: 'teacher' }),
  getMyRecords: () => request('/records/my', { role: 'student' }),

  // 缴费
  getPayments: (params) => request('/payments?' + new URLSearchParams(params), { role: 'teacher' }),
  addPayment: (data) => request('/payments', { method: 'POST', body: JSON.stringify(data), role: 'teacher' }),
  deletePayment: (id) => request(`/payments/${id}`, { method: 'DELETE', role: 'teacher' }),
  getMyPayments: () => request('/payments/my', { role: 'student' }),

  // 排课
  getSchedules: (params) => request('/schedule?' + new URLSearchParams(params), { role: 'teacher' }),
  addSchedule: (data) => request('/schedule', { method: 'POST', body: JSON.stringify(data), role: 'teacher' }),
  deleteSchedule: (id) => request(`/schedule/${id}`, { method: 'DELETE', role: 'teacher' }),
  getMySchedules: () => request('/schedule/my', { role: 'student' }),

  // 统计
  getTeacherStats: (params) => request('/stats/teacher?' + new URLSearchParams(params), { role: 'teacher' }),
  getStudentStats: () => request('/stats/student', { role: 'student' }),
}
