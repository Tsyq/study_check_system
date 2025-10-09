async function debugFollowRelationship() {
  console.log('🔍 调试关注关系问题...\n');
  
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
        } else {
          console.log('  - 没有关注任何用户');
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
          });
        } else {
          console.log('  - 没有关注动态');
        }
      } else {
        console.log('❌ 关注动态获取失败');
      }
      
      // 4. 测试获取所有打卡记录
      console.log('\n4. 测试获取所有打卡记录...');
      const allCheckinsResponse = await fetch('http://localhost:5000/api/checkins?limit=5', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (allCheckinsResponse.status === 200) {
        const allCheckinsData = await allCheckinsResponse.json();
        console.log('✅ 所有打卡记录获取成功');
        console.log(`  - 打卡记录数量: ${allCheckinsData.checkins.length}`);
        
        if (allCheckinsData.checkins.length > 0) {
          console.log('  - 最近的打卡记录:');
          allCheckinsData.checkins.forEach(checkin => {
            console.log(`    - ${checkin.user.username}: ${checkin.content} (${checkin.isPublic ? '公开' : '私密'})`);
          });
        }
      } else {
        console.log('❌ 所有打卡记录获取失败');
      }
      
    } else {
      console.log('❌ 登录失败');
    }
    
    console.log('\n🎯 问题分析:');
    console.log('1. 检查用户是否真的关注了其他用户');
    console.log('2. 检查被关注用户是否有公开的打卡记录');
    console.log('3. 检查后端 /feed 接口的查询逻辑');
    console.log('4. 检查数据库中的关注关系');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

debugFollowRelationship();
