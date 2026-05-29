<template>
  <div class="page">
    <div class="top-bar">
      <div>
        <h1>设置</h1>
        <div class="user-info">{{ teacherInfo?.name }}</div>
      </div>
      <button class="btn btn-outline btn-sm" @click="logout">退出</button>
    </div>

    <div class="card">
      <div class="card-title">账号信息</div>
      <div class="flex-between mb-8"><span class="text-gray">用户名</span><span>{{ teacherInfo?.username }}</span></div>
      <div class="flex-between mb-8"><span class="text-gray">姓名</span><span>{{ teacherInfo?.name }}</span></div>
    </div>

    <div class="card">
      <div class="card-title">学生使用指南</div>
      <div style="font-size:14px;line-height:1.8;color:var(--gray-600);">
        <p>1. 学生登录网址：<strong>{{ url }}</strong></p>
        <p>2. 每位学生有对应的<strong>学号</strong>（创建时自动生成）</p>
        <p>3. 默认登录密码：<strong>123456</strong>（可在编辑学生时修改）</p>
        <p>4. 学生可查看自己的课表、上课记录和费用明细</p>
      </div>
    </div>

    <div class="card">
      <div class="card-title">系统信息</div>
      <div class="flex-between mb-8"><span class="text-gray">版本</span><span>v1.0.0</span></div>
      <div class="flex-between"><span class="text-gray">数据存储</span><span>本地 SQLite</span></div>
    </div>
  </div>
</template>

<script>
import TeacherNav from '../../components/TeacherNav.vue'

export default {
  components: { TeacherNav },
  data() {
    return {
      teacherInfo: JSON.parse(localStorage.getItem('teacher_info') || '{}'),
      url: window.location.origin + '/#' + this.$router.resolve({ path: '/login' }).href
    }
  },
  methods: {
    logout() {
      localStorage.removeItem('teacher_token')
      localStorage.removeItem('teacher_info')
      this.$router.push('/login')
    }
  }
}
</script>
