import React, { useState, useEffect } from 'react';
import { configureIndex, getIndexSettings } from '../../services/meilisearch';
import styled from 'styled-components';
import Head from 'next/head';
import Navbar from '../../components/Navbar';
import { Button, Form, Input, Card, Space, Switch, Typography, notification } from 'antd';
import axios from 'axios';

const { Title, Text } = Typography;

export default function Configure() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);

  // 获取当前设置
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/settings');
      setSettings(response.data);
      form.setFieldsValue(response.data);
    } catch (error) {
      console.error('获取设置失败', error);
    }
  };

  const handleConfigure = async (values) => {
    setLoading(true);
    try {
      await axios.post('/api/configure', {
        settings: values
      });
      notification.success({
        message: '设置成功',
        description: '索引设置已更新',
      });
    } catch (error) {
      notification.error({
        message: '设置失败',
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Head>
        <title>配置 Meilisearch 索引</title>
      </Head>

      <Navbar />

      <Container>
        <h1>Meilisearch 索引配置</h1>

        <Card title={<Title level={2}>索引配置</Title>}>
          <Form 
            form={form}
            layout="vertical"
            onFinish={handleConfigure}
            initialValues={settings || {}}
          >
            <Form.Item
              name={['searchableAttributes']}
              label="可搜索字段"
              extra="设置哪些字段可以被搜索，按优先级排序"
            >
              <Input.TextArea 
                rows={4} 
                placeholder="每行一个字段名，例如：title.zh_CN"
                disabled={loading}
              />
            </Form.Item>

            <Form.Item
              name={['filterableAttributes']}
              label="可筛选字段"
              extra="设置哪些字段可以用于筛选"
            >
              <Input.TextArea 
                rows={4} 
                placeholder="每行一个字段名，例如：volume"
                disabled={loading}
              />
            </Form.Item>

            <Form.Item
              name={['sortableAttributes']}
              label="可排序字段"
              extra="设置哪些字段可以用于排序"
            >
              <Input.TextArea 
                rows={4} 
                placeholder="每行一个字段名，例如：year"
                disabled={loading}
              />
            </Form.Item>
            
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
              >
                保存设置
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/admin/import'}
                disabled={loading}
              >
                文档导入
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/'}
                disabled={loading}
              >
                返回首页
              </Button>
            </Space>
          </Form>
        </Card>
      </Container>
    </div>
  );
}

const Container = styled.div`
  max-width: 1200px;
  margin: 80px auto 0;
  padding: 20px;
`;

const Section = styled.div`
  margin: 20px 0;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  pre {
    background: #f5f5f5;
    padding: 15px;
    border-radius: 4px;
    overflow-x: auto;
  }

  body.dark-theme & {
    background: #2d2d2d;
    
    pre {
      background: #1d1d1d;
    }
  }
`;

const ConfigureButton = styled.button`
  padding: 10px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;

  &:hover {
    background: var(--primary-dark);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const Message = styled.div`
  padding: 15px;
  margin: 10px 0;
  border-radius: 4px;
`;

const Error = styled(Message)`
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ef9a9a;
`;

const Success = styled(Message)`
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #a5d6a7;
`;

const Loading = styled.div`
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
`; 