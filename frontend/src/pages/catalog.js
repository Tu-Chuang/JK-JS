import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styled from 'styled-components';
import { FaBook, FaFile } from 'react-icons/fa';
import { useTheme } from '../components/ThemeContext';
import Navbar from '../components/Navbar';
import { categoryMap } from '../services/api';
import { directory } from '../data/directory';

function Catalog() {
  const { language, theme, isTraditional } = useTheme();
  const [loading, setLoading] = useState(true);
  const [catalogData, setCatalogData] = useState({});
  const [selectedMainDir, setSelectedMainDir] = useState(() => {
    // 从 localStorage 中获取上次选择的主目录
    return localStorage.getItem('selectedMainDir') || null;
  });
  const [error, setError] = useState(null);
  const subDirGridRef = useRef(null);
  
  // 保存滚动位置
  const saveScrollPosition = () => {
    if (subDirGridRef.current && selectedMainDir) {
      const scrollTop = subDirGridRef.current.scrollTop;
      localStorage.setItem(`scrollPos_${selectedMainDir}`, scrollTop.toString());
    }
  };

  // 恢复滚动位置
  const restoreScrollPosition = () => {
    if (subDirGridRef.current && selectedMainDir) {
      const savedPosition = localStorage.getItem(`scrollPos_${selectedMainDir}`);
      if (savedPosition) {
        subDirGridRef.current.scrollTop = parseInt(savedPosition);
      }
    }
  };

  // 监听滚动事件
  useEffect(() => {
    const gridElement = subDirGridRef.current;
    if (gridElement) {
      gridElement.addEventListener('scroll', saveScrollPosition);
      return () => {
        gridElement.removeEventListener('scroll', saveScrollPosition);
      };
    }
  }, [selectedMainDir]);

  // 当主目录改变时，恢复对应的滚动位置
  useEffect(() => {
    if (selectedMainDir) {
      // 使用 setTimeout 确保在 DOM 更新后再恢复滚动位置
      setTimeout(restoreScrollPosition, 100);
    }
  }, [selectedMainDir]);

  // 组件卸载时保存滚动位置
  useEffect(() => {
    return () => {
      saveScrollPosition();
    };
  }, [selectedMainDir]);

  useEffect(() => {
    // 直接使用本地目录数据，不再请求API
    try {
      console.log('使用本地目录数据');
      // 从directory.js获取目录数据
      const localCatalogData = directory.categories;
      
      // 设置目录数据
      setCatalogData(localCatalogData);
      
      // 如果没有已选中的目录，则默认选中第一个
      if (!selectedMainDir) {
        const firstDir = Object.keys(localCatalogData).sort((a, b) => parseInt(a) - parseInt(b))[0];
        if (firstDir) {
          setSelectedMainDir(firstDir);
          localStorage.setItem('selectedMainDir', firstDir);
          console.log('默认选中目录:', firstDir);
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('目录数据处理失败:', err);
      setError(language === 'zh_CN' ? '目录数据加载失败' : '目錄數據加載失敗');
    } finally {
      setLoading(false);
    }
  }, [language, selectedMainDir]);
  
  // 获取所有主目录
  const mainDirs = Object.keys(categoryMap).sort((a, b) => parseInt(a) - parseInt(b));
  
  // 获取当前选中主目录下的所有子目录
  const currentSubDirs = selectedMainDir && catalogData[selectedMainDir] 
    ? Object.entries(catalogData[selectedMainDir]?.courses || {}).map(([id, course]) => ({
        id,
        title: language === 'zh_CN' ? course.title : course.titleTw,
        files: course.files
      }))
    : [];
  
  const handleMainDirClick = (mainDir) => {
    setSelectedMainDir(mainDir);
    localStorage.setItem('selectedMainDir', mainDir);
  };
  
  const renderMainDirectories = () => {
    return Object.entries(catalogData)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([mainDir, data]) => {
        // 获取分类名称 - 根据当前语言选择简体或繁体
        const name = language === 'zh_CN' 
          ? data.name 
          : data.nameTw;
        
        // 获取课程数量
        const courseCount = Object.keys(data.courses || {}).length;
        
        const isActive = selectedMainDir === mainDir;
        
        return (
          <div key={mainDir}>
            <MainDirectoryItem
              active={isActive}
              theme={theme}
              onClick={() => handleMainDirClick(mainDir)}
            >
              <MainDirNumber theme={theme}>{mainDir}</MainDirNumber>
              <MainDirName theme={theme}>{name}</MainDirName>
              <MainDirCount theme={theme}>({courseCount})</MainDirCount>
            </MainDirectoryItem>
          </div>
        );
      });
  };

  // 获取课程的链接
  const getFirstLectureLink = (courseId) => {
    // 如果已经是完整的文档ID，直接返回
    if (/^\d{2}-\d{3}-\d{4}$/.test(courseId)) {
      return `/document/${courseId}`;
    }
    
    // 直接添加-0001后缀
    return `/document/${courseId}-0001`;
  };

  return (
    <div className={theme === 'dark' ? 'dark-theme' : ''}>
      <Head>
        <title>{language === 'zh_CN' ? '浏览目录' : '瀏覽目錄'}</title>
        <meta name="description" content={language === 'zh_CN' ? '浏览全部分类和课程' : '瀏覽全部分類和課程'} />
      </Head>
      
      <Navbar />
      
      <CatalogContainer className={theme === 'dark' ? 'dark-theme' : ''}>
        {loading ? (
          <LoadingContainer>
            <Spinner />
            <LoadingText>{language === 'zh_CN' ? '加载中...' : '加載中...'}</LoadingText>
          </LoadingContainer>
        ) : error ? (
          <ErrorContainer>
            <ErrorMessage>{error}</ErrorMessage>
            <RetryButton onClick={() => window.location.reload()}>
              {language === 'zh_CN' ? '重试' : '重試'}
            </RetryButton>
          </ErrorContainer>
        ) : (
          <CatalogLayout>
            <MainDirectory>
              <MainDirectoryHeader>
                <MainDirectoryTitle>
                  {language === 'zh_CN' ? '分类目录' : '分類目錄'}
                </MainDirectoryTitle>
                <MainDirectorySubtitle>
                  {language === 'zh_CN' ? '共有分类' : '共有分類'} {Object.keys(catalogData).length}
                </MainDirectorySubtitle>
              </MainDirectoryHeader>
              <MainDirectoryList>
                {renderMainDirectories()}
              </MainDirectoryList>
            </MainDirectory>
            
            <SubDirectory>
              {selectedMainDir && (
                <>
                  <SubDirectoryHeader>
                    <SubDirectoryTitle>
                      {language === 'zh_CN' 
                        ? catalogData[selectedMainDir]?.name 
                        : catalogData[selectedMainDir]?.nameTw}
                    </SubDirectoryTitle>
                    <SubDirectoryStats>
                      {language === 'zh_CN' ? '共计' : '共計'} 
                      <StatsHighlight>{currentSubDirs.length}</StatsHighlight> 
                      {language === 'zh_CN' ? '个课程' : '個課程'}
                    </SubDirectoryStats>
                  </SubDirectoryHeader>
                  
                  {currentSubDirs.length > 0 ? (
                    <SubDirectoryGrid ref={subDirGridRef}>
                      {currentSubDirs.map(({ id, title, files }, index) => (
                        <SubDirectoryItem key={id}>
                          <Link href={getFirstLectureLink(id)} passHref legacyBehavior>
                            <SubDirectoryLink 
                              className="course-card-hover"
                              onClick={saveScrollPosition} // 点击时保存位置
                            >
                              <SubDirIcon>
                                <FaBook />
                              </SubDirIcon>
                              <SubDirContent>
                                <SubDirTitle>{title}</SubDirTitle>
                                <SubDirMeta>
                                  <CourseNumber>{id}</CourseNumber>
                                  {files > 0 && (
                                    <>
                                      <FilesLabel>
                                        {language === 'zh_CN' ? '文档数量' : '文檔數量'}
                                      </FilesLabel>
                                      <FileBadge>{files}</FileBadge>
                                    </>
                                  )}
                                </SubDirMeta>
                              </SubDirContent>
                            </SubDirectoryLink>
                          </Link>
                        </SubDirectoryItem>
                      ))}
                    </SubDirectoryGrid>
                  ) : (
                    <EmptyMessage>
                      {language === 'zh_CN' ? '此分类下暂无文档' : '此分類下暫無文檔'}
                    </EmptyMessage>
                  )}
                </>
              )}
            </SubDirectory>
          </CatalogLayout>
        )}
      </CatalogContainer>
    </div>
  );
}

// 解析目录数据，将文件路径组织成目录结构
const parseDirectoryData = (files) => {
  const catalogStructure = {};
  
  // 确保 files 是数组
  if (!files || !Array.isArray(files)) {
    console.warn('目录数据不是数组，返回空结构');
    return catalogStructure;
  }
  
  // 过滤无效的文件路径
  const validFiles = files.filter(file => typeof file === 'string' && file.includes('-'));
  
  console.log('有效的文件数量:', validFiles.length);
  
  // 初始化所有分类
  Object.keys(categoryMap).forEach(categoryId => {
    catalogStructure[categoryId] = {
      items: []
    };
  });
  
  // 处理文件路径
  validFiles.forEach(file => {
    const courseId = file.split(' ')[0];
    const mainDir = courseId.split('-')[0];
    
    if (catalogStructure[mainDir]) {
      if (!catalogStructure[mainDir].items.includes(file)) {
        catalogStructure[mainDir].items.push(file);
      }
    }
  });
  
  return catalogStructure;
};

// 更新样式定义，修复在主题切换中的问题
const CatalogContainer = styled.div`
  max-width: 1250px;
  margin: 0 auto;
  padding: 120px 2rem 2rem;
  animation: fadeIn 0.5s ease-in-out;
  min-height: calc(100vh - 64px);
  
  @media (max-width: 1280px) {
    max-width: 100%;
    padding: 100px 1.5rem 1.5rem;
  }
  
  @media (max-width: 768px) {
    padding: 90px 1rem 1rem;
  }
`;

const CatalogLayout = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 3rem;
  height: calc(100vh - 150px);
  
  @media (max-width: 1024px) {
    gap: 2rem;
  }
  
  @media (max-width: 992px) {
    grid-template-columns: 1fr;
    height: auto;
    gap: 1.5rem;
  }
`;

const MainDirectory = styled.div`
  background: var(--bg-secondary);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: var(--shadow-medium);
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  body.dark-theme &, .dark-theme & {
    background: rgba(30, 30, 30, 0.7);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }
  
  @media (max-width: 992px) {
    margin-bottom: 1rem;
    height: auto;
    max-height: 70vh;
  }
  
  @media (max-width: 480px) {
    max-height: 60vh;
  }
`;

const MainDirectoryHeader = styled.div`
  padding: 1.2rem 1.2rem 0.8rem;
  background: var(--bg-gradient);
  border-radius: 12px 12px 0 0;
  border-bottom: 1px solid var(--border-color);
  
  @media (max-width: 768px) {
    padding: 1rem 1rem 0.7rem;
  }
  
  body.dark-theme &, .dark-theme & {
    background: linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 100%);
    border-bottom-color: #444;
  }
`;

const MainDirectoryTitle = styled.h3`
  font-size: 1.4rem;
  margin: 0;
  color: var(--text-primary);
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
  
  body.dark-theme &, .dark-theme & {
    color: #f0f0f0;
  }
`;

const MainDirectorySubtitle = styled.div`
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 0.3rem;
  text-align: center;
  
  body.dark-theme &, .dark-theme & {
    color: #aaa;
  }
`;

const MainDirectoryList = styled.div`
  overflow-y: auto;
  flex: 1; // 占用剩余空间
  padding: 0.5rem;
  
  /* 美化滚动条 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--scrollbar-track);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border-radius: 3px;
  }
  
  body.dark-theme &, .dark-theme & {
    &::-webkit-scrollbar-track {
      background: #2a2a2a;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #555;
    }
  }
`;

const MainDirectoryItem = styled.div`
  display: flex;
  align-items: center;
  padding: 0.8rem 0.9rem;
  margin: 0.4rem 0;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  background: ${props => props.active ? 'var(--item-active-bg)' : 'transparent'};
  border-left: 3px solid ${props => props.active ? 'var(--primary-color)' : 'transparent'};
    
  &:hover {
    background: var(--item-hover-bg);
  }
  
  body.dark-theme &, .dark-theme & {
    background: ${props => props.active ? 'rgba(55, 125, 255, 0.15)' : 'transparent'};
    border-left-color: ${props => props.active ? '#3773ff' : 'transparent'};
    
    &:hover {
      background: rgba(80, 80, 80, 0.5);
    }
  }
`;

const MainDirNumber = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--number-bg);
  color: var(--number-text);
  border-radius: 50%;
  margin-right: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  
  body.dark-theme &, .dark-theme & {
    background: #333;
    color: #f0f0f0;
  }
`;

const MainDirName = styled.span`
  flex: 1;
  font-size: 1rem;
  color: var(--text-primary);
  
  body.dark-theme &, .dark-theme & {
    color: #f0f0f0;
  }
`;

const MainDirCount = styled.span`
  font-size: 0.85rem;
  font-weight: 400;
  color: var(--text-secondary);
  margin-left: 5px;
  
  body.dark-theme &, .dark-theme & {
    color: #aaa;
  }
`;

const SubDirectory = styled.div`
  background: var(--bg-secondary);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: var(--shadow-medium);
  padding: 1.5rem;
  height: 100%; // 占满父容器高度
  display: flex;
  flex-direction: column;
  overflow: hidden; // 防止内容溢出
  
  body.dark-theme &, .dark-theme & {
    background: rgba(30, 30, 30, 0.7);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }
`;

const SubDirectoryHeader = styled.div`
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
  
  body.dark-theme &, .dark-theme & {
    border-bottom-color: #444;
  }
`;

const SubDirectoryTitle = styled.h3`
  font-size: 1.6rem;
  margin: 0 0 0.5rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  
  @media (max-width: 768px) {
    font-size: 1.3rem;
  }
  
  &::before {
    content: '';
    display: block;
    width: 5px;
    height: 24px;
    background: var(--primary-color);
    border-radius: 3px;
    margin-right: 12px;
    
    @media (max-width: 768px) {
      height: 20px;
      margin-right: 10px;
    }
  }
  
  body.dark-theme &, .dark-theme & {
    color: #f0f0f0;
  }
`;

const SubDirectoryStats = styled.div`
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-left: 18px;
  
  body.dark-theme &, .dark-theme & {
    color: #aaa;
  }
`;

const StatsHighlight = styled.span`
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 4px;
`;

const SubDirectoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  column-gap: 20px;
  row-gap: 20px;
  overflow-y: auto;
  padding-right: 5px;
  flex: 1;
  grid-auto-rows: 85px; // 设置每行固定高度
  
  @media (max-width: 1280px) {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    column-gap: 16px;
    row-gap: 16px;
    grid-auto-rows: 100px; // 移动端每行高度
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    padding-right: 0;
    column-gap: 12px;
    row-gap: 12px;
  }
  
  /* 美化滚动条 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--scrollbar-track);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border-radius: 3px;
  }
  
  body.dark-theme &, .dark-theme & {
    &::-webkit-scrollbar-track {
      background: #2a2a2a;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #555;
    }
  }
`;

const SubDirectoryItem = styled.div`
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: 85px; // 固定高度，与 SubDirectoryLink 保持一致
  
  &:hover {
    transform: translateY(-2px);
  }
  
  @media (max-width: 768px) {
    height: 100px; // 移动端高度
  }
`;

const SubDirectoryLink = styled.a`
  display: flex;
  align-items: center;
  padding: 16px;
  width: 100%;
  height: 100%;
  border-radius: var(--border-radius);
  text-decoration: none;
  color: var(--text-primary);
  background: var(--card-gradient);
  transition: all 0.3s ease;
  box-shadow: var(--card-shadow);
  border: 1px solid var(--card-border);
  
  &:hover {
    background: var(--card-hover-gradient);
    transform: translateY(-2px);
    box-shadow: var(--card-hover-shadow);
    border-color: var(--card-hover-border);
  }
  
  body.dark-theme &, .dark-theme & {
    background: var(--card-gradient-dark);
    border-color: rgba(255, 255, 255, 0.1);
    &:hover {
      background: var(--card-hover-gradient-dark);
      border-color: rgba(255, 255, 255, 0.15);
    }
  }
`;

const SubDirIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--primary-color);
  color: white;
  border-radius: 8px;
  margin-right: 12px;
  flex-shrink: 0;
  align-self: center;
  
  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
  }
  
  svg {
    font-size: 1.1rem;
    
    @media (max-width: 768px) {
      font-size: 1rem;
    }
  }
  
  body.dark-theme &, .dark-theme & {
    background: rgba(55, 115, 255, 0.8);
  }
`;

const SubDirContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: center;
  min-height: 60px;
`;

const SubDirTitle = styled.div`
  font-weight: 500;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 6px;
`;

const SubDirMeta = styled.div`
  display: flex;
  align-items: center;
`;

const FilesLabel = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: var(--text-secondary);
`;

const FileBadge = styled.div`
  font-size: 0.8rem;
  color: var(--text-primary);
  margin-left: 4px;
`;

const CourseNumber = styled.span`
  font-size: 0.8rem;
  font-weight: 400;
  color: var(--text-secondary);
  margin-right: 8px;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid ${props => props.theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
  border-radius: 50%;
  border-left-color: #4285f4;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
`;

const LoadingText = styled.div`
  font-size: 1.1rem;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#777'};
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  text-align: center;
  padding: 0 20px;
`;

const ErrorMessage = styled.div`
  font-size: 1.2rem;
  color: ${props => props.theme === 'dark' ? '#ff6b6b' : '#e53935'};
  margin-bottom: 20px;
`;

const RetryButton = styled.button`
  background: #4285f4;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s ease;
  
  &:hover {
    background: #3367d6;
  }
`;

const EmptyMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#888'};
  font-size: 1.1rem;
  border: 2px dashed ${props => props.theme === 'dark' ? '#444' : '#e0e0e0'};
  border-radius: 8px;
  margin-top: 1rem;
`;

export default Catalog;