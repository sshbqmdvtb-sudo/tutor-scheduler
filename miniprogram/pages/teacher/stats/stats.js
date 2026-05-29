const api = require('../../../utils/api')
const { formatMoney, formatMinutes, showError, getMonth } = require('../../../utils/util')

Page({
  data: {
    month: getMonth(),
    stats: {},
    loading: true
  },

  onShow() { this.loadStats() },

  computedMonthLabel() {
    const [y, m] = this.data.month.split('-')
    return y + '年' + Number(m) + '月'
  },

  onMonthChange(e) {
    this.setData({ month: e.detail.value })
    this.loadStats()
  },

  async loadStats() {
    this.setData({ loading: true })
    try {
      const res = await api.getTeacherStats({ month: this.data.month })
      this.setData({ stats: res.data, loading: false, monthLabel: this.computedMonthLabel() })
    } catch (err) {
      showError(err.message || '加载失败')
      this.setData({ loading: false })
    }
  },

  formatMoney(v) { return formatMoney(v) },
  formatMinutes(m) { return formatMinutes(m) }
})
