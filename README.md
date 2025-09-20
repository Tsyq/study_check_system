# 智能学习打卡系统

一个帮助同学养成学习习惯，记录并分享学习进度的智能学习打卡系统。

## 功能特性

### 🎯 核心功能
- **用户注册/登录** - 安全的用户认证系统
- **每日学习打卡** - 记录学习内容、时长、心情等
- **学习计划管理** - 创建和管理个人学习计划
- **社交互动** - 学习圈动态、点赞评论、好友关注
- **统计分析** - 学习数据统计和排行榜

### 📊 四大模块

#### 成员 A - 用户与打卡模块
- ✅ 用户注册/登录
- ✅ 每日学习打卡（文字/上传学习时长）
- ✅ 打卡提醒（邮件/消息推送）

#### 成员 B - 学习计划模块
- ✅ 创建学习计划（科目、目标）
- ✅ 学习计划进度管理
- ✅ 提醒设置（如考试倒计时）

#### 成员 C - 社交互动模块
- ✅ 学习圈动态（展示大家的打卡）
- ✅ 点赞/评论功能
- ✅ 好友关注

#### 成员 D - 统计与后台模块
- ✅ 学习时长统计图表
- ✅ 活跃用户排行榜
- ✅ 后台数据管理（违规内容删除）

## 技术栈

### 后端
- **Node.js** - 服务器运行环境
- **Express.js** - Web应用框架
- **MySQL** - 关系型数据库
- **Sequelize** - MySQL ORM框架
- **JWT** - 身份验证
- **Socket.IO** - 实时通信
- **Nodemailer** - 邮件服务

### 前端
- **React** - 用户界面库
- **TypeScript** - 类型安全的JavaScript
- **Ant Design** - UI组件库
- **React Router** - 路由管理
- **Axios** - HTTP客户端
- **Recharts** - 图表库
- **Socket.IO Client** - 实时通信客户端

## 项目结构

```
智能学习打卡系统/
├── server/                 # 后端代码
│   ├── models/            # 数据模型
│   │   ├── User.js        # 用户模型
│   │   ├── Checkin.js     # 打卡模型
│   │   └── StudyPlan.js   # 学习计划模型
│   ├── routes/            # 路由
│   │   ├── auth.js        # 认证路由
│   │   ├── checkins.js    # 打卡路由
│   │   ├── plans.js       # 学习计划路由
│   │   ├── social.js      # 社交路由
│   │   ├── stats.js       # 统计路由
│   │   └── users.js       # 用户管理路由
│   ├── middleware/        # 中间件
│   │   └── auth.js        # 认证中间件
│   └── index.js           # 服务器入口
├── client/                # 前端代码
│   ├── src/
│   │   ├── components/    # 组件
│   │   │   ├── Layout.tsx # 布局组件
│   │   │   └── ProtectedRoute.tsx
│   │   ├── pages/         # 页面
│   │   │   ├── Login.tsx  # 登录页
│   │   │   ├── Register.tsx # 注册页
│   │   │   ├── Dashboard.tsx # 仪表盘
│   │   │   ├── Checkin.tsx # 打卡页
│   │   │   ├── Plans.tsx  # 学习计划页
│   │   │   ├── Social.tsx # 社交页
│   │   │   ├── Stats.tsx  # 统计页
│   │   │   └── Profile.tsx # 个人资料页
│   │   ├── contexts/      # 上下文
│   │   │   ├── AuthContext.tsx # 认证上下文
│   │   │   └── SocketContext.tsx # Socket上下文
│   │   ├── services/      # 服务
│   │   │   └── api.ts     # API服务
│   │   └── App.tsx        # 应用入口
├── package.json           # 项目配置
└── README.md             # 项目说明
```

## 快速开始

### 环境要求
- Node.js >= 14.0.0
- MySQL >= 5.7 或 MySQL >= 8.0
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd 智能学习打卡系统
```

2. **安装依赖**
```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd client
npm install
cd ..
```

3. **环境配置**
```bash
# 复制环境变量文件
cp env.example .env
cp client/env.example client/.env

# 编辑 .env 文件，配置MySQL数据库连接等信息
```

4. **安装并启动MySQL**
```bash
# Windows: 下载并安装MySQL Community Server
# 或使用包管理器安装
winget install Oracle.MySQL

# Linux/Mac: 使用包管理器安装
# Ubuntu/Debian: sudo apt install mysql-server
# CentOS/RHEL: sudo yum install mysql-server
# macOS: brew install mysql

# 启动MySQL服务
# Windows: net start mysql
# Linux: sudo systemctl start mysql
# macOS: brew services start mysql
```

5. **创建数据库**
```bash
# 登录MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE smart_study_checkin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 退出MySQL
exit;
```

6. **初始化数据库**
```bash
# 初始化数据库表结构和示例数据
npm run init-db
```

7. **启动项目**
```bash
# 开发模式（同时启动前后端）
npm run dev

# 或者分别启动
npm run server  # 启动后端 (端口5000)
npm run client  # 启动前端 (端口3000)
```

8. **访问应用**
- 前端: http://localhost:3000
- 后端API: http://localhost:5000/api

## API接口

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `PUT /api/auth/profile` - 更新用户信息

### 打卡接口
- `POST /api/checkins` - 创建打卡
- `GET /api/checkins` - 获取打卡列表
- `GET /api/checkins/:id` - 获取打卡详情
- `POST /api/checkins/:id/like` - 点赞/取消点赞
- `POST /api/checkins/:id/comments` - 添加评论

### 学习计划接口
- `POST /api/plans` - 创建学习计划
- `GET /api/plans` - 获取学习计划列表
- `GET /api/plans/:id` - 获取学习计划详情
- `PUT /api/plans/:id` - 更新学习计划
- `POST /api/plans/:id/progress` - 更新学习进度

### 社交接口
- `POST /api/social/follow/:userId` - 关注用户
- `DELETE /api/social/follow/:userId` - 取消关注
- `GET /api/social/feed` - 获取学习圈动态
- `GET /api/social/search/users` - 搜索用户

### 统计接口
- `GET /api/stats/leaderboard/study-time` - 学习时长排行榜
- `GET /api/stats/leaderboard/streak` - 连续打卡排行榜
- `GET /api/stats/personal/:userId` - 个人统计
- `GET /api/stats/global` - 全局统计

## 数据库设计

### 用户表 (users)
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(255) DEFAULT '',
  bio VARCHAR(200) DEFAULT '',
  study_goals JSON DEFAULT '[]',
  total_study_time INT DEFAULT 0,
  streak INT DEFAULT 0,
  last_checkin_date DATETIME NULL,
  is_active BOOLEAN DEFAULT TRUE,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 打卡表 (checkins)
```sql
CREATE TABLE checkins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  study_time INT NOT NULL,
  subject VARCHAR(100) NOT NULL,
  images JSON DEFAULT '[]',
  mood ENUM('excited', 'happy', 'normal', 'tired', 'frustrated') DEFAULT 'normal',
  location VARCHAR(255) DEFAULT '',
  likes JSON DEFAULT '[]',
  comments JSON DEFAULT '[]',
  is_public BOOLEAN DEFAULT TRUE,
  tags JSON DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_created (user_id, created_at),
  INDEX idx_created (created_at),
  INDEX idx_subject (subject)
);
```

### 学习计划表 (study_plans)
```sql
CREATE TABLE study_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT DEFAULT '',
  subject VARCHAR(100) NOT NULL,
  target VARCHAR(255) NOT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  total_hours DECIMAL(10,2) NOT NULL,
  completed_hours DECIMAL(10,2) DEFAULT 0,
  daily_goal INT DEFAULT 60,
  milestones JSON DEFAULT '[]',
  reminders JSON DEFAULT '[]',
  progress JSON DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  is_completed BOOLEAN DEFAULT FALSE,
  tags JSON DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_created (user_id, created_at),
  INDEX idx_end_date (end_date),
  INDEX idx_subject (subject)
);
```

### 用户关注表 (user_follows)
```sql
CREATE TABLE user_follows (
  id INT PRIMARY KEY AUTO_INCREMENT,
  follower_id INT NOT NULL,
  following_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_follow (follower_id, following_id)
);
```

## 功能截图

### 登录注册
- 美观的登录注册界面
- 表单验证和错误提示
- 响应式设计

### 仪表盘
- 学习统计概览
- 最近打卡动态
- 活跃学习计划

### 学习打卡
- 丰富的打卡表单
- 心情和标签记录
- 实时动态展示

### 学习计划
- 可视化进度管理
- 里程碑设置
- 计划统计

### 社交功能
- 学习圈动态
- 用户关注系统
- 点赞评论互动

### 统计分析
- 个人学习统计
- 排行榜系统
- 数据可视化图表

## 开发计划

### 已完成功能 ✅
- [x] 用户注册登录系统
- [x] 学习打卡功能
- [x] 学习计划管理
- [x] 社交互动功能
- [x] 统计图表展示
- [x] 响应式界面设计

### 待开发功能 🚧
- [ ] 邮件提醒系统
- [ ] 消息推送功能
- [ ] 文件上传功能
- [ ] 移动端适配优化
- [ ] 数据导出功能
- [ ] 管理员后台
- [ ] 学习小组功能
- [ ] 成就系统

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

如有问题或建议，请通过以下方式联系：

- 项目Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 邮箱: your-email@example.com

## 致谢

感谢所有为这个项目做出贡献的开发者！

---

**智能学习打卡系统** - 让学习更有趣，让进步更可见！ 🎓✨
