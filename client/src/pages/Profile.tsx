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
  const [fileSizeModalVisible, setFileSizeModalVisible] = useState(false);
  const [fileSizeInfo, setFileSizeInfo] = useState({ name: '', size: 0 });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      setProfile(response.data.user);
      form.setFieldsValue(response.data.user);
      // 同步更新全局用户信息
      updateUser(response.data.user);
    } catch (error) {
      message.error('获取个人信息失败');
    }
  }, [form, updateUser]);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]); // 移除 fetchProfile 依赖，避免无限循环

  const handleEdit = () => {
    setEditing(true);
  };

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      // 如果有选中的头像文件，先上传头像
      if (selectedAvatarFile) {
        const formData = new FormData();
        formData.append('avatar', selectedAvatarFile);
        
        const uploadResponse = await api.post('/upload/avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (uploadResponse.data && uploadResponse.data.avatarUrl) {
          values.avatar = uploadResponse.data.avatarUrl;
        }
      }
      
      // 更新个人信息
      await api.put('/auth/profile', values);
      message.success('个人信息更新成功');
      setEditing(false);
      
      // 清除头像相关状态
      setSelectedAvatarFile(null);
      setAvatarPreview(null);
      
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
    // 清除头像相关状态
    setSelectedAvatarFile(null);
    setAvatarPreview(null);
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

  // 图片压缩函数
  const compressImage = (file: File, maxWidth: number = 200, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // 计算压缩后的尺寸
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height;
            height = maxWidth;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // 绘制压缩后的图片
        ctx?.drawImage(img, 0, 0, width, height);
        
        // 转换为 Blob
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleAvatarChange = (info: any) => {
    const file = info.file.originFileObj || info.file;
    
    if (file) {
      // 验证文件类型
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件!');
        return;
      }
      
      // 验证文件大小
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        setFileSizeInfo({
          name: file.name,
          size: file.size
        });
        setFileSizeModalVisible(true);
        return;
      }
      
      // 设置选中的文件
      setSelectedAvatarFile(file);
      
      // 创建预览URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
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
                onChange={handleAvatarChange}
                disabled={!editing}
                beforeUpload={() => false} // 阻止自动上传
              >
                <div style={{ position: 'relative' }}>
                  <Avatar 
                    size={120} 
                    src={avatarPreview || getAvatarUrl(profile?.avatar)} 
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

        {/* 文件大小提醒弹窗 */}
        <Modal
          title="文件大小超出限制"
          open={fileSizeModalVisible}
          onCancel={() => setFileSizeModalVisible(false)}
          footer={[
            <Button key="ok" type="primary" onClick={() => setFileSizeModalVisible(false)}>
              我知道了
            </Button>
          ]}
          width={500}
        >
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 16 }}>
              📁
            </div>
            <h3 style={{ color: '#ff4d4f', marginBottom: 16 }}>
              文件过大，无法上传
            </h3>
            <div style={{ marginBottom: 16 }}>
              <p><strong>文件名：</strong>{fileSizeInfo.name}</p>
              <p><strong>文件大小：</strong>{(fileSizeInfo.size / 1024 / 1024).toFixed(2)} MB</p>
              <p><strong>限制大小：</strong>10 MB</p>
            </div>
            <div style={{ 
              background: '#f6ffed', 
              border: '1px solid #b7eb8f', 
              borderRadius: 6, 
              padding: 16,
              marginTop: 20
            }}>
              <h4 style={{ color: '#52c41a', marginBottom: 8 }}>💡 建议解决方案：</h4>
              <ul style={{ textAlign: 'left', margin: 0, paddingLeft: 20 }}>
                <li><strong>自动压缩：</strong>系统会自动压缩大于2MB的图片</li>
                <li>使用图片编辑软件进一步压缩</li>
                <li>调整图片尺寸（建议 200x200 像素）</li>
                <li>选择其他较小的图片文件</li>
                <li>使用在线图片压缩工具</li>
              </ul>
            </div>
          </div>
        </Modal>
      </div>
    );
  };

  export default Profile;
