const { sequelize } = require('../models');
const { User, Checkin, StudyPlan } = require('../models');

// 标准科目列表（与前端一致）
const STANDARD_SUBJECTS = [
  '高等数学', '线性代数', '概率论与数理统计', '离散数学', '数学分析',
  'C语言程序设计', 'Java程序设计', 'Python程序设计', 'C++程序设计', '数据结构与算法',
  '计算机组成原理', '操作系统', '计算机网络', '数据库原理', '软件工程',
  '人工智能', '机器学习', '深度学习', '计算机图形学', '数字图像处理',
  '编译原理', '计算机体系结构', '信息安全', '密码学', 'Web开发',
  '移动应用开发', '数据分析', '算法设计与分析', '计算机视觉', '其他'
];

// 学习地点
const STUDY_LOCATIONS = ['图书馆', '教室', '寝室', '咖啡厅'];

// 心情选项
const MOODS = ['excited', 'happy', 'normal', 'tired', 'frustrated'];

// 生成随机中文姓名
function generateChineseName() {
  const surnames = ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗'];
  const givenNames = ['明', '芳', '伟', '敏', '静', '强', '丽', '华', '军', '红', '涛', '艳', '杰', '雪', '峰', '霞', '斌', '燕', '超', '梅'];
  
  const surname = surnames[Math.floor(Math.random() * surnames.length)];
  const givenName = givenNames[Math.floor(Math.random() * givenNames.length)];
  return surname + givenName;
}

// 生成学习内容
function generateStudyContent(subject) {
  const contentTemplates = {
    '高等数学': ['复习微积分基础概念', '练习极限计算', '学习导数应用', '完成数学作业'],
    '数据结构与算法': ['学习链表操作', '练习排序算法', '复习二叉树遍历', '完成算法题'],
    'Web开发': ['学习React组件', '练习CSS布局', '学习JavaScript ES6', '完成前端项目'],
    '数据库原理': ['学习SQL查询', '练习数据库设计', '学习索引优化', '完成数据库作业'],
    '其他': ['阅读课外书籍', '学习新技能', '完成作业', '复习课程内容']
  };
  
  const templates = contentTemplates[subject] || contentTemplates['其他'];
  return templates[Math.floor(Math.random() * templates.length)];
}

// 生成随机日期（2025年7月1日到10月9日）
function generateRandomDate() {
  const start = new Date('2025-07-01');
  const end = new Date('2025-10-09');
  const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(randomTime);
}

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
    
    // 创建20个用户
    const users = [];
    for (let i = 1; i <= 20; i++) {
      const username = generateChineseName();
      const user = await User.create({
        username: username,
        email: `${username}${i}@example.com`,
        password: '123456',
        bio: `这是用户${username}的个人简介`,
        total_study_time: Math.floor(Math.random() * 5000) + 8000, // 8000-13000分钟
        streak: Math.floor(Math.random() * 20) + 20 // 20-40天
      });
      users.push(user);
    }
    
    console.log(`${users.length}个用户创建成功`);
    
    // 为每个用户创建打卡记录（约150条/用户）
    let totalCheckins = 0;
    for (const user of users) {
      const checkinCount = Math.floor(Math.random() * 50) + 100; // 100-150条
      
      for (let i = 0; i < checkinCount; i++) {
        const subject = STANDARD_SUBJECTS[Math.floor(Math.random() * STANDARD_SUBJECTS.length)];
        const studyTime = Math.floor(Math.random() * 120) + 30; // 30-150分钟
        const mood = MOODS[Math.floor(Math.random() * MOODS.length)];
        const location = STUDY_LOCATIONS[Math.floor(Math.random() * STUDY_LOCATIONS.length)];
        const createdAt = generateRandomDate();
        
        await Checkin.create({
          user_id: user.id,
          content: generateStudyContent(subject),
          study_time: studyTime,
          subject: subject,
          mood: mood,
          location: location,
          tags: [subject, '学习'],
          created_at: createdAt,
          updated_at: createdAt
        });
        
        totalCheckins++;
      }
    }
    
    console.log(`${totalCheckins}条打卡记录创建成功`);
    
    // 为每个用户创建学习计划（2-4个/用户）
    let totalPlans = 0;
    for (const user of users) {
      const planCount = Math.floor(Math.random() * 3) + 2; // 2-4个计划
      
      for (let i = 0; i < planCount; i++) {
        const subject = STANDARD_SUBJECTS[Math.floor(Math.random() * STANDARD_SUBJECTS.length)];
        const totalHours = Math.floor(Math.random() * 50) + 20; // 20-70小时
        const completedHours = Math.floor(Math.random() * totalHours);
        const startDate = generateRandomDate();
        const endDate = new Date(startDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000); // 30天内
        
        await StudyPlan.create({
          user_id: user.id,
          title: `${subject}学习计划`,
          description: `深入学习${subject}相关知识和技能`,
          subject: subject,
          target: `掌握${subject}核心概念`,
          start_date: startDate,
          end_date: endDate,
          total_hours: totalHours,
          completed_hours: completedHours,
          daily_goal: Math.floor(Math.random() * 60) + 60, // 60-120分钟
          milestones: JSON.stringify([
            {
              title: '基础概念学习',
              description: '掌握基础理论知识',
              target_date: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
              is_completed: Math.random() > 0.5
            },
            {
              title: '实践练习',
              description: '通过练习巩固知识',
              target_date: new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000),
              is_completed: Math.random() > 0.7
            }
          ])
        });
        
        totalPlans++;
      }
    }
    
    console.log(`${totalPlans}个学习计划创建成功`);
    
    console.log('\n数据库初始化完成！');
    console.log('示例用户账号:');
    console.log('- 李明1@example.com / 123456');
    console.log('- 王芳2@example.com / 123456');
    console.log('- 张伟3@example.com / 123456');
    console.log('- 刘敏4@example.com / 123456');
    console.log('- 陈静5@example.com / 123456');
    console.log('... (共20个用户)');
    
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
