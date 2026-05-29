<template>
  <div class="page">
    <div class="top-bar">
      <button class="btn btn-outline btn-sm" @click="$router.back()">← 返回</button>
      <h1>学生管理</h1>
      <button class="btn btn-primary btn-sm" @click="$router.push('/teacher/students/add')">+ 添加</button>
    </div>

    <div v-if="loading" class="text-center" style="padding:40px;color:var(--gray-400);">加载中...</div>

    <div v-else-if="students.length === 0" class="card">
      <div class="empty-state">
        <div class="empty-icon">👥</div>
        <p>还没有学生，点击右上角添加</p>
      </div>
    </div>

    <div v-else>
      <div class="card" v-for="s in students" :key="s.id"
        style="cursor:pointer;" @click="$router.push('/teacher/students/' + s.id)">
        <div class="list-item">
          <div style="width:40px;height:40px;border-radius:50%;background:var(--primary-light);display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--primary);">
            {{ s.name[0] }}
          </div>
          <div class="item-main">
            <div class="item-title">{{ s.name }}
              <span v-if="!s.is_active" class="tag tag-danger" style="margin-left:6px;">已停用</span>
            </div>
            <div class="item-sub">{{ s.grade }} · {{ s.subject }} · ¥{{ s.default_fee }}/h · {{ s.default_people_type }}</div>
          </div>
          <span style="font-size:18px;">→</span>
        </div>
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
    return { students: [], loading: true }
  },
  mounted() { this.load() },
  methods: {
    async load() {
      const res = await api.getStudents()
      if (res.success) this.students = res.data
      this.loading = false
    }
  }
}
</script>
