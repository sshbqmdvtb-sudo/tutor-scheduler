const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const jwt = require('jsonwebtoken')
const SECRET = 'tutor-scheduler-secret-key-2024'

// 认证函数
function authTeacher(token) {
  if (!token) throw new Error('未登录')
  const decoded = jwt.verify(token.replace('Bearer ', ''), SECRET)
  if (decoded.role !== 'teacher') throw new Error('无权限')
  return decoded.id
}

function authStudent(token) {
  if (!token) throw new Error('未登录')
  const decoded = jwt.verify(token.replace('Bearer ', ''), SECRET)
  if (decoded.role !== 'student') throw new Error('无权限')
  return decoded.id
}

// ====== 认证 ======

async function teacherLogin(event) {
  const { username, password } = event
  const res = await db.collection('teachers').where({ username }).get()
  if (res.data.length === 0) throw new Error('用户名或密码错误')
  const teacher = res.data[0]
  if (teacher.password !== password) throw new Error('用户名或密码错误')
  const token = jwt.sign({ id: teacher._id, role: 'teacher', name: teacher.name }, SECRET, { expiresIn: '7d' })
  return {
    success: true,
    data: {
      token,
      teacher: { id: teacher._id, name: teacher.name, username: teacher.username }
    }
  }
}

async function studentLogin(event) {
  const { phone, password } = event
  const res = await db.collection('students').where({ phone, isActive: 1 }).get()
  if (res.data.length === 0) throw new Error('手机号或密码错误')
  const student = res.data[0]
  if (student.password !== password) throw new Error('手机号或密码错误')
  const token = jwt.sign({ id: student._id, role: 'student', name: student.name }, SECRET, { expiresIn: '7d' })
  return {
    success: true,
    data: {
      token,
      student: {
        id: student._id,
        name: student.name,
        grade: student.grade,
        subject: student.subject,
        default_fee: student.defaultFee,
        default_people_type: student.defaultPeopleType,
        phone: student.phone
      }
    }
  }
}

async function verify(event) {
  const auth = event.token
  if (!auth) return { success: false, message: '未登录' }
  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), SECRET)
    return { success: true, data: decoded }
  } catch {
    return { success: false, message: 'token无效' }
  }
}

// ====== 学生管理 ======

async function getStudents(event) {
  const teacherId = authTeacher(event.token)
  const res = await db.collection('students').where({ teacherId }).get()
  const list = res.data.sort((a, b) => (b.isActive - a.isActive) || a.name.localeCompare(b.name))
  return { success: true, data: list.map(mapper.student) }
}

async function getStudent(event) {
  const teacherId = authTeacher(event.token)
  const res = await db.collection('students').doc(event.id).get()
  if (!res.data || res.data.teacherId !== teacherId) throw new Error('学生不存在')
  return { success: true, data: mapper.student(res.data) }
}

async function addStudent(event) {
  const teacherId = authTeacher(event.token)
  const data = {
    teacherId,
    name: event.name,
    grade: event.grade || '',
    subject: event.subject || '',
    defaultFee: event.default_fee || 0,
    defaultPeopleType: event.default_people_type || '一对一',
    phone: event.phone || '',
    password: event.password || '123456',
    isActive: 1,
    createdAt: db.serverDate()
  }
  const res = await db.collection('students').add({ data })
  const doc = await db.collection('students').doc(res._id).get()
  return { success: true, data: mapper.student(doc.data) }
}

async function updateStudent(event) {
  const teacherId = authTeacher(event.token)
  const existing = await db.collection('students').doc(event.id).get()
  if (!existing.data || existing.data.teacherId !== teacherId) throw new Error('学生不存在')
  const updateData = {}
  if (event.name !== undefined) updateData.name = event.name
  if (event.grade !== undefined) updateData.grade = event.grade
  if (event.subject !== undefined) updateData.subject = event.subject
  if (event.default_fee !== undefined) updateData.defaultFee = event.default_fee
  if (event.default_people_type !== undefined) updateData.defaultPeopleType = event.default_people_type
  if (event.phone !== undefined) updateData.phone = event.phone
  if (event.password !== undefined) updateData.password = event.password
  if (event.is_active !== undefined) updateData.isActive = event.is_active
  await db.collection('students').doc(event.id).update({ data: updateData })
  const doc = await db.collection('students').doc(event.id).get()
  return { success: true, data: mapper.student(doc.data) }
}

async function deleteStudent(event) {
  const teacherId = authTeacher(event.token)
  const existing = await db.collection('students').doc(event.id).get()
  if (!existing.data || existing.data.teacherId !== teacherId) throw new Error('学生不存在')
  const sid = event.id
  await db.collection('class_records').where({ studentId: sid }).remove()
  await db.collection('payments').where({ studentId: sid }).remove()
  await db.collection('schedules').where({ studentId: sid }).remove()
  await db.collection('students').doc(sid).remove()
  return { success: true }
}

// ====== 上课记录 ======

async function getRecords(event) {
  const teacherId = authTeacher(event.token)
  const studentsRes = await db.collection('students').where({ teacherId }).get()
  const studentIds = studentsRes.data.map(s => s._id)
  if (studentIds.length === 0) return { success: true, data: [] }

  let cond = { studentId: _.in(studentIds) }
  if (event.student_id) {
    cond = { studentId: event.student_id }
  }
  const res = await db.collection('class_records').where(cond).get()
  let list = res.data
  if (event.month) {
    list = list.filter(r => r.date && r.date.startsWith(event.month))
  }
  list.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.startTime || '').localeCompare(a.startTime || ''))
  const studentMap = {}
  studentsRes.data.forEach(s => { studentMap[s._id] = s.name })
  const records = list.map(r => ({
    ...mapper.record(r),
    student_name: studentMap[r.studentId] || '未知'
  }))
  return { success: true, data: records }
}

async function getMyRecords(event) {
  const studentId = authStudent(event.token)
  const res = await db.collection('class_records').where({ studentId }).get()
  const list = res.data.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.startTime || '').localeCompare(a.startTime || ''))
  return { success: true, data: list.map(mapper.record) }
}

async function addRecord(event) {
  const teacherId = authTeacher(event.token)
  const studentRes = await db.collection('students').doc(event.student_id).get()
  if (!studentRes.data || studentRes.data.teacherId !== teacherId) throw new Error('学生不存在')
  const data = {
    studentId: event.student_id,
    date: event.date,
    startTime: event.start_time,
    endTime: event.end_time,
    durationMinutes: event.duration_minutes || 0,
    peopleType: event.people_type || '一对一',
    peopleCount: event.people_count || 1,
    feePerHour: event.fee_per_hour || 0,
    totalFee: event.total_fee || 0,
    content: event.content || '',
    isSettled: event.is_settled || 0,
    createdAt: db.serverDate()
  }
  const res = await db.collection('class_records').add({ data })
  const doc = await db.collection('class_records').doc(res._id).get()
  return { success: true, data: mapper.record(doc.data) }
}

async function updateRecord(event) {
  authTeacher(event.token)
  const updateData = {}
  if (event.date !== undefined) updateData.date = event.date
  if (event.start_time !== undefined) updateData.startTime = event.start_time
  if (event.end_time !== undefined) updateData.endTime = event.end_time
  if (event.duration_minutes !== undefined) updateData.durationMinutes = event.duration_minutes
  if (event.people_type !== undefined) updateData.peopleType = event.people_type
  if (event.people_count !== undefined) updateData.peopleCount = event.people_count
  if (event.fee_per_hour !== undefined) updateData.feePerHour = event.fee_per_hour
  if (event.total_fee !== undefined) updateData.totalFee = event.total_fee
  if (event.content !== undefined) updateData.content = event.content
  if (event.is_settled !== undefined) updateData.isSettled = event.is_settled
  await db.collection('class_records').doc(event.id).update({ data: updateData })
  const doc = await db.collection('class_records').doc(event.id).get()
  return { success: true, data: mapper.record(doc.data) }
}

async function deleteRecord(event) {
  authTeacher(event.token)
  await db.collection('class_records').doc(event.id).remove()
  return { success: true }
}

// ====== 缴费 ======

async function getPayments(event) {
  const teacherId = authTeacher(event.token)
  const studentsRes = await db.collection('students').where({ teacherId }).get()
  const studentIds = studentsRes.data.map(s => s._id)
  if (studentIds.length === 0) return { success: true, data: [] }

  let query
  if (event.student_id) {
    query = db.collection('payments').where({ studentId: event.student_id })
  } else {
    query = db.collection('payments').where({ studentId: _.in(studentIds) })
  }
  const res = await query.get()
  const studentMap = {}
  res.data.sort((a, b) => (b.paymentDate || '').localeCompare(a.paymentDate || ''))
  studentsRes.data.forEach(s => { studentMap[s._id] = s.name })
  const payments = res.data.map(p => ({
    ...p,
    id: p._id,
    student_name: studentMap[p.studentId] || '未知'
  }))
  return { success: true, data: payments }
}

async function getMyPayments(event) {
  const studentId = authStudent(event.token)
  const res = await db.collection('payments').where({ studentId }).get()
  const list = res.data.sort((a, b) => (b.paymentDate || '').localeCompare(a.paymentDate || ''))
  return { success: true, data: list.map(p => ({ ...p, id: p._id })) }
}

async function addPayment(event) {
  const teacherId = authTeacher(event.token)
  const studentRes = await db.collection('students').doc(event.student_id).get()
  if (!studentRes.data || studentRes.data.teacherId !== teacherId) throw new Error('学生不存在')
  const data = {
    studentId: event.student_id,
    amount: event.amount,
    paymentDate: event.payment_date,
    note: event.note || '',
    createdAt: db.serverDate()
  }
  const res = await db.collection('payments').add({ data })
  const doc = await db.collection('payments').doc(res._id).get()
  return { success: true, data: { ...doc.data, id: doc.data._id } }
}

async function deletePayment(event) {
  authTeacher(event.token)
  await db.collection('payments').doc(event.id).remove()
  return { success: true }
}

// ====== 排课 ======

async function getSchedules(event) {
  const teacherId = authTeacher(event.token)
  const studentsRes = await db.collection('students').where({ teacherId }).get()
  const studentIds = studentsRes.data.map(s => s._id)
  if (studentIds.length === 0) return { success: true, data: [] }

  let query
  if (event.student_id) {
    query = db.collection('schedules').where({ studentId: event.student_id, isActive: 1 })
  } else {
    query = db.collection('schedules').where({ studentId: _.in(studentIds), isActive: 1 })
  }
  const res = await query.get()
  res.data.sort((a, b) => (a.dayOfWeek - b.dayOfWeek) || (a.startTime || '').localeCompare(b.startTime || ''))
  const studentMap = {}
  studentsRes.data.forEach(s => { studentMap[s._id] = { name: s.name, subject: s.subject } })
  const schedules = res.data.map(s => ({
    ...s,
    id: s._id,
    student_name: studentMap[s.studentId]?.name || '未知',
    student_subject: studentMap[s.studentId]?.subject || ''
  }))
  return { success: true, data: schedules }
}

async function getMySchedules(event) {
  const studentId = authStudent(event.token)
  const res = await db.collection('schedules').where({ studentId, isActive: 1 }).get()
  const list = res.data.sort((a, b) => (a.dayOfWeek - b.dayOfWeek) || (a.startTime || '').localeCompare(b.startTime || ''))
  return { success: true, data: list.map(s => ({ ...s, id: s._id })) }
}

async function addSchedule(event) {
  const teacherId = authTeacher(event.token)
  const studentRes = await db.collection('students').doc(event.student_id).get()
  if (!studentRes.data || studentRes.data.teacherId !== teacherId) throw new Error('学生不存在')
  const data = {
    studentId: event.student_id,
    dayOfWeek: event.day_of_week,
    startTime: event.start_time,
    endTime: event.end_time,
    isActive: 1,
    createdAt: db.serverDate()
  }
  const res = await db.collection('schedules').add({ data })
  const doc = await db.collection('schedules').doc(res._id).get()
  return { success: true, data: { ...doc.data, id: doc.data._id } }
}

async function deleteSchedule(event) {
  authTeacher(event.token)
  await db.collection('schedules').doc(event.id).remove()
  return { success: true }
}

// ====== 统计 ======

async function getTeacherStats(event) {
  const teacherId = authTeacher(event.token)
  const month = event.month || new Date().toISOString().slice(0, 7)

  const studentsRes = await db.collection('students').where({ teacherId }).get()
  const students = studentsRes.data
  const studentIds = students.map(s => s._id)

  const activeStudents = students.filter(s => s.isActive === 1)
  const studentCount = activeStudents.length

  if (studentIds.length === 0) {
    return { success: true, data: { studentCount: 0, monthData: { total_classes: 0, total_minutes: 0, total_income: 0 }, unsettled: 0, studentStats: [], recentRecords: [] } }
  }

  // 本月记录
  const monthRecordsRes = await db.collection('class_records')
    .where({ studentId: _.in(studentIds) })
    .get()
  const allRecords = monthRecordsRes.data
  const monthRecords = allRecords.filter(r => r.date && r.date.startsWith(month))

  const totalMinutes = monthRecords.reduce((a, r) => a + (r.durationMinutes || 0), 0)
  const totalIncome = monthRecords.reduce((a, r) => a + (r.totalFee || 0), 0)
  const totalClasses = monthRecords.length

  // 未结算
  const unsettled = allRecords.filter(r => !r.isSettled).reduce((a, r) => a + (r.totalFee || 0), 0)

  // 学生统计
  const studentStats = monthRecords.reduce((acc, r) => {
    if (!acc[r.studentId]) acc[r.studentId] = { studentId: r.studentId, class_count: 0, total_minutes: 0, total_fee: 0 }
    acc[r.studentId].class_count++
    acc[r.studentId].total_minutes += r.durationMinutes || 0
    acc[r.studentId].total_fee += r.totalFee || 0
    return acc
  }, {})

  const studentMap = {}
  students.forEach(s => { studentMap[s._id] = s.name })

  const studentStatsArr = Object.values(studentStats).map(ss => ({
    id: ss.studentId,
    name: studentMap[ss.studentId] || '未知',
    class_count: ss.class_count,
    total_minutes: ss.total_minutes,
    total_fee: ss.total_fee
  }))

  // 最近20条
  const recentRecords = allRecords.sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 20).map(r => ({
    id: r._id,
    student_name: studentMap[r.studentId] || '未知',
    date: r.date,
    start_time: r.startTime,
    end_time: r.endTime,
    people_type: r.peopleType,
    total_fee: r.totalFee,
    is_settled: r.isSettled
  }))

  return {
    success: true,
    data: {
      studentCount,
      monthData: { total_classes: totalClasses, total_minutes: totalMinutes, total_income: totalIncome },
      unsettled,
      studentStats: studentStatsArr.sort((a, b) => b.total_fee - a.total_fee),
      recentRecords
    }
  }
}

async function getStudentStats(event) {
  const studentId = authStudent(event.token)
  const studentRes = await db.collection('students').doc(studentId).get()
  const student = studentRes.data
  if (!student) throw new Error('学生不存在')

  const recordsRes = await db.collection('class_records').where({ studentId }).get()
  const records = recordsRes.data
  const total = {
    class_count: records.length,
    total_minutes: records.reduce((a, r) => a + (r.durationMinutes || 0), 0),
    total_fee: records.reduce((a, r) => a + (r.totalFee || 0), 0)
  }
  const unsettled = records.filter(r => !r.isSettled).reduce((a, r) => a + (r.totalFee || 0), 0)

  const paymentsRes = await db.collection('payments').where({ studentId }).get()
  const paid = paymentsRes.data.reduce((a, p) => a + (p.amount || 0), 0)

  // 月度统计（最近12月）
  const monthlyMap = {}
  records.forEach(r => {
    if (r.date) {
      const m = r.date.slice(0, 7)
      if (!monthlyMap[m]) monthlyMap[m] = { month: m, class_count: 0, total_minutes: 0, total_fee: 0 }
      monthlyMap[m].class_count++
      monthlyMap[m].total_minutes += r.durationMinutes || 0
      monthlyMap[m].total_fee += r.totalFee || 0
    }
  })
  const monthlyStats = Object.values(monthlyMap).sort((a, b) => b.month.localeCompare(a.month)).slice(0, 12)

  return {
    success: true,
    data: {
      student: { id: student._id, name: student.name, grade: student.grade, subject: student.subject, default_fee: student.defaultFee, default_people_type: student.defaultPeopleType, phone: student.phone },
      total,
      unsettled,
      paid,
      balance: total.total_fee - paid,
      monthlyStats
    }
  }
}

// ====== 初始化 ======

async function init() {
  const existing = await db.collection('teachers').where({ username: 'admin' }).get()
  if (existing.data.length > 0) return { success: true, message: '管理员已存在' }

  await db.collection('teachers').add({
    data: { username: 'admin', password: 'admin123', name: '管理员', createdAt: db.serverDate() }
  })
  return { success: true, message: '初始化完成' }
}

// ====== 字段映射（数据库 <=> 小程序） ======

const mapper = {
  student(doc) {
    return {
      id: doc._id,
      name: doc.name,
      grade: doc.grade,
      subject: doc.subject,
      default_fee: doc.defaultFee,
      default_people_type: doc.defaultPeopleType,
      phone: doc.phone,
      password: doc.password,
      is_active: doc.isActive
    }
  },
  record(doc) {
    return {
      id: doc._id,
      student_id: doc.studentId,
      date: doc.date,
      start_time: doc.startTime,
      end_time: doc.endTime,
      duration_minutes: doc.durationMinutes,
      people_type: doc.peopleType,
      people_count: doc.peopleCount,
      fee_per_hour: doc.feePerHour,
      total_fee: doc.totalFee,
      content: doc.content,
      is_settled: doc.isSettled
    }
  }
}

// ====== 路由 ======

exports.main = async (event) => {
  try {
    switch (event.type) {
      case 'teacherLogin': return await teacherLogin(event)
      case 'studentLogin': return await studentLogin(event)
      case 'verify': return await verify(event)
      case 'getStudents': return await getStudents(event)
      case 'getStudent': return await getStudent(event)
      case 'addStudent': return await addStudent(event)
      case 'updateStudent': return await updateStudent(event)
      case 'deleteStudent': return await deleteStudent(event)
      case 'getRecords': return await getRecords(event)
      case 'getMyRecords': return await getMyRecords(event)
      case 'addRecord': return await addRecord(event)
      case 'updateRecord': return await updateRecord(event)
      case 'deleteRecord': return await deleteRecord(event)
      case 'getPayments': return await getPayments(event)
      case 'getMyPayments': return await getMyPayments(event)
      case 'addPayment': return await addPayment(event)
      case 'deletePayment': return await deletePayment(event)
      case 'getSchedules': return await getSchedules(event)
      case 'getMySchedules': return await getMySchedules(event)
      case 'addSchedule': return await addSchedule(event)
      case 'deleteSchedule': return await deleteSchedule(event)
      case 'getTeacherStats': return await getTeacherStats(event)
      case 'getStudentStats': return await getStudentStats(event)
      case 'init': return await init()
      default: return { success: false, message: '未知操作' }
    }
  } catch (err) {
    return { success: false, message: err.message }
  }
}
