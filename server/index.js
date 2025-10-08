const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const { sequelize } = require('./models');

// 加载环境变量
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 数据库连接
sequelize.authenticate()
  .then(() => {
    console.log('MySQL数据库连接成功');
    return sequelize.sync({ force: false }); // 只同步表结构，不强制重建
  })
  .then(() => {
    console.log('数据库表结构同步完成');
  })
  .catch(err => {
    console.error('MySQL数据库连接失败:', err.message);
    console.log('提示: 请确保MySQL服务已启动，并检查数据库配置');
    console.log('请检查.env文件中的数据库配置');
  });

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/checkins', require('./routes/checkins'));
app.use('/api/plans', require('./routes/plans'));
app.use('/api/social', require('./routes/social'));
app.use('/api/stats', require('./routes/stats'));

// 前端静态资源（生产环境或需要同源访问时）
const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
app.use(express.static(clientBuildPath));

// SPA 路由回退：除 /api 前缀外的所有请求都返回 index.html
app.get(/^\/(?!api).*/, (req, res, next) => {
  const indexHtml = path.join(clientBuildPath, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) next();
  });
});

// Socket.IO 连接处理
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);
  
  // 加入学习圈
  socket.on('join-study-circle', (userId) => {
    socket.join('study-circle');
    console.log(`用户 ${userId} 加入学习圈`);
  });
  
  // 实时打卡通知
  socket.on('new-checkin', (data) => {
    socket.to('study-circle').emit('checkin-notification', data);
  });
  
  // 点赞通知
  socket.on('like-checkin', (data) => {
    socket.to('study-circle').emit('like-notification', data);
  });
  
  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id);
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '服务器内部错误' });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
