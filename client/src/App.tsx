import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Checkin from './pages/Checkin';
import Plans from './pages/Plans';
import Social from './pages/Social';
import Stats from './pages/Stats';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/login" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="checkin" element={<Checkin />} />
                  <Route path="plans" element={<Plans />} />
                  <Route path="social" element={<Social />} />
                  <Route path="stats" element={<Stats />} />
                  <Route path="profile" element={<Profile />} />
                </Route>
              </Routes>
            </div>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;