<template>
  <div class="page">
    <div class="top-bar">
      <div>
        <h1>统计报表</h1>
        <div class="user-info">查看收入和课时统计</div>
      </div>
      <input class="form-input" type="month" v-model="month" @change="loadStats" style="width:auto;" />
    </div>

    <div v-if="loading" class="text-center" style="padding:40px;color:var(--gray-400);">加载中...</div>

    <template v-else>
      <!-- 月度概览 -->
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-value">{{ stats.monthData?.total_classes || 0 }}</div><div class="stat-label">总课次</div></div>
        <div class="stat-card green"><div class="stat-value">{{ formatMinutes(stats.monthData?.total_minutes || 0) }}</div><div class="stat-label">总课时</div></div>
        <div class="stat-card orange"><div class="stat-value">{{ formatMoney(stats.monthData?.total_income || 0) }}</div><div class="stat-label">本月收入</div></div>
        <div class="stat-card red"><div class="stat-value">{{ formatMoney(stats.unsettled || 0) }}</div><div class="stat-label">未结算</div></div>
      </div>

      <!-- 各学生月度统计 -->
      <div class="card">
        <div class="card-title">{{ monthLabel }} 各学生统计</div>
        <div v-if="stats.studentStats?.length">
          <div class="list-item" v-for="s in stats.studentStats" :key="s.id">
            <div class="item-main">
              <div class="item-title">{{ s.name }}</div>
              <div class="item-sub">{{ s.class_count }} 次 · {{ formatMinutes(s.total_minutes) }}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-weight:600;">{{ formatMoney(s.total_fee) }}</div>
            </div>
          </div>
          <div class="list-item" style="border-top:2px solid var(--gray-200);margin-top:8px;padding-top:12px;">
            <div class="item-main"><strong>合计</strong></div>
            <div style="font-weight:700;color:var(--primary);">{{ formatMoney(stats.monthData?.total_income || 0) }}</div>
          </div>
        </div>
        <div v-else class="empty-state" style="padding:12px;"><p>暂无数据</p></div>
      </div>

      <!-- 近期记录 -->
      <div class="card">
        <div class="card-title">近期上课</div>
        <div v-if="stats.recentRecords?.length">
          <div class="list-item" v-for="r in stats.recentRecords" :key="r.id">
            <div class="item-main">
              <div class="item-title">{{ r.student_name }}</div>
              <div class="item-sub">{{ r.date }} {{ r.start_time }}-{{ r.end_time }} </div>
            </div>
            <span class="text-sm">{{ formatMoney(r.total_fee) }}</span>
          </div>
        </div>
      </div>
    </template>

    <div style="height:60px;"></div>
    <TeacherNav />
  </div>
</template>

<script>
import { api } from '../../api'
import TeacherNav from '../../components/TeacherNav.vue'

export default {
  components: { TeacherNav },
  data() {
    const now = new Date()
    return {
      month: now.toISOString().slice(0, 7),
      stats: {},
      loading: true
    }
  },
  computed: {
    monthLabel() {
      const [y, m] = this.month.split('-')
      return y + '年' + Number(m) + '月'
    }
  },
  mounted() { this.loadStats() },
  methods: {
    async loadStats() {
      this.loading = true
      const res = await api.getTeacherStats({ month: this.month })
      if (res.success) this.stats = res.data
      this.loading = false
    },
    formatMoney(v) { return '¥' + (Number(v) || 0).toFixed(0) },
    formatMinutes(m) {
      m = Number(m) || 0
      return Math.floor(m / 60) + 'h' + (m % 60 > 0 ? (m % 60) + 'min' : '')
    }
  }
}
</script>
