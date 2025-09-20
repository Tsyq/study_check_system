@echo off
echo 智能学习打卡系统启动脚本
echo ================================

echo 检查Node.js环境...
node --version
if %errorlevel% neq 0 (
    echo 错误: 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)

echo 检查MongoDB服务...
mongod --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 警告: 未找到MongoDB，请确保MongoDB已安装并启动
    echo 如果没有安装MongoDB，请访问: https://www.mongodb.com/try/download/community
)

echo.
echo 安装依赖包...
call npm install
if %errorlevel% neq 0 (
    echo 错误: 后端依赖安装失败
    pause
    exit /b 1
)

cd client
call npm install
if %errorlevel% neq 0 (
    echo 错误: 前端依赖安装失败
    pause
    exit /b 1
)
cd ..

echo.
echo 创建环境变量文件...
if not exist .env (
    copy env.example .env
    echo 已创建 .env 文件，请根据需要修改配置
)

if not exist client\.env (
    copy client\env.example client\.env
    echo 已创建 client\.env 文件
)

echo.
echo 启动项目...
echo 前端地址: http://localhost:3000
echo 后端地址: http://localhost:5000
echo.
echo 按 Ctrl+C 停止服务
echo ================================

call npm run dev
