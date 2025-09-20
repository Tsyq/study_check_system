# 快速开始指南

## 🚀 一键启动

### Windows用户
双击运行 `start.bat` 文件，或在命令行中执行：
```bash
start.bat
```

### Linux/Mac用户
在终端中执行：
```bash
chmod +x start.sh
./start.sh
```

## 📋 手动启动步骤

### 1. 环境准备
确保已安装：
- Node.js (版本 >= 14.0.0)
- MongoDB (版本 >= 4.0.0)

### 2. 安装依赖
```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd client
npm install
cd ..
```

### 3. 配置环境变量
```bash
# 复制环境变量文件
copy env.example .env
copy client\env.example client\.env
```

编辑 `.env` 文件，配置数据库连接等信息：
```env
MONGODB_URI=mongodb://localhost:27017/smart-study-checkin
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
CLIENT_URL=http://localhost:3000
```

### 4. 启动MongoDB
确保MongoDB服务正在运行：
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
# 或
mongod
```

### 5. 启动项目
```bash
# 开发模式（同时启动前后端）
npm run dev

# 或分别启动
npm run server  # 后端 (端口5000)
npm run client  # 前端 (端口3000)
```

## 🌐 访问应用

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:5000/api

## 👤 默认账户

首次使用需要注册账户，或可以使用以下测试账户：
- 用户名: testuser
- 邮箱: test@example.com
- 密码: 123456

## 🔧 常见问题

### MongoDB连接失败
1. 确保MongoDB服务已启动
2. 检查MongoDB端口是否为27017
3. 确认防火墙设置

### 端口被占用
1. 检查5000和3000端口是否被其他程序占用
2. 可以修改`.env`文件中的端口配置

### 依赖安装失败
1. 清除npm缓存: `npm cache clean --force`
2. 删除node_modules文件夹重新安装
3. 检查网络连接

## 📱 功能测试

启动成功后，可以测试以下功能：

1. **用户注册/登录** - 创建新账户或登录
2. **学习打卡** - 记录学习内容和时长
3. **学习计划** - 创建和管理学习计划
4. **社交功能** - 关注其他用户，查看动态
5. **统计分析** - 查看学习数据和排行榜

## 🎯 下一步

- 查看完整的 [README.md](README.md) 了解详细功能
- 根据需要修改配置和样式
- 部署到生产环境

---

**需要帮助？** 查看项目文档或提交Issue！
