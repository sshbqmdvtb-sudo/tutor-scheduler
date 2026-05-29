import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: () => import('./views/Login.vue') },

  // 老师端
  { path: '/teacher', redirect: '/teacher/dashboard' },
  { path: '/teacher/dashboard', name: 'TeacherDashboard', component: () => import('./views/teacher/Dashboard.vue'), meta: { role: 'teacher' } },
  { path: '/teacher/students', name: 'StudentList', component: () => import('./views/teacher/StudentList.vue'), meta: { role: 'teacher' } },
  { path: '/teacher/students/add', name: 'AddStudent', component: () => import('./views/teacher/AddStudent.vue'), meta: { role: 'teacher' } },
  { path: '/teacher/students/:id/edit', name: 'EditStudent', component: () => import('./views/teacher/AddStudent.vue'), meta: { role: 'teacher' }, props: true },
  { path: '/teacher/students/:id', name: 'StudentDetail', component: () => import('./views/teacher/StudentDetail.vue'), meta: { role: 'teacher' }, props: true },
  { path: '/teacher/records', name: 'Records', component: () => import('./views/teacher/Records.vue'), meta: { role: 'teacher' } },
  { path: '/teacher/schedule', name: 'TeacherSchedule', component: () => import('./views/teacher/Schedule.vue'), meta: { role: 'teacher' } },
  { path: '/teacher/stats', name: 'Stats', component: () => import('./views/teacher/Stats.vue'), meta: { role: 'teacher' } },
  { path: '/teacher/settings', name: 'Settings', component: () => import('./views/teacher/Settings.vue'), meta: { role: 'teacher' } },

  // 学生端
  { path: '/student', redirect: '/student/schedule' },
  { path: '/student/schedule', name: 'StudentSchedule', component: () => import('./views/student/StudentSchedule.vue'), meta: { role: 'student' } },
  { path: '/student/records', name: 'StudentRecords', component: () => import('./views/student/StudentRecords.vue'), meta: { role: 'student' } },
  { path: '/student/fees', name: 'StudentFees', component: () => import('./views/student/StudentFees.vue'), meta: { role: 'student' } },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const teacher = localStorage.getItem('teacher_token')
  const student = localStorage.getItem('student_token')
  const role = to.meta?.role

  if (to.path === '/login') return next()

  if (role === 'teacher' && !teacher) return next('/login')
  if (role === 'student' && !student) return next('/login')

  next()
})

export default router
