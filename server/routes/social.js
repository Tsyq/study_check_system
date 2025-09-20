const express = require('express');
const User = require('../models/User');
const Checkin = require('../models/Checkin');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// 关注用户
router.post('/follow/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ message: '不能关注自己' });
    }

    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const currentUser = await User.findById(currentUserId);

    // 检查是否已经关注
    if (currentUser.following.includes(userId)) {
      return res.status(400).json({ message: '已经关注了该用户' });
    }

    // 添加关注关系
    currentUser.following.push(userId);
    userToFollow.followers.push(currentUserId);

    await Promise.all([currentUser.save(), userToFollow.save()]);

    res.json({ message: '关注成功' });
  } catch (error) {
    console.error('关注用户错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 取消关注用户
router.delete('/follow/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId);
    const userToUnfollow = await User.findById(userId);

    if (!userToUnfollow) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 移除关注关系
    currentUser.following = currentUser.following.filter(
      id => id.toString() !== userId
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== currentUserId.toString()
    );

    await Promise.all([currentUser.save(), userToUnfollow.save()]);

    res.json({ message: '取消关注成功' });
  } catch (error) {
    console.error('取消关注错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取关注列表
router.get('/following/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(userId)
      .populate({
        path: 'following',
        select: 'username avatar bio totalStudyTime streak',
        options: {
          skip: (parseInt(page) - 1) * parseInt(limit),
          limit: parseInt(limit)
        }
      });

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const total = user.following.length;

    res.json({
      following: user.following,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: (parseInt(page) * parseInt(limit)) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('获取关注列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取粉丝列表
router.get('/followers/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(userId)
      .populate({
        path: 'followers',
        select: 'username avatar bio totalStudyTime streak',
        options: {
          skip: (parseInt(page) - 1) * parseInt(limit),
          limit: parseInt(limit)
        }
      });

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const total = user.followers.length;

    res.json({
      followers: user.followers,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: (parseInt(page) * parseInt(limit)) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('获取粉丝列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取学习圈动态（关注用户的打卡）
router.get('/feed', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    // 获取当前用户关注的用户ID列表
    const currentUser = await User.findById(userId).select('following');
    const followingIds = currentUser.following;

    // 如果没有关注任何人，返回空结果
    if (followingIds.length === 0) {
      return res.json({
        checkins: [],
        pagination: {
          current: parseInt(page),
          pages: 0,
          total: 0,
          hasNext: false,
          hasPrev: false
        }
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const checkins = await Checkin.find({
      user: { $in: followingIds },
      isPublic: true
    })
      .populate('user', 'username avatar')
      .populate('likes.user', 'username avatar')
      .populate('comments.user', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Checkin.countDocuments({
      user: { $in: followingIds },
      isPublic: true
    });

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
    console.error('获取学习圈动态错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 搜索用户
router.get('/search/users', optionalAuth, async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: '请输入搜索关键词' });
    }

    const query = {
      $or: [
        { username: { $regex: q.trim(), $options: 'i' } },
        { email: { $regex: q.trim(), $options: 'i' } }
      ],
      isActive: true
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select('username avatar bio totalStudyTime streak followers following')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: skip + users.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('搜索用户错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户详情
router.get('/users/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password')
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar');

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 获取用户最近的打卡记录
    const recentCheckins = await Checkin.find({
      user: userId,
      isPublic: true
    })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(5);

    // 检查当前用户是否关注了该用户
    let isFollowing = false;
    if (req.user) {
      const currentUser = await User.findById(req.user._id);
      isFollowing = currentUser.following.includes(userId);
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        totalStudyTime: user.totalStudyTime,
        streak: user.streak,
        followers: user.followers,
        following: user.following,
        createdAt: user.createdAt
      },
      recentCheckins,
      isFollowing
    });
  } catch (error) {
    console.error('获取用户详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取热门话题/标签
router.get('/trending/tags', async (req, res) => {
  try {
    const { period = '7' } = req.query; // 默认7天

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const trendingTags = await Checkin.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          isPublic: true,
          tags: { $exists: true, $ne: [] }
        }
      },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
          recentCheckins: { $push: '$$ROOT' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    res.json({ trendingTags });
  } catch (error) {
    console.error('获取热门标签错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取热门科目
router.get('/trending/subjects', async (req, res) => {
  try {
    const { period = '7' } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const trendingSubjects = await Checkin.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          isPublic: true
        }
      },
      {
        $group: {
          _id: '$subject',
          count: { $sum: 1 },
          totalStudyTime: { $sum: '$studyTime' },
          avgStudyTime: { $avg: '$studyTime' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({ trendingSubjects });
  } catch (error) {
    console.error('获取热门科目错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
