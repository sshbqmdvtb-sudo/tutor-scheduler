const api = require('../../../utils/api')
const { formatMoney, formatMinutes, showSuccess, showError, DAYS, PEOPLE_TYPES } = require('../../../utils/util')

Page({
  data: {
    student: null,
    records: [],
    payments: [],
    schedules: [],
    stats: {},
    unsettled: 0,
    DAYS,
    PEOPLE_TYPES,
    peopleTypeIndex: 0,

    showScheduleModal: false,
    scheduleForm: { day_of_week: 1, start_time: '09:00', end_time: '11:00' },

    showRecordModal: false,
    recordForm: { date: '', start_time: '09:00', end_time: '10:00', people_type: '一对一', people_count: 1, fee_per_hour: 100, total_fee: 100, content: '' },

    showPaymentModal: false,
    paymentForm: { amount: 0, payment_date: '', note: '' }
  },

  onLoad(options) {
    this.data.studentId = options.id
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10)
    this.setData({
      'recordForm.date': dateStr,
      'paymentForm.payment_date': dateStr
    })
    this.loadData()
  },

  async loadData() {
    try {
      const [studentRes, recordsRes, paymentsRes, scheduleRes] = await Promise.all([
        api.getStudent(this.data.studentId),
        api.getRecords({ student_id: this.data.studentId }),
        api.getPayments({ student_id: this.data.studentId }),
        api.getSchedules({ student_id: this.data.studentId })
      ])
      let stats = {}, unsettled = 0
      if (recordsRes.success) {
        const records = recordsRes.data
        stats = {
          class_count: records.length,
          total_minutes: records.reduce((a, r) => a + (r.duration_minutes || 0), 0),
          total_fee: records.reduce((a, r) => a + (r.total_fee || 0), 0)
        }
        unsettled = records.filter(r => !r.is_settled).reduce((a, r) => a + (r.total_fee || 0), 0)
        this.setData({ records })
      }
      this.setData({
        student: studentRes.data,
        payments: paymentsRes.data || [],
        schedules: scheduleRes.data || [],
        stats,
        unsettled,
        'recordForm.fee_per_hour': (studentRes.data && studentRes.data.default_fee) || 100,
        'recordForm.people_type': (studentRes.data && studentRes.data.default_people_type) || '一对一'
      })
      const ptIndex = PEOPLE_TYPES.indexOf(this.data.recordForm.people_type)
      this.setData({ peopleTypeIndex: ptIndex >= 0 ? ptIndex : 0 })
    } catch (err) {
      showError(err.message || '加载失败')
    }
  },

  formatMoney(v) { return formatMoney(v) },
  formatMinutes(m) { return formatMinutes(m) },

  // 排课
  showAddSchedule() { this.setData({ showScheduleModal: true }) },
  onScheduleDayChange(e) { this.setData({ 'scheduleForm.day_of_week': e.detail.value }) },
  onScheduleStartChange(e) { this.setData({ 'scheduleForm.start_time': e.detail.value }) },
  onScheduleEndChange(e) { this.setData({ 'scheduleForm.end_time': e.detail.value }) },

  async addSchedule() {
    try {
      await api.addSchedule({ ...this.data.scheduleForm, student_id: Number(this.data.studentId) })
      showSuccess('添加成功')
      this.setData({ showScheduleModal: false })
      this.loadData()
    } catch (err) { showError(err.message) }
  },

  async deleteSchedule(e) {
    const id = e.currentTarget.dataset.id
    try {
      await api.deleteSchedule(id)
      this.loadData()
    } catch (err) { showError(err.message) }
  },

  // 上课记录
  showAddRecord() { this.setData({ showRecordModal: true }) },
  onRecordDateChange(e) { this.setData({ 'recordForm.date': e.detail.value }) },
  onRecordStartChange(e) { this.setData({ 'recordForm.start_time': e.detail.value }) },
  onRecordEndChange(e) { this.setData({ 'recordForm.end_time': e.detail.value }); this.calcFee() },
  onPeopleTypeChange(e) {
    const idx = e.detail.value
    this.setData({ peopleTypeIndex: idx, 'recordForm.people_type': PEOPLE_TYPES[idx] })
  },
  onRecordPeopleCountInput(e) { this.setData({ 'recordForm.people_count': Number(e.detail.value) }) },
  onRecordFeeInput(e) { this.setData({ 'recordForm.fee_per_hour': Number(e.detail.value) }); this.calcFee() },
  onRecordTotalFeeInput(e) { this.setData({ 'recordForm.total_fee': Number(e.detail.value) }) },
  onRecordContentInput(e) { this.setData({ 'recordForm.content': e.detail.value }) },

  calcFee() {
    const { start_time, end_time, fee_per_hour } = this.data.recordForm
    if (start_time && end_time) {
      const [h1, m1] = start_time.split(':').map(Number)
      const [h2, m2] = end_time.split(':').map(Number)
      const minutes = (h2 * 60 + m2) - (h1 * 60 + m1)
      const dur = Math.max(0, minutes)
      this.setData({
        'recordForm.duration_minutes': dur,
        'recordForm.total_fee': Math.round((fee_per_hour || 0) * (dur / 60))
      })
    }
  },

  async addRecord() {
    this.calcFee()
    try {
      await api.addRecord({ ...this.data.recordForm, student_id: Number(this.data.studentId) })
      showSuccess('记录成功')
      this.setData({ showRecordModal: false })
      this.loadData()
    } catch (err) { showError(err.message) }
  },

  async deleteRecord(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定删除这条记录？',
      success: async (res) => {
        if (res.confirm) {
          try { await api.deleteRecord(id); this.loadData() } catch (err) { showError(err.message) }
        }
      }
    })
  },

  // 缴费
  showAddPayment() { this.setData({ showPaymentModal: true }) },
  onPaymentAmountInput(e) { this.setData({ 'paymentForm.amount': Number(e.detail.value) }) },
  onPaymentDateChange(e) { this.setData({ 'paymentForm.payment_date': e.detail.value }) },
  onPaymentNoteInput(e) { this.setData({ 'paymentForm.note': e.detail.value }) },

  async addPayment() {
    try {
      await api.addPayment({ ...this.data.paymentForm, student_id: Number(this.data.studentId) })
      showSuccess('缴费记录已添加')
      this.setData({ showPaymentModal: false })
      this.loadData()
    } catch (err) { showError(err.message) }
  },

  async deletePayment(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定删除？',
      success: async (res) => {
        if (res.confirm) {
          try { await api.deletePayment(id); this.loadData() } catch (err) { showError(err.message) }
        }
      }
    })
  },

  hideModals() {
    this.setData({ showScheduleModal: false, showRecordModal: false, showPaymentModal: false })
  },

  noop() {}
})
