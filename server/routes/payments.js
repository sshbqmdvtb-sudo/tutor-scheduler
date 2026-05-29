const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { authTeacher, authStudent } = require('../middleware');

// 获取所有缴费记录（老师端）
router.get('/', authTeacher, (req, res) => {
  const db = getDB();
  const { student_id } = req.query;
  let sql = `SELECT p.*, s.name as student_name
             FROM payments p JOIN students s ON p.student_id = s.id
             WHERE s.teacher_id = ?`;
  const params = [req.userId];
  if (student_id) {
    sql += ' AND p.student_id = ?';
    params.push(student_id);
  }
  sql += ' ORDER BY p.payment_date DESC';
  const payments = db.prepare(sql).all(...params);
  res.json({ success: true, data: payments });
});

// 获取学生的缴费记录
router.get('/my', authStudent, (req, res) => {
  const db = getDB();
  const payments = db.prepare('SELECT * FROM payments WHERE student_id = ? ORDER BY payment_date DESC').all(req.userId);
  res.json({ success: true, data: payments });
});

// 添加缴费记录
router.post('/', authTeacher, (req, res) => {
  const db = getDB();
  const { student_id, amount, payment_date, note } = req.body;
  const student = db.prepare('SELECT id FROM students WHERE id = ? AND teacher_id = ?').get(student_id, req.userId);
  if (!student) return res.json({ success: false, message: '学生不存在' });
  const result = db.prepare(
    'INSERT INTO payments (student_id, amount, payment_date, note) VALUES (?, ?, ?, ?)'
  ).run(student_id, amount, payment_date, note || '');
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(result.lastInsertRowid);
  res.json({ success: true, data: payment });
});

// 删除缴费记录
router.delete('/:id', authTeacher, (req, res) => {
  const db = getDB();
  const payment = db.prepare(
    `SELECT p.* FROM payments p JOIN students s ON p.student_id = s.id
     WHERE p.id = ? AND s.teacher_id = ?`
  ).get(req.params.id, req.userId);
  if (!payment) return res.json({ success: false, message: '记录不存在' });
  db.prepare('DELETE FROM payments WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
