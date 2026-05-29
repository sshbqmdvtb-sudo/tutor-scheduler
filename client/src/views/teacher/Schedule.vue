<template>
  <div class="page">
    <div class="top-bar">
      <div>
        <h1>课表</h1>
        <div class="user-info">所有学生的固定上课安排</div>
      </div>
      <button class="btn btn-primary btn-sm" @click="showAddModal = true">+ 添加</button>
    </div>

    <div v-if="loading" class="text-center" style="padding:40px;color:var(--gray-400);">加载中...</div>

    <template v-else>
      <div v-for="day in 7" :key="day">
        <div class="card" v-if="getDaySchedules(day - 1).length > 0">
          <div class="card-title">{{ DAYS[day - 1] }}</div>
          <div class="list-item" v-for="s in getDaySchedules(day - 1)" :key="s.id">
            <div style="width:36px;height:36px;border-radius:50%;background:var(--primary-light);display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--primary);">
              {{ s.student_name?.[0] }}
            </div>
            <div class="item-main">
              <div class="item-title">{{ s.student_name }}</div>
              <div class="item-sub">{{ s.start_time }} - {{ s.end_time }}</div>
            </div>
            <button class="btn btn-danger btn-sm" @click="deleteSchedule(s.id)">删除</button>
          </div>
        </div>
      </div>

      <div v-if="allSchedules.length === 0" class="card">
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <p>暂无排课，点击右上角添加</p>
        </div>
      </div>
    </template>

    <div style="height:60px;"></div>
    <TeacherNav />

    <!-- 添加排课 -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-content">
        <h3>添加固定排课</h3>
        <div class="form-group">
          <label class="form-label">学生 *</label>
          <select class="form-select" v-model="form.student_id">
            <option value="">请选择</option>
            <option v-for="s in students" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">星期</label>
          <select class="form-select" v-model="form.day_of_week">
            <option v-for="(d, i) in DAYS" :key="i" :value="i">{{ d }}</option>
          </select>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">开始</label>
            <input class="form-input" type="time" v-model="form.start_time" />
          </div>
          <div class="form-group">
            <label class="form-label">结束</label>
            <input class="form-input" type="time" v-model="form.end_time" />
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" @click="showAddModal = false">取消</button>
          <button class="btn btn-primary" @click="addSchedule" :disabled="!form.student_id">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { api } from '../../api'
import TeacherNav from '../../components/TeacherNav.vue'
import { inject } from 'vue'

export default {
  components: { TeacherNav },
  setup() {
    const toast = inject('toast')
    return { toast }
  },
  data() {
    return {
      allSchedules: [],
      students: [],
      loading: true,
      DAYS: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
      showAddModal: false,
      form: { student_id: '', day_of_week: 1, start_time: '09:00', end_time: '11:00' }
    }
  },
  async mounted() {
    const [schedRes, stuRes] = await Promise.all([
      api.getSchedules({}), api.getStudents()
    ])
    if (schedRes.success) this.allSchedules = schedRes.data
    if (stuRes.success) this.students = stuRes.data
    this.loading = false
  },
  methods: {
    getDaySchedules(day) {
      return this.allSchedules.filter(s => s.day_of_week === day)
    },
    async addSchedule() {
      if (!this.form.student_id) return
      const res = await api.addSchedule(this.form)
      if (res.success) {
        this.toast('添加成功')
        this.showAddModal = false
        const schedRes = await api.getSchedules({})
        if (schedRes.success) this.allSchedules = schedRes.data
      }
    },
    async deleteSchedule(id) {
      if (!confirm('确定删除？')) return
      await api.deleteSchedule(id)
      const schedRes = await api.getSchedules({})
      if (schedRes.success) this.allSchedules = schedRes.data
    }
  }
}
</script>
