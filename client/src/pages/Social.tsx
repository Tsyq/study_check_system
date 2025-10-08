import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Avatar,
  Button,
  Input,
  Typography,
  Row,
  Col,
  Tag,
  Space,
  Tabs,
  message,
  Divider,
  Empty
} from 'antd';
import {
  SearchOutlined,
  UserAddOutlined,
  HeartOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  BookOutlined,
  FireOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const { Title, Text } = Typography;
const { Search } = Input;
const { TabPane } = Tabs;

interface Checkin {
  _id: string;
  content: string;
  studyTime: number;
  subject: string;
  mood: string;
  createdAt: string;
  user: {
    _id: string;
    username: string;
    avatar: string;
  };
  likes: Array<{
    user: {
      _id: string;
      username: string;
    };
  }>;
  comments: Array<{
    _id: string;
    content: string;
    user: {
      _id: string;
      username: string;
    };
    createdAt: string;
  }>;
}

interface UserBrief {
  _id: string;
}

const Social: React.FC = () => {
  const { user, updateUser } = useAuth() as any;
  const [activeTab, setActiveTab] = useState('feed');
  const [feedCheckins, setFeedCheckins] = useState<Checkin[]>([]);
  const [allCheckins, setAllCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [myFollowing, setMyFollowing] = useState<any[]>([]);
  const [myFollowers, setMyFollowers] = useState<any[]>([]);
  const [receivedItems, setReceivedItems] = useState<any[]>([]);
  const [discoverUsers, setDiscoverUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user?.id === 'demo-user') {
      // 演示模式，使用模拟数据
      const demoCheckins: Checkin[] = [
        {
          _id: '1',
          content: '今天学习了React Hooks，感觉对状态管理有了更深的理解！',
          studyTime: 120,
          subject: '编程',
          mood: 'happy',
          createdAt: new Date().toISOString(),
          user: { _id: 'demo-user', username: '演示用户', avatar: '' },
          likes: [{ user: { _id: 'user1', username: '小明' } }],
          comments: [{ _id: '1', content: '加油！', user: { _id: 'user1', username: '小明' }, createdAt: new Date().toISOString() }]
        },
        {
          _id: '2',
          content: '完成了数学作业，解出了几道难题，很有成就感！',
          studyTime: 90,
          subject: '数学',
          mood: 'excited',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          user: { _id: 'demo-user', username: '演示用户', avatar: '' },
          likes: [],
          comments: []
        },
        {
          _id: '3',
          content: '英语阅读练习，今天读了一篇关于AI的文章，学到了很多新词汇！',
          studyTime: 60,
          subject: '英语',
          mood: 'normal',
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          user: { _id: 'user2', username: '小红', avatar: '' },
          likes: [{ user: { _id: 'demo-user', username: '演示用户' } }],
          comments: []
        }
      ];

      // 模拟关注和粉丝数据
      const demoFollowing = [
        {
          _id: 'user1',
          username: '小明',
          avatar: '',
          bio: '热爱编程的学习者',
          totalStudyTime: 1200,
          streak: 15
        },
        {
          _id: 'user2',
          username: '小红',
          avatar: '',
          bio: '英语学习达人',
          totalStudyTime: 800,
          streak: 8
        }
      ];

      const demoFollowers = [
        {
          _id: 'user3',
          username: '小李',
          avatar: '',
          bio: '数学爱好者',
          totalStudyTime: 1500,
          streak: 20
        },
        {
          _id: 'user4',
          username: '小王',
          avatar: '',
          bio: '前端开发者',
          totalStudyTime: 2000,
          streak: 25
        }
      ];

      setFeedCheckins(demoCheckins);
      setAllCheckins(demoCheckins);
      setMyFollowing(demoFollowing);
      setMyFollowers(demoFollowers);
      setFollowingIds(new Set(demoFollowing.map(u => u._id)));
      setLoading(false);
    } else {
      // 同步关注ID集合和粉丝数据
      fetchFollowingIds();
      fetchFollowers();
      if (activeTab === 'feed') {
        fetchFeed();
      } else if (activeTab === 'discover') {
        fetchAllCheckins();
      } else if (activeTab === 'me') {
        fetchReceived();
      }
    }
  }, [activeTab, user]);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const response = await api.get('/social/feed');
      setFeedCheckins(response.data.checkins);
    } catch (error) {
      message.error('获取学习圈动态失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCheckins = async () => {
    setLoading(true);
    try {
      const url = selectedUserId ? `/checkins?limit=20&userId=${selectedUserId}` : '/checkins?limit=20';
      const response = await api.get(url);
      setAllCheckins(response.data.checkins);
    } catch (error) {
      message.error('获取打卡动态失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowingIds = async () => {
    if (!user?.id) {
      console.log('用户未登录，跳过获取关注列表');
      return;
    }
    setLoading(true);
    try {
      console.log('开始获取关注列表，用户ID:', user.id);
      const response = await api.get(`/social/following/${user.id}?limit=200&_t=${Date.now()}`);
      console.log('关注列表API响应:', response.data);
      const raw = (response.data.following || []) as any[];
      const list = raw.map((u: any) => ({
        _id: u._id ?? u.id,
        username: u.username,
        avatar: u.avatar,
        bio: u.bio,
        totalStudyTime: u.totalStudyTime ?? u.total_study_time,
        streak: u.streak
      }));
      setFollowingIds(new Set(list.map(u => u._id)));
      setMyFollowing(list);
    } catch (error) {
      console.error('获取关注用户失败:', error);
      message.error('获取关注用户失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowers = async () => {
    if (!user?.id) {
      console.log('用户未登录，跳过获取粉丝列表');
      return;
    }
    try {
      console.log('开始获取粉丝列表，用户ID:', user.id);
      const response = await api.get(`/social/followers/${user.id}?limit=200&_t=${Date.now()}`);
      console.log('粉丝列表API响应:', response.data);
      setMyFollowers(response.data.followers || []);
    } catch (e) {
      console.error('获取粉丝失败:', e);
      message.error('获取粉丝失败');
    }
  };

  const fetchReceived = async () => {
    try {
      const response = await api.get(`/social/me/received?limit=50`);
      setReceivedItems(response.data.items || []);
    } catch (e) {
      message.error('获取收到的互动失败');
    }
  };

  const fetchMine = async () => {
    await Promise.all([fetchFollowingIds(), fetchFollowers(), fetchReceived()]);
  };

  const refreshUserInfo = async () => {
    try {
      const response = await api.get('/auth/me');
      updateUser(response.data.user);
    } catch (error) {
      console.error('刷新用户信息失败:', error);
    }
  };

  const handleSearch = async (value: string) => {
    setSearchQuery(value);
    if (!value.trim()) {
      setDiscoverUsers([]);
      return;
    }
    try {
      const res = await api.get(`/social/search/users?q=${encodeURIComponent(value)}&limit=20`);
      setDiscoverUsers(res.data.users || []);
    } catch (e) {
      message.error('搜索用户失败');
    }
  };

  const handleClickUsername = async (uid?: string) => {
    if (!uid) return;
    setSelectedUserId(uid);
    await fetchAllCheckins();
  };

  const handleFollow = async (userId: string) => {
    try {
      await api.post(`/social/follow/${userId}`);
      message.success('关注成功');
      await Promise.all([
        fetchFollowingIds(),
        refreshUserInfo() // 刷新用户信息以更新关注数量
      ]);
      if (activeTab === 'feed') fetchFeed();
      if (activeTab === 'discover') fetchAllCheckins();
    } catch (error: any) {
      message.error(error.response?.data?.message || '关注失败');
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      await api.delete(`/social/follow/${userId}`);
      message.success('已取消关注');
      await Promise.all([
        fetchFollowingIds(),
        refreshUserInfo() // 刷新用户信息以更新关注数量
      ]);
      if (activeTab === 'feed') fetchFeed();
      if (activeTab === 'discover') fetchAllCheckins();
    } catch (error: any) {
      message.error(error.response?.data?.message || '取关失败');
    }
  };

  const handleLike = async (checkinId: string) => {
    try {
      await api.post(`/checkins/${checkinId}/like`);
      if (activeTab === 'feed') {
        fetchFeed();
      } else {
        fetchAllCheckins();
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleAddComment = async (checkinId: string) => {
    const text = (commentText[checkinId] || '').trim();
    if (!text) return message.warning('请输入评论内容');
    try {
      await api.post(`/checkins/${checkinId}/comments`, { content: text });
      setCommentText(prev => ({ ...prev, [checkinId]: '' }));
      if (activeTab === 'feed') {
        fetchFeed();
      } else {
        fetchAllCheckins();
      }
    } catch (e) {
      message.error('评论失败');
    }
  };

  const toggleComments = (checkinId: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(checkinId)) next.delete(checkinId); else next.add(checkinId);
      return next;
    });
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`;
  };

  const getMoodColor = (mood: string) => {
    const colors: { [key: string]: string } = {
      excited: 'red',
      happy: 'green',
      normal: 'blue',
      tired: 'orange',
      frustrated: 'purple'
    };
    return colors[mood] || 'default';
  };

  const getMoodText = (mood: string) => {
    const texts: { [key: string]: string } = {
      excited: '兴奋',
      happy: '开心',
      normal: '正常',
      tired: '疲惫',
      frustrated: '沮丧'
    };
    return texts[mood] || '正常';
  };

  const isLiked = (checkin: Checkin) => {
    return checkin.likes.some(like => like.user._id === user?.id);
  };

  const renderCheckinItem = (item: Checkin) => (
    <List.Item>
      <Card size="small" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar src={item.user?.avatar || undefined}>{item.user?.username?.[0] || 'U'}</Avatar>
            <div style={{ marginLeft: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Button type="link" size="small" onClick={() => handleClickUsername(item.user?._id)} style={{ paddingLeft: 0 }}>
                  <Text strong>{item.user?.username || '未知用户'}</Text>
                </Button>
                {item.user?._id && item.user._id !== user?.id && (
                  followingIds.has(item.user._id) ? (
                    <Button 
                      type="primary" 
                      size="small" 
                      onClick={() => handleUnfollow(item.user!._id)}
                      style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                    >
                      已关注
                    </Button>
                  ) : (
                    <Button type="primary" size="small" onClick={() => handleFollow(item.user!._id)}>关注</Button>
                  )
                )}
              </div>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </div>
          </div>
          <Tag color={getMoodColor(item.mood)}>
            {getMoodText(item.mood)}
          </Tag>
        </div>

        <Text style={{ display: 'block', marginBottom: 12 }}>
          {item.content}
        </Text>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Space>
            <Tag icon={<BookOutlined />}>{item.subject}</Tag>
            <Tag icon={<ClockCircleOutlined />}>{formatTime(item.studyTime)}</Tag>
          </Space>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button
              type="text"
              icon={<HeartOutlined />}
              onClick={() => handleLike(item._id)}
              style={{ color: isLiked(item) ? '#1890ff' : undefined }}
            >
              {item.likes.length}
            </Button>
            <Button
              type="text"
              icon={<MessageOutlined />}
              onClick={() => toggleComments(item._id)}
              style={{ color: expandedComments.has(item._id) ? '#1890ff' : undefined }}
            >
              {item.comments.length}
            </Button>
          </Space>
          <Space>
            <Input
              placeholder="写下你的评论..."
              size="small"
              style={{ width: 240 }}
              value={commentText[item._id] || ''}
              onChange={(e) => setCommentText(prev => ({ ...prev, [item._id]: e.target.value }))}
            />
            <Button type="primary" size="small" onClick={() => handleAddComment(item._id)}>评论</Button>
          </Space>
        </div>

        {item.comments && item.comments.length > 0 && expandedComments.has(item._id) && (
          <div style={{ marginTop: 8 }}>
            <List
              size="small"
              header={<Text type="secondary">评论</Text>}
              dataSource={item.comments}
              renderItem={(cm: any) => (
                <List.Item>
                  <Space>
                    <Avatar size="small">{cm.user?.username?.[0] || 'U'}</Avatar>
                    <Text strong>{cm.user?.username || '用户'}</Text>
                    <Text>{cm.content}</Text>
                    {cm.createdAt && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(cm.createdAt).toLocaleString()}
                      </Text>
                    )}
                  </Space>
                </List.Item>
              )}
            />
          </div>
        )}
      </Card>
    </List.Item>
  );

  // 用户列表与关注用户列表已移除

  return (
    <div>
      <Title level={2}>学习圈</Title>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="关注动态" key="feed">
          <Card>
            <List
              dataSource={feedCheckins}
              loading={loading}
              renderItem={renderCheckinItem}
              locale={{ emptyText: <Empty description="还没有关注任何人，去发现更多学习伙伴吧！" /> }}
            />
          </Card>
        </TabPane>

        <TabPane tab="发现" key="discover">
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Search
                placeholder="搜索用户..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={handleSearch}
                onChange={(e) => setSearchQuery(e.target.value)}
                value={searchQuery}
              />
            </div>
            {discoverUsers.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <List
                  dataSource={discoverUsers}
                  renderItem={(u: any) => (
                    <List.Item>
                      <Space>
                        <Avatar src={u.avatar || undefined}>{u.username?.[0] || 'U'}</Avatar>
                        <Button type="link" onClick={() => handleClickUsername(u._id)}>{u.username}</Button>
                        {String(u._id) !== String(user?.id) && (
                          followingIds.has(u._id) ? (
                            <Button 
                              type="primary" 
                              size="small" 
                              onClick={() => handleUnfollow(u._id)}
                              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                            >
                              已关注
                            </Button>
                          ) : (
                            <Button type="primary" size="small" onClick={() => handleFollow(u._id)}>关注</Button>
                          )
                        )}
                      </Space>
                    </List.Item>
                  )}
                />
                <Divider />
              </div>
            )}
            <List
              dataSource={allCheckins}
              loading={loading}
              renderItem={renderCheckinItem}
            />
          </Card>
        </TabPane>

        <TabPane tab="我的" key="me">
          <Card>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Card size="small" title="正在关注">
                  <List
                    dataSource={myFollowing}
                    renderItem={(u: any) => (
                      <List.Item>
                        <Space>
                          <Avatar src={u.avatar || undefined}>{u.username?.[0] || 'U'}</Avatar>
                          <Button type="link" onClick={() => handleClickUsername(u._id)}>{u.username}</Button>
                          <Button size="small" onClick={() => handleUnfollow(u._id)}>取关</Button>
                        </Space>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" title="关注者">
                  <List
                    dataSource={myFollowers}
                    renderItem={(u: any) => (
                      <List.Item>
                        <Space>
                          <Avatar src={u.avatar || undefined}>{u.username?.[0] || 'U'}</Avatar>
                          <Button type="link" onClick={() => handleClickUsername(u._id)}>{u.username}</Button>
                        </Space>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>

            <Divider />

            <Card size="small" title="消息">
              <Tabs defaultActiveKey="likes">
                <TabPane tab={`收到的赞`} key="likes">
                  <List
                    dataSource={receivedItems.filter((it: any) => it.type === 'like')}
                    locale={{ emptyText: <Empty description="暂无点赞消息" /> }}
                    renderItem={(it: any) => (
                      <List.Item>
                        <Space>
                          <Avatar>{it.fromUser?.username?.[0] || 'U'}</Avatar>
                          <Text>{it.fromUser?.username || '用户'} 点赞了你的打卡</Text>
                          <Text type="secondary">{new Date(it.createdAt).toLocaleString()}</Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                </TabPane>
                <TabPane tab={`回复我的`} key="comments">
                  <List
                    dataSource={receivedItems.filter((it: any) => it.type === 'comment')}
                    locale={{ emptyText: <Empty description="暂无回复" /> }}
                    renderItem={(it: any) => (
                      <List.Item>
                        <Space>
                          <Avatar>{it.fromUser?.username?.[0] || 'U'}</Avatar>
                          <Text>{it.fromUser?.username || '用户'} 评论：{it.content || ''}</Text>
                          <Text type="secondary">{new Date(it.createdAt).toLocaleString()}</Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                </TabPane>
              </Tabs>
            </Card>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Social;
