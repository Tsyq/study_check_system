const express = require('express');
const User = require('../models/User');
const Checkin = require('../models/Checkin');
const StudyPlan = require('../models/StudyPlan');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// 获取学习时长排行榜
router.get('/leaderboard/study-time', optionalAuth, async (req, res) => {
  try {
    const { period = '30', limit = 50 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const leaderboard = await Checkin.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          isPublic: true
        }
      },
      {
        $group: {
          _id: '$user',
          totalStudyTime: { $sum: '$studyTime' },
          checkinCount: { $sum: 1 },
          subjects: { $addToSet: '$subject' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $project: {
          userId: '$_id',
          username: '$userInfo.username',
          avatar: '$userInfo.avatar',
          totalStudyTime: 1,
          checkinCount: 1,
          subjects: 1,
          streak: '$userInfo.streak'
        }
      },
      {
        $sort: { totalStudyTime: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    res.json({ leaderboard });
  } catch (error) {
    console.error('获取学习时长排行榜错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取连续打卡排行榜
router.get('/leaderboard/streak', optionalAuth, async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const leaderboard = await User.find({
      isActive: true,
      streak: { $gt: 0 }
    })
      .select('username avatar streak totalStudyTime')
      .sort({ streak: -1 })
      .limit(parseInt(limit));

    res.json({ leaderboard });
  } catch (error) {
    console.error('获取连续打卡排行榜错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取活跃用户排行榜
router.get('/leaderboard/active', optionalAuth, async (req, res) => {
  try {
    const { period = '7', limit = 50 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const leaderboard = await Checkin.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          isPublic: true
        }
      },
      {
        $group: {
          _id: '$user',
          checkinCount: { $sum: 1 },
          totalStudyTime: { $sum: '$studyTime' },
          avgStudyTime: { $avg: '$studyTime' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $project: {
          userId: '$_id',
          username: '$userInfo.username',
          avatar: '$userInfo.avatar',
          checkinCount: 1,
          totalStudyTime: 1,
          avgStudyTime: 1,
          streak: '$userInfo.streak'
        }
      },
      {
        $sort: { checkinCount: -1, totalStudyTime: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    res.json({ leaderboard });
  } catch (error) {
    console.error('获取活跃用户排行榜错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户个人统计
router.get('/personal/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = '30' } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // 基础用户信息
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 学习统计
    const studyStats = await Checkin.aggregate([
      {
        $match: {
          user: require('mongoose').Types.ObjectId(userId),
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalStudyTime: { $sum: '$studyTime' },
          totalCheckins: { $sum: 1 },
          avgStudyTime: { $avg: '$studyTime' },
          subjects: { $addToSet: '$subject' }
        }
      }
    ]);

    // 按日期统计学习时长
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

    // 按科目统计
    const subjectStats = await Checkin.aggregate([
      {
        $match: {
          user: require('mongoose').Types.ObjectId(userId),
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$subject',
          totalTime: { $sum: '$studyTime' },
          checkinCount: { $sum: 1 },
          avgTime: { $avg: '$studyTime' }
        }
      },
      {
        $sort: { totalTime: -1 }
      }
    ]);

    // 学习计划统计
    const planStats = await StudyPlan.aggregate([
      {
        $match: { user: require('mongoose').Types.ObjectId(userId) }
      },
      {
        $group: {
          _id: null,
          totalPlans: { $sum: 1 },
          activePlans: {
            $sum: { $cond: [{ $and: ['$isActive', { $not: '$isCompleted' }] }, 1, 0] }
          },
          completedPlans: {
            $sum: { $cond: ['$isCompleted', 1, 0] }
          },
          totalTargetHours: { $sum: '$totalHours' },
          totalCompletedHours: { $sum: '$completedHours' }
        }
      }
    ]);

    res.json({
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        totalStudyTime: user.totalStudyTime,
        streak: user.streak,
        followers: user.followers.length,
        following: user.following.length
      },
      studyStats: studyStats[0] || {
        totalStudyTime: 0,
        totalCheckins: 0,
        avgStudyTime: 0,
        subjects: []
      },
      dailyStats,
      subjectStats,
      planStats: planStats[0] || {
        totalPlans: 0,
        activePlans: 0,
        completedPlans: 0,
        totalTargetHours: 0,
        totalCompletedHours: 0
      }
    });
  } catch (error) {
    console.error('获取用户个人统计错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取全局统计
router.get('/global', async (req, res) => {
  try {
    const { period = '30' } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // 用户统计
    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          totalStudyTime: { $sum: '$totalStudyTime' }
        }
      }
    ]);

    // 打卡统计
    const checkinStats = await Checkin.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          isPublic: true
        }
      },
      {
        $group: {
          _id: null,
          totalCheckins: { $sum: 1 },
          totalStudyTime: { $sum: '$studyTime' },
          avgStudyTime: { $avg: '$studyTime' },
          uniqueUsers: { $addToSet: '$user' }
        }
      }
    ]);

    // 热门科目
    const popularSubjects = await Checkin.aggregate([
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
          totalTime: { $sum: '$studyTime' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // 学习计划统计
    const planStats = await StudyPlan.aggregate([
      {
        $group: {
          _id: null,
          totalPlans: { $sum: 1 },
          activePlans: {
            $sum: { $cond: [{ $and: ['$isActive', { $not: '$isCompleted' }] }, 1, 0] }
          },
          completedPlans: {
            $sum: { $cond: ['$isCompleted', 1, 0] }
          }
        }
      }
    ]);

    res.json({
      userStats: userStats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        totalStudyTime: 0
      },
      checkinStats: checkinStats[0] ? {
        ...checkinStats[0],
        uniqueUserCount: checkinStats[0].uniqueUsers.length
      } : {
        totalCheckins: 0,
        totalStudyTime: 0,
        avgStudyTime: 0,
        uniqueUserCount: 0
      },
      popularSubjects,
      planStats: planStats[0] || {
        totalPlans: 0,
        activePlans: 0,
        completedPlans: 0
      }
    });
  } catch (error) {
    console.error('获取全局统计错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取学习趋势数据
router.get('/trends', optionalAuth, async (req, res) => {
  try {
    const { period = '30', type = 'daily' } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    let groupBy;
    if (type === 'daily') {
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      };
    } else if (type === 'weekly') {
      groupBy = {
        year: { $year: '$createdAt' },
        week: { $week: '$createdAt' }
      };
    } else {
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      };
    }

    const trends = await Checkin.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          isPublic: true
        }
      },
      {
        $group: {
          _id: groupBy,
          totalStudyTime: { $sum: '$studyTime' },
          checkinCount: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user' }
        }
      },
      {
        $project: {
          date: '$_id',
          totalStudyTime: 1,
          checkinCount: 1,
          uniqueUserCount: { $size: '$uniqueUsers' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    res.json({ trends });
  } catch (error) {
    console.error('获取学习趋势错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
