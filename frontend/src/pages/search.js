import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styled from 'styled-components';
import { FaSearch, FaHome, FaSpinner, FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../components/ThemeContext';
import SearchResult from '../components/SearchResult';
import Navbar from '../components/Navbar';
import { searchDocuments } from '../services/meilisearch';
import dynamic from 'next/dynamic';

// 添加加载动画组件
const LoadingSpinner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 40px 0;
  font-size: 1rem;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#666'};
  
  svg {
    animation: spin 1.5s linear infinite;
    font-size: 2rem;
    margin-bottom: 12px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// 添加无结果状态组件
const NoResultsMessage = styled.div`
  text-align: center;
  margin: 40px 0;
  padding: 20px;
  background-color: ${props => props.theme === 'dark' ? '#2a2a2a' : '#f5f5f5'};
  border-radius: 8px;
  font-size: 1rem;
  color: ${props => props.theme === 'dark' ? '#ddd' : '#333'};
`;

// 完全禁用服务端渲染，只在客户端渲染
const ClientOnlyPage = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <div style={{ padding: '100px 20px', textAlign: 'center' }}>加载中...</div>;
  }
  
  return <>{children}</>;
};

function Search() {
  const router = useRouter();
  const { q: query, lang } = router.query;
  const { language, toggleLanguage, isDarkMode, toggleTheme } = useTheme();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isClient, setIsClient] = useState(false);
  const [searchCache, setSearchCache] = useState({});  // 添加缓存状态
  
  // 添加新的状态管理搜索结果的显示
  const [resultsReady, setResultsReady] = useState(false);
  
  // 使用ref存储最新请求ID，避免依赖项循环
  const activeRequestIdRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const isSearchingRef = useRef(false);
  
  const ITEMS_PER_PAGE = 10;
  
  // 当URL参数变化时更新搜索查询，添加防抖
  useEffect(() => {
    if (query && query !== searchQuery) {
      setSearchQuery(query);
    }
  }, [query]);
  
  // 当语言变化时更新URL
  useEffect(() => {
    if (!query) return; // 如果没有查询词，不需要更新

    if (lang && lang !== language) {
      router.push({
        pathname: router.pathname,
        query: { ...router.query, lang: language }
      }, undefined, { shallow: true });
    }
  }, [lang, language, query, router]);
  
  useEffect(() => {
    setIsClient(true);
    
    // 组件卸载时清除可能的超时调用
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  
  // 监听 URL 中的页码参数
  useEffect(() => {
    const page = parseInt(router.query.page) || 1;
    setCurrentPage(page);
  }, [router.query.page]);
  
  // 执行搜索 - 修复循环触发的问题
  useEffect(() => {
    // 确保客户端渲染
    if (typeof window === 'undefined') {
      return;
    }
    
    // 避免空搜索
    if (!searchQuery || searchQuery.trim() === '') {
      setResults([]);
      setLoading(false);
      setResultsReady(false);
      return;
    }
    
    // 清除之前的定时器
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // 使用防抖延迟执行搜索，避免连续快速的状态更新
    searchTimeoutRef.current = setTimeout(async () => {
      // 如果已经在搜索中，不要开始新的搜索
      if (isSearchingRef.current) {
        return;
      }
      
      isSearchingRef.current = true;
      
      // 生成新的请求ID并存储在ref中，不使用状态变量触发重新渲染
      const requestId = Date.now();
      activeRequestIdRef.current = requestId;
      
      console.log(`开始搜索: "${searchQuery}" (ID: ${requestId})`);
      
      // 设置搜索状态
      setLoading(true);
      setResultsReady(false);
      
      try {
        // 检查缓存
        const cacheKey = `${searchQuery}-${currentPage}-${language}`;
        
        if (searchCache[cacheKey]) {
          // 如果有缓存，使用缓存数据
          console.log(`使用缓存结果: "${searchQuery}" (ID: ${requestId})`);
          
          setResults(searchCache[cacheKey].results);
          setHasNextPage(searchCache[cacheKey].hasNextPage);
          setProcessingTime(searchCache[cacheKey].processingTime);
          
          // 延迟设置结果准备状态，提供更平滑的UI体验
          setTimeout(() => {
            // 确保仍然是最新请求
            if (requestId === activeRequestIdRef.current) {
              setResultsReady(true);
              setLoading(false);
              isSearchingRef.current = false;
            }
          }, 300);
          
          return;
        }
        
        // 没有缓存，执行实际搜索
        const data = await searchDocuments(searchQuery, {
          language,
          limit: ITEMS_PER_PAGE,
          offset: (currentPage - 1) * ITEMS_PER_PAGE
        });
        
        // 再次检查这是否仍然是最新的搜索请求
        if (requestId !== activeRequestIdRef.current) {
          console.log(`搜索请求已过时，丢弃结果 (ID: ${requestId})`);
          isSearchingRef.current = false;
          return;
        }
        
        // 处理搜索结果
        if (data && Array.isArray(data.hits)) {
          const validResults = data.hits.filter(hit => {
            if (!hit.paragraphs || !Array.isArray(hit.paragraphs)) return false;
            const langKey = language === 'zh_CN' ? 'zh_CN' : 'zh_TW';
            
            // 只在单个段落中搜索
            return hit.paragraphs.some(p => {
              if (!p || typeof p !== 'object') return false;
              const text = p[langKey];
              if (typeof text !== 'string') return false;
              return new RegExp(searchQuery, 'i').test(text);
            });
          });
          
          // 更新缓存
          setSearchCache(prev => ({
            ...prev,
            [cacheKey]: {
              results: validResults,
              hasNextPage: data.hasNextPage,
              processingTime: data.processingTimeMs || 0
            }
          }));
          
          // 设置状态
          setResults(validResults);
          setHasNextPage(data.hasNextPage);
          setProcessingTime(data.processingTimeMs || 0);
          setError(null);
          
          // 只记录一次最终结果
          console.log('搜索结果:', {
            requestId: requestId,
            currentPage: currentPage,
            displayedResults: validResults.length,
            processingTime: data.processingTimeMs,
            pages: Math.ceil(validResults.length / ITEMS_PER_PAGE)
          });
          
          // 延迟显示结果，避免UI闪烁
          setTimeout(() => {
            if (requestId === activeRequestIdRef.current) {
              setResultsReady(true);
            }
          }, 300);
        } else {
          console.error('搜索结果格式错误:', data);
          setResults([]);
          setHasNextPage(false);
          setProcessingTime(0);
          setError(language === 'zh_CN' ? '搜索结果格式错误' : '搜索結果格式錯誤');
          
          setTimeout(() => {
            if (requestId === activeRequestIdRef.current) {
              setResultsReady(true);
            }
          }, 300);
        }
      } catch (err) {
        console.error('搜索失败:', err);
        
        if (requestId === activeRequestIdRef.current) {
          setError(language === 'zh_CN' ? '搜索请求失败: ' + err.message : '搜索請求失敗: ' + err.message);
          setResults([]);
          
          setTimeout(() => {
            setResultsReady(true);
          }, 300);
        }
      } finally {
        if (requestId === activeRequestIdRef.current) {
          setLoading(false);
        }
        
        isSearchingRef.current = false;
      }
    }, 300); // 300ms防抖延迟
    
    // 清理函数：组件卸载或依赖项变化时清除超时调用
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, language, currentPage]); // 移除activeRequestId依赖
  
  // 修改处理搜索的函数
  const handleSearch = (e) => {
    e.preventDefault();
    
    // 防止重复提交
    if (isSearchingRef.current) {
      return;
    }
    
    // 清空搜索结果准备状态
    setResultsReady(false);
    
    const trimmedQuery = searchQuery.trim();
    
    if (trimmedQuery) {
      // 对于有效查询，先完全重置状态
      setResults([]);
      setLoading(true);
      setError(null);
      
      // 更新路由 - 使用浅路由更新减少不必要的渲染
      router.push({
        pathname: '/search',
        query: { q: trimmedQuery, lang: language }
      }, undefined, { shallow: true });
    } else {
      // 对于空查询，清空结果但不更新路由
      setResults([]);
      setLoading(false);
      setError(null);
      
      // 如果当前URL有查询参数，清除它们
      if (router.query.q) {
        router.push('/search', undefined, { shallow: true });
      }
    }
  };
  
  // 修改翻页函数
  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    
    // 防止在搜索过程中翻页
    if (isSearchingRef.current) {
      return;
    }
    
    // 更新当前页码
    setCurrentPage(newPage);
    // 清除结果准备状态，确保显示加载指示器
    setResultsReady(false);
    
    // 重置搜索状态
    setResults([]);
    setLoading(true);
    
    // 更新 URL，保持搜索词和页码
    router.push({
      pathname: '/search',
      query: { 
        q: searchQuery,
        lang: language,
        page: newPage
      }
    }, undefined, { shallow: true });
    
    // 滚动到页面顶部
    window.scrollTo(0, 0);
  };
  
  // 清除缓存的函数 - 修改为按需清除
  const clearCache = (type = 'all') => {
    if (type === 'all') {
      // 完全清除所有缓存
      setSearchCache({});
      return;
    }
    
    if (type === 'query') {
      // 仅清除当前搜索词相关的所有缓存
      const newCache = { ...searchCache };
      Object.keys(newCache).forEach(key => {
        if (key.startsWith(`${searchQuery}-`)) {
          delete newCache[key];
        }
      });
      setSearchCache(newCache);
    }
  };

  // 当搜索条件改变时清除缓存
  useEffect(() => {
    clearCache('all');
  }, [searchQuery, language]); // 只在搜索词或语言变化时清除缓存
  
  // 预加载下一页 - 加强检查以避免不必要的预加载
  const preloadNextPage = async () => {
    if (!hasNextPage || isSearchingRef.current || !searchQuery) return;
    
    const nextPage = currentPage + 1;
    const cacheKey = `${searchQuery}-${nextPage}-${language}`;
    
    // 如果已经缓存，不需要预加载
    if (searchCache[cacheKey]) return;
    
    try {
      console.log(`预加载下一页: ${nextPage}`);
      
      const data = await searchDocuments(searchQuery, {
        language,
        limit: ITEMS_PER_PAGE,
        offset: nextPage * ITEMS_PER_PAGE
      });
      
      if (data && Array.isArray(data.hits)) {
        const validResults = data.hits.filter(hit => {
          if (!hit.paragraphs || !Array.isArray(hit.paragraphs)) return false;
          const langKey = language === 'zh_CN' ? 'zh_CN' : 'zh_TW';
          
          return hit.paragraphs.some(p => {
            if (!p || typeof p !== 'object') return false;
            const text = p[langKey];
            if (typeof text !== 'string') return false;
            return new RegExp(searchQuery, 'i').test(text);
          });
        });
        
        // 更新缓存
        setSearchCache(prev => ({
          ...prev,
          [cacheKey]: {
            results: validResults,
            hasNextPage: data.hasNextPage,
            processingTime: data.processingTimeMs || 0
          }
        }));
        
        console.log(`预加载完成: 页 ${nextPage}, 结果数 ${validResults.length}`);
      }
    } catch (error) {
      console.error('预加载下一页失败:', error);
    }
  };

  // 当当前页加载完成后，预加载下一页 - 添加条件以减少不必要的预加载
  useEffect(() => {
    if (!loading && results.length > 0 && resultsReady && searchQuery) {
      // 使用延迟预加载，避免在主搜索过程中进行预加载
      const preloadTimer = setTimeout(() => {
        preloadNextPage();
      }, 1000);
      
      return () => clearTimeout(preloadTimer);
    }
  }, [loading, results, resultsReady, searchQuery]);
  
  return (
    <ClientOnlyPage>
      <div className={isDarkMode ? 'dark-theme' : ''}>
        <Head>
          <title>
            {searchQuery
              ? `${searchQuery} - ${language === 'zh_CN' ? '搜索结果' : '搜索結果'}`
              : language === 'zh_CN'
              ? '搜索'
              : '搜索'}
          </title>
        </Head>

        <Navbar />

        <SearchContainer>
          <SearchForm onSubmit={handleSearch} autoComplete="off">
            <SearchInput
              type="search"
              name="searchQuery"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                // 阻止回车键发生在未准备好的状态下提交
                if (e.key === 'Enter' && loading) {
                  e.preventDefault();
                }
              }}
              autoComplete="off"
              placeholder={language === 'zh_CN' 
                ? '请输入简体关键词搜索，如需繁体检索请切换简繁主题...' 
                : '請輸入繁體關鍵詞搜索，如需簡體檢索請切換簡繁主題...'}
            />
            <SearchButton type="submit" disabled={loading}>
              {loading ? <FaSpinner className="spin" /> : <FaSearch />}
            </SearchButton>
          </SearchForm>

          <PageContent>
            <ResultsWrapper>
              {error ? (
                <ErrorMessage>
                  {language === 'zh_CN' ? '搜索时发生错误' : '搜索時發生錯誤'}: {error}
                </ErrorMessage>
              ) : (
                <>
                  <ResultsSummary>
                    {searchQuery && !loading && (
                      <span>
                        {language === 'zh_CN' ? '搜索' : '搜索'}: "{searchQuery}"
                      </span>
                    )}
                  </ResultsSummary>

                  {loading && (
                    <LoadingSpinner theme={isDarkMode ? 'dark' : 'light'}>
                      <FaSpinner />
                      <div>{language === 'zh_CN' ? '正在搜索，请稍候...' : '正在搜索，請稍候...'}</div>
                    </LoadingSpinner>
                  )}

                  {!loading && resultsReady && query && results.length === 0 && (
                    <NoResultsMessage theme={isDarkMode ? 'dark' : 'light'}>
                      {language === 'zh_CN'
                        ? '未找到相关结果，请尝试其他搜索词'
                        : '未找到相關結果，請嘗試其他搜索詞'}
                    </NoResultsMessage>
                  )}

                  {!loading && resultsReady && results.length > 0 && (
                    <ResultsList>
                      {results.map((result, index) => (
                        <SearchResult 
                          key={result.id}
                          result={result} 
                          query={searchQuery}
                          language={language}
                        />
                      ))}
                    </ResultsList>
                  )}

                  {/* 只在有结果且不是最后一页时显示分页 */}
                  {results.length > 0 && (
                    <Pagination>
                      <PageButton 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        {language === 'zh_CN' ? '上一页' : '上一頁'}
                      </PageButton>
                      
                      <PageInfo>
                        {language === 'zh_CN' 
                          ? `第 ${currentPage} 页`
                          : `第 ${currentPage} 頁`}
                      </PageInfo>
                      
                      <PageButton 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!hasNextPage}
                      >
                        {language === 'zh_CN' ? '下一页' : '下一頁'}
                      </PageButton>
                    </Pagination>
                  )}
                </>
              )}
            </ResultsWrapper>
          </PageContent>
        </SearchContainer>
      </div>
    </ClientOnlyPage>
  );
}

// 禁用服务端渲染
export default dynamic(() => Promise.resolve(Search), {
  ssr: false
});

// 样式组件
const SearchContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 120px 20px 40px;
  
  @media (max-width: 768px) {
    padding: 100px 15px 30px;
  }
`;

const SearchForm = styled.form`
  position: relative;
  margin-bottom: 30px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 15px 50px 15px 20px;
  border: 2px solid var(--border-color);
  border-radius: 10px;
  font-size: 1rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
  }
  
  &::placeholder {
    color: var(--text-secondary);
  }
  
  body.dark-theme & {
    background: rgba(30, 30, 30, 0.7);
    border-color: #444;
    
    &:focus {
      border-color: #3773ff;
    }
  }
`;

const SearchButton = styled.button`
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s ease;
  
  &:hover {
    color: var(--primary-color);
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const PageContent = styled.div`
  display: flex;
  padding: 20px;
  max-width: var(--max-width);
  margin: 0 auto;
  gap: 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ResultsWrapper = styled.div`
  flex: 1;
`;

const ResultsSummary = styled.div`
  margin: 1rem 0;
  color: #666;
  font-size: 0.9rem;
`;

const ResultsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ErrorMessage = styled.div`
  padding: 20px;
  background-color: rgba(255, 0, 0, 0.1);
  border-radius: var(--border-radius);
  margin: 20px 0;
  
  body.dark-theme & {
    background-color: rgba(255, 0, 0, 0.2);
  }
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
`;

const PageButton = styled.button`
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-color);
  color: var(--text-color);
  cursor: pointer;
  
  &:hover:not(:disabled) {
    background: var(--hover-color);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  color: var(--text-secondary);
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
`;

const ThemeButton = styled.button`
  padding: 8px;
  background: var(--bg-color);
  color: var(--text-color);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    background: var(--hover-color);
  }
`;

const LangButton = styled.button`
  padding: 8px;
  background: var(--bg-color);
  color: var(--text-color);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    background: var(--hover-color);
  }
`;

const LangLabel = styled.span`
  font-size: 0.8rem;
  color: var(--text-secondary);
`;