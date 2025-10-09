const mysql = require('mysql2/promise');

async function checkZhaoLiCheckins() {
  console.log('🔍 检查赵丽的打卡记录...\n');
  
  try {
    // 连接数据库
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123456',
      database: 'smart_study_checkin'
    });
    
    console.log('✅ 数据库连接成功');
    
    // 1. 查找赵丽的用户信息
    console.log('\n1. 查找赵丽的用户信息...');
    const [zhaoLi] = await connection.execute('SELECT * FROM users WHERE username = ?', ['赵丽']);
    
    if (zhaoLi.length > 0) {
      console.log('✅ 找到赵丽用户');
      console.log(`  - ID: ${zhaoLi[0].id}`);
      console.log(`  - 用户名: ${zhaoLi[0].username}`);
      console.log(`  - 邮箱: ${zhaoLi[0].email}`);
      
      const zhaoLiId = zhaoLi[0].id;
      
      // 2. 检查赵丽的打卡记录
      console.log('\n2. 检查赵丽的打卡记录...');
      const [checkins] = await connection.execute(
        'SELECT * FROM checkins WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
        [zhaoLiId]
      );
      
      console.log(`赵丽的打卡记录数量: ${checkins.length}`);
      
      if (checkins.length > 0) {
        console.log('赵丽的打卡记录:');
        checkins.forEach(checkin => {
          console.log(`  - ID: ${checkin.id}`);
          console.log(`    内容: ${checkin.content}`);
          console.log(`    学习时长: ${checkin.study_time}分钟`);
          console.log(`    科目: ${checkin.subject}`);
          console.log(`    是否公开: ${checkin.is_public ? '是' : '否'}`);
          console.log(`    创建时间: ${checkin.created_at}`);
          console.log('');
        });
      } else {
        console.log('  - 赵丽没有打卡记录');
        
        // 3. 为赵丽创建一些公开的打卡记录
        console.log('\n3. 为赵丽创建公开的打卡记录...');
        const checkinData = [
          {
            user_id: zhaoLiId,
            content: '今天学习了高等数学，完成了微积分练习',
            study_time: 120,
            subject: '高等数学',
            mood: 'happy',
            location: '图书馆',
            is_public: 1,
            created_at: new Date('2025-10-08 14:30:00'),
            updated_at: new Date('2025-10-08 14:30:00')
          },
          {
            user_id: zhaoLiId,
            content: '学习了数据结构与算法，完成了二叉树遍历',
            study_time: 90,
            subject: '数据结构与算法',
            mood: 'excited',
            location: '教室',
            is_public: 1,
            created_at: new Date('2025-10-07 16:20:00'),
            updated_at: new Date('2025-10-07 16:20:00')
          },
          {
            user_id: zhaoLiId,
            content: '复习了计算机网络，学习了TCP/IP协议',
            study_time: 150,
            subject: '计算机网络',
            mood: 'normal',
            location: '寝室',
            is_public: 1,
            created_at: new Date('2025-10-06 19:45:00'),
            updated_at: new Date('2025-10-06 19:45:00')
          }
        ];
        
        for (const checkin of checkinData) {
          await connection.execute(
            'INSERT INTO checkins (user_id, content, study_time, subject, mood, location, is_public, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [checkin.user_id, checkin.content, checkin.study_time, checkin.subject, checkin.mood, checkin.location, checkin.is_public, checkin.created_at, checkin.updated_at]
          );
        }
        
        console.log('✅ 为赵丽创建了3条公开的打卡记录');
      }
      
    } else {
      console.log('❌ 没有找到赵丽用户');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkZhaoLiCheckins();
