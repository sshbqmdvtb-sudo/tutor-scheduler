<template>
  <div class="page">
    <div class="top-bar">
      <div>
        <h1>我的课表</h1>
        <div class="user-info">{{ studentInfo?.name }}</div>
      </div>
      <button class="btn btn-outline btn-sm" @click="logout">退出</button>
    </div>

    <div v-if="loading" class="text-center" style="padding:40px;color:var(--gray-400);">加载中...</div>

    <template v-else>
      <div class="card">
        <div class="card-title">固定上课安排</div>
        <div v-if="schedules.length === 0" class="empty-state" style="padding:20px;">
          <div class="empty-icon">📅</div>
          <p>暂无固定课表，请联系老师设置</p>
        </div>
        <div class="list-item" v-for="s in schedules" :key="s.id">
          <div style="width:40px;height:40px;border-radius:50%;background:var(--primary-light);display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--primary);font-weight:600;">
            {{ DAYS_SHORT[s.day_of_week] }}
          </div>
          <div class="item-main">
            <div class="item-title">{{ DAYS[s.day_of_week] }}</div>
            <div class="item-sub">{{ s.start_time }} - {{ s.end_time }}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">学生信息</div>
        <div class="flex-between mb-8"><span class="text-gray">学号</span><span>{{ studentInfo?.id }}</span></div>
        <div class="flex-between mb-8"><span class="text-gray">年级</span><span>{{ studentInfo?.grade || '-' }}</span></div>
        <div class="flex-between mb-8"><span class="text-gray">科目</span><span>{{ studentInfo?.subject || '-' }}</span></div>
        <div class="flex-between"><span class="text-gray">课时费</span><span>¥{{ studentInfo?.default_fee }}/小时</span></div>
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
      schedules: [],
      loading: true,
      DAYS: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
      DAYS_SHORT: ['日', '一', '二', '三', '四', '五', '六'],
      studentInfo: JSON.parse(localStorage.getItem('student_info') || '{}')
    }
  },
  mounted() { this.load() },
  methods: {
    async load() {
      const res = await api.getMySchedules()
      if (res.success) this.schedules = res.data
      this.loading = false
    },
    logout() {
      localStorage.removeItem('student_token')
      localStorage.removeItem('student_info')
      this.$router.push('/login')
    }
  }
}
</script>
