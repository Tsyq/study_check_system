const mysql = require('mysql2/promise');

async function checkZhaoLiPublicCheckins() {
  console.log('🔍 检查赵丽的公开打卡记录...\n');
  
  try {
    // 连接数据库
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123456',
      database: 'smart_study_checkin'
    });
    
    console.log('✅ 数据库连接成功');
    
    // 1. 查找赵丽的用户ID
    const [zhaoLi] = await connection.execute('SELECT id, username FROM users WHERE username = ?', ['赵丽']);
    
    if (zhaoLi.length > 0) {
      const zhaoLiId = zhaoLi[0].id;
      console.log(`赵丽用户ID: ${zhaoLiId}`);
      
      // 2. 检查赵丽的所有打卡记录
      console.log('\n2. 检查赵丽的所有打卡记录...');
      const [allCheckins] = await connection.execute(
        'SELECT id, content, study_time, subject, is_public, created_at FROM checkins WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
        [zhaoLiId]
      );
      
      console.log(`赵丽的打卡记录总数: ${allCheckins.length}`);
      
      if (allCheckins.length > 0) {
        console.log('赵丽的打卡记录:');
        allCheckins.forEach(checkin => {
          console.log(`  - ID: ${checkin.id}`);
          console.log(`    内容: ${checkin.content}`);
          console.log(`    学习时长: ${checkin.study_time}分钟`);
          console.log(`    科目: ${checkin.subject}`);
          console.log(`    是否公开: ${checkin.is_public ? '是' : '否'}`);
          console.log(`    创建时间: ${checkin.created_at}`);
          console.log('');
        });
        
        // 3. 统计公开和私密的打卡记录
        const publicCheckins = allCheckins.filter(c => c.is_public === 1);
        const privateCheckins = allCheckins.filter(c => c.is_public === 0);
        
        console.log(`公开打卡记录: ${publicCheckins.length}条`);
        console.log(`私密打卡记录: ${privateCheckins.length}条`);
        
        // 4. 如果公开打卡记录为0，创建一些公开的打卡记录
        if (publicCheckins.length === 0) {
          console.log('\n4. 为赵丽创建公开的打卡记录...');
          const publicCheckinData = [
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
            }
          ];
          
          for (const checkin of publicCheckinData) {
            await connection.execute(
              'INSERT INTO checkins (user_id, content, study_time, subject, mood, location, is_public, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [checkin.user_id, checkin.content, checkin.study_time, checkin.subject, checkin.mood, checkin.location, checkin.is_public, checkin.created_at, checkin.updated_at]
            );
          }
          
          console.log('✅ 为赵丽创建了2条公开的打卡记录');
        }
        
      } else {
        console.log('  - 赵丽没有打卡记录');
      }
      
    } else {
      console.log('❌ 没有找到赵丽用户');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkZhaoLiPublicCheckins();
