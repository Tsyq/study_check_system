import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  List, 
  Avatar, 
  Tag, 
  Tabs,
  Select,
  Statistic,
  message
} from 'antd';
import { 
  TrophyOutlined, 
  FireOutlined, 
  ClockCircleOutlined,
  UserOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface LeaderboardItem {
  userId: string;
  username: string;
  avatar: string;
  totalStudyTime?: number;
  streak?: number;
  checkinCount?: number;
  subjects?: string[];
}

interface PersonalStats {
  user: {
    id: string;
    username: string;
    avatar: string;
    bio: string;
    totalStudyTime: number;
    streak: number;
    followers: number;
    following: number;
  };
  studyStats: {
    totalStudyTime: number;
    totalCheckins: number;
    avgStudyTime: number;
    subjects: string[];
  };
  dailyStats: Array<{
    _id: {
      year: number;
      month: number;
      day: number;
    };
    studyTime: number;
    checkins: number;
  }>;
  subjectStats: Array<{
    _id: string;
    totalTime: number;
    checkinCount: number;
    avgTime: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Stats: React.FC = () => {
  const { user } = useAuth() as any;
  const [activeTab, setActiveTab] = useState('personal');
  const [period, setPeriod] = useState('30');
  const [studyTimeLeaderboard, setStudyTimeLeaderboard] = useState<LeaderboardItem[]>([]);
  const [streakLeaderboard, setStreakLeaderboard] = useState<LeaderboardItem[]>([]);
  const [personalStats, setPersonalStats] = useState<PersonalStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id === 'demo-user') {
      // 演示模式，使用模拟数据
      const demoPersonalStats: PersonalStats = {
        user: {
          id: 'demo-user',
          username: '演示用户',
          avatar: '',
          bio: '这是一个演示账户',
          totalStudyTime: 1250,
          streak: 7,
          followers: 15,
          following: 8
        },
        studyStats: {
          totalStudyTime: 1250,
          totalCheckins: 12,
          avgStudyTime: 104,
          subjects: ['编程', '数学', '英语']
        },
        dailyStats: [
          { _id: { year: 2024, month: 1, day: 15 }, studyTime: 120, checkins: 1 },
          { _id: { year: 2024, month: 1, day: 16 }, studyTime: 90, checkins: 1 },
          { _id: { year: 2024, month: 1, day: 17 }, studyTime: 150, checkins: 2 },
          { _id: { year: 2024, month: 1, day: 18 }, studyTime: 80, checkins: 1 },
          { _id: { year: 2024, month: 1, day: 19 }, studyTime: 200, checkins: 2 }
        ],
        subjectStats: [
          { _id: '编程', totalTime: 600, checkinCount: 6, avgTime: 100 },
          { _id: '数学', totalTime: 400, checkinCount: 4, avgTime: 100 },
          { _id: '英语', totalTime: 250, checkinCount: 2, avgTime: 125 }
        ]
      };

      const demoLeaderboard: LeaderboardItem[] = [
        { userId: 'user1', username: '小明', avatar: '', totalStudyTime: 2100, checkinCount: 20, subjects: ['编程', '数学'] },
        { userId: 'demo-user', username: '演示用户', avatar: '', totalStudyTime: 1250, checkinCount: 12, subjects: ['编程', '数学', '英语'] },
        { userId: 'user2', username: '小红', avatar: '', totalStudyTime: 1800, checkinCount: 15, subjects: ['英语', '语文'] },
        { userId: 'user3', username: '小李', avatar: '', totalStudyTime: 1500, checkinCount: 10, subjects: ['数学', '物理'] }
      ];

      const demoStreakLeaderboard: LeaderboardItem[] = [
        { userId: 'user1', username: '小明', avatar: '', streak: 12, totalStudyTime: 2100 },
        { userId: 'user2', username: '小红', avatar: '', streak: 8, totalStudyTime: 1800 },
        { userId: 'demo-user', username: '演示用户', avatar: '', streak: 7, totalStudyTime: 1250 },
        { userId: 'user3', username: '小李', avatar: '', streak: 5, totalStudyTime: 1500 }
      ];

      setPersonalStats(demoPersonalStats);
      setStudyTimeLeaderboard(demoLeaderboard);
      setStreakLeaderboard(demoStreakLeaderboard);
      setLoading(false);
    } else {
      if (activeTab === 'personal') {
        fetchPersonalStats();
      } else if (activeTab === 'leaderboard') {
        fetchLeaderboards();
      }
    }
  }, [activeTab, period, user]);

  const fetchPersonalStats = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/stats/personal/${localStorage.getItem('userId')}?period=${period}`);
      setPersonalStats(response.data);
    } catch (error) {
      message.error('获取个人统计失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboards = async () => {
    setLoading(true);
    try {
      const [studyTimeResponse, streakResponse] = await Promise.all([
        api.get(`/stats/leaderboard/study-time?period=${period}`),
        api.get('/stats/leaderboard/streak')
      ]);
      setStudyTimeLeaderboard(studyTimeResponse.data.leaderboard);
      setStreakLeaderboard(streakResponse.data.leaderboard);
    } catch (error) {
      message.error('获取排行榜失败');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`;
  };

  const formatChartData = (dailyStats: any[]) => {
    return dailyStats.map(item => ({
      date: `${item._id.month}/${item._id.day}`,
      studyTime: item.studyTime,
      checkins: item.checkins
    }));
  };

  const formatSubjectData = (subjectStats: any[]) => {
    return subjectStats.map((item, index) => ({
      name: item._id,
      value: item.totalTime,
      color: COLORS[index % COLORS.length]
    }));
  };

  const renderPersonalStats = () => {
    if (!personalStats) return null;

    const chartData = formatChartData(personalStats.dailyStats);
    const subjectData = formatSubjectData(personalStats.subjectStats);

    return (
      <div>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总学习时长"
                value={personalStats.studyStats.totalStudyTime}
                suffix="分钟"
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总打卡次数"
                value={personalStats.studyStats.totalCheckins}
                prefix={<BarChartOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="平均学习时长"
                value={Math.round(personalStats.studyStats.avgStudyTime)}
                suffix="分钟"
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="学习科目"
                value={personalStats.studyStats.subjects.length}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="学习时长趋势">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="studyTime" stroke="#1890ff" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="科目学习分布">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={subjectData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {subjectData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            <Card title="科目详细统计">
              <List
                dataSource={personalStats.subjectStats}
                renderItem={(item) => (
                  <List.Item>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text strong>{item._id}</Text>
                        <Text type="secondary">{formatTime(item.totalTime)}</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text type="secondary">打卡次数: {item.checkinCount}</Text>
                        <Text type="secondary">平均时长: {Math.round(item.avgTime)}分钟</Text>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderLeaderboard = () => (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="学习时长排行榜" extra={<Tag color="blue">近{period}天</Tag>}>
            <List
              dataSource={studyTimeLeaderboard}
              loading={loading}
              renderItem={(item, index) => (
                <List.Item>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <div style={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: '50%', 
                      backgroundColor: index < 3 ? '#1890ff' : '#f0f0f0',
                      color: index < 3 ? 'white' : '#666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                      fontWeight: 'bold'
                    }}>
                      {index + 1}
                    </div>
                    <Avatar src={item.avatar} style={{ marginRight: 12 }}>{item.username?.[0] || 'U'}</Avatar>
                    <div style={{ flex: 1 }}>
                      <Text strong>{item.username}</Text>
                      <br />
                      <Text type="secondary">
                        {formatTime(item.totalStudyTime || 0)} · {item.checkinCount}次打卡
                      </Text>
                    </div>
                    <Tag icon={<TrophyOutlined />} color={index < 3 ? 'gold' : 'default'}>
                      {index < 3 ? '🏆' : ''}
                    </Tag>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="连续打卡排行榜">
            <List
              dataSource={streakLeaderboard}
              loading={loading}
              renderItem={(item, index) => (
                <List.Item>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <div style={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: '50%', 
                      backgroundColor: index < 3 ? '#f5222d' : '#f0f0f0',
                      color: index < 3 ? 'white' : '#666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                      fontWeight: 'bold'
                    }}>
                      {index + 1}
                    </div>
                    <Avatar src={item.avatar} style={{ marginRight: 12 }}>{item.username?.[0] || 'U'}</Avatar>
                    <div style={{ flex: 1 }}>
                      <Text strong>{item.username}</Text>
                      <br />
                      <Text type="secondary">
                        {formatTime(item.totalStudyTime || 0)} 总学习时长
                      </Text>
                    </div>
                    <Tag icon={<FireOutlined />} color="red">
                      {item.streak}天
                    </Tag>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>统计分析</Title>
        <Select value={period} onChange={setPeriod} style={{ width: 120 }}>
          <Option value="7">近7天</Option>
          <Option value="30">近30天</Option>
          <Option value="90">近90天</Option>
        </Select>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="个人统计" key="personal">
          {renderPersonalStats()}
        </TabPane>
        <TabPane tab="排行榜" key="leaderboard">
          {renderLeaderboard()}
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Stats;
