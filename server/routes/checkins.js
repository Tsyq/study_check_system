const express = require('express');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { Checkin, User, StudyPlan } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

const mapCheckin = (c) => ({
  id: c.id,
  user_id: c.user_id,
  content: c.content,
  studyTime: c.study_time,
  subject: c.subject,
  images: c.images || [],
  mood: c.mood,
  location: c.location,
  likes: c.likes || [],
  comments: c.comments || [],
  isPublic: c.is_public,
  tags: c.tags || [],
  createdAt: c.createdAt
});

// 创建打卡并自动更新学习计划进度
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { content, studyTime, subject, images, mood, location, tags, isPublic } = req.body;
    if (!content || !studyTime || !subject) {
      return res.status(400).json({ message: '请填写打卡内容、学习时长和科目' });
    }
    if (studyTime <= 0) return res.status(400).json({ message: '学习时长必须大于0' });

    const now = new Date();

    const created = await Checkin.create({
      user_id: req.user.id,
      content,
      study_time: studyTime,
      subject,
      images: images || [],
      mood: mood || 'normal',
      location: location || '',
      tags: tags || [],
      is_public: isPublic !== undefined ? !!isPublic : true
    });

    // 更新用户学习总时长与连续天数
    const user = await User.findByPk(req.user.id);
    if (user) {
      await user.updateStudyTime(studyTime);
      await user.updateStreak();
    }

    // 自动匹配并更新学习计划进度（科目一致、在计划时间范围内、进行中的计划）
    let activePlans = await StudyPlan.findAll({
      where: {
        user_id: req.user.id,
        subject,
        is_active: true,
        is_completed: false,
        start_date: { [Op.lte]: now },
        end_date: { [Op.gte]: now }
      }
    });

    // 如果没有匹配到进行中的计划，则回退到最近一个同科目且未完成的计划（忽略时间范围）
    if (!activePlans || activePlans.length === 0) {
      const fallback = await StudyPlan.findAll({
        where: {
          user_id: req.user.id,
          subject,
          is_completed: false
        },
        order: [["updatedAt", "DESC"]],
        limit: 1
      });
      activePlans = fallback;
    }

    for (const plan of activePlans) {
      const progress = Array.isArray(plan.progress) ? plan.progress : [];
      progress.push({ date: now.toISOString(), study_time: studyTime, notes: content || '' });
      const newCompletedHours = Number(plan.completed_hours || 0) + studyTime / 60;
      const updates = {
        progress,
        completed_hours: newCompletedHours,
        is_completed: newCompletedHours >= Number(plan.total_hours)
      };
      await plan.update(updates);
    }

    return res.status(201).json({ message: '打卡成功', checkin: mapCheckin(created) });
  } catch (error) {
    console.error('创建打卡错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取打卡列表（分页）
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, subject, userId, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const where = { is_public: true };
    if (subject) where.subject = subject;
    if (userId) where.user_id = userId;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await Checkin.findAndCountAll({
      where,
      order: [[sortBy, sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC']],
      offset,
      limit: parseInt(limit),
      include: [{
        model: User,
        attributes: ['id', 'username', 'avatar'],
        as: 'user'
      }]
    });

    const checkins = result.rows.map(c => ({
      _id: c.id,
      content: c.content,
      studyTime: c.study_time,
      subject: c.subject,
      images: c.images || [],
      mood: c.mood,
      location: c.location,
      likes: c.likes || [],
      comments: c.comments || [],
      isPublic: c.is_public,
      tags: c.tags || [],
      createdAt: c.createdAt,
      user: c.user ? {
        _id: c.user.id,
        username: c.user.username,
        avatar: c.user.avatar
      } : null
    }));

    return res.json({
      checkins,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(result.count / parseInt(limit)),
        total: result.count,
        hasNext: offset + result.rows.length < result.count,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('获取打卡列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除打卡（仅限本人或管理员）
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const checkin = await Checkin.findOne({ where: { id: req.params.id } });
    if (!checkin) return res.status(404).json({ message: '打卡记录不存在' });
    if (checkin.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限删除此打卡记录' });
    }
    await checkin.destroy();
    return res.json({ message: '打卡记录删除成功' });
  } catch (error) {
    console.error('删除打卡错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
