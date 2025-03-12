import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import Navbar from '../components/Navbar';
import { useTheme } from '../components/ThemeContext';
import api from '../services/api';

export default function TestApi() {
  const { language } = useTheme();
  const [apiStatus, setApiStatus] = useState(null);
  const [searchTest, setSearchTest] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function testConnections() {
      try {
        setLoading(true);
        setError(null);
        
        // 测试API根端点
        try {
          const rootResponse = await api.get('/');
          setApiStatus({
            status: 'success',
            message: rootResponse.data
          });
        } catch (err) {
          setApiStatus({
            status: 'error',
            message: err.message
          });
        }
        
        // 测试搜索API
        try {
          const searchResponse = await api.get('/search', { 
            params: { 
              query: '阿弥陀',
              limit: 2
            } 
          });
          setSearchTest({
            status: 'success',
            hits: searchResponse.data.hits || [],
            total: searchResponse.data.estimatedTotalHits || 0,
            processingTime: searchResponse.data.processingTimeMs || 0
          });
        } catch (err) {
          setSearchTest({
            status: 'error',
            message: err.message
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    testConnections();
  }, []);
  
  return (
    <div>
      <Head>
        <title>{language === 'zh_CN' ? 'API测试' : 'API測試'}</title>
        <meta name="description" content="API connection test" />
      </Head>
      
      <Navbar />
      
      <Container>
        <PageTitle>{language === 'zh_CN' ? 'API连接测试' : 'API連接測試'}</PageTitle>
        
        {loading ? (
          <LoadingMessage>{language === 'zh_CN' ? '正在测试API连接...' : '正在測試API連接...'}</LoadingMessage>
        ) : error ? (
          <ErrorBox>{error}</ErrorBox>
        ) : (
          <>
            <TestSection>
              <SectionTitle>{language === 'zh_CN' ? 'API状态' : 'API狀態'}</SectionTitle>
              <StatusBox status={apiStatus?.status}>
                <strong>{language === 'zh_CN' ? '状态' : '狀態'}:</strong> {apiStatus?.status === 'success' ? '成功' : '失败'}<br />
                <strong>{language === 'zh_CN' ? '消息' : '訊息'}:</strong> {apiStatus?.message}
              </StatusBox>
            </TestSection>
            
            <TestSection>
              <SectionTitle>{language === 'zh_CN' ? '搜索测试' : '搜索測試'}</SectionTitle>
              <StatusBox status={searchTest?.status}>
                <strong>{language === 'zh_CN' ? '状态' : '狀態'}:</strong> {searchTest?.status === 'success' ? '成功' : '失败'}<br />
                {searchTest?.status === 'success' ? (
                  <>
                    <strong>{language === 'zh_CN' ? '结果数量' : '結果數量'}:</strong> {searchTest?.total}<br />
                    <strong>{language === 'zh_CN' ? '处理时间' : '處理時間'}:</strong> {searchTest?.processingTime}ms<br />
                    <strong>{language === 'zh_CN' ? '样本结果' : '樣本結果'}:</strong>
                    <ResultsPreview>
                      {searchTest?.hits?.length > 0 ? (
                        <pre>{JSON.stringify(searchTest.hits[0], null, 2)}</pre>
                      ) : (
                        <em>{language === 'zh_CN' ? '没有结果' : '沒有結果'}</em>
                      )}
                    </ResultsPreview>
                  </>
                ) : (
                  <>
                    <strong>{language === 'zh_CN' ? '错误' : '錯誤'}:</strong> {searchTest?.message}
                  </>
                )}
              </StatusBox>
            </TestSection>
            
            <BackLink href="/">
              {language === 'zh_CN' ? '返回首页' : '返回首頁'}
            </BackLink>
          </>
        )}
      </Container>
    </div>
  );
}

const Container = styled.div`
  padding-top: 80px;
  max-width: 800px;
  margin: 0 auto;
  padding-left: 20px;
  padding-right: 20px;
  padding-bottom: 50px;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  margin-bottom: 30px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
  
  body.dark-theme & {
    border-bottom-color: var(--dark-border-color);
  }
`;

const TestSection = styled.div`
  margin-bottom: 30px;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 15px;
`;

const StatusBox = styled.div`
  padding: 20px;
  border-radius: var(--border-radius);
  background: ${props => props.status === 'success' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)'};
  border: 1px solid ${props => props.status === 'success' ? 'rgba(46, 204, 113, 0.3)' : 'rgba(231, 76, 60, 0.3)'};
  line-height: 1.6;
  
  body.dark-theme & {
    background: ${props => props.status === 'success' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)'};
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 50px 0;
  font-size: 1.2rem;
  opacity: 0.7;
`;

const ErrorBox = styled.div`
  padding: 20px;
  background-color: rgba(231, 76, 60, 0.1);
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: var(--border-radius);
  color: #e74c3c;
  margin: 20px 0;
`;

const ResultsPreview = styled.div`
  margin-top: 10px;
  background: rgba(0, 0, 0, 0.05);
  padding: 10px;
  border-radius: 4px;
  max-height: 300px;
  overflow: auto;
  
  pre {
    margin: 0;
    font-size: 0.85rem;
    white-space: pre-wrap;
  }
  
  body.dark-theme & {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const BackLink = styled.a`
  display: inline-block;
  margin-top: 20px;
  padding: 10px 20px;
  background-color: var(--primary-color);
  color: white;
  border-radius: var(--border-radius);
  text-decoration: none;
  transition: all 0.3s;
  
  &:hover {
    background-color: var(--primary-dark);
    transform: translateY(-2px);
  }
`; 