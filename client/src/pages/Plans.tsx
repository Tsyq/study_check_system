
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  Progress,
  Tag,
  Typography,
  Row,
  Col,
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Select,
  message,
  Space,
  Divider,
  Checkbox,
  List,
  Empty
} from 'antd';
import { 
  PlusOutlined, 
  BookOutlined,
  EditOutlined,
  DeleteOutlined,
  TrophyOutlined,
  ReloadOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import api from '../services/api';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface StudyPlan {
  _id: string;
  title: string;
  description: string;
  subject: string;
  target: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  completedHours: number;
  progressPercentage: number;
  dailyGoal: number;
  milestones: Array<{
    _id: string;
    title: string;
    description: string;
    targetDate: string;
    isCompleted: boolean;
  }>;
  isActive: boolean;
  isCompleted: boolean;
  createdAt: string;
}

const Plans: React.FC = () => {
  const { user } = useAuth() as any;
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<StudyPlan | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<{
    title: string;
    content: string;
    onOk: () => void;
  } | null>(null);
  const [milestonesModalVisible, setMilestonesModalVisible] = useState(false);
  const [selectedPlanForMilestones, setSelectedPlanForMilestones] = useState<StudyPlan | null>(null);
  const [form] = Form.useForm();

  const predefinedSubjects = [
    '高等数学', '线性代数', '概率论与数理统计', '离散数学', '数学分析',
    'C语言程序设计', 'Java程序设计', 'Python程序设计', 'C++程序设计', '数据结构与算法',
    '计算机组成原理', '操作系统', '计算机网络', '数据库原理', '软件工程',
    '人工智能', '机器学习', '深度学习', '计算机图形学', '数字图像处理',
    '编译原理', '计算机体系结构', '信息安全', '密码学', 'Web开发',
    '移动应用开发', '数据分析', '算法设计与分析', '计算机视觉', '其他'
  ];

  // 获取已使用的科目（用于检查唯一性）
  const getUsedSubjects = useCallback(() => {
    return plans.map(plan => plan.subject).filter(subject => subject && subject !== '');
  }, [plans]);

  // 检查科目唯一性
  const validateSubjectUnique = (value: string, editingPlan: StudyPlan | null) => {
    if (!value.trim()) return Promise.resolve();
    
    const usedSubjects = getUsedSubjects();
    const currentSubject = editingPlan ? editingPlan.subject : null;
    
    // 如果是编辑模式且科目没有更改，则允许
    if (currentSubject === value) {
      return Promise.resolve();
    }
    
    // 检查是否已被使用
    if (usedSubjects.includes(value)) {
      return Promise.reject(new Error(`科目"${value}"已被其他学习计划使用，请选择其他科目`));
    }
    
    return Promise.resolve();
  };

  // 自定义确认对话框函数
  const showConfirmModal = (title: string, content: string, onOk: () => void) => {
    console.log('显示自定义确认对话框');
    setConfirmModalData({ title, content, onOk });
    setConfirmModalVisible(true);
  };

  const handleConfirmOk = () => {
    console.log('用户确认操作');
    if (confirmModalData) {
      confirmModalData.onOk();
    }
    setConfirmModalVisible(false);
    setConfirmModalData(null);
  };

  const handleConfirmCancel = () => {
    console.log('用户取消操作');
    setConfirmModalVisible(false);
    setConfirmModalData(null);
  };

  // 统计数据计算函数
  const calculateStatistics = useCallback(() => {
    if (!plans || plans.length === 0) {
      return {
        totalPlannedHours: 0,
        totalCompletedHours: 0,
        completionRate: 0,
        averageDifference: 0,
        overCompletedPlans: 0,
        underCompletedPlans: 0,
        onTrackPlans: 0,
        totalPlans: 0
      };
    }

    const totalPlannedHours = plans.reduce((sum, plan) => sum + plan.totalHours, 0);
    const totalCompletedHours = plans.reduce((sum, plan) => sum + plan.completedHours, 0);
    const completionRate = totalPlannedHours > 0 ? (totalCompletedHours / totalPlannedHours) * 100 : 0;

    // 计算差异分析
    let overCompletedPlans = 0;
    let underCompletedPlans = 0;
    let onTrackPlans = 0;
    let totalDifference = 0;

    plans.forEach(plan => {
      const difference = plan.completedHours - plan.totalHours;
      totalDifference += difference;
      
      // 允许5%的误差范围
      const tolerance = plan.totalHours * 0.05;
      
      if (difference > tolerance) {
        overCompletedPlans++;
      } else if (difference < -tolerance) {
        underCompletedPlans++;
      } else {
        onTrackPlans++;
      }
    });

    const averageDifference = plans.length > 0 ? totalDifference / plans.length : 0;

    return {
      totalPlannedHours,
      totalCompletedHours,
      completionRate,
      averageDifference,
      overCompletedPlans,
      underCompletedPlans,
      onTrackPlans,
      totalPlans: plans.length
    };
  }, [plans]);

  const fetchPlans = useCallback(async () => {
    try {
      console.log('获取学习计划列表...');
      const response = await api.get('/plans');
      console.log('学习计划数据:', response.data);
      
      // 处理学习计划数据，为没有里程碑的计划动态生成里程碑
      let plansData = response.data.plans || [];
      const plansWithMilestones = await Promise.all(
        plansData.map(async (plan: StudyPlan) => {
          if (!plan.milestones || plan.milestones.length === 0) {
            // 为学习计划动态生成里程碑
            plan.milestones = await generateDynamicMilestones(plan);
          }
          return plan;
        })
      );
      
      setPlans(plansWithMilestones);
    } catch (error: any) {
      console.error('获取学习计划失败:', error);
      console.error('错误详情:', error.response?.data);
      message.error(error.response?.data?.message || '获取学习计划失败');
    }
  }, []);

  // 基于打卡内容动态生成里程碑
  const generateDynamicMilestones = async (plan: StudyPlan): Promise<StudyPlan['milestones']> => {
    try {
      // 获取该学习计划的打卡记录
      const response = await api.get(`/checkins?subject=${encodeURIComponent(plan.subject)}`);
      const checkins = response.data.checkins || [];
      
      const milestones: StudyPlan['milestones'] = [];
      const startDate = dayjs(plan.startDate);
      const endDate = dayjs(plan.endDate);
      const totalDuration = endDate.diff(startDate, 'day');
      
      if (checkins.length === 0) {
        // 如果没有打卡记录，显示基于时间的里程碑
        const weeklyMilestones = Math.floor(totalDuration / 7) || 1;
        for (let i = 1; i <= weeklyMilestones; i++) {
          const targetDate = startDate.add((totalDuration / weeklyMilestones) * i, 'day');
          milestones.push({
            _id: `milestone-time-${Date.now()}-${i}`,
            title: `第${i}周学习目标`,
            description: `完成本周的${plan.subject}学习任务`,
            targetDate: targetDate.format('YYYY-MM-DD'),
            isCompleted: dayjs().isAfter(targetDate) // 如果当前时间超过了目标时间，标记为已完成
          });
        }
      } else {
        // 基于打卡内容生成里程碑
        const distinctTopics = Array.from(new Set(checkins.map((checkin: any) => checkin.content.substring(0, 20))));
        
        distinctTopics.slice(0, 5).forEach((topic, index) => {
          const topicStr = topic as string;
          const targetDate = startDate.add((totalDuration / distinctTopics.length) * (index + 1), 'day');
          const completedCount = checkins.filter((checkin: any) => 
            dayjs(checkin.createdAt).isBefore(targetDate) && 
            checkin.content.includes(topicStr.substring(0, 10))
          ).length;
          
          milestones.push({
            _id: `milestone-content-${Date.now()}-${index}`,
            title: topicStr.length > 20 ? topicStr.substring(0, 20) + '...' : topicStr,
            description: `完成关于"${topicStr}"的学习内容 (${completedCount}次打卡)`,
            targetDate: targetDate.format('YYYY-MM-DD'),
            isCompleted: dayjs().isAfter(targetDate) && completedCount > 0
          });
        });
      }
      
      return milestones;
    } catch (error) {
      console.error('生成动态里程碑失败:', error);
      return [];
    }
  };

  // 计算时间进度
  const calculateTimeProgress = (plan: StudyPlan) => {
    const startDate = dayjs(plan.startDate);
    const endDate = dayjs(plan.endDate);
    const now = dayjs();
    
    if (now.isBefore(startDate)) return 0;
    if (now.isAfter(endDate)) return 100;
    
    const totalDuration = endDate.diff(startDate, 'day');
    const elapsedDuration = now.diff(startDate, 'day');
    
    return Math.round((elapsedDuration / totalDuration) * 100);
  };

  useEffect(() => {
    if (user?.id) {
      fetchPlans();
    }
  }, [user?.id, fetchPlans]);

  const handleCreatePlan = () => {
    setEditingPlan(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditPlan = (plan: StudyPlan) => {
    setEditingPlan(plan);
    form.setFieldsValue({
      ...plan,
      dateRange: [dayjs(plan.startDate), dayjs(plan.endDate)]
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const planData = {
        ...values,
        subject: values.subject,
        startDate: values.dateRange[0].toISOString(),
        endDate: values.dateRange[1].toISOString()
      };
      delete planData.dateRange;

      // 演示模式处理 - 现在也保存到数据库
      if (user?.id === 'demo-user') {
        // 使用demo_user的ID来保存到数据库
        const planDataWithUserId = {
          ...planData,
          user_id: 1 // demo_user的ID
        };

        if (editingPlan) {
          await api.put(`/plans/${editingPlan._id}`, planDataWithUserId);
          message.success('学习计划更新成功（演示模式）');
        } else {
          await api.post('/plans', planDataWithUserId);
          message.success('学习计划创建成功（演示模式）');
        }
        fetchPlans();
      } else {
        // 正常模式
        if (editingPlan) {
          await api.put(`/plans/${editingPlan._id}`, planData);
          message.success('学习计划更新成功');
        } else {
          await api.post('/plans', planData);
          message.success('学习计划创建成功');
        }
        fetchPlans();
      }

      setModalVisible(false);
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    console.log('=== 开始删除流程 ===');
    console.log('planId:', planId);
    
    // 防止重复调用
    if (deletingPlanId) {
      console.log('删除操作正在进行中，忽略重复调用');
      return;
    }

    const planTitle = plans.find(p => p._id === planId)?.title || '未知计划';
    console.log('计划标题:', planTitle);
    
    // 使用自定义确认对话框
    showConfirmModal(
      '确认删除',
      `确定要删除学习计划 "${planTitle}" 吗？此操作不可撤销。`,
      async () => {
        console.log('=== 用户点击了确认删除 ===');
        console.log('开始删除学习计划:', planId);
        setDeletingPlanId(planId);
        
        try {
          console.log('调用删除API...');
          const response = await api.delete(`/plans/${planId}`);
          console.log('删除响应:', response.data);
          message.success(response.data.message || '学习计划删除成功');
          
          // 手动从状态中移除已删除的计划
          setPlans(prevPlans => {
            const newPlans = prevPlans.filter(plan => plan._id !== planId);
            console.log('更新后的计划列表:', newPlans.length);
            return newPlans;
          });
          setSelectedPlans(prev => prev.filter(id => id !== planId));
          
          console.log('学习计划删除完成');
        } catch (error: any) {
          console.error('删除学习计划失败:', error);
          console.error('错误详情:', error.response?.data);
          console.error('错误状态:', error.response?.status);
          message.error(error.response?.data?.message || '删除失败，请检查网络连接');
        } finally {
          setDeletingPlanId(null);
        }
      }
    );
    
    console.log('=== 删除流程准备完成 ===');
  };

  const handleBatchDelete = () => {
    console.log('handleBatchDelete 被调用, selectedPlans:', selectedPlans);
    
    // 使用自定义确认对话框
    showConfirmModal(
      '批量删除确认',
      `确定要删除这 ${selectedPlans.length} 个学习计划吗？此操作不可撤销。`,
      async () => {
        console.log('用户确认批量删除，开始删除学习计划:', selectedPlans);
        try {
          const deletePromises = selectedPlans.map(planId => {
            console.log('删除计划ID:', planId);
            return api.delete(`/plans/${planId}`);
          });
          await Promise.all(deletePromises);
          message.success(`成功删除 ${selectedPlans.length} 个学习计划`);
          
          console.log('批量删除完成，更新状态...');
          // 手动从状态中移除已删除的计划
          setPlans(prevPlans => prevPlans.filter(plan => !selectedPlans.includes(plan._id)));
          setSelectedPlans([]);
          setShowBatchActions(false);
          
          console.log('批量删除操作完成');
        } catch (error: any) {
          console.error('批量删除失败:', error);
          console.error('错误详情:', error.response?.data);
          message.error(error.response?.data?.message || '批量删除失败，请检查网络连接');
        }
      }
    );
    
    console.log('自定义确认对话框已调用');
  };

  const togglePlanSelection = (planId: string) => {
    setSelectedPlans(prev => {
      const newSelected = prev.includes(planId)
        ? prev.filter(id => id !== planId)
        : [...prev, planId];

      if (newSelected.length === 0) {
        setShowBatchActions(false);
      } else {
        setShowBatchActions(true);
      }

      return newSelected;
    });
  };

  const handleViewMilestones = (plan: StudyPlan) => {
    setSelectedPlanForMilestones(plan);
    setMilestonesModalVisible(true);
  };

  // 刷新里程碑数据（重新从打卡内容生成）
  const refreshMilestones = async () => {
    if (!selectedPlanForMilestones) return;
    
    try {
      setMilestonesModalVisible(false);
      const freshMilestones = await generateDynamicMilestones(selectedPlanForMilestones);
      const updatedPlan = {
        ...selectedPlanForMilestones,
        milestones: freshMilestones
      };
      
      setPlans(prevPlans => 
        prevPlans.map(plan => 
          plan._id === selectedPlanForMilestones._id ? updatedPlan : plan
        )
      );
      
      message.success('里程碑数据已在刷新！');
    } catch (error: any) {
      console.error('刷新里程碑失败:', error);
      message.error('刷新失败，请重试');
    }
  };

  const getStatusColor = (plan: StudyPlan) => {
    if (plan.isCompleted) return 'success';
    if (!plan.isActive) return 'default';
    if (plan.progressPercentage >= 80) return 'processing';
    return 'active';
  };

  const getStatusText = (plan: StudyPlan) => {
    if (plan.isCompleted) return '已完成';
    if (!plan.isActive) return '已暂停';
    return '进行中';
  };

  const statistics = calculateStatistics();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>学习计划</Title>
        <Space>
          {showBatchActions && (
            <Button 
              danger
              icon={<DeleteOutlined />}
              onClick={handleBatchDelete}
            >
              批量删除 ({selectedPlans.length})
            </Button>
          )}
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreatePlan}
          >
            创建计划
          </Button>
        </Space>
      </div>

      {/* 计划对比统计面板 */}
      {statistics.totalPlans > 0 && (
        <Card style={{ marginBottom: 24, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <BarChartOutlined style={{ marginRight: 8, fontSize: 20, color: '#1890ff' }} />
            <Title level={4} style={{ margin: 0 }}>计划对比统计</Title>
          </div>
          
          <Row gutter={[16, 16]}>
            {/* 总体完成情况 */}
            <Col xs={24} sm={12} lg={6}>
              <div style={{ padding: 16, borderRadius: 8, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <ClockCircleOutlined style={{ fontSize: 16, marginRight: 8 }} />
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>总计划时长</Text>
                </div>
                <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                  {statistics.totalPlannedHours.toFixed(1)} 小时
                </div>
              </div>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <div style={{ padding: 16, borderRadius: 8, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <CheckCircleOutlined style={{ fontSize: 16, marginRight: 8 }} />
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>实际完成时长</Text>
                </div>
                <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                  {statistics.totalCompletedHours.toFixed(1)} 小时
                </div>
              </div>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <div style={{ padding: 16, borderRadius: 8, background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <BarChartOutlined style={{ fontSize: 16, marginRight: 8 }} />
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>完成率</Text>
                </div>
                <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                  {statistics.completionRate.toFixed(1)}%
                </div>
              </div>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <div style={{ padding: 16, borderRadius: 8, background: statistics.averageDifference >= 0 ? 'linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%)' : 'linear-gradient(135deg, #ff6b6b 0%, #ffa8a8 100%)', color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  {statistics.averageDifference >= 0 ? <CheckCircleOutlined /> : <WarningOutlined />}
                  <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 8 }}>平均差异</Text>
                </div>
                <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                  {statistics.averageDifference >= 0 ? '+' : ''}{statistics.averageDifference.toFixed(1)} 小时
                </div>
              </div>
            </Col>
          </Row>

          {/* 差异分析 */}
          <div style={{ marginTop: 16 }}>
            <Title level={5} style={{ color: '#666', marginBottom: 12 }}>差异分析</Title>
            <Row gutter={[16, 8]}>
              <Col xs={24} md={8}>
                <div style={{ padding: 12, borderRadius: 6, background: '#f6f8fa', textAlign: 'center' }}>
                  <div style={{ color: '#52c41a', fontSize: 18, fontWeight: 'bold' }}>{statistics.overCompletedPlans}</div>
                  <div style={{ color: '#666', fontSize: 12 }}>超前完成</div>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div style={{ padding: 12, borderRadius: 6, background: '#f6f8fa', textAlign: 'center' }}>
                  <div style={{ color: '#1890ff', fontSize: 18, fontWeight: 'bold' }}>{statistics.onTrackPlans}</div>
                  <div style={{ color: '#666', fontSize: 12 }}>正常进度</div>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div style={{ padding: 12, borderRadius: 6, background: '#f6f8fa', textAlign: 'center' }}>
                  <div style={{ color: '#ff4d4f', fontSize: 18, fontWeight: 'bold' }}>{statistics.underCompletedPlans}</div>
                  <div style={{ color: '#666', fontSize: 12 }}>进度滞后</div>
                </div>
              </Col>
            </Row>
          </div>

          {/* 完成情况解释 */}
          <div style={{ marginTop: 12, padding: 12, background: '#fafafa', borderRadius: 6 }}>
            <Text style={{ fontSize: 12, color: '#666' }}>
              💡 差异分析基于5%的容忍误差，帮助识别学习进度的偏差情况。超前完成表示实际用时比计划少，进度滞后表示需要更多时间完成计划。
            </Text>
          </div>
        </Card>
      )}

      <Row gutter={[16, 16]}>
        {plans.map(plan => (
          <Col xs={24} sm={12} lg={8} key={plan._id}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Checkbox 
                    checked={selectedPlans.includes(plan._id)}
                    onChange={() => togglePlanSelection(plan._id)}
                  />
                  <span style={{ flex: 1 }}>{plan.title}</span>
                </div>
              }
              extra={
                <Space>
                  <Button 
                    type="text" 
                    icon={<EditOutlined />}
                    onClick={() => handleEditPlan(plan)}
                    title="编辑计划"
                  />
                  <Button 
                    type="text" 
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeletePlan(plan._id)}
                    title="删除计划"
                        loading={deletingPlanId === plan._id}
                        disabled={deletingPlanId === plan._id}
                  />
                </Space>
              }
              actions={[
                <Button 
                  type="link" 
                  icon={<TrophyOutlined />}
                  onClick={() => handleViewMilestones(plan)}
                >
                  查看里程碑
                </Button>
              ]}
            >
              <div style={{ marginBottom: 16 }}>
                <Tag color="blue" icon={<BookOutlined />}>
                  {plan.subject}
                </Tag>
                <Tag color={getStatusColor(plan)}>
                  {getStatusText(plan)}
                </Tag>
              </div>

              <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                {plan.description}
              </Text>

              <div style={{ marginBottom: 16 }}>
                <Text strong>目标：</Text>
                <Text>{plan.target}</Text>
              </div>

              <div style={{ marginBottom: 16 }}>
                <Text strong>进度：</Text>
                <Progress 
                  percent={plan.progressPercentage} 
                  status={plan.progressPercentage === 100 ? 'success' : 'active'}
                  size="small"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {plan.completedHours.toFixed(1)} / {plan.totalHours} 小时
                  </Text>
                  <Text 
                    type="secondary" 
                    style={{ 
                      fontSize: 11, 
                      color: plan.completedHours > plan.totalHours ? '#52c41a' : plan.completedHours < plan.totalHours * 0.8 ? '#ff4d4f' : '#1890ff'
                    }}
                  >
                    {plan.completedHours > plan.totalHours ? `+${(plan.completedHours - plan.totalHours).toFixed(1)}h` : `${((plan.totalHours - plan.completedHours) / plan.totalHours * 100).toFixed(0)}%`}
                    {plan.completedHours > plan.totalHours ? ' 超前' : plan.completedHours < plan.totalHours * 0.8 ? ' 滞后' : ' 正常'}
                  </Text>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <Text strong>时间：</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {dayjs(plan.startDate).format('YYYY-MM-DD')} 至 {dayjs(plan.endDate).format('YYYY-MM-DD')}
                </Text>
              </div>

              <div>
                <Text strong>每日目标：</Text>
                <Text>{plan.dailyGoal} 分钟</Text>
              </div>

              {plan.milestones && plan.milestones.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <Divider style={{ margin: '12px 0' }} />
                  <Text strong>里程碑：</Text>
                  <div style={{ marginTop: 8 }}>
                    {plan.milestones.slice(0, 2).map(milestone => (
                      <div key={milestone._id} style={{ marginBottom: 4 }}>
                        <Text 
                          style={{ 
                            textDecoration: milestone.isCompleted ? 'line-through' : 'none',
                            color: milestone.isCompleted ? '#999' : undefined
                          }}
                        >
                          {milestone.title}
                        </Text>
                      </div>
                    ))}
                    {plan.milestones.length > 2 && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        +{plan.milestones.length - 2} 更多...
                      </Text>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title={editingPlan ? '编辑学习计划' : '创建学习计划'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="title"
            label="计划标题"
            rules={[{ required: true, message: '请输入计划标题' }]}
          >
            <Input placeholder="例如：准备期末考试" />
          </Form.Item>

          <Form.Item
            name="description"
            label="计划描述"
          >
            <TextArea rows={3} placeholder="描述你的学习计划..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="subject"
                label="学习科目"
                rules={[
                  { required: true, message: '请选择学习科目' },
                  {
                    validator: (_, value) => validateSubjectUnique(value, editingPlan)
                  }
                ]}
              >
                <Select
                  placeholder="选择学习科目"
                  showSearch
                  allowClear
                  filterOption={(input, option) =>
                    option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? true
                  }
                >
                  {predefinedSubjects.map(subject => (
                    <Select.Option key={subject} value={subject}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{subject}</span>
                        {getUsedSubjects().includes(subject) && (
                          <span style={{ color: '#ff4d4f', fontSize: '12px' }}>（已使用）</span>
                        )}
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

            </Col>
            <Col span={12}>
              <Form.Item
                name="totalHours"
                label="总学习时长"
                rules={[{ required: true, message: '请输入总学习时长' }]}
              >
                <InputNumber
                  min={1}
                  placeholder="小时"
                  style={{ width: '100%' }}
                  addonAfter="小时"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="target"
            label="学习目标"
            rules={[{ required: true, message: '请输入学习目标' }]}
          >
            <Input placeholder="例如：掌握所有知识点，通过考试" />
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="计划时间"
            rules={[{ required: true, message: '请选择计划时间' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="dailyGoal"
            label="每日目标"
            initialValue={60}
          >
            <InputNumber
              min={1}
              placeholder="分钟"
              style={{ width: '100%' }}
              addonAfter="分钟"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingPlan ? '更新计划' : '创建计划'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 自定义确认对话框 */}
      <Modal
        title={confirmModalData?.title || '确认'}
        open={confirmModalVisible}
        onOk={handleConfirmOk}
        onCancel={handleConfirmCancel}
        okText="确认"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        centered
        maskClosable={false}
      >
        <p style={{ margin: '16px 0', fontSize: '14px' }}>
          {confirmModalData?.content || ''}
        </p>
      </Modal>

      {/* 里程碑查看对话框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrophyOutlined style={{ color: '#faad14' }} />
            <span>学习里程碑 - {selectedPlanForMilestones?.title}</span>
          </div>
        }
        open={milestonesModalVisible}
        onCancel={() => setMilestonesModalVisible(false)}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={refreshMilestones} icon={<ReloadOutlined />}>
              刷新里程碑
            </Button>
            <Button type="primary" style={{ marginLeft: 8 }} onClick={() => setMilestonesModalVisible(false)}>
              关闭
            </Button>
          </div>
        }
        width={600}
        centered
      >
        <div style={{ marginTop: 16 }}>
          {selectedPlanForMilestones?.milestones && selectedPlanForMilestones.milestones.length > 0 ? (
            <div>
              {/* 时间进度概览 */}
              <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text strong>学习时间进度</Text>
                  <Text type="secondary">
                    {dayjs(selectedPlanForMilestones.startDate).format('YYYY-MM-DD')} 至 {dayjs(selectedPlanForMilestones.endDate).format('YYYY-MM-DD')}
                  </Text>
                </div>
                <Progress 
                  percent={calculateTimeProgress(selectedPlanForMilestones)} 
                  size="small"
                  status={calculateTimeProgress(selectedPlanForMilestones) === 100 ? 'success' : 'active'}
                  format={(percent) => `剩余 ${dayjs(selectedPlanForMilestones.endDate).diff(dayjs(), 'day')} 天`}
                />
                <Text type="secondary" style={{ fontSize: 12, marginTop: 8 }}>
                  总时长: {dayjs(selectedPlanForMilestones.endDate).diff(dayjs(selectedPlanForMilestones.startDate), 'day')} 天
                </Text>
              </div>
              
              <List
              dataSource={selectedPlanForMilestones.milestones}
              renderItem={milestone => {
                const isOverdue = dayjs().isAfter(milestone.targetDate) && !milestone.isCompleted;
                const isUpcoming = dayjs().add(7, 'day').isAfter(milestone.targetDate) && !milestone.isCompleted;
                
                return (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ 
                            textDecoration: milestone.isCompleted ? 'line-through' : 'none',
                            color: milestone.isCompleted ? '#8c8c8c' : 'inherit'
                          }}>
                            {milestone.title}
                          </span>
                          {milestone.isCompleted && (
                            <Tag color="success" icon={<TrophyOutlined />}>
                              已完成
                            </Tag>
                          )}
                          {isOverdue && (
                            <Tag color="error">已逾期</Tag>
                          )}
                          {isUpcoming && !milestone.isCompleted && (
                            <Tag color="orange">即将到期</Tag>
                          )}
                        </div>
                      }
                      description={
                        <div>
                          <div style={{ marginBottom: 8 }}>
                            {milestone.description}
                          </div>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            目标完成时间：{dayjs(milestone.targetDate).format('YYYY年MM月DD日')}
                          </Text>
                          {milestone.isCompleted && (
                            <Text type="secondary" style={{ fontSize: '12px', marginLeft: 16 }}>
                              ✅ 基于打卡内容自动确认完成
                            </Text>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />
            </div>
          ) : (
            <Empty
              description="暂无可查看的里程碑"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Text type="secondary">
                创建学习计划时设置里程碑，完成后可在此处查看和管理
              </Text>
            </Empty>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Plans;
