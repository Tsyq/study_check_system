const { sequelize } = require('../models');
const { User, Checkin, StudyPlan } = require('../models');

async function initDatabase() {
  try {
    console.log('开始初始化数据库...');
    
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 同步数据库表结构
    await sequelize.sync({ force: true });
    console.log('数据库表结构创建成功');
    
    // 创建示例数据
    console.log('创建示例数据...');
    
    // 创建示例用户
    const demoUser = await User.create({
      username: 'demo_user',
      email: 'demo@example.com',
      password: '123456',
      bio: '这是一个演示用户',
      total_study_time: 1250,
      streak: 7
    });
    
    const testUser = await User.create({
      username: 'test_user',
      email: 'test@example.com',
      password: '123456',
      bio: '测试用户',
      total_study_time: 800,
      streak: 5
    });
    
    console.log('示例用户创建成功');
    
    // 创建示例打卡记录
    await Checkin.create({
      user_id: demoUser.id,
      content: '今天学习了React Hooks，感觉对状态管理有了更深的理解！',
      study_time: 120,
      subject: '编程',
      mood: 'happy',
      location: '图书馆',
      tags: ['React', '前端开发']
    });
    
    await Checkin.create({
      user_id: demoUser.id,
      content: '完成了数学作业，解出了几道难题，很有成就感！',
      study_time: 90,
      subject: '数学',
      mood: 'excited',
      location: '宿舍',
      tags: ['微积分', '作业']
    });
    
    await Checkin.create({
      user_id: testUser.id,
      content: '英语阅读练习，今天读了一篇关于AI的文章，学到了很多新词汇！',
      study_time: 60,
      subject: '英语',
      mood: 'normal',
      location: '咖啡厅',
      tags: ['阅读', 'AI']
    });
    
    console.log('示例打卡记录创建成功');
    
    // 创建示例学习计划
    await StudyPlan.create({
      user_id: demoUser.id,
      title: 'React学习计划',
      description: '深入学习React框架，掌握现代前端开发技能',
      subject: '编程',
      target: '掌握React核心概念和最佳实践',
      start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      total_hours: 50,
      completed_hours: 32.5,
      daily_goal: 120,
      milestones: [
        {
          title: '完成基础语法学习',
          description: '掌握JSX、组件、Props等基础概念',
          target_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          is_completed: true
        },
        {
          title: '学习Hooks',
          description: '掌握useState、useEffect等常用Hooks',
          target_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          is_completed: false
        }
      ]
    });
    
    await StudyPlan.create({
      user_id: demoUser.id,
      title: '期末考试复习',
      description: '全面复习数学课程，准备期末考试',
      subject: '数学',
      target: '期末考试达到90分以上',
      start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      total_hours: 30,
      completed_hours: 12,
      daily_goal: 90
    });
    
    console.log('示例学习计划创建成功');
    
    console.log('数据库初始化完成！');
    console.log('示例用户:');
    console.log('- demo@example.com / 123456');
    console.log('- test@example.com / 123456');
    
  } catch (error) {
    console.error('数据库初始化失败:', error);
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
