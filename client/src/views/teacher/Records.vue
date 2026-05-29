<template>
  <div class="page">
    <div class="top-bar">
      <div>
        <h1>上课记录</h1>
        <div class="user-info">快速记录每次上课</div>
      </div>
      <button class="btn btn-primary btn-sm" @click="showAddModal = true">+ 记录</button>
    </div>

    <!-- 筛选 -->
    <div class="card" style="padding:12px;">
      <div class="flex gap-8">
        <select class="form-select" v-model="filter.student_id" style="flex:1;" @change="loadRecords">
          <option value="">全部学生</option>
          <option v-for="s in students" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <input class="form-input" type="month" v-model="filter.month" style="flex:1;" @change="loadRecords" />
      </div>
    </div>

    <div v-if="loading" class="text-center" style="padding:40px;color:var(--gray-400);">加载中...</div>

    <div v-else-if="records.length === 0" class="card">
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <p>暂无上课记录</p>
      </div>
    </div>

    <div v-else class="card" v-for="r in records" :key="r.id">
      <div class="list-item">
        <div style="width:40px;height:40px;border-radius:50%;background:var(--primary-light);display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--primary);">
          {{ r.student_name?.[0] }}
        </div>
        <div class="item-main">
          <div class="item-title">{{ r.student_name }}
            <span :class="r.is_settled ? 'tag tag-success' : 'tag tag-warning'" style="margin-left:6px;">
              {{ r.is_settled ? '已结' : '未结' }}
            </span>
          </div>
          <div class="item-sub">{{ r.date }} {{ r.start_time }}-{{ r.end_time }}</div>
          <div class="item-sub">{{ r.people_type }} · {{ formatMinutes(r.duration_minutes) }} · ¥{{ r.total_fee }}</div>
          <div v-if="r.content" class="item-sub text-sm" style="color:var(--gray-600);">{{ r.content }}</div>
        </div>
        <button class="btn btn-danger btn-sm" @click="deleteRecord(r.id)">删除</button>
      </div>
    </div>

    <div style="height:60px;"></div>
    <TeacherNav />

    <!-- 添加上课记录弹窗 -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-content">
        <h3>记录上课</h3>
        <div class="form-group">
          <label class="form-label">学生 *</label>
          <select class="form-select" v-model="form.student_id">
            <option value="">请选择学生</option>
            <option v-for="s in students" :key="s.id" :value="s.id">{{ s.name }} ({{ s.subject }})</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">日期</label>
          <input class="form-input" type="date" v-model="form.date" />
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">开始</label>
            <input class="form-input" type="time" v-model="form.start_time" @change="calcFee" />
          </div>
          <div class="form-group">
            <label class="form-label">结束</label>
            <input class="form-input" type="time" v-model="form.end_time" @change="calcFee" />
          </div>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">类型</label>
            <select class="form-select" v-model="form.people_type">
              <option>一对一</option>
              <option>一对二</option>
              <option>一对多</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">人数</label>
            <input class="form-input" type="number" v-model.number="form.people_count" />
          </div>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">课时费(元/小时)</label>
            <input class="form-input" type="number" v-model.number="form.fee_per_hour" @change="calcFee" />
          </div>
          <div class="form-group">
            <label class="form-label">总费用</label>
            <input class="form-input" type="number" v-model.number="form.total_fee" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">上课内容</label>
          <textarea class="form-input" v-model="form.content" placeholder="选填"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" @click="showAddModal = false">取消</button>
          <button class="btn btn-primary" @click="addRecord" :disabled="!form.student_id">保存</button>
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
    const now = new Date()
    return {
      records: [],
      students: [],
      loading: true,
      filter: { student_id: '', month: now.toISOString().slice(0, 7) },
      showAddModal: false,
      form: {
        student_id: '',
        date: now.toISOString().slice(0, 10),
        start_time: '09:00',
        end_time: '10:00',
        people_type: '一对一',
        people_count: 1,
        fee_per_hour: 100,
        total_fee: 100,
        content: ''
      }
    }
  },
  async mounted() {
    const res = await api.getStudents()
    if (res.success) this.students = res.data
    await this.loadRecords()
  },
  methods: {
    async loadRecords() {
      this.loading = true
      const params = {}
      if (this.filter.student_id) params.student_id = this.filter.student_id
      if (this.filter.month) params.month = this.filter.month
      const res = await api.getRecords(params)
      if (res.success) this.records = res.data
      this.loading = false
    },
    calcFee() {
      const start = this.form.start_time
      const end = this.form.end_time
      if (start && end) {
        const [h1, m1] = start.split(':').map(Number)
        const [h2, m2] = end.split(':').map(Number)
        const minutes = (h2 * 60 + m2) - (h1 * 60 + m1)
        this.form.duration_minutes = Math.max(0, minutes)
        this.form.total_fee = Math.round((this.form.fee_per_hour || 0) * (minutes / 60))
      }
    },
    async addRecord() {
      if (!this.form.student_id) return this.toast('请选择学生', 'error')
      this.calcFee()
      const res = await api.addRecord(this.form)
      if (res.success) {
        this.toast('记录成功')
        this.showAddModal = false
        this.loadRecords()
      }
    },
    async deleteRecord(id) {
      if (!confirm('确定删除？')) return
      await api.deleteRecord(id)
      this.loadRecords()
    },
    formatMinutes(m) {
      m = Number(m) || 0
      return Math.floor(m / 60) + 'h' + (m % 60 > 0 ? (m % 60) + 'min' : '')
    }
  }
}
</script>
