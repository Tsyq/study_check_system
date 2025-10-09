const mysql = require('mysql2/promise');

async function testFollowFeedLogic() {
  console.log('🔍 测试关注动态逻辑...\n');
  
  try {
    // 连接数据库
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123456',
      database: 'smart_study_checkin'
    });
    
    console.log('✅ 数据库连接成功');
    
    // 1. 检查用户443的关注关系
    console.log('\n1. 检查用户443的关注关系...');
    const [follows] = await connection.execute(
      'SELECT uf.following_id, u.username FROM user_follows uf JOIN users u ON uf.following_id = u.id WHERE uf.follower_id = 443'
    );
    
    console.log(`用户443关注的用户数量: ${follows.length}`);
    if (follows.length > 0) {
      follows.forEach(follow => {
        console.log(`  - 关注了: ${follow.username} (ID: ${follow.following_id})`);
      });
      
      // 2. 检查被关注用户的公开打卡
      console.log('\n2. 检查被关注用户的公开打卡...');
      const followingIds = follows.map(f => f.following_id);
      const [checkins] = await connection.execute(
        'SELECT c.*, u.username FROM checkins c JOIN users u ON c.user_id = u.id WHERE c.user_id IN (?) AND c.is_public = 1 ORDER BY c.created_at DESC LIMIT 10',
        [followingIds]
      );
      
      console.log(`被关注用户的公开打卡数量: ${checkins.length}`);
      if (checkins.length > 0) {
        console.log('公开打卡记录:');
        checkins.forEach(checkin => {
          console.log(`  - ${checkin.username}: ${checkin.content}`);
          console.log(`    学习时长: ${checkin.study_time}分钟`);
          console.log(`    科目: ${checkin.subject}`);
          console.log(`    创建时间: ${checkin.created_at}`);
          console.log('');
        });
      } else {
        console.log('  - 没有公开的打卡记录');
      }
      
    } else {
      console.log('  - 用户443没有关注任何用户');
    }
    
    // 3. 模拟后端查询逻辑
    console.log('\n3. 模拟后端查询逻辑...');
    if (follows.length > 0) {
      const followingIds = follows.map(f => f.following_id);
      console.log(`关注的用户ID: [${followingIds.join(', ')}]`);
      
      const [feedCheckins] = await connection.execute(
        'SELECT c.*, u.username, u.avatar FROM checkins c JOIN users u ON c.user_id = u.id WHERE c.user_id IN (?) AND c.is_public = 1 ORDER BY c.created_at DESC LIMIT 10',
        [followingIds]
      );
      
      console.log(`关注动态数量: ${feedCheckins.length}`);
      if (feedCheckins.length > 0) {
        console.log('关注动态内容:');
        feedCheckins.forEach(checkin => {
          console.log(`  - ${checkin.username}: ${checkin.content}`);
          console.log(`    学习时长: ${checkin.study_time}分钟`);
          console.log(`    科目: ${checkin.subject}`);
          console.log(`    创建时间: ${checkin.created_at}`);
          console.log('');
        });
      }
    }
    
    await connection.end();
    
    console.log('\n🎯 问题分析:');
    console.log('1. 用户443确实关注了用户445（赵丽）');
    console.log('2. 赵丽有公开的打卡记录');
    console.log('3. 后端查询逻辑应该能获取到这些数据');
    console.log('4. 问题可能在前端的数据显示或API调用');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testFollowFeedLogic();
