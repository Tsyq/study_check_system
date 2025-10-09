const express = require('express');
const { User, Checkin, StudyPlan } = require('../models');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { Op, fn, col, literal } = require('sequelize');

const router = express.Router();

// 获取学习时长排行榜
router.get('/leaderboard/study-time', optionalAuth, async (req, res) => {
  try {
    const { period = '30', limit = 50 } = req.query;
    const numericLimit = parseInt(limit);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // 使用原生SQL查询避免GROUP BY问题
    const leaderboard = await Checkin.sequelize.query(`
      SELECT 
        c.user_id,
        SUM(c.study_time) as totalStudyTime,
        COUNT(c.id) as checkinCount,
        GROUP_CONCAT(DISTINCT c.subject) as subjects,
        u.username,
        u.avatar,
        u.streak
      FROM checkins c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.created_at >= :startDate AND c.is_public = 1
      GROUP BY c.user_id, u.username, u.avatar, u.streak
      ORDER BY totalStudyTime DESC
      LIMIT :limit
    `, {
      replacements: { startDate, limit: numericLimit },
      type: Checkin.sequelize.QueryTypes.SELECT
    });

    const formattedLeaderboard = leaderboard.map(item => ({
      userId: item.user_id,
      username: item.username || '未知用户',
      avatar: item.avatar || '',
      totalStudyTime: parseInt(item.totalStudyTime) || 0,
      checkinCount: parseInt(item.checkinCount) || 0,
      subjects: item.subjects ? item.subjects.split(',') : [],
      streak: item.streak || 0
    }));

    res.json({ leaderboard: formattedLeaderboard });
  } catch (error) {
    console.error('获取学习时长排行榜错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取连续打卡排行榜
router.get('/leaderboard/streak', optionalAuth, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const numericLimit = parseInt(limit);

    const leaderboard = await User.findAll({
      where: {
        is_active: true,
        streak: { [Op.gt]: 0 }
      },
      attributes: ['id', 'username', 'avatar', 'streak', 'total_study_time'],
      order: [['streak', 'DESC']],
      limit: numericLimit
    });

    const formattedLeaderboard = leaderboard.map(user => ({
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      streak: user.streak,
      totalStudyTime: user.total_study_time
    }));

    res.json({ leaderboard: formattedLeaderboard });
  } catch (error) {
    console.error('获取连续打卡排行榜错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户个人统计
router.get('/personal/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = '30' } = req.query;
    const numericUserId = parseInt(userId);

    if (isNaN(numericUserId)) {
      return res.status(400).json({ message: '无效的用户ID' });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // 基础用户信息
    const user = await User.findByPk(numericUserId, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 学习统计
    const studyStats = await Checkin.findOne({
      attributes: [
        [fn('SUM', col('study_time')), 'totalStudyTime'],
        [fn('COUNT', col('id')), 'totalCheckins'],
        [fn('AVG', col('study_time')), 'avgStudyTime'],
        [fn('GROUP_CONCAT', col('subject')), 'subjects']
      ],
      where: {
        user_id: numericUserId,
        created_at: { [Op.gte]: startDate }
      }
    });

    // 获取打卡记录用于情绪分析
    const checkins = await Checkin.findAll({
      attributes: ['mood', 'content'],
      where: {
        user_id: numericUserId,
        created_at: { [Op.gte]: startDate }
      }
    });

    // 按日期统计学习时长
    const dailyStats = await Checkin.findAll({
      attributes: [
        [fn('YEAR', col('created_at')), 'year'],
        [fn('MONTH', col('created_at')), 'month'],
        [fn('DAY', col('created_at')), 'day'],
        [fn('SUM', col('study_time')), 'studyTime'],
        [fn('COUNT', col('id')), 'checkins']
      ],
      where: {
        user_id: numericUserId,
        created_at: { [Op.gte]: startDate }
      },
      group: [
        fn('YEAR', col('created_at')),
        fn('MONTH', col('created_at')),
        fn('DAY', col('created_at'))
      ],
      order: [
        [fn('YEAR', col('created_at')), 'ASC'],
        [fn('MONTH', col('created_at')), 'ASC'],
        [fn('DAY', col('created_at')), 'ASC']
      ]
    });

    // 按科目统计
    const subjectStats = await Checkin.findAll({
      attributes: [
        'subject',
        [fn('SUM', col('study_time')), 'totalTime'],
        [fn('COUNT', col('id')), 'checkinCount'],
        [fn('AVG', col('study_time')), 'avgTime']
      ],
      where: {
        user_id: numericUserId,
        created_at: { [Op.gte]: startDate }
      },
      group: ['subject'],
      order: [[fn('SUM', col('study_time')), 'DESC']]
    });

    // 学习计划统计
    const planStats = await StudyPlan.findOne({
      attributes: [
        [fn('COUNT', col('id')), 'totalPlans'],
        [fn('SUM', literal('CASE WHEN is_active = 1 AND is_completed = 0 THEN 1 ELSE 0 END')), 'activePlans'],
        [fn('SUM', literal('CASE WHEN is_completed = 1 THEN 1 ELSE 0 END')), 'completedPlans'],
        [fn('SUM', col('total_hours')), 'totalTargetHours'],
        [fn('SUM', col('completed_hours')), 'totalCompletedHours']
      ],
      where: { user_id: numericUserId }
    });

    // 格式化数据
    const formattedDailyStats = dailyStats.map(item => ({
      _id: {
        year: parseInt(item.dataValues.year),
        month: parseInt(item.dataValues.month),
        day: parseInt(item.dataValues.day)
      },
      studyTime: parseInt(item.dataValues.studyTime) || 0,
      checkins: parseInt(item.dataValues.checkins) || 0
    }));

    const formattedSubjectStats = subjectStats.map(item => ({
      _id: item.subject,
      totalTime: parseInt(item.dataValues.totalTime) || 0,
      checkinCount: parseInt(item.dataValues.checkinCount) || 0,
      avgTime: parseFloat(item.dataValues.avgTime) || 0
    }));

    const studyStatsData = studyStats ? {
      totalStudyTime: parseInt(studyStats.dataValues.totalStudyTime) || 0,
      totalCheckins: parseInt(studyStats.dataValues.totalCheckins) || 0,
      avgStudyTime: parseFloat(studyStats.dataValues.avgStudyTime) || 0,
      subjects: studyStats.dataValues.subjects ? studyStats.dataValues.subjects.split(',') : []
    } : {
      totalStudyTime: 0,
      totalCheckins: 0,
      avgStudyTime: 0,
      subjects: []
    };

    const planStatsData = planStats ? {
      totalPlans: parseInt(planStats.dataValues.totalPlans) || 0,
      activePlans: parseInt(planStats.dataValues.activePlans) || 0,
      completedPlans: parseInt(planStats.dataValues.completedPlans) || 0,
      totalTargetHours: parseFloat(planStats.dataValues.totalTargetHours) || 0,
      totalCompletedHours: parseFloat(planStats.dataValues.totalCompletedHours) || 0
    } : {
      totalPlans: 0,
      activePlans: 0,
      completedPlans: 0,
      totalTargetHours: 0,
      totalCompletedHours: 0
    };

    res.json({
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        totalStudyTime: user.total_study_time,
        streak: user.streak,
        followers: 0, // 需要单独查询关注关系
        following: 0
      },
      studyStats: studyStatsData,
      dailyStats: formattedDailyStats,
      subjectStats: formattedSubjectStats,
      planStats: planStatsData,
      checkins: checkins // 添加打卡记录用于情绪分析
    });
  } catch (error) {
    console.error('获取用户个人统计错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;