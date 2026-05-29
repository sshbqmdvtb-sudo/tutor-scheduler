function formatMoney(v) {
  return '¥' + (Number(v) || 0).toFixed(0)
}

function formatMinutes(m) {
  m = Number(m) || 0
  const h = Math.floor(m / 60)
  const min = m % 60
  return h + 'h' + (min > 0 ? min + 'min' : '')
}

function showToast(title, icon = 'none') {
  wx.showToast({ title, icon, duration: 2000 })
}

function showSuccess(title) {
  wx.showToast({ title, icon: 'success', duration: 2000 })
}

function showError(title) {
  wx.showToast({ title, icon: 'error', duration: 2000 })
}

function getNow() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

function getMonth() {
  const d = new Date()
  return d.toISOString().slice(0, 7)
}

const DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const PEOPLE_TYPES = ['一对一', '一对二', '一对多']

module.exports = {
  formatMoney,
  formatMinutes,
  showToast,
  showSuccess,
  showError,
  getNow,
  getMonth,
  DAYS,
  PEOPLE_TYPES
}
