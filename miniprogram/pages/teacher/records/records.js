const api = require('../../../utils/api')
const { formatMinutes, showSuccess, showError, getNow, getMonth, PEOPLE_TYPES } = require('../../../utils/util')

Page({
  data: {
    records: [],
    students: [],
    loading: true,
    filterStudentIndex: 0,
    filterMonth: getMonth(),
    studentNames: ['全部学生'],
    realStudentNames: [],
    formStudentIndex: -1,

    showAddModal: false,
    form: { student_id: '', date: getNow(), start_time: '09:00', end_time: '10:00', people_type: '一对一', people_count: 1, fee_per_hour: 100, total_fee: 100, content: '' },
    formPeopleTypeIndex: 0,
    PEOPLE_TYPES
  },

  async onShow() {
    try {
      const res = await api.getStudents()
      const students = res.data || []
      const names = students.map(s => s.name)
      this.setData({
        students,
        studentNames: ['全部学生', ...names],
        realStudentNames: names
      })
    } catch (err) {}
    this.loadRecords()
  },

  async loadRecords() {
    this.setData({ loading: true })
    try {
      const params = {}
      if (this.data.filterStudentIndex > 0) {
        const s = this.data.students[this.data.filterStudentIndex - 1]
        if (s) params.student_id = s.id
      }
      params.month = this.data.filterMonth
      const res = await api.getRecords(params)
      this.setData({ records: res.data, loading: false })
    } catch (err) {
      showError(err.message || '加载失败')
      this.setData({ loading: false })
    }
  },

  onStudentFilterChange(e) {
    this.setData({ filterStudentIndex: e.detail.value })
    this.loadRecords()
  },
  onMonthFilterChange(e) {
    this.setData({ filterMonth: e.detail.value })
    this.loadRecords()
  },

  // 表单
  showAddModal() { this.setData({ showAddModal: true }) },
  onFormDateChange(e) { this.setData({ 'form.date': e.detail.value }) },
  onFormStartChange(e) { this.setData({ 'form.start_time': e.detail.value }) },
  onFormEndChange(e) { this.setData({ 'form.end_time': e.detail.value }); this.calcFee() },
  onFormPeopleTypeChange(e) {
    const idx = e.detail.value
    this.setData({ formPeopleTypeIndex: idx, 'form.people_type': PEOPLE_TYPES[idx] })
  },
  onFormPeopleCountInput(e) { this.setData({ 'form.people_count': Number(e.detail.value) }) },
  onFormFeeInput(e) { this.setData({ 'form.fee_per_hour': Number(e.detail.value) }); this.calcFee() },
  onFormTotalFeeInput(e) { this.setData({ 'form.total_fee': Number(e.detail.value) }) },
  onFormContentInput(e) { this.setData({ 'form.content': e.detail.value }) },

  onFormStudentChange(e) {
    const idx = e.detail.value
    const student = this.data.students[idx]
    if (student) {
      this.setData({
        formStudentIndex: idx,
        'form.student_id': student.id,
        'form.fee_per_hour': student.default_fee || 100,
        'form.people_type': student.default_people_type || '一对一'
      })
      const ptIdx = PEOPLE_TYPES.indexOf(student.default_people_type)
      this.setData({ formPeopleTypeIndex: ptIdx >= 0 ? ptIdx : 0 })
      this.calcFee()
    }
  },

  calcFee() {
    const { start_time, end_time, fee_per_hour } = this.data.form
    if (start_time && end_time) {
      const [h1, m1] = start_time.split(':').map(Number)
      const [h2, m2] = end_time.split(':').map(Number)
      const minutes = (h2 * 60 + m2) - (h1 * 60 + m1)
      const dur = Math.max(0, minutes)
      this.setData({
        'form.duration_minutes': dur,
        'form.total_fee': Math.round((fee_per_hour || 0) * (dur / 60))
      })
    }
  },

  async addRecord() {
    if (!this.data.form.student_id) return showError('请选择学生')
    this.calcFee()
    try {
      await api.addRecord(this.data.form)
      showSuccess('记录成功')
      this.setData({ showAddModal: false })
      this.loadRecords()
    } catch (err) { showError(err.message) }
  },

  async deleteRecord(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定删除？',
      success: async (res) => {
        if (res.confirm) {
          try { await api.deleteRecord(id); this.loadRecords() } catch (err) { showError(err.message) }
        }
      }
    })
  },

  formatMinutes(m) { return formatMinutes(m) },
  hideModals() { this.setData({ showAddModal: false }) },
  noop() {}
})
