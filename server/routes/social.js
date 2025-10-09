const express = require('express');
const { User, Checkin } = require('../models');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// 关注用户（通过 user_follows 中间表）
router.post('/follow/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    if (parseInt(userId) === parseInt(currentUserId)) {
      return res.status(400).json({ message: '不能关注自己' });
    }

    const [currentUser, userToFollow] = await Promise.all([
      User.findByPk(currentUserId),
      User.findByPk(userId)
    ]);
    if (!userToFollow) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const existing = await currentUser.hasFollowing(userToFollow);
    if (existing) {
      return res.status(400).json({ message: '已经关注了该用户' });
    }

    await currentUser.addFollowing(userToFollow);
    return res.json({ message: '关注成功' });
  } catch (error) {
    console.error('关注用户错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 取消关注用户
router.delete('/follow/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const [currentUser, userToUnfollow] = await Promise.all([
      User.findByPk(currentUserId),
      User.findByPk(userId)
    ]);
    if (!userToUnfollow) {
      return res.status(404).json({ message: '用户不存在' });
    }

    await currentUser.removeFollowing(userToUnfollow);
    return res.json({ message: '取消关注成功' });
  } catch (error) {
    console.error('取消关注错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取关注列表
router.get('/following/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, q } = req.query;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: '用户不存在' });

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = q ? { username: { [Op.like]: `%${q}%` } } : undefined;

    // 使用更简单的查询方式
    const following = await user.getFollowing({
      where,
      attributes: ['id', 'username', 'avatar', 'bio', 'total_study_time', 'streak'],
      offset,
      limit: parseInt(limit)
    });
    
    const totalCount = await user.countFollowing();
    
    const rows = following;
    const count = totalCount;

    const followingList = rows.map(u => ({
      _id: u.id,
      username: u.username,
      avatar: u.avatar,
      bio: u.bio,
      totalStudyTime: u.total_study_time,
      streak: u.streak
    }));

    return res.json({
      following: followingList,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(count / parseInt(limit)),
        total: count,
        hasNext: offset + rows.length < count,
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

    const target = await User.findByPk(userId);
    if (!target) return res.status(404).json({ message: '用户不存在' });

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 使用更简单的查询方式
    const followers = await target.getFollowers({
      attributes: ['id', 'username', 'avatar', 'bio', 'total_study_time', 'streak'],
      offset,
      limit: parseInt(limit)
    });
    
    const totalCount = await target.countFollowers();
    
    const rows = followers;
    const count = totalCount;

    const followersList = rows.map(u => ({
      _id: u.id,
      username: u.username,
      avatar: u.avatar,
      bio: u.bio,
      totalStudyTime: u.total_study_time,
      streak: u.streak
    }));

    return res.json({
      followers: followersList,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(count / parseInt(limit)),
        total: count,
        hasNext: offset + rows.length < count,
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
    const userId = req.user.id;

    // 查询当前用户关注的用户ID
    const followingUsers = await User.findAll({
      include: [{
        model: User,
        as: 'following',
        where: { id: userId },
        attributes: []
      }],
      attributes: ['id']
    });
    const followingIds = followingUsers.map(u => u.id);

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

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows, count } = await Checkin.findAndCountAll({
      where: {
        user_id: { [Op.in]: followingIds },
        is_public: true
      },
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit),
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatar']
      }]
    });

    // 收集评论用户
    const commentUserIds = new Set();
    for (const c of rows) {
      const comments = Array.isArray(c.comments) ? c.comments : [];
      comments.forEach(cm => { if (cm && cm.user_id) commentUserIds.add(cm.user_id); });
    }
    const commentUsers = commentUserIds.size > 0
      ? await User.findAll({ where: { id: { [Op.in]: Array.from(commentUserIds) } }, attributes: ['id', 'username', 'avatar'] })
      : [];
    const idToUser = new Map(commentUsers.map(u => [u.id, { _id: u.id, username: u.username, avatar: u.avatar }]));

    const checkins = rows.map(c => ({
      _id: c.id,
      content: c.content,
      studyTime: c.study_time,
      subject: c.subject,
      images: c.images || [],
      mood: c.mood,
      location: c.location,
      likes: Array.isArray(c.likes) ? c.likes.map(l => ({ user: { _id: l.user_id } })) : [],
      comments: Array.isArray(c.comments) ? c.comments.map(cm => ({ _id: cm.id || '', content: cm.content, user: idToUser.get(cm.user_id) || { _id: cm.user_id }, createdAt: cm.created_at })) : [],
      isPublic: c.is_public,
      tags: Array.isArray(c.tags) ? c.tags : [],
      createdAt: c.createdAt,
      user: c.user ? { _id: c.user.id, username: c.user.username, avatar: c.user.avatar } : null
    }));

    return res.json({
      checkins,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(count / parseInt(limit)),
        total: count,
        hasNext: offset + rows.length < count,
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
    const { q = '', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      is_active: true,
      [Op.or]: q
        ? [
            { username: { [Op.like]: `%${q}%` } },
            { email: { [Op.like]: `%${q}%` } }
          ]
        : undefined
    };

    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: ['id', 'username', 'avatar', 'bio', 'total_study_time', 'streak'],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit)
    });

    // 获取关注计数（可选：如有需要可通过额外查询优化）
    const users = rows.map(u => ({
      _id: u.id,
      username: u.username,
      avatar: u.avatar,
      bio: u.bio,
      totalStudyTime: u.total_study_time,
      streak: u.streak,
      followers: 0,
      following: 0
    }));

    return res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(count / parseInt(limit)),
        total: count,
        hasNext: offset + rows.length < count,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('搜索用户错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户详情（精简，仅供需要时使用）
router.get('/users/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    const u = await User.findByPk(userId, {
      attributes: ['id', 'username', 'avatar', 'bio', 'total_study_time', 'streak', 'createdAt']
    });
    if (!u) return res.status(404).json({ message: '用户不存在' });

    // 获取关注者和正在关注的数量
    const [followersCount, followingCount] = await Promise.all([
      u.countFollowers(),
      u.countFollowing()
    ]);

    const recent = await Checkin.findAll({
      where: { user_id: u.id, is_public: true },
      order: [['createdAt', 'DESC']],
      limit: 5,
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatar'] }]
    });

    let isFollowing = false;
    if (req.user) {
      const current = await User.findByPk(req.user.id);
      if (current) {
        const target = await User.findByPk(u.id);
        isFollowing = await current.hasFollowing(target);
      }
    }

    const recentCheckins = recent.map(c => ({
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
      tags: Array.isArray(c.tags) ? c.tags : [],
      createdAt: c.createdAt,
      user: c.user ? { _id: c.user.id, username: c.user.username, avatar: c.user.avatar } : null
    }));

    return res.json({
      user: {
        id: u.id,
        username: u.username,
        avatar: u.avatar,
        bio: u.bio,
        totalStudyTime: u.total_study_time,
        streak: u.streak,
        followers: followersCount,
        following: followingCount,
        createdAt: u.createdAt
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

    // 简化版：用原始查询统计最近 period 天的标签热度
    const rows = await Checkin.findAll({
      where: { is_public: true, createdAt: { [Op.gte]: startDate } },
      attributes: ['tags']
    });
    const counter = new Map();
    rows.forEach(r => {
      const tags = Array.isArray(r.tags) ? r.tags : [];
      tags.forEach(t => counter.set(t, (counter.get(t) || 0) + 1));
    });
    const trendingTags = Array.from(counter.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag, count]) => ({ _id: tag, count }));

    return res.json({ trendingTags });
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

    const rows = await Checkin.findAll({
      where: { is_public: true, createdAt: { [Op.gte]: startDate } },
      attributes: ['subject', 'study_time']
    });
    const agg = new Map();
    rows.forEach(r => {
      const s = r.subject || '未分类';
      const entry = agg.get(s) || { count: 0, totalStudyTime: 0 };
      entry.count += 1;
      entry.totalStudyTime += Number(r.study_time || 0);
      agg.set(s, entry);
    });
    const trendingSubjects = Array.from(agg.entries())
      .map(([subject, v]) => ({ _id: subject, count: v.count, totalStudyTime: v.totalStudyTime, avgStudyTime: v.count ? Math.round(v.totalStudyTime / v.count) : 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return res.json({ trendingSubjects });
  } catch (error) {
    console.error('获取热门科目错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 我的：获取我收到的点赞和评论（最近）
router.get('/me/received', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, type = 'all' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 找到我的公开和私有打卡（都可收到互动）
    const myCheckins = await Checkin.findAll({
      where: { user_id: req.user.id },
      attributes: ['id', 'likes', 'comments', 'createdAt']
    });

    const likedItems = [];
    const commentedItems = [];
    for (const c of myCheckins) {
      const likes = Array.isArray(c.likes) ? c.likes : [];
      likes.forEach(l => likedItems.push({ checkinId: c.id, user_id: l.user_id, created_at: new Date(l.created_at || c.createdAt) }));
      const comments = Array.isArray(c.comments) ? c.comments : [];
      comments.forEach(cm => commentedItems.push({ checkinId: c.id, user_id: cm.user_id, content: cm.content, created_at: new Date(cm.created_at || c.createdAt) }));
    }

    // 合并类型
    let merged = [];
    if (type === 'likes' || type === 'all') merged = merged.concat(likedItems.map(x => ({ type: 'like', ...x })));
    if (type === 'comments' || type === 'all') merged = merged.concat(commentedItems.map(x => ({ type: 'comment', ...x })));

    // 时间倒序
    merged.sort((a, b) => b.created_at - a.created_at);
    const total = merged.length;
    const pageItems = merged.slice(offset, offset + parseInt(limit));

    // 补充用户信息
    const userIds = [...new Set(pageItems.map(i => i.user_id))];
    const users = await User.findAll({ where: { id: { [Op.in]: userIds } }, attributes: ['id', 'username', 'avatar'] });
    const idToUser = new Map(users.map(u => [u.id, { _id: u.id, username: u.username, avatar: u.avatar }]));
    const items = pageItems.map(i => ({
      type: i.type,
      createdAt: i.created_at,
      content: i.content,
      checkinId: i.checkinId,
      fromUser: idToUser.get(i.user_id) || { _id: i.user_id, username: '未知用户', avatar: '' }
    }));

    return res.json({
      items,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: offset + items.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('获取我收到的互动错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
