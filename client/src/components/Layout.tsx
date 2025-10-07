import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Button, Badge } from 'antd';
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
import './Layout.css';

const { Header, Sider, Content } = AntLayout;

const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, demoMode, exitDemoMode } = useAuth() as any;
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
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
    ...(demoMode ? [{
      key: 'exit-demo',
      icon: <LogoutOutlined />,
      label: '退出演示模式',
      onClick: () => {
        exitDemoMode();
        navigate('/login');
      },
    }] : [{
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout,
    }]),
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

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
            {demoMode && (
              <div style={{ 
                marginRight: 16, 
                padding: '4px 12px', 
                backgroundColor: '#ff4d4f', 
                color: 'white', 
                borderRadius: 12, 
                fontSize: 12,
                fontWeight: 'bold'
              }}>
                🎯 演示模式
              </div>
            )}
            <Badge count={0} size="small">
              <Button type="text" icon={<BellOutlined />} className="notification-btn" />
            </Badge>
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <div className="user-info">
                <Avatar src={user?.avatar || undefined} icon={<UserOutlined />} />
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
