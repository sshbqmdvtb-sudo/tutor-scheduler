const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { authTeacher } = require('../middleware');

// 获取所有学生
router.get('/', authTeacher, (req, res) => {
  const db = getDB();
  const students = db.prepare('SELECT * FROM students WHERE teacher_id = ? ORDER BY is_active DESC, name ASC').all(req.userId);
  res.json({ success: true, data: students });
});

// 获取单个学生
router.get('/:id', authTeacher, (req, res) => {
  const db = getDB();
  const student = db.prepare('SELECT * FROM students WHERE id = ? AND teacher_id = ?').get(req.params.id, req.userId);
  if (!student) return res.json({ success: false, message: '学生不存在' });
  res.json({ success: true, data: student });
});

// 添加学生
router.post('/', authTeacher, (req, res) => {
  const db = getDB();
  const { name, grade, subject, default_fee, default_people_type, phone, password } = req.body;
  const result = db.prepare(
    'INSERT INTO students (teacher_id, name, grade, subject, default_fee, default_people_type, phone, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(req.userId, name, grade || '', subject || '', default_fee || 0, default_people_type || '一对一', phone || '', password || '123456');
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);
  res.json({ success: true, data: student });
});

// 更新学生
router.put('/:id', authTeacher, (req, res) => {
  const db = getDB();
  const { name, grade, subject, default_fee, default_people_type, phone, password, is_active } = req.body;
  db.prepare(
    'UPDATE students SET name=?, grade=?, subject=?, default_fee=?, default_people_type=?, phone=?, password=?, is_active=? WHERE id=? AND teacher_id=?'
  ).run(name, grade, subject, default_fee, default_people_type, phone, password, is_active ?? 1, req.params.id, req.userId);
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: student });
});

// 删除学生
router.delete('/:id', authTeacher, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM class_records WHERE student_id = ?').run(req.params.id);
  db.prepare('DELETE FROM payments WHERE student_id = ?').run(req.params.id);
  db.prepare('DELETE FROM schedules WHERE student_id = ?').run(req.params.id);
  db.prepare('DELETE FROM students WHERE id = ? AND teacher_id = ?').run(req.params.id, req.userId);
  res.json({ success: true });
});

module.exports = router;
