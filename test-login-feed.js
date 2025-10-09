const mysql = require('mysql2/promise');

async function testLoginAndFeed() {
  console.log('🔍 测试登录和关注动态...\n');
  
  try {
    // 连接数据库
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123456',
      database: 'smart_study_checkin'
    });
    
    console.log('✅ 数据库连接成功');
    
    // 1. 检查陈静用户是否存在
    console.log('\n1. 检查陈静用户...');
    const [chenjing] = await connection.execute('SELECT * FROM users WHERE username = ?', ['陈静']);
    
    if (chenjing.length > 0) {
      console.log('✅ 找到陈静用户');
      console.log(`  - ID: ${chenjing[0].id}`);
      console.log(`  - 用户名: ${chenjing[0].username}`);
      console.log(`  - 邮箱: ${chenjing[0].email}`);
      
      // 2. 测试密码验证
      console.log('\n2. 测试密码验证...');
      const bcrypt = require('bcrypt');
      const isPasswordValid = await bcrypt.compare('123456', chenjing[0].password);
      console.log(`密码验证结果: ${isPasswordValid ? '正确' : '错误'}`);
      
      if (isPasswordValid) {
        // 3. 检查关注关系
        console.log('\n3. 检查关注关系...');
        const [follows] = await connection.execute(
          'SELECT uf.following_id, u.username FROM user_follows uf JOIN users u ON uf.following_id = u.id WHERE uf.follower_id = ?',
          [chenjing[0].id]
        );
        
        console.log(`陈静关注的用户数量: ${follows.length}`);
        if (follows.length > 0) {
          follows.forEach(follow => {
            console.log(`  - 关注了: ${follow.username} (ID: ${follow.following_id})`);
          });
          
          // 4. 检查被关注用户的公开打卡
          console.log('\n4. 检查被关注用户的公开打卡...');
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
          }
        }
      }
      
    } else {
      console.log('❌ 没有找到陈静用户');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testLoginAndFeed();
