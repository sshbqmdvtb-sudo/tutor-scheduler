<template>
  <div class="page">
    <div class="top-bar">
      <button class="btn btn-outline btn-sm" @click="$router.back()">← 返回</button>
      <h1>{{ student?.name }}</h1>
      <button class="btn btn-outline btn-sm" @click="$router.push('/teacher/students/' + id + '/edit')">编辑</button>
    </div>

    <div v-if="!student" class="text-center" style="padding:40px;color:var(--gray-400);">加载中...</div>

    <template v-else>
      <!-- 基本信息 -->
      <div class="card">
        <div class="card-title">基本信息</div>
        <div class="flex-between mb-8"><span class="text-gray">学号</span><span>{{ student.id }}</span></div>
        <div class="flex-between mb-8"><span class="text-gray">年级</span><span>{{ student.grade || '-' }}</span></div>
        <div class="flex-between mb-8"><span class="text-gray">科目</span><span>{{ student.subject || '-' }}</span></div>
        <div class="flex-between mb-8"><span class="text-gray">课时费</span><span>¥{{ student.default_fee }}/小时</span></div>
        <div class="flex-between mb-8"><span class="text-gray">上课类型</span><span>{{ student.default_people_type }}</span></div>
        <div class="flex-between"><span class="text-gray">登录密码</span><span>{{ student.password }}</span></div>
      </div>

      <!-- 统计 -->
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-value">{{ stats.class_count || 0 }}</div><div class="stat-label">总课次</div></div>
        <div class="stat-card green"><div class="stat-value">{{ formatMinutes(stats.total_minutes) }}</div><div class="stat-label">总课时</div></div>
        <div class="stat-card orange"><div class="stat-value">{{ formatMoney(stats.total_fee) }}</div><div class="stat-label">总费用</div></div>
        <div class="stat-card red"><div class="stat-value">{{ formatMoney(unsettled) }}</div><div class="stat-label">未结算</div></div>
      </div>

      <!-- 固定课表 -->
      <div class="card">
        <div class="flex-between">
          <span class="card-title" style="margin-bottom:0;">固定课表</span>
          <button class="btn btn-primary btn-sm" @click="showScheduleModal = true">+ 添加</button>
        </div>
        <div v-if="schedules.length === 0" class="empty-state" style="padding:12px;">
          <p>暂无固定排课</p>
        </div>
        <div class="list-item" v-for="s in schedules" :key="s.id">
          <div class="item-main">
            <div class="item-title">{{ DAYS[s.day_of_week] }}</div>
            <div class="item-sub">{{ s.start_time }} - {{ s.end_time }}</div>
          </div>
          <button class="btn btn-danger btn-sm" @click="deleteSchedule(s.id)">删除</button>
        </div>
      </div>

      <!-- 上课记录 -->
      <div class="card">
        <div class="flex-between">
          <span class="card-title" style="margin-bottom:0;">上课记录</span>
          <button class="btn btn-primary btn-sm" @click="showRecordModal = true">+ 记上课</button>
        </div>
        <div v-if="records.length === 0" class="empty-state" style="padding:12px;">
          <p>暂无上课记录</p>
        </div>
        <div class="list-item" v-for="r in records" :key="r.id">
          <div class="item-main">
            <div class="item-title">{{ r.date }} {{ r.start_time }}-{{ r.end_time }}</div>
            <div class="item-sub">{{ r.people_type }} · {{ formatMinutes(r.duration_minutes) }} · ¥{{ r.total_fee }}</div>
            <div v-if="r.content" class="item-sub">{{ r.content }}</div>
          </div>
          <div>
            <span :class="r.is_settled ? 'tag tag-success' : 'tag tag-warning'">{{ r.is_settled ? '已结' : '未结' }}</span>
            <button class="btn btn-danger btn-sm mt-8" @click="deleteRecord(r.id)" style="display:block;">删除</button>
          </div>
        </div>
      </div>

      <!-- 缴费记录 -->
      <div class="card">
        <div class="flex-between">
          <span class="card-title" style="margin-bottom:0;">缴费记录</span>
          <button class="btn btn-success btn-sm" @click="showPaymentModal = true">+ 记缴费</button>
        </div>
        <div v-if="payments.length === 0" class="empty-state" style="padding:12px;">
          <p>暂无缴费记录</p>
        </div>
        <div class="list-item" v-for="p in payments" :key="p.id">
          <div class="item-main">
            <div class="item-title">¥{{ p.amount }}</div>
            <div class="item-sub">{{ p.payment_date }}{{ p.note ? ' · ' + p.note : '' }}</div>
          </div>
          <button class="btn btn-danger btn-sm" @click="deletePayment(p.id)">删除</button>
        </div>
      </div>
    </template>

    <div style="height:60px;"></div>
    <TeacherNav />

    <!-- 添加排课弹窗 -->
    <div v-if="showScheduleModal" class="modal-overlay" @click.self="showScheduleModal = false">
      <div class="modal-content">
        <h3>添加固定排课</h3>
        <div class="form-group">
          <label class="form-label">星期</label>
          <select class="form-select" v-model="scheduleForm.day_of_week">
            <option v-for="(d, i) in DAYS" :key="i" :value="i">{{ d }}</option>
          </select>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">开始时间</label>
            <input class="form-input" type="time" v-model="scheduleForm.start_time" />
          </div>
          <div class="form-group">
            <label class="form-label">结束时间</label>
            <input class="form-input" type="time" v-model="scheduleForm.end_time" />
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" @click="showScheduleModal = false">取消</button>
          <button class="btn btn-primary" @click="addSchedule">保存</button>
        </div>
      </div>
    </div>

    <!-- 添加上课记录弹窗 -->
    <div v-if="showRecordModal" class="modal-overlay" @click.self="showRecordModal = false">
      <div class="modal-content">
        <h3>记录上课</h3>
        <div class="form-group">
          <label class="form-label">日期</label>
          <input class="form-input" type="date" v-model="recordForm.date" />
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">开始时间</label>
            <input class="form-input" type="time" v-model="recordForm.start_time" />
          </div>
          <div class="form-group">
            <label class="form-label">结束时间</label>
            <input class="form-input" type="time" v-model="recordForm.end_time" />
          </div>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">上课类型</label>
            <select class="form-select" v-model="recordForm.people_type">
              <option>一对一</option>
              <option>一对二</option>
              <option>一对多</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">人数</label>
            <input class="form-input" type="number" v-model.number="recordForm.people_count" />
          </div>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">课时费(元/小时)</label>
            <input class="form-input" type="number" v-model.number="recordForm.fee_per_hour" />
          </div>
          <div class="form-group">
            <label class="form-label">总费用</label>
            <input class="form-input" type="number" v-model.number="recordForm.total_fee" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">上课内容</label>
          <textarea class="form-input" v-model="recordForm.content" placeholder="选填"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" @click="showRecordModal = false">取消</button>
          <button class="btn btn-primary" @click="addRecord">保存</button>
        </div>
      </div>
    </div>

    <!-- 添加缴费记录弹窗 -->
    <div v-if="showPaymentModal" class="modal-overlay" @click.self="showPaymentModal = false">
      <div class="modal-content">
        <h3>记录缴费</h3>
        <div class="form-group">
          <label class="form-label">金额</label>
          <input class="form-input" type="number" v-model.number="paymentForm.amount" />
        </div>
        <div class="form-group">
          <label class="form-label">缴费日期</label>
          <input class="form-input" type="date" v-model="paymentForm.payment_date" />
        </div>
        <div class="form-group">
          <label class="form-label">备注</label>
          <input class="form-input" v-model="paymentForm.note" placeholder="选填" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" @click="showPaymentModal = false">取消</button>
          <button class="btn btn-success" @click="addPayment">保存</button>
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
  props: { id: [String, Number] },
  data() {
    const now = new Date()
    return {
      student: null,
      records: [],
      payments: [],
      schedules: [],
      stats: {},
      unsettled: 0,
      DAYS: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
      showScheduleModal: false,
      scheduleForm: { day_of_week: 1, start_time: '09:00', end_time: '11:00' },
      showRecordModal: false,
      recordForm: {
        student_id: Number(this.id),
        date: now.toISOString().slice(0, 10),
        start_time: '09:00',
        end_time: '10:00',
        people_type: '一对一',
        people_count: 1,
        fee_per_hour: 100,
        total_fee: 100,
        content: ''
      },
      showPaymentModal: false,
      paymentForm: {
        student_id: Number(this.id),
        amount: 0,
        payment_date: now.toISOString().slice(0, 10),
        note: ''
      }
    }
  },
  async mounted() {
    await this.loadData()
    this.recordForm.fee_per_hour = this.student?.default_fee || 100
    this.recordForm.people_type = this.student?.default_people_type || '一对一'
  },
  watch: {
    'id'() { this.loadData() }
  },
  methods: {
    async loadData() {
      const [studentRes, recordsRes, paymentsRes, scheduleRes] = await Promise.all([
        api.getStudent(this.id),
        api.getRecords({ student_id: this.id }),
        api.getPayments({ student_id: this.id }),
        api.getSchedules({ student_id: this.id })
      ])
      if (studentRes.success) this.student = studentRes.data
      if (recordsRes.success) {
        this.records = recordsRes.data
        this.stats = {
          class_count: this.records.length,
          total_minutes: this.records.reduce((a, r) => a + (r.duration_minutes || 0), 0),
          total_fee: this.records.reduce((a, r) => a + (r.total_fee || 0), 0)
        }
        this.unsettled = this.records.filter(r => !r.is_settled).reduce((a, r) => a + (r.total_fee || 0), 0)
      }
      if (paymentsRes.success) this.payments = paymentsRes.data
      if (scheduleRes.success) this.schedules = scheduleRes.data
    },
    async addSchedule() {
      const res = await api.addSchedule({ ...this.scheduleForm, student_id: Number(this.id) })
      if (res.success) {
        this.toast('添加成功')
        this.showScheduleModal = false
        this.loadData()
      }
    },
    async deleteSchedule(id) {
      await api.deleteSchedule(id)
      this.loadData()
    },
    calcFee() {
      const start = this.recordForm.start_time
      const end = this.recordForm.end_time
      if (start && end) {
        const [h1, m1] = start.split(':').map(Number)
        const [h2, m2] = end.split(':').map(Number)
        const minutes = (h2 * 60 + m2) - (h1 * 60 + m1)
        this.recordForm.duration_minutes = Math.max(0, minutes)
        this.recordForm.total_fee = Math.round((this.recordForm.fee_per_hour || 0) * (minutes / 60))
      }
    },
    async addRecord() {
      this.calcFee()
      const res = await api.addRecord({ ...this.recordForm, student_id: Number(this.id) })
      if (res.success) {
        this.toast('记录成功')
        this.showRecordModal = false
        this.loadData()
      }
    },
    async deleteRecord(id) {
      if (!confirm('确定删除这条记录？')) return
      await api.deleteRecord(id)
      this.loadData()
    },
    async addPayment() {
      const res = await api.addPayment({ ...this.paymentForm, student_id: Number(this.id) })
      if (res.success) {
        this.toast('缴费记录已添加')
        this.showPaymentModal = false
        this.loadData()
      }
    },
    async deletePayment(id) {
      if (!confirm('确定删除？')) return
      await api.deletePayment(id)
      this.loadData()
    },
    formatMoney(v) { return '¥' + (Number(v) || 0).toFixed(0) },
    formatMinutes(m) {
      m = Number(m) || 0
      return Math.floor(m / 60) + 'h' + (m % 60 > 0 ? (m % 60) + 'min' : '')
    }
  }
}
</script>
