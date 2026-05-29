const api = require('../../../utils/api')
const { showToast, showError, PEOPLE_TYPES } = require('../../../utils/util')

Page({
  data: { students: [], loading: true, showModal: false, form: { name: '', grade: '', subject: '', phone: '', default_fee: 100, default_people_type: '一对一' }, PEOPLE_TYPES },

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

  showAddModal() { this.setData({ showModal: true }) },

  onFormInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ ['form.' + field]: e.detail.value })
  },

  onPeopleTypeChange(e) {
    this.setData({ 'form.default_people_type': PEOPLE_TYPES[e.detail.value] })
  },

  async addStudent() {
    const { name, phone } = this.data.form
    if (!name) return showToast('请输入学生姓名')
    this.setData({ loading: true })
    try {
      await api.addStudent(this.data.form)
      showToast('添加成功')
      this.setData({ showModal: false, form: { name: '', grade: '', subject: '', phone: '', default_fee: 100, default_people_type: '一对一' } })
      this.load()
    } catch (err) {
      showError(err.message || '添加失败')
      this.setData({ loading: false })
    }
  },

  hideModal() { this.setData({ showModal: false }) },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/teacher/student-detail/student-detail?id=' + id })
  },

  async deleteStudent(e) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name
    wx.showModal({
      title: '确认删除',
      content: '确定删除学生 ' + name + '？该生的所有上课记录、缴费记录和排课都将被删除。',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.deleteStudent(id)
            showToast('已删除')
            this.load()
          } catch (err) {
            showError(err.message || '删除失败')
          }
        }
      }
    })
  },

  noop() {}
})
