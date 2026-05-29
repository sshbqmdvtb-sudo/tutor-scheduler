<template>
  <div class="page" style="display:flex;flex-direction:column;justify-content:center;min-height:100vh;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:48px;margin-bottom:8px;">📚</div>
      <h1 style="font-size:24px;font-weight:700;">家教课时管理系统</h1>
      <p style="color:var(--gray-500);margin-top:4px;">请选择登录角色</p>
    </div>

    <!-- 老师登录 -->
    <div class="card" style="margin-bottom:16px;">
      <div class="card-title">👨‍🏫 老师登录</div>
      <div class="form-group">
        <label class="form-label">用户名</label>
        <input class="form-input" v-model="teacherForm.username" placeholder="请输入用户名" />
      </div>
      <div class="form-group">
        <label class="form-label">密码</label>
        <input class="form-input" type="password" v-model="teacherForm.password" placeholder="请输入密码"
          @keyup.enter="teacherLogin" />
      </div>
      <button class="btn btn-primary btn-block" @click="teacherLogin" :disabled="loading">
        {{ loading ? '登录中...' : '老师登录' }}
      </button>
    </div>

    <!-- 学生登录 -->
    <div class="card">
      <div class="card-title">🎓 学生登录</div>
      <div class="form-group">
        <label class="form-label">手机号</label>
        <input class="form-input" type="number" v-model="studentForm.phone" placeholder="老师登记的家长手机号" />
      </div>
      <div class="form-group">
        <label class="form-label">密码</label>
        <input class="form-input" type="password" v-model="studentForm.password" placeholder="默认密码 123456"
          @keyup.enter="studentLogin" />
      </div>
      <button class="btn btn-success btn-block" @click="studentLogin" :disabled="loading">
        {{ loading ? '登录中...' : '学生登录' }}
      </button>
    </div>

    <p style="text-align:center;margin-top:16px;color:var(--gray-400);font-size:12px;">
      默认老师账号: admin / admin123
    </p>
  </div>
</template>

<script>
import { api } from '../api'
import { inject } from 'vue'

export default {
  name: 'Login',
  setup() {
    const toast = inject('toast')
    return { toast }
  },
  data() {
    return {
      teacherForm: { username: 'admin', password: 'admin123' },
      studentForm: { phone: '', password: '123456' },
      loading: false
    }
  },
  methods: {
    async teacherLogin() {
      if (!this.teacherForm.username || !this.teacherForm.password) return
      this.loading = true
      const res = await api.teacherLogin(this.teacherForm)
      this.loading = false
      if (res.success) {
        localStorage.setItem('teacher_token', res.data.token)
        localStorage.setItem('teacher_info', JSON.stringify(res.data.teacher))
        this.$router.push('/teacher/dashboard')
      } else {
        this.toast(res.message || '登录失败', 'error')
      }
    },
    async studentLogin() {
      if (!this.studentForm.phone) return
      this.loading = true
      const res = await api.studentLogin(this.studentForm)
      this.loading = false
      if (res.success) {
        localStorage.setItem('student_token', res.data.token)
        localStorage.setItem('student_info', JSON.stringify(res.data.student))
        this.$router.push('/student/schedule')
      } else {
        this.toast(res.message || '登录失败', 'error')
      }
    }
  }
}
</script>
