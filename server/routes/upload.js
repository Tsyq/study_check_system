const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const { User } = require('../models');

const router = express.Router();

// 配置multer存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/avatars');
    // 确保目录存在
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名：用户ID_时间戳_原文件名
    const userId = req.user.id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${userId}_${timestamp}${ext}`;
    cb(null, filename);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 只允许图片文件
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件'), false);
  }
};

// 配置multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB限制
  }
});

// 头像上传API
router.post('/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }

    const userId = req.user.id;
    const filename = req.file.filename;
    const avatarUrl = `/uploads/avatars/${filename}`;

    // 先删除旧头像文件
    await deleteOldAvatar(userId);

    // 更新用户头像
    await User.update(
      { avatar: avatarUrl },
      { where: { id: userId } }
    );

    res.json({
      message: '头像上传成功',
      avatarUrl: avatarUrl
    });

  } catch (error) {
    console.error('头像上传失败:', error);
    res.status(500).json({ message: '头像上传失败' });
  }
});

// 删除旧头像文件
const deleteOldAvatar = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    if (user && user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
      const oldAvatarPath = path.join(__dirname, '../', user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
        console.log(`已删除旧头像文件: ${oldAvatarPath}`);
      }
    }
  } catch (error) {
    console.error('删除旧头像失败:', error);
  }
};


module.exports = router;
