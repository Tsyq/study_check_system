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
  Divider,
  Modal
} from 'antd';
import {
  ClockCircleOutlined,
  BookOutlined,
  SmileOutlined,
  CheckCircleOutlined
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
  // 移除“今日已打卡”逻辑，始终允许打卡
  // const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [lastCheckinData, setLastCheckinData] = useState<any>(null);

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
      setLoading(false);
    } else {
      fetchCheckins();
      // 不再检查今日是否已打卡，始终允许打卡
    }
  }, [user]);

  const fetchCheckins = async () => {
    setLoading(true);
    try {
      // 只获取当前用户自己的打卡记录
      const response = await api.get(`/checkins?userId=${user?.id}&limit=20`);
      setCheckins(response.data.checkins);
    } catch (error) {
      message.error('获取打卡记录失败');
    } finally {
      setLoading(false);
    }
  };

  // 移除 checkTodayCheckin 逻辑

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
<<<<<<< HEAD
      const response = await api.post('/checkins', values);

      // 保存打卡数据用于显示
      setLastCheckinData({
        ...values,
        createdAt: new Date().toISOString()
      });

      // 重置表单
=======
      console.log('提交的打卡数据:', values);
      await api.post('/checkins', values);
      message.success('打卡成功！');
>>>>>>> 2dc6634ff5ec996a7c06a39977366dcacc1dfc43
      form.resetFields();

      // 刷新打卡记录
      fetchCheckins();
      // 不再设置 hasCheckedInToday，始终允许打卡

      // 显示成功模态框
      setSuccessModalVisible(true);

    } catch (error: any) {
      console.error('打卡失败:', error);
      console.error('错误响应:', error.response?.data);
      if (error.response?.status === 401) {
        message.error('登录已过期，请重新登录');
      } else if (error.response?.status === 400) {
        message.error(error.response?.data?.message || '打卡失败');
      } else {
        message.error('网络错误，请稍后重试');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessModalClose = () => {
    setSuccessModalVisible(false);
    setLastCheckinData(null);
    // 关闭模态框后重置表单，允许继续打卡
    form.resetFields();
  };



  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`;
  };

  const getMoodConfig = (mood: string) => {
    return moods.find(m => m.value === mood) || moods[2];
  };


  return (
    <div>
      <Title level={2}>学习打卡</Title>

      <Row gutter={[24, 24]}>
        {/* 打卡表单：始终显示 */}
        <Col xs={24} lg={8}>
          <Card title="今日打卡">
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
          </Card>
        </Col>

        {/* 我的打卡记录 */}
        <Col xs={24} lg={16}>
          <Card title="我的打卡记录">
            <List
              dataSource={checkins}
              loading={loading}
              renderItem={(item) => (
                <List.Item>
                  <Card size="small" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
<<<<<<< HEAD
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {new Date(item.createdAt).toLocaleString()}
                        </Text>
=======
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar src={item.user?.avatar}>{item.user?.username?.[0] || 'U'}</Avatar>
                        <div style={{ marginLeft: 12 }}>
                          <Text strong>{item.user?.username || '未知用户'}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {new Date(item.createdAt).toLocaleString()}
                          </Text>
                        </div>
>>>>>>> 2dc6634ff5ec996a7c06a39977366dcacc1dfc43
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

                  </Card>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 打卡成功模态框 */}
      <Modal
        title="打卡成功！"
        open={successModalVisible}
        onCancel={handleSuccessModalClose}
        footer={[
          <Button key="close" type="primary" onClick={handleSuccessModalClose}>
            继续打卡
          </Button>
        ]}
        centered
        width={400}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 16, color: '#52c41a' }}>
              🎉 恭喜您完成学习打卡！
            </Text>
          </div>

          {lastCheckinData && (
            <div style={{
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16
            }}>
              <div style={{ marginBottom: 8 }}>
                <Text strong>学习科目：</Text>
                <Tag color="blue" style={{ marginLeft: 8 }}>{lastCheckinData.subject}</Tag>
              </div>

              <div style={{ marginBottom: 8 }}>
                <Text strong>学习时长：</Text>
                <Text style={{ color: '#1890ff', marginLeft: 8 }}>
                  {formatTime(lastCheckinData.studyTime)}
                </Text>
              </div>

              <div style={{ marginBottom: 8 }}>
                <Text strong>学习心情：</Text>
                <Tag
                  color={getMoodConfig(lastCheckinData.mood).color}
                  style={{ marginLeft: 8 }}
                >
                  {getMoodConfig(lastCheckinData.mood).label}
                </Tag>
              </div>

              {lastCheckinData.content && (
                <div>
                  <Text strong>学习内容：</Text>
                  <Text style={{ marginLeft: 8 }}>{lastCheckinData.content}</Text>
                </div>
              )}
            </div>
          )}

          <Text type="secondary" style={{ fontSize: 12 }}>
            点击"继续打卡"可以立即进行下一次学习打卡
          </Text>
        </div>
      </Modal>
    </div>
  );
};

export default Checkin;
