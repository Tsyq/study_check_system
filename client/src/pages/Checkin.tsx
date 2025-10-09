import React, { useState, useEffect, useCallback } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Card,
  Typography,
  Row,
  Col,
  List,
  Tag,
  message,
  Space,
  Modal,
  Calendar,
  Badge,
  DatePicker
} from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import locale from 'antd/es/date-picker/locale/zh_CN';
import {
  ClockCircleOutlined,
  BookOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface CheckinRecord {
  id: number;
  content: string;
  studyTime: number;
  subject: string;
  mood: string;
  location: string;
  tags: string[] | any;
  createdAt: string;
  user: {
    id: number;
    username: string;
    avatar: string;
  };
  likes: Array<{
    user: {
      id: number;
      username: string;
    };
  }>;
  comments: Array<{
    id: string;
    content: string;
    user: {
      id: number;
      username: string;
    };
    createdAt: string;
  }>;
}

const Checkin: React.FC = () => {
  // 设置 dayjs 全局为中文
  dayjs.locale('zh-cn');
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [checkins, setCheckins] = useState<CheckinRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [lastCheckinData, setLastCheckinData] = useState<any>(null);
  const [userSubjects, setUserSubjects] = useState<string[]>([]);
  const [isBackfillMode, setIsBackfillMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  // 日历弹窗状态
  const [calendarModal, setCalendarModal] = useState<{ visible: boolean, date: string, items: CheckinRecord[] }>({ visible: false, date: '', items: [] });
  // 日历数据分组
  const checkinMap: Record<string, CheckinRecord[]> = React.useMemo(() => {
    const map: Record<string, CheckinRecord[]> = {};
    checkins.forEach((item: CheckinRecord) => {
      const date = dayjs(item.createdAt).format('YYYY-MM-DD');
      if (!map[date]) map[date] = [];
      map[date].push(item);
    });
    return map;
  }, [checkins]);

  // 日历单元格渲染
  const dateCellRender = (value: any) => {
    const dateStr = value.format('YYYY-MM-DD');
    const items = checkinMap[dateStr] || [];
    return (
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {items.length > 0 && (
          <li>
            <Badge status="success" text={`打卡${items.length}次`} />
          </li>
        )}
      </ul>
    );
  };

  // 日历点击事件
  const onSelectDate = (value: any) => {
    const dateStr = value.format('YYYY-MM-DD');
    const items = checkinMap[dateStr] || [];
    setCalendarModal({ visible: true, date: dateStr, items });
  };

  const predefinedSubjects = [
    '高等数学', '线性代数', '概率论与数理统计', '离散数学', '数学分析',
    'C语言程序设计', 'Java程序设计', 'Python程序设计', 'C++程序设计', '数据结构与算法',
    '计算机组成原理', '操作系统', '计算机网络', '数据库原理', '软件工程',
    '人工智能', '机器学习', '深度学习', '计算机图形学', '数字图像处理',
    '编译原理', '计算机体系结构', '信息安全', '密码学', 'Web开发',
    '移动应用开发', '数据分析', '算法设计与分析', '计算机视觉', '其他'
  ];

  const moods = [
    { value: 'excited', label: '兴奋', color: 'red' },
    { value: 'happy', label: '开心', color: 'green' },
    { value: 'normal', label: '正常', color: 'blue' },
    { value: 'tired', label: '疲惫', color: 'orange' },
    { value: 'frustrated', label: '沮丧', color: 'purple' }
  ];

  // 获取用户的学习计划科目
  const fetchUserPlans = async () => {
    try {
      const response = await api.get('/plans');
      const plans = response.data.plans || [];
      const subjects = plans.map((plan: any) => plan.subject).filter((subject: string) => subject);
      setUserSubjects(subjects);
    } catch (error) {
      console.error('获取用户学习计划失败:', error);
    }
  };

  const fetchCheckins = useCallback(async () => {
    try {
      // 只获取当前用户自己的打卡记录
      const response = await api.get(`/checkins?userId=${user?.id}&limit=20`);
      setCheckins(response.data.checkins);
    } catch (error) {
      message.error('获取打卡记录失败');
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchCheckins();
      fetchUserPlans();
    }
  }, [user, fetchCheckins]);

  // 移除 checkTodayCheckin 逻辑

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      console.log('发送打卡数据:', values);
      
      // 确保数据类型正确并映射字段名
      const submitData = {
        content: values.content?.trim() || '',
        studyTime: parseInt(values.studyTime) || 0,
        subject: values.subject?.trim() || '',
        images: values.images || [],
        mood: values.mood || 'normal',
        location: values.location || '',
        tags: values.tags || [],
        isPublic: values.isPublic !== undefined ? !!values.isPublic : true,
        // 如果是补卡模式，添加学习日期
        ...(isBackfillMode && selectedDate && { studyDate: selectedDate.format('YYYY-MM-DD') })
      };
      
      console.log('处理后的打卡数据:', submitData);
      
      const response = await api.post('/checkins', submitData);
      console.log('打卡成功响应:', response.data);

      // 保存打卡数据用于显示
      setLastCheckinData({
        ...submitData,
        createdAt: new Date().toISOString()
      });

      // 重置表单
      form.resetFields();
      
      // 重置补卡模式
      setIsBackfillMode(false);
      setSelectedDate(null);

      // 刷新打卡记录
      fetchCheckins();
      // 刷新用户科目列表（以防添加了新科目）
      fetchUserPlans();

      // 显示成功模态框
      setSuccessModalVisible(true);
      
      // 延迟刷新页面以确保日历立即更新
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error: any) {
      console.error('打卡失败:', error);
      console.error('错误详情:', error.response?.data);
      message.error(error.response?.data?.message || '打卡失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessModalClose = () => {
    setSuccessModalVisible(false);
    setLastCheckinData(null);
    // 关闭模态框后重置表单，允许继续打卡
    form.resetFields();
  };



  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`;
  };

  const getMoodConfig = (mood: string) => {
    return moods.find(m => m.value === mood) || moods[2];
  };


  return (
    <div>
      <Title level={2}>学习打卡</Title>

      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%)', padding: '40px 0' }}>
        <Row gutter={[32, 32]} justify="center">
          {/* 左侧：新增打卡表单 */}
          <Col xs={24} lg={8}>
            <Card title={isBackfillMode ? "补卡" : "今日打卡"} bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 24px #bdbdbd30', background: '#fff' }}>
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                size="large"
              >
                {/* 补卡模式切换 */}
                <Form.Item>
                  <Space>
                    <Button 
                      type={isBackfillMode ? "default" : "primary"}
                      onClick={() => {
                        setIsBackfillMode(false);
                        setSelectedDate(null);
                        form.resetFields();
                      }}
                    >
                      今日打卡
                    </Button>
                    <Button 
                      type={isBackfillMode ? "primary" : "default"}
                      onClick={() => {
                        setIsBackfillMode(true);
                        setSelectedDate(dayjs().subtract(1, 'day'));
                      }}
                    >
                      补卡
                    </Button>
                  </Space>
                </Form.Item>

                {/* 补卡日期选择 */}
                {isBackfillMode && (
                  <Form.Item
                    name="studyDate"
                    label="学习日期"
                    rules={[{ required: true, message: '请选择学习日期' }]}
                    initialValue={dayjs().subtract(1, 'day')}
                  >
                    <DatePicker
                      style={{ width: '100%' }}
                      placeholder="选择学习日期"
                      disabledDate={(current) => {
                        // 不能选择未来日期
                        return current && current > dayjs().endOf('day');
                      }}
                      onChange={(date) => setSelectedDate(date)}
                    />
                  </Form.Item>
                )}

                <Form.Item
                  name="content"
                  label="学习内容"
                  rules={[{ required: true, message: '请描述今天的学习内容' }]}
                >
                  <TextArea
                    rows={4}
                    placeholder="今天学习了什么？有什么收获？"
                    maxLength={500}
                    showCount
                  />
                </Form.Item>

                <Form.Item
                  name="studyTime"
                  label="学习时长"
                  initialValue={60}
                  rules={[{ required: true, message: '请输入学习时长' }]}
                >
                  <InputNumber
                    min={1}
                    max={1440}
                    placeholder="分钟"
                    style={{ width: '100%' }}
                    addonAfter="分钟"
                    prefix={<ClockCircleOutlined />}
                  />
                </Form.Item>

                <Form.Item
                  name="subject"
                  label="学习科目"
                  rules={[{ required: true, message: '请选择学习科目' }]}
                >
                  <Select placeholder="选择学习科目" prefix={<BookOutlined />}>
                    {predefinedSubjects.map(subject => (
                      <Option key={subject} value={subject}>
                        {subject}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="mood"
                  label="学习心情"
                  initialValue="normal"
                >
                  <Select placeholder="选择心情">
                    {moods.map(mood => (
                      <Option key={mood.value} value={mood.value}>
                        <Tag color={mood.color}>{mood.label}</Tag>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="location"
                  label="学习地点"
                >
                  <Input placeholder="在哪里学习的？" />
                </Form.Item>

                <Form.Item
                  name="tags"
                  label="标签"
                >
                  <Input placeholder="请输入标签，多个标签用逗号分隔" />
                </Form.Item>

                <Form.Item>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={submitting}
                      block
                      size="large"
                      style={{ background: 'linear-gradient(90deg, #6366f1 0%, #06b6d4 100%)', border: 'none' }}
                    >
                      完成打卡
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          {/* 右侧：打卡日历 */}
          <Col xs={24} lg={12}>
            <Card title="我的打卡日历" bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 24px #bdbdbd30', background: '#f8fafc' }}>
              <Calendar
                dateCellRender={dateCellRender}
                // 只在点击具体日期时弹窗
                onSelect={(date, info) => {
                  // 只在点击天视图时弹窗，切换月/年不弹窗
                  if (info && info.source === 'date') {
                    onSelectDate(date);
                  }
                }}
                locale={locale}
                style={{ background: '#f8fafc', borderRadius: 12, padding: 12 }}
                headerRender={headerProps => {
                  const { value, onChange } = headerProps;
                  const year = value.year();
                  const month = value.month() + 1;
                  return (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, padding: 8 }}>
                      <Button size="small" onClick={() => onChange(value.clone().subtract(1, 'month'))}>{'<'}</Button>
                      <span style={{ fontWeight: 600, fontSize: 18, color: '#6366f1' }}>{year}年{month}月</span>
                      <Button size="small" onClick={() => onChange(value.clone().add(1, 'month'))}>{'>'}</Button>
                    </div>
                  );
                }}
              />
            </Card>
          </Col>
        </Row>
      </div>
      {/* 日历弹窗，显示当天所有打卡详情 */}
      <Modal
        title={calendarModal.date + ' 打卡详情'}
        open={calendarModal.visible}
        onCancel={() => setCalendarModal({ ...calendarModal, visible: false })}
        footer={null}
        width={500}
      >
        {calendarModal.items.length === 0 ? (
          <Text type="secondary">这一天没有打卡记录</Text>
        ) : (
          <List
            dataSource={calendarModal.items}
            renderItem={(item: CheckinRecord) => (
              <List.Item>
                <Card size="small" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
                    <Tag color={getMoodConfig(item.mood).color}>{getMoodConfig(item.mood).label}</Tag>
                  </div>
                  <Text style={{ display: 'block', marginBottom: 8 }}>{item.content}</Text>
                  <Space>
                    <Tag icon={<BookOutlined />}>{item.subject}</Tag>
                    <Tag icon={<ClockCircleOutlined />}>{formatTime(item.studyTime)}</Tag>
                    {item.location && <Tag>{item.location}</Tag>}
                  </Space>
                  {item.tags && Array.isArray(item.tags) && item.tags.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {item.tags.filter(tag => typeof tag === 'string').map((tag: string) => (
                        <Tag key={tag} color="blue">{tag}</Tag>
                      ))}
                    </div>
                  )}
                </Card>
              </List.Item>
            )}
          />
        )}
      </Modal>
      {/* 打卡成功模态框 */}
      <Modal
        title="打卡成功！"
        open={successModalVisible}
        onCancel={handleSuccessModalClose}
        footer={[
          <Button key="close" type="primary" onClick={handleSuccessModalClose}>
            继续打卡
          </Button>
        ]}
        centered
        width={400}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 16, color: '#52c41a' }}>
              🎉 恭喜您完成学习打卡！
            </Text>
          </div>

          {lastCheckinData && (
            <div style={{
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16
            }}>
              <div style={{ marginBottom: 8 }}>
                <Text strong>学习科目：</Text>
                <Tag color="blue" style={{ marginLeft: 8 }}>{lastCheckinData.subject}</Tag>
              </div>

              <div style={{ marginBottom: 8 }}>
                <Text strong>学习时长：</Text>
                <Text style={{ color: '#1890ff', marginLeft: 8 }}>
                  {formatTime(lastCheckinData.studyTime)}
                </Text>
              </div>

              <div style={{ marginBottom: 8 }}>
                <Text strong>学习心情：</Text>
                <Tag
                  color={getMoodConfig(lastCheckinData.mood).color}
                  style={{ marginLeft: 8 }}
                >
                  {getMoodConfig(lastCheckinData.mood).label}
                </Tag>
              </div>

              {lastCheckinData.content && (
                <div>
                  <Text strong>学习内容：</Text>
                  <Text style={{ marginLeft: 8 }}>{lastCheckinData.content}</Text>
                </div>
              )}
            </div>
          )}

          <Text type="secondary" style={{ fontSize: 12 }}>
            点击"继续打卡"可以立即进行下一次学习打卡
          </Text>
        </div>
      </Modal>
    </div>
  );
};

export default Checkin;
