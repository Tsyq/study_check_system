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

interface User {
  _id: string;
  username: string;
  avatar: string;
  bio: string;
  totalStudyTime: number;
  streak: number;
  followers: number;
  following: number;
}

const Social: React.FC = () => {
  const { user } = useAuth() as any;
  const [activeTab, setActiveTab] = useState('feed');
  const [feedCheckins, setFeedCheckins] = useState<Checkin[]>([]);
  const [allCheckins, setAllCheckins] = useState<Checkin[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

      const demoUsers: User[] = [
        {
          _id: 'user1',
          username: '小明',
          avatar: '',
          bio: '热爱编程的大学生',
          totalStudyTime: 2100,
          streak: 12,
          followers: 25,
          following: 15
        },
        {
          _id: 'user2',
          username: '小红',
          avatar: '',
          bio: '英语专业，喜欢阅读',
          totalStudyTime: 1800,
          streak: 8,
          followers: 18,
          following: 12
        },
        {
          _id: 'user3',
          username: '小李',
          avatar: '',
          bio: '数学爱好者',
          totalStudyTime: 1500,
          streak: 5,
          followers: 10,
          following: 8
        }
      ];

      setFeedCheckins(demoCheckins);
      setAllCheckins(demoCheckins);
      setUsers(demoUsers);
      setLoading(false);
    } else {
      if (activeTab === 'feed') {
        fetchFeed();
      } else if (activeTab === 'discover') {
        fetchAllCheckins();
      } else if (activeTab === 'users') {
        fetchUsers();
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
      const response = await api.get('/checkins?limit=20');
      setAllCheckins(response.data.checkins);
    } catch (error) {
      message.error('获取打卡动态失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/social/search/users?limit=20');
      setUsers(response.data.users);
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      fetchUsers();
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/social/search/users?q=${encodeURIComponent(value)}`);
      setUsers(response.data.users);
    } catch (error) {
      message.error('搜索用户失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      await api.post(`/social/follow/${userId}`);
      message.success('关注成功');
      fetchUsers();
    } catch (error: any) {
      message.error(error.response?.data?.message || '关注失败');
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
            <Avatar src={item.user?.avatar}>{item.user?.username?.[0] || 'U'}</Avatar>
            <div style={{ marginLeft: 12 }}>
              <Text strong>{item.user?.username || '未知用户'}</Text>
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
            <Button type="text" icon={<MessageOutlined />}>
              {item.comments.length}
            </Button>
          </Space>
        </div>
      </Card>
    </List.Item>
  );

  const renderUserItem = (item: User) => (
    <List.Item>
      <Card size="small" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar src={item.avatar} size="large">{item.username?.[0] || 'U'}</Avatar>
            <div style={{ marginLeft: 16 }}>
              <Text strong style={{ fontSize: 16 }}>{item.username}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {item.bio || '这个人很懒，什么都没有写'}
              </Text>
              <br />
              <Space size="small" style={{ marginTop: 4 }}>
                <Tag icon={<ClockCircleOutlined />}>{item.totalStudyTime}分钟</Tag>
                <Tag icon={<FireOutlined />}>{item.streak}天</Tag>
                <Tag icon={<TrophyOutlined />}>{item.followers}关注者</Tag>
              </Space>
            </div>
          </div>
          <Button 
            type="primary" 
            icon={<UserAddOutlined />}
            onClick={() => handleFollow(item._id)}
          >
            关注
          </Button>
        </div>
      </Card>
    </List.Item>
  );

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
            <List
              dataSource={allCheckins}
              loading={loading}
              renderItem={renderCheckinItem}
            />
          </Card>
        </TabPane>
        
        <TabPane tab="用户" key="users">
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Search
                placeholder="搜索用户..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={handleSearch}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <List
              dataSource={users}
              loading={loading}
              renderItem={renderUserItem}
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Social;
