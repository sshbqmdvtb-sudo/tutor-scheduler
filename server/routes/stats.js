const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { authTeacher, authStudent } = require('../middleware');

// 老师端统计
router.get('/teacher', authTeacher, (req, res) => {
  const db = getDB();
  const { month } = req.query;

  // 本月总课时和收入
  let monthSql = `SELECT COALESCE(SUM(r.duration_minutes), 0) as total_minutes,
                         COALESCE(SUM(r.total_fee), 0) as total_income,
                         COUNT(r.id) as total_classes
                  FROM class_records r
                  JOIN students s ON r.student_id = s.id
                  WHERE s.teacher_id = ? AND strftime('%Y-%m', r.date) = ?`;
  const monthData = db.prepare(monthSql).get(req.userId, month || new Date().toISOString().slice(0, 7));

  // 未结算费用
  const unsettled = db.prepare(
    `SELECT COALESCE(SUM(r.total_fee), 0) as total
     FROM class_records r JOIN students s ON r.student_id = s.id
     WHERE s.teacher_id = ? AND r.is_settled = 0`
  ).get(req.userId);

  // 学生总数
  const studentCount = db.prepare('SELECT COUNT(*) as count FROM students WHERE teacher_id = ? AND is_active = 1').get(req.userId);

  // 本月各学生上课统计
  const studentStats = db.prepare(
    `SELECT s.id, s.name,
            COUNT(r.id) as class_count,
            COALESCE(SUM(r.duration_minutes), 0) as total_minutes,
            COALESCE(SUM(r.total_fee), 0) as total_fee
     FROM students s
     LEFT JOIN class_records r ON r.student_id = s.id AND strftime('%Y-%m', r.date) = ?
     WHERE s.teacher_id = ? AND s.is_active = 1
     GROUP BY s.id
     ORDER BY total_fee DESC`
  ).all(month || new Date().toISOString().slice(0, 7), req.userId);

  // 近期上课记录
  const recentRecords = db.prepare(
    `SELECT r.*, s.name as student_name
     FROM class_records r JOIN students s ON r.student_id = s.id
     WHERE s.teacher_id = ?
     ORDER BY r.date DESC, r.start_time DESC LIMIT 20`
  ).all(req.userId);

  res.json({
    success: true,
    data: {
      monthData,
      unsettled: unsettled.total,
      studentCount: studentCount.count,
      studentStats,
      recentRecords
    }
  });
});

// 学生端统计
router.get('/student', authStudent, (req, res) => {
  const db = getDB();
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.userId);

  // 总课时和总费用
  const total = db.prepare(
    `SELECT COUNT(*) as class_count, COALESCE(SUM(duration_minutes), 0) as total_minutes,
            COALESCE(SUM(total_fee), 0) as total_fee
     FROM class_records WHERE student_id = ?`
  ).get(req.userId);

  // 未结算费用
  const unsettled = db.prepare(
    `SELECT COALESCE(SUM(total_fee), 0) as total
     FROM class_records WHERE student_id = ? AND is_settled = 0`
  ).get(req.userId);

  // 已支付总额
  const paid = db.prepare(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM payments WHERE student_id = ?`
  ).get(req.userId);

  // 月度统计
  const monthlyStats = db.prepare(
    `SELECT strftime('%Y-%m', date) as month,
            COUNT(*) as class_count,
            SUM(duration_minutes) as total_minutes,
            SUM(total_fee) as total_fee
     FROM class_records WHERE student_id = ?
     GROUP BY month ORDER BY month DESC LIMIT 12`
  ).all(req.userId);

  res.json({
    success: true,
    data: {
      student,
      total,
      unsettled: unsettled.total,
      paid: paid.total,
      balance: total.total_fee - paid.total,
      monthlyStats
    }
  });
});

module.exports = router;
