const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// 生成JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 验证输入
    if (!username || !email || !password) {
      return res.status(400).json({ message: '请填写所有必填字段' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: '密码至少需要6个字符' });
    }

    // 检查用户是否已存在
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: '用户名或邮箱已存在' });
    }

    // 创建新用户
    const user = await User.create({
      username,
      email,
      password
    });

    res.status(201).json({
      message: '注册成功，请登录',
      success: true
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({ message: '请填写用户名和密码' });
    }

    // 查找用户
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 检查账户状态
    if (!user.is_active) {
      return res.status(401).json({ message: '账户已被禁用' });
    }

    // 生成token
    const token = generateToken(user.id);

    // 获取关注和粉丝数量
    const [followersCount, followingCount] = await Promise.all([
      user.countFollowers(),
      user.countFollowing()
    ]);

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        totalStudyTime: user.total_study_time,
        streak: user.streak,
        followers: followersCount,
        following: followingCount
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 获取关注和粉丝数量
    const [followersCount, followingCount] = await Promise.all([
      user.countFollowers(),
      user.countFollowing()
    ]);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        studyGoals: user.study_goals,
        totalStudyTime: user.total_study_time,
        streak: user.streak,
        lastCheckinDate: user.last_checkin_date,
        followers: followersCount,
        following: followingCount,
        role: user.role,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新用户信息
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { username, bio, avatar } = req.body;
    const userId = req.user.id;

    // 检查用户名是否已被其他用户使用
    if (username && username !== req.user.username) {
      const existingUser = await User.findOne({
        where: {
          username,
          id: { [Op.ne]: userId }
        }
      });
      if (existingUser) {
        return res.status(400).json({ message: '用户名已被使用' });
      }
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await User.update(updateData, {
      where: { id: userId },
      returning: true
    });

    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      message: '个人信息更新成功',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
        totalStudyTime: updatedUser.total_study_time,
        streak: updatedUser.streak
      }
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 修改密码
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: '请填写当前密码和新密码' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: '新密码至少需要6个字符' });
    }

    const user = await User.findByPk(req.user.id);

    // 验证当前密码
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: '当前密码错误' });
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    res.json({ message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
