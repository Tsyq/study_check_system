import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Avatar, 
  Typography, 
  Row, 
  Col, 
  Upload, 
  message,
  Divider,
  Statistic,
  List,
  Tag,
  Space
} from 'antd';
import { 
  UserOutlined, 
  EditOutlined, 
  SaveOutlined, 
  CameraOutlined,
  ClockCircleOutlined,
  FireOutlined,
  TeamOutlined,
  BookOutlined,
  TrophyOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface UserProfile {
  id: number;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  totalStudyTime: number;
  streak: number;
  followers: number;
  following: number;
  createdAt: string;
}

interface RecentCheckin {
  _id: string;
  content: string;
  studyTime: number;
  subject: string;
  createdAt: string;
}

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentCheckins, setRecentCheckins] = useState<RecentCheckin[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
      fetchRecentCheckins();
    }
  }, [user, form, fetchProfile, fetchRecentCheckins]);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      setProfile(response.data.user);
      form.setFieldsValue(response.data.user);
    } catch (error) {
      message.error('获取个人信息失败');
    }
  };

  const fetchRecentCheckins = async () => {
    try {
      const response = await api.get(`/checkins?userId=${user?.id}&limit=5`);
      setRecentCheckins(response.data.checkins);
    } catch (error) {
      console.error('获取最近打卡失败:', error);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      await api.put('/auth/profile', values);
      message.success('个人信息更新成功');
      setEditing(false);
      fetchProfile();
      updateUser(values);
    } catch (error: any) {
      message.error(error.response?.data?.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    form.setFieldsValue(profile);
  };

  const handleAvatarChange = (info: any) => {
    if (info.file.status === 'done') {
      message.success('头像上传成功');
      fetchProfile();
    } else if (info.file.status === 'error') {
      message.error('头像上传失败');
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`;
  };

  return (
    <div>
      <Title level={2}>个人资料</Title>
      
      <Row gutter={[24, 24]}>
        {/* 个人信息卡片 */}
        <Col xs={24} lg={8}>
          <Card>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Upload
                name="avatar"
                listType="picture-circle"
                showUploadList={false}
                action="/api/upload/avatar"
                onChange={handleAvatarChange}
                disabled={!editing}
              >
                <div style={{ position: 'relative' }}>
                  <Avatar 
                    size={120} 
                    src={profile?.avatar || undefined} 
                    icon={<UserOutlined />}
                  />
                  {editing && (
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      backgroundColor: '#1890ff',
                      borderRadius: '50%',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}>
                      <CameraOutlined style={{ color: 'white' }} />
                    </div>
                  )}
                </div>
              </Upload>
              <Title level={4} style={{ marginTop: 16, marginBottom: 8 }}>
                {profile?.username}
              </Title>
              <Text type="secondary">{profile?.email}</Text>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
            >
              <Form.Item
                name="username"
                label="用户名"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3个字符' },
                  { max: 20, message: '用户名最多20个字符' }
                ]}
              >
                <Input disabled={!editing} />
              </Form.Item>

              <Form.Item
                name="bio"
                label="个人简介"
                rules={[{ max: 200, message: '个人简介最多200个字符' }]}
              >
                <TextArea 
                  rows={4} 
                  disabled={!editing}
                  placeholder="介绍一下自己..."
                  maxLength={200}
                  showCount
                />
              </Form.Item>

              {editing ? (
                <Form.Item>
                  <Space>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={loading}
                      icon={<SaveOutlined />}
                    >
                      保存
                    </Button>
                    <Button onClick={handleCancel}>
                      取消
                    </Button>
                  </Space>
                </Form.Item>
              ) : (
                <Button 
                  type="primary" 
                  icon={<EditOutlined />}
                  onClick={handleEdit}
                  block
                >
                  编辑资料
                </Button>
              )}
            </Form>
          </Card>
        </Col>

        {/* 学习统计 */}
        <Col xs={24} lg={16}>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="总学习时长"
                  value={profile?.totalStudyTime || 0}
                  suffix="分钟"
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="连续打卡"
                  value={profile?.streak || 0}
                  suffix="天"
                  prefix={<FireOutlined />}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="关注者"
                  value={profile?.followers || 0}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="正在关注"
                  value={profile?.following || 0}
                  prefix={<UserAddOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          <Card title="最近打卡" style={{ marginTop: 16 }}>
            <List
              dataSource={recentCheckins}
              renderItem={(item) => (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text strong>{item.content}</Text>
                      <Tag icon={<BookOutlined />}>{item.subject}</Tag>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text type="secondary">
                        {formatTime(item.studyTime)}
                      </Text>
                      <Text type="secondary">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </div>
                  </div>
                </List.Item>
              )}
              locale={{ emptyText: '还没有打卡记录' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
