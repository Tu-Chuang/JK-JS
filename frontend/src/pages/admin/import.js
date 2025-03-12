import { useState } from 'react';
import { Button, Card, Space, notification, Radio, Spin, Typography } from 'antd';
import axios from 'axios';

const { Title, Paragraph, Text } = Typography;

export default function ImportPage() {
  const [loading, setLoading] = useState(false);
  const [useBackend, setUseBackend] = useState(false);

  const runImport = async () => {
    setLoading(true);
    
    try {
      const response = await axios.post('/api/import', {
        useBackend
      });
      
      notification.success({
        message: '导入成功',
        description: '文档已成功导入到Meilisearch',
        duration: 5,
      });
      
    } catch (error) {
      notification.error({
        message: '导入失败',
        description: error.response?.data?.message || error.message,
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px' }}>
      <Title level={2}>文档导入工具</Title>
      
      <Card title="导入设置" style={{ marginBottom: 20 }}>
        <Paragraph>
          此工具将从指定目录读取JSON文件，并将其导入到Meilisearch索引中。请确保Meilisearch服务正在运行。
        </Paragraph>
        
        <div style={{ marginBottom: 20 }}>
          <Text strong>选择文档来源：</Text>
          <Radio.Group 
            value={useBackend} 
            onChange={e => setUseBackend(e.target.value)}
            style={{ marginLeft: 10 }}
          >
            <Radio value={false}>使用根目录下的Doc目录</Radio>
            <Radio value={true}>使用backend/Doc目录</Radio>
          </Radio.Group>
        </div>
        
        <Text type="warning">
          警告：此操作将重置现有索引并重新导入所有文档。这可能需要几分钟时间，请耐心等待。
        </Text>
      </Card>
      
      <Space>
        <Button 
          type="primary" 
          size="large" 
          onClick={runImport}
          loading={loading}
          disabled={loading}
        >
          开始导入
        </Button>
        
        <Button 
          size="large" 
          onClick={() => window.location.href = '/admin/configure'}
          disabled={loading}
        >
          返回配置
        </Button>
      </Space>
      
      {loading && (
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Spin size="large" />
          <Paragraph style={{ marginTop: 10 }}>
            正在导入文档，请勿关闭此页面...
          </Paragraph>
        </div>
      )}
    </div>
  );
} 