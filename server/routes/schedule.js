const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { authTeacher, authStudent } = require('../middleware');

// 获取所有排课（老师端）
router.get('/', authTeacher, (req, res) => {
  const db = getDB();
  const { student_id } = req.query;
  let sql = `SELECT sc.*, s.name as student_name, s.subject as student_subject
             FROM schedules sc JOIN students s ON sc.student_id = s.id
             WHERE s.teacher_id = ? AND sc.is_active = 1`;
  const params = [req.userId];
  if (student_id) {
    sql += ' AND sc.student_id = ?';
    params.push(student_id);
  }
  sql += ' ORDER BY sc.day_of_week, sc.start_time';
  const schedules = db.prepare(sql).all(...params);
  res.json({ success: true, data: schedules });
});

// 获取学生的排课
router.get('/my', authStudent, (req, res) => {
  const db = getDB();
  const schedules = db.prepare(
    'SELECT * FROM schedules WHERE student_id = ? AND is_active = 1 ORDER BY day_of_week, start_time'
  ).all(req.userId);
  res.json({ success: true, data: schedules });
});

// 添加排课
router.post('/', authTeacher, (req, res) => {
  const db = getDB();
  const { student_id, day_of_week, start_time, end_time } = req.body;
  const student = db.prepare('SELECT id FROM students WHERE id = ? AND teacher_id = ?').get(student_id, req.userId);
  if (!student) return res.json({ success: false, message: '学生不存在' });
  const result = db.prepare(
    'INSERT INTO schedules (student_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)'
  ).run(student_id, day_of_week, start_time, end_time);
  const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(result.lastInsertRowid);
  res.json({ success: true, data: schedule });
});

// 删除排课
router.delete('/:id', authTeacher, (req, res) => {
  const db = getDB();
  const schedule = db.prepare(
    `SELECT sc.* FROM schedules sc JOIN students s ON sc.student_id = s.id
     WHERE sc.id = ? AND s.teacher_id = ?`
  ).get(req.params.id, req.userId);
  if (!schedule) return res.json({ success: false, message: '排课不存在' });
  db.prepare('DELETE FROM schedules WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
