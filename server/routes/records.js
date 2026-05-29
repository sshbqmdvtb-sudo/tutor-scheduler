const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { authTeacher, authStudent } = require('../middleware');

// 获取所有上课记录（老师端）
router.get('/', authTeacher, (req, res) => {
  const db = getDB();
  const { student_id, month, start_date, end_date } = req.query;
  let sql = `SELECT r.*, s.name as student_name, s.subject as student_subject, s.grade as student_grade
             FROM class_records r JOIN students s ON r.student_id = s.id
             WHERE s.teacher_id = ?`;
  const params = [req.userId];

  if (student_id) {
    sql += ' AND r.student_id = ?';
    params.push(student_id);
  }
  if (month) {
    sql += " AND strftime('%Y-%m', r.date) = ?";
    params.push(month);
  }
  if (start_date && end_date) {
    sql += ' AND r.date >= ? AND r.date <= ?';
    params.push(start_date, end_date);
  }

  sql += ' ORDER BY r.date DESC, r.start_time DESC';
  const records = db.prepare(sql).all(...params);
  res.json({ success: true, data: records });
});

// 获取学生的上课记录（学生端）
router.get('/my', authStudent, (req, res) => {
  const db = getDB();
  const records = db.prepare(
    'SELECT * FROM class_records WHERE student_id = ? ORDER BY date DESC, start_time DESC'
  ).all(req.userId);
  res.json({ success: true, data: records });
});

// 添加上课记录
router.post('/', authTeacher, (req, res) => {
  const db = getDB();
  const { student_id, date, start_time, end_time, duration_minutes, people_type, people_count, fee_per_hour, total_fee, content } = req.body;

  // 验证学生属于该老师
  const student = db.prepare('SELECT id FROM students WHERE id = ? AND teacher_id = ?').get(student_id, req.userId);
  if (!student) return res.json({ success: false, message: '学生不存在' });

  const result = db.prepare(
    `INSERT INTO class_records (student_id, date, start_time, end_time, duration_minutes, people_type, people_count, fee_per_hour, total_fee, content)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(student_id, date, start_time, end_time, duration_minutes, people_type, people_count, fee_per_hour, total_fee, content || '');

  const record = db.prepare('SELECT * FROM class_records WHERE id = ?').get(result.lastInsertRowid);
  res.json({ success: true, data: record });
});

// 更新上课记录
router.put('/:id', authTeacher, (req, res) => {
  const db = getDB();
  const { student_id, date, start_time, end_time, duration_minutes, people_type, people_count, fee_per_hour, total_fee, content, is_settled } = req.body;

  const record = db.prepare(
    `SELECT r.* FROM class_records r JOIN students s ON r.student_id = s.id
     WHERE r.id = ? AND s.teacher_id = ?`
  ).get(req.params.id, req.userId);
  if (!record) return res.json({ success: false, message: '记录不存在' });

  db.prepare(
    `UPDATE class_records SET student_id=?, date=?, start_time=?, end_time=?, duration_minutes=?,
     people_type=?, people_count=?, fee_per_hour=?, total_fee=?, content=?, is_settled=?
     WHERE id=?`
  ).run(student_id, date, start_time, end_time, duration_minutes, people_type, people_count, fee_per_hour, total_fee, content, is_settled ?? 0, req.params.id);

  const updated = db.prepare('SELECT * FROM class_records WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updated });
});

// 删除上课记录
router.delete('/:id', authTeacher, (req, res) => {
  const db = getDB();
  const record = db.prepare(
    `SELECT r.* FROM class_records r JOIN students s ON r.student_id = s.id
     WHERE r.id = ? AND s.teacher_id = ?`
  ).get(req.params.id, req.userId);
  if (!record) return res.json({ success: false, message: '记录不存在' });
  db.prepare('DELETE FROM class_records WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
