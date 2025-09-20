const express = require('express');
const StudyPlan = require('../models/StudyPlan');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 创建学习计划
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      target,
      startDate,
      endDate,
      totalHours,
      dailyGoal,
      milestones,
      reminders,
      tags
    } = req.body;

    // 验证必填字段
    if (!title || !subject || !target || !startDate || !endDate || !totalHours) {
      return res.status(400).json({ message: '请填写所有必填字段' });
    }

    // 验证日期
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return res.status(400).json({ message: '结束日期必须晚于开始日期' });
    }

    if (start < new Date()) {
      return res.status(400).json({ message: '开始日期不能早于今天' });
    }

    if (totalHours <= 0) {
      return res.status(400).json({ message: '总学习时长必须大于0' });
    }

    // 创建学习计划
    const plan = new StudyPlan({
      user: req.user._id,
      title,
      description: description || '',
      subject,
      target,
      startDate: start,
      endDate: end,
      totalHours,
      dailyGoal: dailyGoal || 60, // 默认60分钟
      milestones: milestones || [],
      reminders: reminders || [],
      tags: tags || []
    });

    await plan.save();

    res.status(201).json({
      message: '学习计划创建成功',
      plan
    });
  } catch (error) {
    console.error('创建学习计划错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户的学习计划列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 10 } = req.query;
    
    let query = { user: req.user._id };
    
    // 根据状态筛选
    if (status === 'active') {
      query.isActive = true;
      query.isCompleted = false;
    } else if (status === 'completed') {
      query.isCompleted = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const plans = await StudyPlan.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await StudyPlan.countDocuments(query);

    // 计算每个计划的进度
    const plansWithProgress = plans.map(plan => ({
      ...plan.toObject(),
      progressPercentage: plan.getProgressPercentage()
    }));

    res.json({
      plans: plansWithProgress,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: skip + plans.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('获取学习计划列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个学习计划详情
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const plan = await StudyPlan.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!plan) {
      return res.status(404).json({ message: '学习计划不存在' });
    }

    const planWithProgress = {
      ...plan.toObject(),
      progressPercentage: plan.getProgressPercentage()
    };

    res.json({ plan: planWithProgress });
  } catch (error) {
    console.error('获取学习计划详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新学习计划
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const plan = await StudyPlan.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!plan) {
      return res.status(404).json({ message: '学习计划不存在' });
    }

    const {
      title,
      description,
      subject,
      target,
      startDate,
      endDate,
      totalHours,
      dailyGoal,
      milestones,
      reminders,
      tags,
      isActive
    } = req.body;

    // 更新字段
    if (title) plan.title = title;
    if (description !== undefined) plan.description = description;
    if (subject) plan.subject = subject;
    if (target) plan.target = target;
    if (startDate) plan.startDate = new Date(startDate);
    if (endDate) plan.endDate = new Date(endDate);
    if (totalHours) plan.totalHours = totalHours;
    if (dailyGoal) plan.dailyGoal = dailyGoal;
    if (milestones) plan.milestones = milestones;
    if (reminders) plan.reminders = reminders;
    if (tags) plan.tags = tags;
    if (isActive !== undefined) plan.isActive = isActive;

    await plan.save();

    const planWithProgress = {
      ...plan.toObject(),
      progressPercentage: plan.getProgressPercentage()
    };

    res.json({
      message: '学习计划更新成功',
      plan: planWithProgress
    });
  } catch (error) {
    console.error('更新学习计划错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新学习进度
router.post('/:id/progress', authenticateToken, async (req, res) => {
  try {
    const { date, studyTime, notes } = req.body;

    if (!date || !studyTime || studyTime <= 0) {
      return res.status(400).json({ message: '请提供有效的日期和学习时长' });
    }

    const plan = await StudyPlan.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!plan) {
      return res.status(404).json({ message: '学习计划不存在' });
    }

    await plan.updateProgress(new Date(date), studyTime, notes);

    const planWithProgress = {
      ...plan.toObject(),
      progressPercentage: plan.getProgressPercentage()
    };

    res.json({
      message: '学习进度更新成功',
      plan: planWithProgress
    });
  } catch (error) {
    console.error('更新学习进度错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 添加里程碑
router.post('/:id/milestones', authenticateToken, async (req, res) => {
  try {
    const { title, description, targetDate } = req.body;

    if (!title || !targetDate) {
      return res.status(400).json({ message: '请填写里程碑标题和目标日期' });
    }

    const plan = await StudyPlan.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!plan) {
      return res.status(404).json({ message: '学习计划不存在' });
    }

    await plan.addMilestone(title, description, new Date(targetDate));

    res.json({
      message: '里程碑添加成功',
      plan
    });
  } catch (error) {
    console.error('添加里程碑错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 完成里程碑
router.put('/:id/milestones/:milestoneId', authenticateToken, async (req, res) => {
  try {
    const plan = await StudyPlan.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!plan) {
      return res.status(404).json({ message: '学习计划不存在' });
    }

    await plan.completeMilestone(req.params.milestoneId);

    res.json({
      message: '里程碑完成成功',
      plan
    });
  } catch (error) {
    console.error('完成里程碑错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除学习计划
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const plan = await StudyPlan.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!plan) {
      return res.status(404).json({ message: '学习计划不存在' });
    }

    await StudyPlan.findByIdAndDelete(req.params.id);

    res.json({ message: '学习计划删除成功' });
  } catch (error) {
    console.error('删除学习计划错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取学习计划统计
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await StudyPlan.aggregate([
      { $match: { user: require('mongoose').Types.ObjectId(userId) } },
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

    const result = stats[0] || {
      totalPlans: 0,
      activePlans: 0,
      completedPlans: 0,
      totalTargetHours: 0,
      totalCompletedHours: 0
    };

    res.json({
      ...result,
      completionRate: result.totalTargetHours > 0 
        ? Math.round((result.totalCompletedHours / result.totalTargetHours) * 100) 
        : 0
    });
  } catch (error) {
    console.error('获取学习计划统计错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
