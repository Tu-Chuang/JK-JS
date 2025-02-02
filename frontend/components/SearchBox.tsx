import { useState } from 'react';
import { Input, List, Spin, Typography, message } from 'antd';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import styles from '../styles/SearchBox.module.css';

const { Text } = Typography;

interface SearchResult {
  id: string;
  metadata: {
    zh_CN: {
      display: {
        title: string;
        speaker: string;
        date: string;
      }
    }
  };
  content: {
    sections: Array<{
      paragraphs: Array<{
        text: string;
      }>;
    }>;
  };
}

interface SearchBoxProps {
  language: 'zh_CN' | 'zh_TW';
}

export default function SearchBox({ language }: SearchBoxProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('发起搜索请求:', value);
      
      const response = await fetch(`/api/search?q=${encodeURIComponent(value)}&lang=${language}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('收到响应:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`搜索请求失败: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('搜索响应数据:', data);
      
      if (data.success && Array.isArray(data.data)) {
        setResults(data.data);
        if (data.data.length === 0) {
          message.info('未找到相关结果');
        }
      } else {
        throw new Error(data.error || '搜索返回数据格式错误');
      }
    } catch (error) {
      console.error('搜索出错:', error);
      setError(error instanceof Error ? error.message : '搜索出错');
      message.error('搜索出错，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const getPreviewText = (result: SearchResult) => {
    try {
      const text = result.content.sections[0].paragraphs[0].text;
      return text.length > 200 ? `${text.substring(0, 200)}...` : text;
    } catch (e) {
      console.error('获取预览文本出错:', e);
      return '无法显示预览文本';
    }
  };

  return (
    <div className={styles.searchContainer}>
      <Input.Search
        placeholder={language === 'zh_CN' ? "请输入搜索关键词..." : "請輸入搜索關鍵詞..."}
        enterButton={<SearchOutlined />}
        size="large"
        onSearch={handleSearch}
        loading={loading}
        className={styles.searchInput}
      />
      
      {error && (
        <div className={styles.errorMessage}>
          <Text type="danger">{error}</Text>
        </div>
      )}
      
      <div className={styles.resultContainer}>
        <Spin spinning={loading} tip="搜索中..." wrapperClassName={styles.spinWrapper}>
          <List
            className={styles.resultList}
            itemLayout="vertical"
            dataSource={results}
            locale={{ emptyText: '暂无搜索结果' }}
            renderItem={(item) => (
              <List.Item key={item.id} className={styles.resultItem}>
                <List.Item.Meta
                  title={
                    <Text strong className={styles.resultTitle}>
                      {item.metadata.zh_CN.display.title}
                    </Text>
                  }
                  description={
                    <div className={styles.resultMeta}>
                      <Text type="secondary">
                        讲者: {item.metadata.zh_CN.display.speaker}
                      </Text>
                      <Text type="secondary" className={styles.date}>
                        日期: {item.metadata.zh_CN.display.date}
                      </Text>
                    </div>
                  }
                />
                <div className={styles.previewText}>
                  {getPreviewText(item)}
                </div>
              </List.Item>
            )}
          />
        </Spin>
      </div>
    </div>
  );
} 