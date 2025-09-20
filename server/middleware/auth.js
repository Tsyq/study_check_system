const jwt = require('jsonwebtoken');
const { User } = require('../models');

// 验证JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: '访问令牌缺失' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }

    if (!user.is_active) {
      return res.status(401).json({ message: '账户已被禁用' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '无效的访问令牌' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '访问令牌已过期' });
    }
    console.error('认证错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 管理员权限验证
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '需要管理员权限' });
  }
  next();
};

// 可选认证（不强制要求登录）
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password'] }
      });
      if (user && user.is_active) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // 可选认证失败时不阻止请求继续
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth
};
