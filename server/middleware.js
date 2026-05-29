const jwt = require('jsonwebtoken');
const { SECRET } = require('./routes/auth');

function authTeacher(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ success: false, message: '未登录' });
  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), SECRET);
    if (decoded.role !== 'teacher') return res.status(403).json({ success: false, message: '无权限' });
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'token无效' });
  }
}

function authStudent(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ success: false, message: '未登录' });
  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), SECRET);
    if (decoded.role !== 'student') return res.status(403).json({ success: false, message: '无权限' });
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'token无效' });
  }
}

module.exports = { authTeacher, authStudent };
