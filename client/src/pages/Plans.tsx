import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  List, 
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
  Divider
} from 'antd';
import { 
  PlusOutlined, 
  CalendarOutlined, 
  ClockCircleOutlined,
  BookOutlined,
  EditOutlined,
  DeleteOutlined,
  TrophyOutlined
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
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<StudyPlan | null>(null);
  const [form] = Form.useForm();

  const subjects = [
    '数学', '英语', '语文', '物理', '化学', '生物', 
    '历史', '地理', '政治', '计算机', '编程', '设计', 
    '音乐', '美术', '体育', '其他'
  ];

  useEffect(() => {
    if (user?.id === 'demo-user') {
      // 演示模式，使用模拟数据
      setPlans([
        {
          _id: '1',
          title: 'React学习计划',
          description: '深入学习React框架，掌握现代前端开发技能',
          subject: '编程',
          target: '掌握React核心概念和最佳实践',
          startDate: new Date(Date.now() - 15 * 86400000).toISOString(),
          endDate: new Date(Date.now() + 15 * 86400000).toISOString(),
          totalHours: 50,
          completedHours: 32.5,
          progressPercentage: 65,
          dailyGoal: 120,
          milestones: [
            {
              _id: '1',
              title: '完成基础语法学习',
              description: '掌握JSX、组件、Props等基础概念',
              targetDate: new Date(Date.now() - 5 * 86400000).toISOString(),
              isCompleted: true
            },
            {
              _id: '2',
              title: '学习Hooks',
              description: '掌握useState、useEffect等常用Hooks',
              targetDate: new Date(Date.now() + 5 * 86400000).toISOString(),
              isCompleted: false
            }
          ],
          isActive: true,
          isCompleted: false,
          createdAt: new Date(Date.now() - 15 * 86400000).toISOString()
        },
        {
          _id: '2',
          title: '期末考试复习',
          description: '全面复习数学课程，准备期末考试',
          subject: '数学',
          target: '期末考试达到90分以上',
          startDate: new Date(Date.now() - 7 * 86400000).toISOString(),
          endDate: new Date(Date.now() + 8 * 86400000).toISOString(),
          totalHours: 30,
          completedHours: 12,
          progressPercentage: 40,
          dailyGoal: 90,
          milestones: [
            {
              _id: '3',
              title: '完成基础概念复习',
              description: '复习所有基础数学概念和公式',
              targetDate: new Date(Date.now() + 3 * 86400000).toISOString(),
              isCompleted: false
            }
          ],
          isActive: true,
          isCompleted: false,
          createdAt: new Date(Date.now() - 7 * 86400000).toISOString()
        }
      ]);
      setLoading(false);
    } else {
      fetchPlans();
    }
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await api.get('/plans');
      setPlans(response.data.plans);
    } catch (error) {
      message.error('获取学习计划失败');
    } finally {
      setLoading(false);
    }
  };

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
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个学习计划吗？',
      onOk: async () => {
        try {
          if (user?.id === 'demo-user') {
            // 演示模式：也删除数据库中的记录
            await api.delete(`/plans/${planId}`);
            message.success('学习计划删除成功（演示模式）');
            fetchPlans();
          } else {
            // 正常模式：API删除
            await api.delete(`/plans/${planId}`);
            message.success('学习计划删除成功');
            fetchPlans();
          }
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>学习计划</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleCreatePlan}
        >
          创建计划
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {plans.map(plan => (
          <Col xs={24} sm={12} lg={8} key={plan._id}>
            <Card
              title={plan.title}
              extra={
                <Space>
                  <Button 
                    type="text" 
                    icon={<EditOutlined />}
                    onClick={() => handleEditPlan(plan)}
                  />
                  <Button 
                    type="text" 
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeletePlan(plan._id)}
                  />
                </Space>
              }
              actions={[
                <Button type="link" icon={<TrophyOutlined />}>
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
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {plan.completedHours} / {plan.totalHours} 小时
                </Text>
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
                rules={[{ required: true, message: '请选择学习科目' }]}
              >
                <Select placeholder="选择科目">
                  {subjects.map(subject => (
                    <Select.Option key={subject} value={subject}>{subject}</Select.Option>
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
    </div>
  );
};

export default Plans;
