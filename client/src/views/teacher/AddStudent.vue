<template>
  <div class="page">
    <div class="top-bar">
      <button class="btn btn-outline btn-sm" @click="$router.back()">← 返回</button>
      <h1>{{ isEdit ? '编辑学生' : '添加学生' }}</h1>
      <div style="width:60px;"></div>
    </div>

    <div class="card">
      <div class="form-group">
        <label class="form-label">姓名 *</label>
        <input class="form-input" v-model="form.name" placeholder="学生姓名" />
      </div>
      <div class="form-group">
        <label class="form-label">年级</label>
        <input class="form-input" v-model="form.grade" placeholder="如：高一、初三" />
      </div>
      <div class="form-group">
        <label class="form-label">科目</label>
        <input class="form-input" v-model="form.subject" placeholder="如：数学、英语" />
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">默认课时费(元/小时)</label>
          <input class="form-input" type="number" v-model="form.default_fee" />
        </div>
        <div class="form-group">
          <label class="form-label">上课类型</label>
          <select class="form-select" v-model="form.default_people_type">
            <option>一对一</option>
            <option>一对二</option>
            <option>一对多</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">手机号</label>
        <input class="form-input" v-model="form.phone" placeholder="选填" />
      </div>
      <div class="form-group">
        <label class="form-label">登录密码</label>
        <input class="form-input" v-model="form.password" placeholder="默认 123456" />
        <p class="text-sm text-gray mt-8">学生用此密码登录查看自己的课表和费用</p>
      </div>
      <button class="btn btn-primary btn-block" @click="save" :disabled="!form.name">
        {{ isEdit ? '保存修改' : '添加学生' }}
      </button>
    </div>
  </div>
</template>

<script>
import { api } from '../../api'
import { inject } from 'vue'

export default {
  setup() {
    const toast = inject('toast')
    return { toast }
  },
  data() {
    return {
      form: { name: '', grade: '', subject: '', default_fee: 100, default_people_type: '一对一', phone: '', password: '123456' },
      isEdit: false
    }
  },
  async mounted() {
    if (this.$route.params.id) {
      this.isEdit = true
      const res = await api.getStudent(this.$route.params.id)
      if (res.success) {
        this.form = { ...res.data }
      }
    }
  },
  methods: {
    async save() {
      if (!this.form.name) return
      if (this.isEdit) {
        await api.updateStudent(this.$route.params.id, this.form)
        this.toast('保存成功')
      } else {
        const res = await api.addStudent(this.form)
        if (res.success) {
          this.toast('添加成功，学号: ' + res.data.id)
        }
      }
      this.$router.back()
    }
  }
}
</script>
