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
    console.log('头像上传状态变化:', {
      status: info.file?.status,
      name: info.file?.name,
      percent: info.file?.percent,
      response: info.file?.response,
      error: info.file?.error
    });
    
    if (info.file.status === 'uploading') {
      console.log('上传进度:', info.file.percent + '%');
      return;
    }
    if (info.file.status === 'done') {
      message.success('头像上传成功');
      console.log('上传响应:', info.file.response);
      // 更新本地头像显示
      if (info.file.response && info.file.response.avatarUrl) {
        setProfile(prev => prev ? { ...prev, avatar: info.file.response.avatarUrl } : null);
      }
      fetchProfile(); // 重新获取用户信息
    } else if (info.file.status === 'error') {
      console.error('头像上传失败:', info.file.error);
      message.error('头像上传失败: ' + (info.file.error?.message || '未知错误'));
    } else {
      console.log('未知状态:', info.file.status);
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
                beforeUpload={async (file) => {
                  console.log('beforeUpload 检查文件:', {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    sizeMB: (file.size / 1024 / 1024).toFixed(2)
                  });
                  
                  const isImage = file.type.startsWith('image/');
                  if (!isImage) {
                    console.log('文件类型检查失败:', file.type);
                    message.error('只能上传图片文件!');
                    return false;
                  }
                  
                  // 如果文件大于2MB，自动压缩
                  if (file.size > 2 * 1024 * 1024) {
                    console.log('文件较大，开始压缩...');
                    try {
                      const compressedFile = await compressImage(file, 200, 0.8);
                      console.log('压缩完成:', {
                        原始大小: (file.size / 1024 / 1024).toFixed(2) + 'MB',
                        压缩后大小: (compressedFile.size / 1024 / 1024).toFixed(2) + 'MB'
                      });
                      
                      // 替换原始文件，保持uid属性
                      const fileWithUid = Object.assign(compressedFile, {
                        uid: file.uid
                      });
                      
                      // 如果压缩后仍然太大，显示提醒
                      if (compressedFile.size > 10 * 1024 * 1024) {
                        setFileSizeInfo({
                          name: file.name,
                          size: compressedFile.size
                        });
                        setFileSizeModalVisible(true);
                        return false;
                      }
                      
                      return fileWithUid;
                    } catch (error) {
                      console.error('图片压缩失败:', error);
                      message.error('图片压缩失败，请选择较小的图片');
                      return false;
                    }
                  }
                  
                  // 检查文件大小限制
                  const isLt10M = file.size / 1024 / 1024 < 10;
                  if (!isLt10M) {
                    console.log('文件大小检查失败:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
                    setFileSizeInfo({
                      name: file.name,
                      size: file.size
                    });
                    setFileSizeModalVisible(true);
                    return false;
                  }
                  
                  console.log('文件检查通过，开始上传');
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
