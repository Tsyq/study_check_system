# MySQL 数据库设置指南

## 🗄️ MySQL 安装

### Windows 系统

#### 方法一：使用包管理器（推荐）
```bash
# 使用 winget 安装
winget install Oracle.MySQL

# 或使用 Chocolatey
choco install mysql
```

#### 方法二：手动安装
1. 访问 [MySQL 官网](https://dev.mysql.com/downloads/mysql/)
2. 下载 MySQL Community Server
3. 运行安装程序，选择 "Developer Default" 配置
4. 设置 root 密码
5. 完成安装

### Linux 系统

#### Ubuntu/Debian
```bash
# 更新包列表
sudo apt update

# 安装 MySQL
sudo apt install mysql-server

# 启动 MySQL 服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 安全配置
sudo mysql_secure_installation
```

#### CentOS/RHEL
```bash
# 安装 MySQL
sudo yum install mysql-server

# 启动 MySQL 服务
sudo systemctl start mysqld
sudo systemctl enable mysqld

# 获取临时密码
sudo grep 'temporary password' /var/log/mysqld.log

# 安全配置
sudo mysql_secure_installation
```

### macOS 系统

#### 使用 Homebrew
```bash
# 安装 MySQL
brew install mysql

# 启动 MySQL 服务
brew services start mysql

# 安全配置
mysql_secure_installation
```

## 🔧 数据库配置

### 1. 创建数据库
```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE smart_study_checkin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建用户（可选）
CREATE USER 'study_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON smart_study_checkin.* TO 'study_user'@'localhost';
FLUSH PRIVILEGES;

# 退出 MySQL
exit;
```

### 2. 配置环境变量
编辑项目根目录的 `.env` 文件：

```env
# MySQL数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=smart_study_checkin
DB_USERNAME=root
DB_PASSWORD=your_mysql_password

# 如果创建了专用用户，使用以下配置：
# DB_USERNAME=study_user
# DB_PASSWORD=your_password
```

### 3. 初始化数据库
```bash
# 在项目根目录运行
npm run init-db
```

## 🚀 启动项目

### 1. 确保 MySQL 服务运行
```bash
# Windows
net start mysql

# Linux
sudo systemctl start mysql

# macOS
brew services start mysql
```

### 2. 启动项目
```bash
npm run dev
```

## 🔍 常见问题

### 问题1：连接被拒绝
**错误信息**: `ECONNREFUSED 127.0.0.1:3306`

**解决方案**:
1. 检查 MySQL 服务是否启动
2. 检查端口是否正确（默认 3306）
3. 检查防火墙设置

### 问题2：认证失败
**错误信息**: `Access denied for user 'root'@'localhost'`

**解决方案**:
1. 检查用户名和密码是否正确
2. 重置 root 密码：
```bash
# 停止 MySQL 服务
sudo systemctl stop mysql

# 以安全模式启动
sudo mysqld_safe --skip-grant-tables &

# 连接 MySQL
mysql -u root

# 重置密码
USE mysql;
UPDATE user SET authentication_string=PASSWORD('new_password') WHERE User='root';
FLUSH PRIVILEGES;
exit;

# 重启 MySQL 服务
sudo systemctl restart mysql
```

### 问题3：字符集问题
**错误信息**: `Incorrect string value`

**解决方案**:
确保数据库使用 UTF8MB4 字符集：
```sql
ALTER DATABASE smart_study_checkin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 问题4：权限不足
**错误信息**: `Access denied for user`

**解决方案**:
```sql
-- 授予所有权限
GRANT ALL PRIVILEGES ON smart_study_checkin.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

## 📊 数据库管理工具

### 推荐工具
1. **MySQL Workbench** - 官方图形化管理工具
2. **phpMyAdmin** - Web 界面管理工具
3. **DBeaver** - 通用数据库管理工具
4. **Sequel Pro** (macOS) - 轻量级 MySQL 客户端

### 命令行工具
```bash
# 连接数据库
mysql -u root -p smart_study_checkin

# 查看所有表
SHOW TABLES;

# 查看表结构
DESCRIBE users;

# 查看数据
SELECT * FROM users LIMIT 10;
```

## 🔄 数据库备份与恢复

### 备份数据库
```bash
# 备份整个数据库
mysqldump -u root -p smart_study_checkin > backup.sql

# 备份特定表
mysqldump -u root -p smart_study_checkin users checkins > tables_backup.sql
```

### 恢复数据库
```bash
# 恢复数据库
mysql -u root -p smart_study_checkin < backup.sql
```

## 📈 性能优化

### 1. 索引优化
```sql
-- 为常用查询字段添加索引
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_checkin_date ON checkins(created_at);
CREATE INDEX idx_plan_user ON study_plans(user_id);
```

### 2. 查询优化
- 使用 `LIMIT` 限制结果集大小
- 避免 `SELECT *`，只选择需要的字段
- 使用适当的 `WHERE` 条件

### 3. 连接池配置
在 `server/config/database.js` 中调整连接池参数：
```javascript
pool: {
  max: 20,        // 最大连接数
  min: 5,         // 最小连接数
  acquire: 30000, // 获取连接超时时间
  idle: 10000     // 连接空闲时间
}
```

## 🛡️ 安全建议

1. **使用强密码**
2. **限制用户权限**
3. **定期备份数据**
4. **启用 SSL 连接**（生产环境）
5. **定期更新 MySQL 版本**

---

**需要帮助？** 查看项目文档或提交 Issue！
