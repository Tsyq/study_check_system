#!/bin/bash

echo "智能学习打卡系统启动脚本"
echo "================================"

echo "检查Node.js环境..."
if ! command -v node &> /dev/null; then
    echo "错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi
node --version

echo "检查MongoDB服务..."
if ! command -v mongod &> /dev/null; then
    echo "警告: 未找到MongoDB，请确保MongoDB已安装并启动"
    echo "如果没有安装MongoDB，请访问: https://www.mongodb.com/try/download/community"
fi

echo ""
echo "安装依赖包..."
npm install
if [ $? -ne 0 ]; then
    echo "错误: 后端依赖安装失败"
    exit 1
fi

cd client
npm install
if [ $? -ne 0 ]; then
    echo "错误: 前端依赖安装失败"
    exit 1
fi
cd ..

echo ""
echo "创建环境变量文件..."
if [ ! -f .env ]; then
    cp env.example .env
    echo "已创建 .env 文件，请根据需要修改配置"
fi

if [ ! -f client/.env ]; then
    cp client/env.example client/.env
    echo "已创建 client/.env 文件"
fi

echo ""
echo "启动项目..."
echo "前端地址: http://localhost:3000"
echo "后端地址: http://localhost:5000"
echo ""
echo "按 Ctrl+C 停止服务"
echo "================================"

npm run dev
