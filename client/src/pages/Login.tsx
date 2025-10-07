import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Row, Col, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { fromRegister?: boolean } };

  useEffect(() => {
    // 检查是否从注册页面跳转过来
    if (location.state?.fromRegister) {
      setShowSuccessMessage(true);
      // 3秒后隐藏成功消息
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  }, [location.state]);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const success = await login(values.username, values.password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('用户名或密码错误，或用户不存在');
      }
    } catch (e: any) {
      setError(e?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
        <Col xs={22} sm={16} md={12} lg={8} xl={6}>
          <Card className="auth-card">
            <div className="auth-header">
              <Title level={2} style={{ textAlign: 'center', marginBottom: 8 }}>
                智能学习打卡系统
              </Title>
              <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
                登录您的账户
              </Text>
            </div>


            {showSuccessMessage && (
              <Alert
                message="注册成功！"
                description="请使用您的邮箱和密码登录"
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
                closable
                onClose={() => setShowSuccessMessage(false)}
              />
            )}
            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
                closable
                onClose={() => setError(null)}
              />
            )}

            <Form
              name="login"
              onFinish={onFinish}
              autoComplete="off"
              size="large"
            >
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3个字符' }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="用户名"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6个字符' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="密码"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                >
                  登录
                </Button>
              </Form.Item>

            </Form>

            <div className="auth-footer">
              <Text>
                还没有账户？ <Link to="/register">立即注册</Link>
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Login;
