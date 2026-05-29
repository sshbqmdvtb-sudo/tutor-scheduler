const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const jwt = require('jsonwebtoken');

const SECRET = 'tutor-scheduler-secret-key-2024';

// 老师登录
router.post('/teacher/login', (req, res) => {
  const { username, password } = req.body;
  const db = getDB();
  const teacher = db.prepare('SELECT * FROM teachers WHERE username = ?').get(username);
  if (!teacher || teacher.password !== password) {
    return res.json({ success: false, message: '用户名或密码错误' });
  }
  const token = jwt.sign({ id: teacher.id, role: 'teacher', name: teacher.name }, SECRET, { expiresIn: '7d' });
  res.json({ success: true, data: { token, teacher: { id: teacher.id, name: teacher.name, username: teacher.username } } });
});

// 学生登录
router.post('/student/login', (req, res) => {
  const { phone, password } = req.body;
  const db = getDB();
  const student = db.prepare('SELECT * FROM students WHERE phone = ? AND is_active = 1').get(phone);
  if (!student || student.password !== password) {
    return res.json({ success: false, message: '手机号或密码错误' });
  }
  const token = jwt.sign({ id: student.id, role: 'student', name: student.name }, SECRET, { expiresIn: '7d' });
  res.json({
    success: true,
    data: {
      token,
      student: {
        id: student.id,
        name: student.name,
        grade: student.grade,
        subject: student.subject,
        default_fee: student.default_fee,
        default_people_type: student.default_people_type,
        phone: student.phone
      }
    }
  });
});

// 验证token
router.get('/verify', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.json({ success: false, message: '未登录' });
  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), SECRET);
    res.json({ success: true, data: decoded });
  } catch {
    res.json({ success: false, message: 'token无效' });
  }
});

module.exports = router;
module.exports.SECRET = SECRET;
