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
  Empty,
  Modal,
  Spin
} from 'antd';
import {
  SearchOutlined,
  UserAddOutlined,
  HeartOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  BookOutlined,
  FireOutlined,
  TrophyOutlined,
  UserOutlined,
  CalendarOutlined,
  TeamOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { getAvatarUrl } from '../utils/avatar';

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
      avatar?: string;
    };
    createdAt: string;
  }>;
}

interface UserBrief {
  _id: string;
}

const Social: React.FC = () => {
  const { user, updateUser } = useAuth() as any;
  const location = useLocation() as { state?: { activeTab?: string; openMessages?: boolean } };
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'my-dynamics');
  const [messageTabKey, setMessageTabKey] = useState('likes');
  const [feedCheckins, setFeedCheckins] = useState<Checkin[]>([]);
  const [allCheckins, setAllCheckins] = useState<Checkin[]>([]);
  const [myCheckins, setMyCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [myFollowing, setMyFollowing] = useState<any[]>([]);
  const [myFollowers, setMyFollowers] = useState<any[]>([]);
  const [receivedItems, setReceivedItems] = useState<any[]>([]);
  const [checkinDetails, setCheckinDetails] = useState<Record<string, any>>({});
  const [discoverUsers, setDiscoverUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [followingSearchQuery, setFollowingSearchQuery] = useState('');
  const [followersSearchQuery, setFollowersSearchQuery] = useState('');
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userCheckins, setUserCheckins] = useState<Checkin[]>([]);
  const [userModalLoading, setUserModalLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      // 同步关注ID集合和粉丝数据
      fetchFollowingIds();
      fetchFollowers();
      if (activeTab === 'my-dynamics') {
        fetchMyCheckins();
      } else if (activeTab === 'feed') {
        fetchFeed();
      } else if (activeTab === 'discover') {
        fetchAllCheckins();
      } else if (activeTab === 'me') {
        fetchReceived();
      }
    }
  }, [activeTab, user]);

  // 监听location.state的变化，用于从通知跳转
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
    if (location.state?.openMessages) {
      setMessageTabKey('likes');
    }
  }, [location.state]);

  // 获取消息中动态的详情
  useEffect(() => {
    if (receivedItems.length > 0) {
      receivedItems.forEach(item => {
        if (item.checkinId && !checkinDetails[item.checkinId]) {
          fetchCheckinDetails(item.checkinId);
        }
      });
    }
  }, [receivedItems]);

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

  const fetchMyCheckins = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/checkins?userId=${user?.id}&limit=50`);
      setMyCheckins(response.data.checkins || []);
    } catch (error) {
      console.error('获取我的动态失败:', error);
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
      console.log('收到的消息数据:', response.data);
      setReceivedItems(response.data.items || []);
    } catch (e) {
      console.error('获取收到的互动失败:', e);
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
    setUserModalLoading(true);
    setUserModalVisible(true);
    
    try {
      // 获取用户信息
      const userResponse = await api.get(`/social/users/${uid}`);
      setSelectedUser(userResponse.data.user);
      
      // 获取用户动态
      const checkinsResponse = await api.get(`/checkins?userId=${uid}&limit=20`);
      setUserCheckins(checkinsResponse.data.checkins);
    } catch (error) {
      message.error('获取用户信息失败');
      setUserModalVisible(false);
    } finally {
      setUserModalLoading(false);
    }
  };

  const handleCloseUserModal = () => {
    setUserModalVisible(false);
    setSelectedUser(null);
    setUserCheckins([]);
  };

  const fetchCheckinDetails = async (checkinId: string) => {
    if (checkinDetails[checkinId]) return checkinDetails[checkinId];
    
    console.log('正在获取动态详情:', checkinId);
    try {
      const response = await api.get(`/checkins/${checkinId}`);
      console.log('动态详情响应:', response.data);
      const checkin = response.data.checkin;
      const detail = {
        content: checkin.content,
        subject: checkin.subject,
        studyTime: checkin.studyTime
      };
      console.log('处理后的动态详情:', detail);
      setCheckinDetails(prev => ({ ...prev, [checkinId]: detail }));
      return detail;
    } catch (error) {
      console.error('获取动态详情失败:', error);
      const fallbackDetail = { content: '动态内容获取失败', subject: '', studyTime: 0 };
      setCheckinDetails(prev => ({ ...prev, [checkinId]: fallbackDetail }));
      return fallbackDetail;
    }
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
      } else if (activeTab === 'my-dynamics') {
        fetchMyCheckins();
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
      } else if (activeTab === 'my-dynamics') {
        fetchMyCheckins();
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

  // 过滤正在关注的用户
  const filteredFollowing = myFollowing.filter((user: any) =>
    user.username.toLowerCase().includes(followingSearchQuery.toLowerCase())
  );

  // 过滤关注者
  const filteredFollowers = myFollowers.filter((user: any) =>
    user.username.toLowerCase().includes(followersSearchQuery.toLowerCase())
  );

  const isLiked = (checkin: Checkin) => {
    return checkin.likes.some(like => like.user._id === user?.id);
  };

  const renderMessageItem = (it: any) => {
    console.log('渲染消息项:', it, 'checkinDetails:', checkinDetails);
    const detail = checkinDetails[it.checkinId];
    const content = detail?.content || '动态内容加载中...';
    const subject = detail?.subject || '';
    const studyTime = detail?.studyTime || 0;
    
    return (
      <List.Item>
        <div style={{ width: '100%' }}>
          <Space style={{ marginBottom: 8 }}>
            <Avatar src={getAvatarUrl(it.fromUser?.avatar)} icon={<UserOutlined />}>{it.fromUser?.username?.[0] || 'U'}</Avatar>
            <Text strong>{it.fromUser?.username || '用户'}</Text>
            <Text type="secondary">
              {it.type === 'like' ? '点赞了你的打卡' : '评论了你的打卡'}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {new Date(it.createdAt).toLocaleString()}
            </Text>
          </Space>
          
          <div style={{ 
            background: '#f5f5f5', 
            padding: 12, 
            borderRadius: 8, 
            marginLeft: 40,
            border: '1px solid #e8e8e8'
          }}>
            <div style={{ marginBottom: 8 }}>
              <Text strong style={{ color: '#1890ff' }}>{subject}</Text>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                <ClockCircleOutlined /> {studyTime}分钟
              </Text>
            </div>
            <Text>{content}</Text>
            {it.type === 'comment' && it.content && (
              <div style={{ 
                marginTop: 8, 
                padding: 8, 
                background: '#fff', 
                borderRadius: 4,
                border: '1px solid #d9d9d9'
              }}>
                <Text type="secondary">评论：</Text>
                <Text>{it.content}</Text>
              </div>
            )}
          </div>
        </div>
      </List.Item>
    );
  };

  const renderCheckinItem = (item: Checkin) => (
    <List.Item>
      <Card size="small" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar src={getAvatarUrl(item.user?.avatar)}>{item.user?.username?.[0] || 'U'}</Avatar>
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
                    <Avatar size="small" src={getAvatarUrl(cm.user?.avatar)} icon={<UserOutlined />}>{cm.user?.username?.[0] || 'U'}</Avatar>
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
    <div style={{ padding: '0 24px' }}>
      <Title level={2}>学习圈</Title>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        size="large"
        style={{ 
          backgroundColor: '#fff',
          borderRadius: 8,
          padding: '0 16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <TabPane 
          tab={
            <span>
              <FileTextOutlined style={{ marginRight: 4 }} />
              我的动态
            </span>
          } 
          key="my-dynamics"
        >
          <div style={{ padding: '16px 0' }}>
            <List
              dataSource={myCheckins}
              loading={loading}
              renderItem={renderCheckinItem}
              locale={{ 
                emptyText: (
                  <Empty 
                    description="还没有发布任何动态，去打卡分享你的学习成果吧！"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    <Button type="primary" onClick={() => window.location.href = '/checkin'}>
                      去打卡
                    </Button>
                  </Empty>
                )
              }}
            />
          </div>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <HeartOutlined style={{ marginRight: 4 }} />
              关注动态
            </span>
          } 
          key="feed"
        >
          <div style={{ padding: '16px 0' }}>
            <List
              dataSource={feedCheckins}
              loading={loading}
              renderItem={renderCheckinItem}
              locale={{ 
                emptyText: (
                  <Empty 
                    description="还没有关注任何人，去发现更多学习伙伴吧！"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    <Button type="primary" onClick={() => setActiveTab('discover')}>
                      去发现
                    </Button>
                  </Empty>
                )
              }}
            />
          </div>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <SearchOutlined style={{ marginRight: 4 }} />
              发现
            </span>
          } 
          key="discover"
        >
          <div style={{ padding: '16px 0' }}>
            <div style={{ 
              marginBottom: 20, 
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: 8,
              border: '1px solid #e9ecef'
            }}>
              <Search
                placeholder="搜索用户..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={handleSearch}
                onChange={(e) => setSearchQuery(e.target.value)}
                value={searchQuery}
                style={{ maxWidth: 400 }}
              />
            </div>
            {discoverUsers.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <Text strong style={{ fontSize: 16, marginBottom: 12, display: 'block' }}>
                  搜索结果
                </Text>
                <Card size="small" style={{ marginBottom: 16 }}>
                  <List
                    dataSource={discoverUsers}
                    renderItem={(u: any) => (
                      <List.Item style={{ padding: '12px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <Space>
                            <Avatar src={getAvatarUrl(u.avatar)} size="large">{u.username?.[0] || 'U'}</Avatar>
                            <div>
                              <Button type="link" onClick={() => handleClickUsername(u._id)} style={{ padding: 0, height: 'auto' }}>
                                <Text strong style={{ fontSize: 16 }}>{u.username}</Text>
                              </Button>
                              {u.bio && (
                                <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                                  {u.bio}
                                </div>
                              )}
                            </div>
                          </Space>
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
                        </div>
                      </List.Item>
                    )}
                  />
                </Card>
                <Divider />
              </div>
            )}
            <List
              dataSource={allCheckins}
              loading={loading}
              renderItem={renderCheckinItem}
            />
          </div>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <UserOutlined style={{ marginRight: 4 }} />
              我的
            </span>
          } 
          key="me"
        >
          <div style={{ padding: '16px 0' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card 
                  size="small" 
                  title={
                    <span style={{ color: '#1890ff' }}>
                      <UserAddOutlined style={{ marginRight: 4 }} />
                      正在关注 ({filteredFollowing.length})
                    </span>
                  }
                  style={{ height: '100%' }}
                >
                  <div style={{ marginBottom: 12 }}>
                    <Input
                      placeholder="搜索正在关注的用户..."
                      prefix={<SearchOutlined />}
                      value={followingSearchQuery}
                      onChange={(e) => setFollowingSearchQuery(e.target.value)}
                      allowClear
                    />
                  </div>
                  <List
                    dataSource={filteredFollowing}
                    renderItem={(u: any) => (
                      <List.Item>
                        <Space>
                          <Avatar src={getAvatarUrl(u.avatar)}>{u.username?.[0] || 'U'}</Avatar>
                          <Button type="link" onClick={() => handleClickUsername(u._id)}>{u.username}</Button>
                          <Button size="small" onClick={() => handleUnfollow(u._id)}>取关</Button>
                        </Space>
                      </List.Item>
                    )}
                    locale={{ emptyText: followingSearchQuery ? '没有找到匹配的用户' : '暂无关注的用户' }}
                  />
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card 
                  size="small" 
                  title={
                    <span style={{ color: '#52c41a' }}>
                      <TrophyOutlined style={{ marginRight: 4 }} />
                      关注者 ({filteredFollowers.length})
                    </span>
                  }
                  style={{ height: '100%' }}
                >
                  <div style={{ marginBottom: 12 }}>
                    <Input
                      placeholder="搜索关注者..."
                      prefix={<SearchOutlined />}
                      value={followersSearchQuery}
                      onChange={(e) => setFollowersSearchQuery(e.target.value)}
                      allowClear
                    />
                  </div>
                  <List
                    dataSource={filteredFollowers}
                    renderItem={(u: any) => (
                      <List.Item>
                        <Space>
                          <Avatar src={getAvatarUrl(u.avatar)}>{u.username?.[0] || 'U'}</Avatar>
                          <Button type="link" onClick={() => handleClickUsername(u._id)}>{u.username}</Button>
                        </Space>
                      </List.Item>
                    )}
                    locale={{ emptyText: followersSearchQuery ? '没有找到匹配的用户' : '暂无关注者' }}
                  />
                </Card>
              </Col>
            </Row>

            <Divider style={{ margin: '24px 0' }} />

            <Card 
              size="small" 
              title={
                <span style={{ color: '#722ed1' }}>
                  <MessageOutlined style={{ marginRight: 4 }} />
                  消息通知
                </span>
              }
              style={{ marginTop: 16 }}
            >
              <Tabs activeKey={messageTabKey} onChange={setMessageTabKey} size="small">
                <TabPane 
                  tab={
                    <span>
                      <HeartOutlined style={{ marginRight: 4 }} />
                      收到的赞
                    </span>
                  } 
                  key="likes"
                >
                  <List
                    dataSource={receivedItems.filter((it: any) => it.type === 'like')}
                    locale={{ emptyText: <Empty description="暂无点赞消息" /> }}
                    renderItem={renderMessageItem}
                  />
                </TabPane>
                <TabPane 
                  tab={
                    <span>
                      <MessageOutlined style={{ marginRight: 4 }} />
                      回复我的
                    </span>
                  } 
                  key="comments"
                >
                  <List
                    dataSource={receivedItems.filter((it: any) => it.type === 'comment')}
                    locale={{ emptyText: <Empty description="暂无回复" /> }}
                    renderItem={renderMessageItem}
                  />
                </TabPane>
              </Tabs>
            </Card>
          </div>
        </TabPane>
      </Tabs>

      {/* 用户动态弹窗 */}
      <Modal
        title={
          selectedUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar src={getAvatarUrl(selectedUser.avatar)} size="large">
                {selectedUser.username?.[0] || 'U'}
              </Avatar>
              <div>
                <div style={{ fontSize: 18, fontWeight: 'bold' }}>{selectedUser.username}</div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  {selectedUser.bio || '这个人很懒，什么都没有写'}
                </div>
              </div>
            </div>
          ) : '用户动态'
        }
        open={userModalVisible}
        onCancel={handleCloseUserModal}
        footer={null}
        width={900}
        style={{ top: 20 }}
        bodyStyle={{ 
          padding: '24px',
          background: 'linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%)',
          borderRadius: '12px'
        }}
      >
        <Spin spinning={userModalLoading}>
          {selectedUser && (
            <div>
              {/* 用户统计信息 */}
              <Card size="small" style={{ marginBottom: 20, backgroundColor: '#f8f9fa' }}>
                <Row gutter={16}>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: '12px 0' }}>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff', marginBottom: 4 }}>
                        {selectedUser.totalStudyTime || 0}
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        总学习时长(分钟)
                      </div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: '12px 0' }}>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f5222d', marginBottom: 4 }}>
                        {selectedUser.streak || 0}
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        <FireOutlined style={{ marginRight: 4 }} />
                        连续打卡(天)
                      </div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: '12px 0' }}>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a', marginBottom: 4 }}>
                        {selectedUser.followers || 0}
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        <TrophyOutlined style={{ marginRight: 4 }} />
                        关注者
                      </div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: '12px 0' }}>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1', marginBottom: 4 }}>
                        {selectedUser.following || 0}
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        <UserAddOutlined style={{ marginRight: 4 }} />
                        正在关注
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>

              <Divider />

              {/* 用户动态列表 */}
              <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                <List
                  dataSource={userCheckins}
                  renderItem={(item: Checkin) => (
                    <List.Item>
                      <Card size="small" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar src={getAvatarUrl(item.user?.avatar)}>{item.user?.username?.[0] || 'U'}</Avatar>
                            <div style={{ marginLeft: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Text strong>{item.user?.username || '未知用户'}</Text>
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
                                    <Avatar size="small" src={getAvatarUrl(cm.user?.avatar)} icon={<UserOutlined />}>{cm.user?.username?.[0] || 'U'}</Avatar>
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
                  )}
                  locale={{ emptyText: <Empty description="该用户还没有发布任何动态" /> }}
                />
              </div>
            </div>
          )}
        </Spin>
      </Modal>
    </div>
  );
};

export default Social;
