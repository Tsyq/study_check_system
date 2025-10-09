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
    id: number;
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
  checkins: Array<{
    mood: string;
    content: string;
  }>;
  planStats: {
    totalPlans: number;
    completedPlans: number;
    activePlans: number;
    totalTargetHours: number;
    totalCompletedHours: number;
  };
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
    if (activeTab === 'personal') {
      fetchPersonalStats();
    } else if (activeTab === 'leaderboard') {
      fetchLeaderboards();
    }
  }, [activeTab, period, user]);

  const fetchPersonalStats = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/stats/personal/${user?.id}?period=${period}`);
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

  // 格式化情绪分析数据
  const formatMoodData = (checkins: any[]) => {
    const moodCount: Record<string, number> = {};
    checkins.forEach(checkin => {
      const mood = checkin.mood || 'normal';
      moodCount[mood] = (moodCount[mood] || 0) + 1;
    });
    
    const moodLabels: Record<string, string> = {
      'excited': '兴奋',
      'happy': '开心', 
      'normal': '正常',
      'tired': '疲惫',
      'frustrated': '沮丧'
    };
    
    return Object.entries(moodCount).map(([mood, count], index) => ({
      name: moodLabels[mood] || mood,
      value: count,
      color: COLORS[index % COLORS.length]
    }));
  };

  // 生成学习习惯分析报告
  const renderPersonalHabitReport = () => {
    if (!personalStats) return null;
    const { studyStats, dailyStats, subjectStats, user } = personalStats;
    if (!studyStats) return null;

    // 连续打卡天数
    const streak = user.streak || 0;
    // 总打卡天数
    const totalCheckins = studyStats.totalCheckins || 0;
    // 平均学习时长
    const avgTime = Math.round(studyStats.avgStudyTime || 0);
    // 最常学习科目
    let topSubject = '';
    if (subjectStats && subjectStats.length > 0) {
      topSubject = subjectStats[0]._id;
    }
    // 近一段时间最高学习天数
    let maxDay = '';
    let maxCheckins = 0;
    if (dailyStats && dailyStats.length > 0) {
      const max = dailyStats.reduce((a, b) => (a.checkins > b.checkins ? a : b));
      maxDay = `${max._id.month}月${max._id.day}日`;
      maxCheckins = max.checkins;
    }

    return (
      <Card style={{ marginBottom: 24 }}>
        <Text strong>学习习惯分析：</Text>
        <div style={{ marginTop: 8 }}>
          <div>· 你在本周期内共打卡 <span style={{ color: '#1890ff' }}>{totalCheckins}</span> 天，连续打卡 <span style={{ color: '#fa541c' }}>{streak}</span> 天。</div>
          <div>· 平均每次学习 <span style={{ color: '#722ed1' }}>{avgTime}</span> 分钟。</div>
          {topSubject && <div>· 最常学习的科目是 <span style={{ color: '#faad14' }}>{topSubject}</span>。</div>}
          {maxDay && <div>· {maxDay} 是你打卡最多的一天（<span style={{ color: '#13c2c2' }}>{maxCheckins}</span> 次）。</div>}
        </div>
      </Card>
    );
  };

  const renderPersonalStats = () => {
    if (!personalStats) return null;

    const chartData = formatChartData(personalStats.dailyStats);
    const subjectData = formatSubjectData(personalStats.subjectStats);
    
    // 获取打卡记录用于情绪分析
    const checkins = personalStats.checkins || [];
    
    const moodData = formatMoodData(checkins);

    return (
      <div>
        {renderPersonalHabitReport()}
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
                value={new Set(personalStats.studyStats.subjects).size}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 您要求的三个图表 - 改为两个一行 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} lg={12}>
            <Card title="完成情况饼图">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={[
                      { name: '已完成', value: personalStats.planStats.completedPlans, color: '#52c41a' },
                      { name: '进行中', value: personalStats.planStats.activePlans, color: '#1890ff' },
                      { name: '未开始', value: Math.max(0, personalStats.planStats.totalPlans - personalStats.planStats.completedPlans - personalStats.planStats.activePlans), color: '#f0f0f0' }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }: any) => {
                      const percentage = ((percent as number) * 100).toFixed(0);
                      return `${name}\n${percentage}%`;
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#52c41a" />
                    <Cell fill="#1890ff" />
                    <Cell fill="#f0f0f0" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="情绪分析图">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={moodData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }: any) => {
                      const percentage = ((percent as number) * 100).toFixed(0);
                      return `${name}\n${percentage}%`;
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {moodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
        
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} lg={12}>
            <Card title="学习时长趋势">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="studyTime" stroke="#1890ff" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="科目学习分布">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={subjectData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }: any) => {
                      const percentage = ((percent as number) * 100).toFixed(0);
                      return `${name}\n${percentage}%`;
                    }}
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
                    <Avatar src={item.avatar || undefined} style={{ marginRight: 12 }}>{item.username?.[0] || 'U'}</Avatar>
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
                    <Avatar src={item.avatar || undefined} style={{ marginRight: 12 }}>{item.username?.[0] || 'U'}</Avatar>
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
