<template>
  <div class="page">
    <div class="top-bar">
      <div>
        <h1>首页</h1>
        <div class="user-info">欢迎回来，{{ teacherInfo?.name }}</div>
      </div>
      <button class="btn btn-outline btn-sm" @click="logout">退出</button>
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value">{{ stats.studentCount }}</div>
        <div class="stat-label">学生人数</div>
      </div>
      <div class="stat-card green">
        <div class="stat-value">{{ stats.monthData?.total_classes || 0 }}</div>
        <div class="stat-label">本月上课</div>
      </div>
      <div class="stat-card orange">
        <div class="stat-value">{{ formatMoney(stats.monthData?.total_income || 0) }}</div>
        <div class="stat-label">本月收入</div>
      </div>
      <div class="stat-card red">
        <div class="stat-value">{{ formatMoney(stats.unsettled || 0) }}</div>
        <div class="stat-label">未结算</div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="card">
      <div class="card-title">快捷操作</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <button class="btn btn-primary" @click="$router.push('/teacher/students/add')">➕ 添加学生</button>
        <button class="btn btn-primary" @click="$router.push('/teacher/records')">📝 记上课</button>
        <button class="btn btn-outline" @click="$router.push('/teacher/stats')">📊 查看统计</button>
        <button class="btn btn-outline" @click="$router.push('/teacher/schedule')">📅 课表</button>
      </div>
    </div>

    <!-- 各学生本月统计 -->
    <div class="card">
      <div class="card-title">本月各学生统计</div>
      <div v-if="stats.studentStats?.length">
        <div class="list-item" v-for="s in stats.studentStats" :key="s.id"
          style="cursor:pointer;" @click="$router.push('/teacher/students/' + s.id)">
          <div class="item-main">
            <div class="item-title">{{ s.name }}</div>
            <div class="item-sub">{{ s.class_count }} 次课 · {{ formatMinutes(s.total_minutes) }} · {{ formatMoney(s.total_fee) }}</div>
          </div>
          <span style="font-size:18px;">→</span>
        </div>
      </div>
      <div v-else class="empty-state" style="padding:20px;">
        <p>暂无数据，先去添加学生吧</p>
      </div>
    </div>

    <!-- 近期上课 -->
    <div class="card">
      <div class="card-title">近期上课记录</div>
      <div v-if="stats.recentRecords?.length">
        <div class="list-item" v-for="r in stats.recentRecords" :key="r.id">
          <div class="item-main">
            <div class="item-title">{{ r.student_name }}</div>
            <div class="item-sub">{{ r.date }} {{ r.start_time }}-{{ r.end_time }} · {{ r.people_type }} · {{ formatMoney(r.total_fee) }}</div>
          </div>
          <span :class="r.is_settled ? 'tag tag-success' : 'tag tag-warning'">{{ r.is_settled ? '已结算' : '未结' }}</span>
        </div>
      </div>
      <div v-else class="empty-state" style="padding:20px;">
        <p>暂无上课记录</p>
      </div>
    </div>

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
    return {
      stats: {},
      teacherInfo: JSON.parse(localStorage.getItem('teacher_info') || '{}')
    }
  },
  mounted() {
    this.loadStats()
  },
  methods: {
    async loadStats() {
      const now = new Date()
      const month = now.toISOString().slice(0, 7)
      const res = await api.getTeacherStats({ month })
      if (res.success) this.stats = res.data
    },
    formatMoney(v) { return '¥' + (Number(v) || 0).toFixed(0) },
    formatMinutes(m) {
      m = Number(m) || 0
      return Math.floor(m / 60) + 'h' + (m % 60 > 0 ? (m % 60) + 'min' : '')
    },
    logout() {
      localStorage.removeItem('teacher_token')
      localStorage.removeItem('teacher_info')
      this.$router.push('/login')
    }
  }
}
</script>
