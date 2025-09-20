const express = require('express');
const Checkin = require('../models/Checkin');
const User = require('../models/User');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// 创建打卡
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { content, studyTime, subject, images, mood, location, tags } = req.body;

    // 验证必填字段
    if (!content || !studyTime || !subject) {
      return res.status(400).json({ message: '请填写打卡内容、学习时长和科目' });
    }

    if (studyTime <= 0) {
      return res.status(400).json({ message: '学习时长必须大于0' });
    }

    // 检查今天是否已经打卡
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingCheckin = await Checkin.findOne({
      user: req.user._id,
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    });

    if (existingCheckin) {
      return res.status(400).json({ message: '今天已经打卡过了' });
    }

    // 创建打卡记录
    const checkin = new Checkin({
      user: req.user._id,
      content,
      studyTime,
      subject,
      images: images || [],
      mood: mood || 'normal',
      location: location || '',
      tags: tags || []
    });

    await checkin.save();

    // 更新用户学习时长和连续打卡天数
    const user = await User.findById(req.user._id);
    await user.updateStudyTime(studyTime);
    await user.updateStreak();

    // 返回完整的打卡信息
    const populatedCheckin = await Checkin.findById(checkin._id)
      .populate('user', 'username avatar')
      .populate('likes.user', 'username avatar')
      .populate('comments.user', 'username avatar');

    res.status(201).json({
      message: '打卡成功',
      checkin: populatedCheckin
    });
  } catch (error) {
    console.error('创建打卡错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取打卡列表（支持分页和筛选）
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      subject, 
      userId, 
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { isPublic: true };
    
    // 筛选条件
    if (subject) {
      query.subject = subject;
    }
    
    if (userId) {
      query.user = userId;
    }

    // 排序
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // 分页
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const checkins = await Checkin.find(query)
      .populate('user', 'username avatar')
      .populate('likes.user', 'username avatar')
      .populate('comments.user', 'username avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Checkin.countDocuments(query);

    res.json({
      checkins,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: skip + checkins.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('获取打卡列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个打卡详情
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const checkin = await Checkin.findById(req.params.id)
      .populate('user', 'username avatar bio')
      .populate('likes.user', 'username avatar')
      .populate('comments.user', 'username avatar');

    if (!checkin) {
      return res.status(404).json({ message: '打卡记录不存在' });
    }

    res.json({ checkin });
  } catch (error) {
    console.error('获取打卡详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 点赞/取消点赞
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const checkin = await Checkin.findById(req.params.id);
    
    if (!checkin) {
      return res.status(404).json({ message: '打卡记录不存在' });
    }

    const existingLike = checkin.likes.find(
      like => like.user.toString() === req.user._id.toString()
    );

    if (existingLike) {
      // 取消点赞
      await checkin.removeLike(req.user._id);
      res.json({ message: '取消点赞成功', isLiked: false });
    } else {
      // 点赞
      await checkin.addLike(req.user._id);
      res.json({ message: '点赞成功', isLiked: true });
    }
  } catch (error) {
    console.error('点赞操作错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 添加评论
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: '评论内容不能为空' });
    }

    const checkin = await Checkin.findById(req.params.id);
    
    if (!checkin) {
      return res.status(404).json({ message: '打卡记录不存在' });
    }

    await checkin.addComment(req.user._id, content.trim());

    // 返回更新后的打卡记录
    const updatedCheckin = await Checkin.findById(req.params.id)
      .populate('user', 'username avatar')
      .populate('likes.user', 'username avatar')
      .populate('comments.user', 'username avatar');

    res.json({
      message: '评论成功',
      checkin: updatedCheckin
    });
  } catch (error) {
    console.error('添加评论错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户的打卡统计
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = '30' } = req.query; // 默认30天

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const stats = await Checkin.aggregate([
      {
        $match: {
          user: require('mongoose').Types.ObjectId(userId),
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalCheckins: { $sum: 1 },
          totalStudyTime: { $sum: '$studyTime' },
          averageStudyTime: { $avg: '$studyTime' },
          subjects: { $addToSet: '$subject' }
        }
      }
    ]);

    // 按日期统计
    const dailyStats = await Checkin.aggregate([
      {
        $match: {
          user: require('mongoose').Types.ObjectId(userId),
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          studyTime: { $sum: '$studyTime' },
          checkins: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    res.json({
      stats: stats[0] || {
        totalCheckins: 0,
        totalStudyTime: 0,
        averageStudyTime: 0,
        subjects: []
      },
      dailyStats
    });
  } catch (error) {
    console.error('获取打卡统计错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除打卡（仅限本人或管理员）
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const checkin = await Checkin.findById(req.params.id);
    
    if (!checkin) {
      return res.status(404).json({ message: '打卡记录不存在' });
    }

    // 检查权限
    if (checkin.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限删除此打卡记录' });
    }

    await Checkin.findByIdAndDelete(req.params.id);

    res.json({ message: '打卡记录删除成功' });
  } catch (error) {
    console.error('删除打卡错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
