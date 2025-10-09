async function testFeedAPI() {
  console.log('🔍 测试关注动态API...\n');
  
  try {
    // 1. 测试登录
    console.log('1. 测试登录...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '陈静', password: '123456' })
    });
    
    if (loginResponse.status === 200) {
      const loginData = await loginResponse.json();
      console.log('✅ 登录成功');
      console.log(`  - 用户ID: ${loginData.user.id}`);
      console.log(`  - 用户名: ${loginData.user.username}`);
      
      const token = loginData.token;
      
      // 2. 测试获取关注列表
      console.log('\n2. 测试获取关注列表...');
      const followingResponse = await fetch('http://localhost:5000/api/social/following', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (followingResponse.status === 200) {
        const followingData = await followingResponse.json();
        console.log('✅ 关注列表获取成功');
        console.log(`  - 关注用户数量: ${followingData.users.length}`);
        
        if (followingData.users.length > 0) {
          console.log('  - 关注的用户:');
          followingData.users.forEach(user => {
            console.log(`    - ${user.username} (ID: ${user.id})`);
          });
        }
      } else {
        console.log('❌ 关注列表获取失败');
      }
      
      // 3. 测试获取关注动态
      console.log('\n3. 测试获取关注动态...');
      const feedResponse = await fetch('http://localhost:5000/api/social/feed', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (feedResponse.status === 200) {
        const feedData = await feedResponse.json();
        console.log('✅ 关注动态获取成功');
        console.log(`  - 动态数量: ${feedData.checkins.length}`);
        
        if (feedData.checkins.length > 0) {
          console.log('  - 动态内容:');
          feedData.checkins.forEach(checkin => {
            console.log(`    - ${checkin.user.username}: ${checkin.content}`);
            console.log(`      学习时长: ${checkin.studyTime}分钟`);
            console.log(`      科目: ${checkin.subject}`);
            console.log(`      创建时间: ${checkin.createdAt}`);
            console.log('');
          });
        } else {
          console.log('  - 没有关注动态');
        }
      } else {
        const errorData = await feedResponse.text();
        console.log('❌ 关注动态获取失败');
        console.log(`  - 状态码: ${feedResponse.status}`);
        console.log(`  - 错误: ${errorData}`);
      }
      
    } else {
      console.log('❌ 登录失败');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testFeedAPI();
