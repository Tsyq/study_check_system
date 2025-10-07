const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { StudyPlan } = require('../models');

const router = express.Router();

// 将数据库字段映射为前端期望的字段
const mapPlanToFrontend = (planInstance) => {
  const plan = planInstance.toJSON();
  const totalHours = Number(plan.total_hours) || 0;
  const completedHours = Number(plan.completed_hours) || 0;
  const progressPercentage = totalHours === 0 ? 0 : Math.round((completedHours / totalHours) * 100);
  return {
    _id: String(plan.id),
    title: plan.title,
    description: plan.description || '',
    subject: plan.subject,
    target: plan.target,
    startDate: plan.start_date,
    endDate: plan.end_date,
    totalHours: totalHours,
    completedHours: completedHours,
    progressPercentage,
    dailyGoal: plan.daily_goal,
    milestones: plan.milestones || [],
    isActive: plan.is_active,
    isCompleted: plan.is_completed,
    createdAt: plan.createdAt
  };
};

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
      dailyGoal
    } = req.body;

    if (!title || !subject || !target || !startDate || !endDate || totalHours === undefined) {
      return res.status(400).json({ message: '请填写所有必填字段' });
    }

    const created = await StudyPlan.create({
      user_id: req.user.id,
      title,
      description: description || '',
      subject,
      target,
      start_date: new Date(startDate),
      end_date: new Date(endDate),
      total_hours: totalHours,
      daily_goal: dailyGoal || 60
    });

    return res.status(201).json({
      message: '学习计划创建成功',
      plan: mapPlanToFrontend(created)
    });
  } catch (error) {
    console.error('创建学习计划错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取学习计划列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const plans = await StudyPlan.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    return res.json({ plans: plans.map(mapPlanToFrontend) });
  } catch (error) {
    console.error('获取学习计划列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个学习计划
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const plan = await StudyPlan.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!plan) return res.status(404).json({ message: '学习计划不存在' });
    return res.json({ plan: mapPlanToFrontend(plan) });
  } catch (error) {
    console.error('获取学习计划详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新学习计划
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const plan = await StudyPlan.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!plan) return res.status(404).json({ message: '学习计划不存在' });

    const updates = {};
    const {
      title,
      description,
      subject,
      target,
      startDate,
      endDate,
      totalHours,
      dailyGoal,
      isActive,
      isCompleted
    } = req.body;

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (subject !== undefined) updates.subject = subject;
    if (target !== undefined) updates.target = target;
    if (startDate !== undefined) updates.start_date = new Date(startDate);
    if (endDate !== undefined) updates.end_date = new Date(endDate);
    if (totalHours !== undefined) updates.total_hours = totalHours;
    if (dailyGoal !== undefined) updates.daily_goal = dailyGoal;
    if (isActive !== undefined) updates.is_active = isActive;
    if (isCompleted !== undefined) updates.is_completed = isCompleted;

    await plan.update(updates);
    return res.json({ message: '学习计划更新成功', plan: mapPlanToFrontend(plan) });
  } catch (error) {
    console.error('学习计划更新错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除学习计划
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const plan = await StudyPlan.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!plan) return res.status(404).json({ message: '学习计划不存在' });
    await plan.destroy();
    return res.json({ message: '学习计划删除成功' });
  } catch (error) {
    console.error('删除学习计划错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
