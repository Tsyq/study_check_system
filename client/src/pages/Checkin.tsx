import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  Button, 
  Card, 
  Typography, 
  Row, 
  Col, 
  List, 
  Avatar, 
  Tag, 
  message,
  Space,
  Divider
} from 'antd';
import { 
  ClockCircleOutlined, 
  BookOutlined, 
  SmileOutlined,
  HeartOutlined,
  MessageOutlined,
  LikeOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface Checkin {
  _id: string;
  content: string;
  studyTime: number;
  subject: string;
  mood: string;
  location: string;
  tags: string[];
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

const Checkin: React.FC = () => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

  const subjects = [
    '数学', '英语', '语文', '物理', '化学', '生物', 
    '历史', '地理', '政治', '计算机', '编程', '设计', 
    '音乐', '美术', '体育', '其他'
  ];

  const moods = [
    { value: 'excited', label: '兴奋', color: 'red' },
    { value: 'happy', label: '开心', color: 'green' },
    { value: 'normal', label: '正常', color: 'blue' },
    { value: 'tired', label: '疲惫', color: 'orange' },
    { value: 'frustrated', label: '沮丧', color: 'purple' }
  ];

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
          location: '图书馆',
          tags: ['React', '前端开发'],
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
          location: '宿舍',
          tags: ['微积分', '作业'],
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
          location: '咖啡厅',
          tags: ['阅读', 'AI'],
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          user: { _id: 'user2', username: '小红', avatar: '' },
          likes: [{ user: { _id: 'demo-user', username: '演示用户' } }],
          comments: []
        }
      ];

      setCheckins(demoCheckins);
      setHasCheckedInToday(false); // 演示模式显示可以打卡
      setLoading(false);
    } else {
      fetchCheckins();
      checkTodayCheckin();
    }
  }, [user]);

  const fetchCheckins = async () => {
    setLoading(true);
    try {
      const response = await api.get('/checkins?limit=20');
      setCheckins(response.data.checkins);
    } catch (error) {
      message.error('获取打卡记录失败');
    } finally {
      setLoading(false);
    }
  };

  const checkTodayCheckin = async () => {
    try {
      const today = new Date().toDateString();
      const todayCheckin = checkins.find(checkin => 
        new Date(checkin.createdAt).toDateString() === today &&
        checkin.user._id === user?.id
      );
      setHasCheckedInToday(!!todayCheckin);
    } catch (error) {
      console.error('检查今日打卡失败:', error);
    }
  };

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      await api.post('/checkins', values);
      message.success('打卡成功！');
      form.resetFields();
      fetchCheckins();
      setHasCheckedInToday(true);
    } catch (error: any) {
      message.error(error.response?.data?.message || '打卡失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (checkinId: string) => {
    try {
      await api.post(`/checkins/${checkinId}/like`);
      fetchCheckins();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`;
  };

  const getMoodConfig = (mood: string) => {
    return moods.find(m => m.value === mood) || moods[2];
  };

  const isLiked = (checkin: Checkin) => {
    return checkin.likes.some(like => like.user._id === user?.id);
  };

  return (
    <div>
      <Title level={2}>学习打卡</Title>
      
      <Row gutter={[24, 24]}>
        {/* 打卡表单 */}
        <Col xs={24} lg={8}>
          <Card title="今日打卡" className={hasCheckedInToday ? 'completed-card' : ''}>
            {hasCheckedInToday ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: '48px', color: '#52c41a', marginBottom: 16 }}>
                  ✓
                </div>
                <Title level={4} style={{ color: '#52c41a' }}>
                  今日已打卡
                </Title>
                <Text type="secondary">
                  明天继续加油！
                </Text>
              </div>
            ) : (
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                size="large"
              >
                <Form.Item
                  name="content"
                  label="学习内容"
                  rules={[{ required: true, message: '请描述今天的学习内容' }]}
                >
                  <TextArea
                    rows={4}
                    placeholder="今天学习了什么？有什么收获？"
                    maxLength={500}
                    showCount
                  />
                </Form.Item>

                <Form.Item
                  name="studyTime"
                  label="学习时长"
                  rules={[{ required: true, message: '请输入学习时长' }]}
                >
                  <InputNumber
                    min={1}
                    max={1440}
                    placeholder="分钟"
                    style={{ width: '100%' }}
                    addonAfter="分钟"
                    prefix={<ClockCircleOutlined />}
                  />
                </Form.Item>

                <Form.Item
                  name="subject"
                  label="学习科目"
                  rules={[{ required: true, message: '请选择学习科目' }]}
                >
                  <Select placeholder="选择科目" prefix={<BookOutlined />}>
                    {subjects.map(subject => (
                      <Option key={subject} value={subject}>{subject}</Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="mood"
                  label="学习心情"
                  initialValue="normal"
                >
                  <Select placeholder="选择心情">
                    {moods.map(mood => (
                      <Option key={mood.value} value={mood.value}>
                        <Tag color={mood.color}>{mood.label}</Tag>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="location"
                  label="学习地点"
                >
                  <Input placeholder="在哪里学习的？" />
                </Form.Item>

                <Form.Item
                  name="tags"
                  label="标签"
                >
                  <Select
                    mode="tags"
                    placeholder="添加标签（可选）"
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitting}
                    block
                    size="large"
                  >
                    完成打卡
                  </Button>
                </Form.Item>
              </Form>
            )}
          </Card>
        </Col>

        {/* 打卡动态 */}
        <Col xs={24} lg={16}>
          <Card title="学习动态">
            <List
              dataSource={checkins}
              loading={loading}
              renderItem={(item) => (
                <List.Item>
                  <Card size="small" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar src={item.user.avatar}>{item.user.username[0]}</Avatar>
                        <div style={{ marginLeft: 12 }}>
                          <Text strong>{item.user.username}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {new Date(item.createdAt).toLocaleString()}
                          </Text>
                        </div>
                      </div>
                      <Tag color={getMoodConfig(item.mood).color}>
                        {getMoodConfig(item.mood).label}
                      </Tag>
                    </div>

                    <Text style={{ display: 'block', marginBottom: 12 }}>
                      {item.content}
                    </Text>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Space>
                        <Tag icon={<BookOutlined />}>{item.subject}</Tag>
                        <Tag icon={<ClockCircleOutlined />}>{formatTime(item.studyTime)}</Tag>
                        {item.location && <Tag>{item.location}</Tag>}
                      </Space>
                    </div>

                    {item.tags && item.tags.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        {item.tags.map(tag => (
                          <Tag key={tag} color="blue">{tag}</Tag>
                        ))}
                      </div>
                    )}

                    <Divider style={{ margin: '12px 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space>
                        <Button
                          type="text"
                          icon={<LikeOutlined />}
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
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Checkin;
