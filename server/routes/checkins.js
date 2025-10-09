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
  tags: Array.isArray(c.tags) ? c.tags : [],
  createdAt: c.created_at
});

// 创建打卡并自动更新学习计划进度
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { content, studyTime, subject, images, mood, location, tags, isPublic, studyDate } = req.body;
    if (!content || !studyTime || !subject) {
      return res.status(400).json({ message: '请填写打卡内容、学习时长和科目' });
    }
    if (studyTime <= 0) return res.status(400).json({ message: '学习时长必须大于0' });

    // 处理补卡日期
    let createdAt = new Date();
    if (studyDate) {
      // 验证补卡日期不能是未来日期
      const selectedDate = new Date(studyDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // 设置为今天的最后一刻
      
      if (selectedDate > today) {
        return res.status(400).json({ message: '不能为未来日期补卡' });
      }
      
      // 设置补卡日期的时间为当天的一个合理时间
      createdAt = new Date(studyDate);
      createdAt.setHours(20, 0, 0, 0); // 设置为晚上8点
    }

    const created = await Checkin.create({
      user_id: req.user.id,
      content,
      study_time: studyTime,
      subject,
      images: images || [],
      mood: mood || 'normal',
      location: location || '',
      tags: tags || [],
      is_public: isPublic !== undefined ? !!isPublic : true,
      created_at: createdAt,
      updated_at: createdAt
    });

    // 更新用户学习总时长与连续天数
    const user = await User.findByPk(req.user.id);
    if (user) {
      await user.updateStudyTime(studyTime);
      await user.updateStreak();
    }

    // 自动匹配并更新学习计划进度（科目一致、在计划时间范围内、进行中的计划）
    const now = new Date();
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
    console.error('请求数据:', req.body);
    
    // 根据错误类型返回更详细的错误信息
    if (error.name === 'SequelizeValidationError') {
      const errorMessages = error.errors.map(err => `${err.path}: ${err.message}`).join(', ');
      res.status(400).json({ message: `数据验证失败: ${errorMessages}` });
    } else if (error.name === 'SequelizeForeignKeyConstraintError') {
      res.status(400).json({ message: '用户不存在或数据关联错误' });
    } else {
      res.status(500).json({ message: `服务器错误: ${error.message}` });
    }
  }
});

// 获取单个打卡详情
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const checkin = await Checkin.findOne({ 
      where: { id: req.params.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatar'] }]
    });
    
    if (!checkin) {
      return res.status(404).json({ message: '打卡记录不存在' });
    }

    // 检查权限：只有公开的打卡或者自己的打卡才能查看
    if (!checkin.is_public && (!req.user || checkin.user_id !== req.user.id)) {
      return res.status(403).json({ message: '无权限查看此打卡记录' });
    }

    return res.json({ checkin: mapCheckin(checkin) });
  } catch (error) {
    console.error('获取打卡详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 点赞/取消点赞
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const checkin = await Checkin.findOne({ where: { id: req.params.id } });
    if (!checkin) return res.status(404).json({ message: '打卡记录不存在' });

    const likes = Array.isArray(checkin.likes) ? checkin.likes : [];
    const hasLiked = likes.some(l => String(l.user_id) === String(req.user.id));
    if (hasLiked) {
      checkin.likes = likes.filter(l => String(l.user_id) !== String(req.user.id));
    } else {
      checkin.likes = [...likes, { user_id: req.user.id, created_at: new Date() }];
    }
    await checkin.save();

    return res.json({
      message: hasLiked ? '已取消点赞' : '点赞成功',
      likes: checkin.likes
    });
  } catch (error) {
    console.error('点赞错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
});

// 添加评论
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || String(content).trim().length === 0) {
      return res.status(400).json({ message: '评论内容不能为空' });
    }
    const checkin = await Checkin.findOne({ where: { id: req.params.id } });
    if (!checkin) return res.status(404).json({ message: '打卡记录不存在' });

    const comments = Array.isArray(checkin.comments) ? checkin.comments : [];
    const newComment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      user_id: req.user.id,
      content: String(content).trim(),
      created_at: new Date()
    };
    checkin.comments = [...comments, newComment];
    await checkin.save();

    return res.status(201).json({ message: '评论成功', comments: checkin.comments });
  } catch (error) {
    console.error('添加评论错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
});

// 获取打卡列表（分页）
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, subject, userId, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
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

    // 收集评论中的用户ID以便批量查询用户信息
    const commentUserIds = new Set();
    for (const c of result.rows) {
      const comments = Array.isArray(c.comments) ? c.comments : [];
      comments.forEach(cm => { if (cm && cm.user_id) commentUserIds.add(cm.user_id); });
    }
    const commentUsers = commentUserIds.size > 0
      ? await User.findAll({ where: { id: { [Op.in]: Array.from(commentUserIds) } }, attributes: ['id', 'username', 'avatar'] })
      : [];
    const idToUser = new Map(commentUsers.map(u => [u.id, { _id: u.id, username: u.username, avatar: u.avatar }]));

    const checkins = result.rows.map(c => ({
      _id: c.id,
      content: c.content,
      studyTime: c.study_time,
      subject: c.subject,
      images: c.images || [],
      mood: c.mood,
      location: c.location,
      likes: Array.isArray(c.likes) ? c.likes.map(l => ({ user: { _id: l.user_id } })) : [],
      comments: Array.isArray(c.comments) ? c.comments.map(cm => ({
        _id: cm.id || '',
        content: cm.content,
        user: idToUser.get(cm.user_id) || { _id: cm.user_id },
        createdAt: cm.created_at
      })) : [],
      isPublic: c.is_public,
      tags: Array.isArray(c.tags) ? c.tags : [],
      createdAt: c.created_at,
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
