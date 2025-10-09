import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Progress, List, Avatar, Typography, Button, Tag } from 'antd';
import {
  ClockCircleOutlined,
  FireOutlined,
  TrophyOutlined,
  CalendarOutlined,
  PlusOutlined,
  RightOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const { Title, Text } = Typography;

interface Checkin {
  _id: number;
  content: string;
  studyTime: number;
  subject: string;
  mood: string;
  createdAt: string;
  user: {
    username: string;
    avatar: string;
  };
}

interface Plan {
  _id: string;
  title: string;
  subject: string;
  progressPercentage: number;
  endDate: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentCheckins, setRecentCheckins] = useState<Checkin[]>([]);
  const [activePlans, setActivePlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [checkinsResponse, plansResponse] = await Promise.all([
        api.get(`/checkins?userId=${user?.id}&limit=5`),
        api.get(`/plans?userId=${user?.id}&status=active&limit=3`)
      ]);

      setRecentCheckins(checkinsResponse.data.checkins);
      setActivePlans(plansResponse.data.plans);
    } catch (error) {
      console.error('获取仪表盘数据失败:', error);
    } finally {
      setLoading(false);
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

  return (
    <div>
      <Title level={2}>欢迎回来，{user?.username}！</Title>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总学习时长"
              value={user?.totalStudyTime || 0}
              suffix="分钟"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="连续打卡"
              value={user?.streak || 0}
              suffix="天"
              prefix={<FireOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="关注者"
              value={user?.followers || 0}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="正在关注"
              value={user?.following || 0}
              prefix={<UserAddOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 最近打卡 */}
        <Col xs={24} lg={12}>
          <Card
            title="最近打卡"
            extra={
              <Button
                type="link"
                onClick={() => navigate('/checkin')}
                icon={<PlusOutlined />}
              >
                立即打卡
              </Button>
            }
          >
            <List
              dataSource={recentCheckins}
              loading={loading}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{item.subject}</span>
                        <Tag color={getMoodColor(item.mood)}>{getMoodText(item.mood)}</Tag>
                      </div>
                    }
                    description={
                      <div>
                        <Text>{item.content}</Text>
                        <br />
                        <Text type="secondary">
                          {formatTime(item.studyTime)} · {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 活跃计划 */}
        <Col xs={24} lg={12}>
          <Card
            title="活跃学习计划"
            extra={
              <Button
                type="link"
                onClick={() => navigate('/plans')}
                icon={<RightOutlined />}
              >
                查看全部
              </Button>
            }
          >
            <List
              dataSource={activePlans}
              loading={loading}
              renderItem={(item) => (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text strong>{item.title}</Text>
                      <Text type="secondary">{item.subject}</Text>
                    </div>
                    <Progress
                      percent={item.progressPercentage}
                      size="small"
                      status={item.progressPercentage === 100 ? 'success' : 'active'}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      截止日期: {new Date(item.endDate).toLocaleDateString()}
                    </Text>
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

export default Dashboard;
