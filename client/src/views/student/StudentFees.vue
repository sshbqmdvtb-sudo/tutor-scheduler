<template>
  <div class="page">
    <div class="top-bar">
      <div>
        <h1>费用明细</h1>
        <div class="user-info">{{ studentInfo?.name }}</div>
      </div>
      <button class="btn btn-outline btn-sm" @click="logout">退出</button>
    </div>

    <div v-if="loading" class="text-center" style="padding:40px;color:var(--gray-400);">加载中...</div>

    <template v-else>
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-value">{{ formatMoney(stats.total?.total_fee || 0) }}</div><div class="stat-label">总费用</div></div>
        <div class="stat-card green"><div class="stat-value">{{ formatMoney(stats.paid || 0) }}</div><div class="stat-label">已支付</div></div>
        <div class="stat-card orange"><div class="stat-value">{{ formatMoney(stats.unsettled || 0) }}</div><div class="stat-label">未结算</div></div>
        <div class="stat-card red"><div class="stat-value">{{ formatMoney(stats.balance || 0) }}</div><div class="stat-label">应缴余额</div></div>
      </div>

      <!-- 月度明细 -->
      <div class="card">
        <div class="card-title">月度统计</div>
        <div v-if="stats.monthlyStats?.length">
          <div class="list-item" v-for="m in stats.monthlyStats" :key="m.month">
            <div class="item-main">
              <div class="item-title">{{ m.month }}</div>
              <div class="item-sub">{{ m.class_count }} 次课 · {{ formatMinutes(m.total_minutes) }}</div>
            </div>
            <div style="font-weight:600;">{{ formatMoney(m.total_fee) }}</div>
          </div>
        </div>
        <div v-else class="empty-state" style="padding:12px;"><p>暂无数据</p></div>
      </div>

      <!-- 缴费记录 -->
      <div class="card">
        <div class="card-title">缴费记录</div>
        <div v-if="payments.length === 0" class="empty-state" style="padding:12px;">
          <p>暂无缴费记录</p>
        </div>
        <div class="list-item" v-for="p in payments" :key="p.id">
          <div class="item-main">
            <div class="item-title" style="color:var(--success);">+ ¥{{ p.amount }}</div>
            <div class="item-sub">{{ p.payment_date }}{{ p.note ? ' · ' + p.note : '' }}</div>
          </div>
        </div>
      </div>
    </template>

    <div style="height:60px;"></div>
    <StudentNav />
  </div>
</template>

<script>
import { api } from '../../api'
import StudentNav from '../../components/StudentNav.vue'

export default {
  components: { StudentNav },
  data() {
    return {
      stats: {},
      payments: [],
      loading: true,
      studentInfo: JSON.parse(localStorage.getItem('student_info') || '{}')
    }
  },
  mounted() { this.load() },
  methods: {
    async load() {
      const [statsRes, payRes] = await Promise.all([
        api.getStudentStats(),
        api.getMyPayments()
      ])
      if (statsRes.success) this.stats = statsRes.data
      if (payRes.success) this.payments = payRes.data
      this.loading = false
    },
    formatMoney(v) { return '¥' + (Number(v) || 0).toFixed(0) },
    formatMinutes(m) {
      m = Number(m) || 0
      return Math.floor(m / 60) + 'h' + (m % 60 > 0 ? (m % 60) + 'min' : '')
    },
    logout() {
      localStorage.removeItem('student_token')
      localStorage.removeItem('student_info')
      this.$router.push('/login')
    }
  }
}
</script>
