import React, { useState, useEffect, useCallback } from 'react';
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
  Modal,
  Space
} from 'antd';
import { 
  UserOutlined, 
  EditOutlined, 
  SaveOutlined, 
  CameraOutlined,
  LockOutlined,
  MailOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

// 处理头像URL的函数
const getAvatarUrl = (avatar: string | undefined) => {
  if (!avatar) return undefined;
  if (avatar.startsWith('http')) return avatar;
  return `http://localhost:5000${avatar}`;
};

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

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      setProfile(response.data.user);
      form.setFieldsValue(response.data.user);
    } catch (error) {
      message.error('获取个人信息失败');
    }
  }, [form]);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id, fetchProfile]);

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

  const handlePasswordChange = async (values: any) => {
    setPasswordLoading(true);
    try {
      await api.put('/auth/password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      message.success('密码修改成功');
      setPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.message || '密码修改失败');
    } finally {
      setPasswordLoading(false);
    }
  };

  const showPasswordModal = () => {
    setPasswordModalVisible(true);
  };

  const handleAvatarChange = (info: any) => {
    if (info.file.status === 'uploading') {
      return;
    }
    if (info.file.status === 'done') {
      message.success('头像上传成功');
      // 更新本地头像显示
      if (info.file.response && info.file.response.avatarUrl) {
        setProfile(prev => prev ? { ...prev, avatar: info.file.response.avatarUrl } : null);
      }
      fetchProfile(); // 重新获取用户信息
    } else if (info.file.status === 'error') {
      message.error('头像上传失败');
    }
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
                action="http://localhost:5000/api/upload/avatar"
                headers={{
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }}
                onChange={handleAvatarChange}
                disabled={!editing}
                beforeUpload={(file) => {
                  const isImage = file.type.startsWith('image/');
                  if (!isImage) {
                    message.error('只能上传图片文件!');
                    return false;
                  }
                  const isLt5M = file.size / 1024 / 1024 < 5;
                  if (!isLt5M) {
                    message.error('图片大小不能超过5MB!');
                    return false;
                  }
                  return true;
                }}
              >
                <div style={{ position: 'relative' }}>
                  <Avatar 
                    size={120} 
                    src={getAvatarUrl(profile?.avatar)} 
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
                  { min: 2, message: '用户名至少2个字符' },
                  { max: 60, message: '用户名最多60个字符' },
                  { 
                    pattern: /^[\u4e00-\u9fa5a-zA-Z0-9_\s]+$/, 
                    message: '用户名只能包含中文、英文、数字、下划线和空格' 
                  }
                ]}
              >
                <Input disabled={!editing} />
              </Form.Item>

              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input 
                  disabled={!editing} 
                  prefix={<MailOutlined />}
                  placeholder="请输入邮箱地址"
                />
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
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button 
                    type="primary" 
                    icon={<EditOutlined />}
                    onClick={handleEdit}
                    block
                  >
                    编辑资料
                  </Button>
                  <Button 
                    icon={<LockOutlined />}
                    onClick={showPasswordModal}
                    block
                  >
                    修改密码
                  </Button>
                </Space>
              )}
            </Form>
          </Card>
        </Col>
      </Row>

      {/* 修改密码模态框 */}
      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
        >
          <Form.Item
            name="currentPassword"
            label="当前密码"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />}
              placeholder="请输入当前密码"
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />}
              placeholder="请输入新密码"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />}
              placeholder="请再次输入新密码"
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button 
                onClick={() => {
                  setPasswordModalVisible(false);
                  passwordForm.resetFields();
                }}
              >
                取消
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={passwordLoading}
                icon={<LockOutlined />}
              >
                确认修改
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;
