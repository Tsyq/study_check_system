import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Button, List, Typography, Space, Divider } from 'antd';
import {
  DashboardOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  TeamOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { getAvatarUrl } from '../utils/avatar';
import './Layout.css';

const { Header, Sider, Content } = AntLayout;
const { Text } = Typography;


const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth() as any;
  const { notifications, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '首页',
    },
    {
      key: '/checkin',
      icon: <CheckCircleOutlined />,
      label: '学习打卡',
    },
    {
      key: '/plans',
      icon: <CalendarOutlined />,
      label: '学习计划',
    },
    {
      key: '/social',
      icon: <TeamOutlined />,
      label: '学习圈',
    },
    {
      key: '/stats',
      icon: <BarChartOutlined />,
      label: '统计分析',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout,
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleNotificationClick = () => {
    markAsRead();
    navigate('/social', { state: { activeTab: 'me', openMessages: true } });
  };

  const notificationMenuItems = [
    {
      key: 'view-all',
      label: (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <Button type="link" onClick={handleNotificationClick}>
            查看所有消息
          </Button>
        </div>
      ),
    },
    ...(notifications.length > 0 ? [{
      type: 'divider' as const,
    }] : []),
    ...notifications.slice(0, 5).map((notification, index) => ({
      key: `notification-${index}`,
      label: (
        <div style={{ padding: '8px 0' }}>
          <Space>
            <Avatar 
              size="small" 
              src={getAvatarUrl(notification.fromUser.avatar)}
              icon={<UserOutlined />}
            >
              {notification.fromUser.username[0]}
            </Avatar>
            <div>
              <div style={{ fontSize: 12 }}>
                {notification.type === 'like' 
                  ? `${notification.fromUser.username} 点赞了你的打卡`
                  : `${notification.fromUser.username} 评论：${notification.content}`
                }
              </div>
              <Text type="secondary" style={{ fontSize: 10 }}>
                {new Date(notification.createdAt).toLocaleString()}
              </Text>
            </div>
          </Space>
        </div>
      ),
    })),
    ...(notifications.length === 0 ? [{
      key: 'no-notifications',
      label: (
        <div style={{ textAlign: 'center', padding: '16px 0', color: '#999' }}>
          暂无新消息
        </div>
      ),
    }] : []),
  ];

  return (
    <AntLayout className="layout">
      <Sider trigger={null} collapsible collapsed={collapsed} className="sidebar">
        <div className="logo">
          <h2>{collapsed ? '学习' : '智能学习打卡系统'}</h2>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <AntLayout>
        <Header className="header">
          <div className="header-left">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="trigger"
            />
          </div>
          <div className="header-right">
            <Dropdown
              menu={{ items: notificationMenuItems }}
              placement="bottomRight"
              arrow
              trigger={['click']}
            >
              <Button type="text" icon={<BellOutlined />} className="notification-btn" />
            </Dropdown>
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <div className="user-info">
                <Avatar 
                  src={getAvatarUrl(user?.avatar)} 
                  icon={<UserOutlined />} 
                />
                <span className="username">{user?.username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="content">
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
