const mysql = require('mysql2/promise');

async function checkFollowData() {
  console.log('🔍 检查数据库中的关注关系...\n');
  
  try {
    // 连接数据库
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123456',
      database: 'smart_study_checkin'
    });
    
    console.log('✅ 数据库连接成功');
    
    // 1. 检查用户表
    console.log('\n1. 检查用户表...');
    const [users] = await connection.execute('SELECT id, username FROM users LIMIT 10');
    console.log(`用户数量: ${users.length}`);
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, 用户名: ${user.username}`);
    });
    
    // 2. 检查关注关系表
    console.log('\n2. 检查关注关系表...');
    const [follows] = await connection.execute('SELECT * FROM user_follows LIMIT 10');
    console.log(`关注关系数量: ${follows.length}`);
    
    if (follows.length > 0) {
      console.log('关注关系详情:');
      for (const follow of follows) {
        const [follower] = await connection.execute('SELECT username FROM users WHERE id = ?', [follow.follower_id]);
        const [following] = await connection.execute('SELECT username FROM users WHERE id = ?', [follow.following_id]);
        console.log(`  - ${follower[0]?.username} 关注了 ${following[0]?.username}`);
      }
    } else {
      console.log('  - 没有关注关系数据');
    }
    
    // 3. 检查打卡记录
    console.log('\n3. 检查打卡记录...');
    const [checkins] = await connection.execute('SELECT id, user_id, content, is_public FROM checkins LIMIT 10');
    console.log(`打卡记录数量: ${checkins.length}`);
    
    if (checkins.length > 0) {
      console.log('打卡记录详情:');
      for (const checkin of checkins) {
        const [user] = await connection.execute('SELECT username FROM users WHERE id = ?', [checkin.user_id]);
        console.log(`  - ${user[0]?.username}: ${checkin.content} (${checkin.is_public ? '公开' : '私密'})`);
      }
    }
    
    // 4. 检查用户443的关注关系
    console.log('\n4. 检查用户443的关注关系...');
    const [user443Follows] = await connection.execute(
      'SELECT uf.*, u.username as following_username FROM user_follows uf JOIN users u ON uf.following_id = u.id WHERE uf.follower_id = 443'
    );
    console.log(`用户443关注的用户数量: ${user443Follows.length}`);
    
    if (user443Follows.length > 0) {
      console.log('用户443关注的用户:');
      user443Follows.forEach(follow => {
        console.log(`  - 关注了: ${follow.following_username} (ID: ${follow.following_id})`);
      });
    } else {
      console.log('  - 用户443没有关注任何用户');
    }
    
    // 5. 检查被关注用户的公开打卡
    if (user443Follows.length > 0) {
      console.log('\n5. 检查被关注用户的公开打卡...');
      const followingIds = user443Follows.map(f => f.following_id);
      const [followingCheckins] = await connection.execute(
        'SELECT c.*, u.username FROM checkins c JOIN users u ON c.user_id = u.id WHERE c.user_id IN (?) AND c.is_public = 1 ORDER BY c.created_at DESC LIMIT 10',
        [followingIds]
      );
      
      console.log(`被关注用户的公开打卡数量: ${followingCheckins.length}`);
      if (followingCheckins.length > 0) {
        followingCheckins.forEach(checkin => {
          console.log(`  - ${checkin.username}: ${checkin.content}`);
        });
      }
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkFollowData();
