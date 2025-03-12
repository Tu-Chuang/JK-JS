import React, { useState, useEffect } from 'react';
import { MeiliSearch } from 'meilisearch';
import dynamic from 'next/dynamic';

function SimpleTest() {
  const [status, setStatus] = useState('检查中...');
  const [version, setVersion] = useState('');
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // 确保只在客户端执行
    if (typeof window === 'undefined') return;
    
    async function testConnection() {
      try {
        // 使用直接的值而不是环境变量
        const client = new MeiliSearch({
          host: 'http://127.0.0.1:7700',
          apiKey: 'fBNKHjhvjh16513mkbj13534sdgSDHJTksyk'
        });
        
        // 获取健康信息
        const health = await client.health();
        setStatus(health.status);
        
        // 获取版本信息
        const stats = await client.getStats();
        setVersion(stats.databaseSize);
      } catch (err) {
        setError(err.message);
      }
    }
    
    testConnection();
  }, []);
  
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Meilisearch 简单连接测试</h1>
      
      {error ? (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#ffebee', 
          color: '#d32f2f',
          borderRadius: '4px',
          marginTop: '20px'
        }}>
          <h3>连接错误</h3>
          <p>{error}</p>
        </div>
      ) : (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#e8f5e9', 
          color: '#2e7d32',
          borderRadius: '4px',
          marginTop: '20px'
        }}>
          <h3>连接成功</h3>
          <p>状态: {status}</p>
          <p>数据库大小: {version}</p>
        </div>
      )}
      
      <div style={{ marginTop: '20px' }}>
        <a href="/" style={{ 
          textDecoration: 'none',
          padding: '10px 15px',
          backgroundColor: '#2196f3',
          color: 'white',
          borderRadius: '4px',
          display: 'inline-block'
        }}>
          返回首页
        </a>
      </div>
    </div>
  );
}

// 禁用服务端渲染
export default dynamic(() => Promise.resolve(SimpleTest), {
  ssr: false
}); 