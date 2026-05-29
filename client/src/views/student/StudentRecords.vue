<template>
  <div class="page">
    <div class="top-bar">
      <div>
        <h1>上课记录</h1>
        <div class="user-info">{{ studentInfo?.name }}</div>
      </div>
      <button class="btn btn-outline btn-sm" @click="logout">退出</button>
    </div>

    <div v-if="loading" class="text-center" style="padding:40px;color:var(--gray-400);">加载中...</div>

    <template v-else>
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-value">{{ totalStats.class_count || 0 }}</div><div class="stat-label">总课次</div></div>
        <div class="stat-card green"><div class="stat-value">{{ formatMinutes(totalStats.total_minutes) }}</div><div class="stat-label">总课时</div></div>
      </div>

      <div v-if="records.length === 0" class="card">
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <p>暂无上课记录</p>
        </div>
      </div>

      <div class="card" v-for="r in records" :key="r.id">
        <div class="flex-between">
          <div>
            <div style="font-weight:500;">{{ r.date }} {{ r.start_time }}-{{ r.end_time }}</div>
            <div class="text-sm text-gray mt-8">{{ r.people_type }} · {{ formatMinutes(r.duration_minutes) }}</div>
            <div v-if="r.content" class="text-sm mt-8" style="color:var(--gray-600);">{{ r.content }}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:600;">¥{{ r.total_fee }}</div>
            <span :class="r.is_settled ? 'tag tag-success' : 'tag tag-warning'" style="margin-top:4px;display:inline-block;">
              {{ r.is_settled ? '已结算' : '未结算' }}
            </span>
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
      records: [],
      totalStats: {},
      loading: true,
      studentInfo: JSON.parse(localStorage.getItem('student_info') || '{}')
    }
  },
  mounted() { this.load() },
  methods: {
    async load() {
      const res = await api.getMyRecords()
      if (res.success) {
        this.records = res.data
        this.totalStats = {
          class_count: this.records.length,
          total_minutes: this.records.reduce((a, r) => a + (r.duration_minutes || 0), 0),
          total_fee: this.records.reduce((a, r) => a + (r.total_fee || 0), 0)
        }
      }
      this.loading = false
    },
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
