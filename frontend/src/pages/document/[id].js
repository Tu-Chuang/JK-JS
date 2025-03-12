import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styled, { css } from 'styled-components';
import { FaHome, FaArrowLeft, FaBookOpen, FaSearch, FaPlus, FaMinus, FaArrowUp, FaLeaf, FaSun, FaMoon, FaSearchMinus, FaSearchPlus, FaEye, FaPrint, FaGripLines } from 'react-icons/fa';
import { useTheme } from '../../components/ThemeContext';
import { getDocument, getVolumes, categoryMap } from '../../services/api';

// 添加淡入淡出动画
const fadeIn = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export default function DocumentPage() {
  const router = useRouter();
  const { id } = router.query;
  const { language, isDarkMode, toggleTheme, languageText, toggleLanguage, theme } = useTheme();
  
  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [highlightedParagraph, setHighlightedParagraph] = useState(null);
  const [volumes, setVolumes] = useState([]);  // 添加课程集数状态
  const [fontSize, setFontSize] = useState(1); // 添加字体大小状态
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isEyeCareMode, setIsEyeCareMode] = useState(true); // 添加护眼模式状态
  const [showLines, setShowLines] = useState(true); // 修改为默认显示横线
  
  // 获取文档数据
  useEffect(() => {
    if (!id) return;

    const fetchDocument = async () => {
      let retryCount = 0;
      const maxRetries = 2; // 最多重试2次
      
      const attemptFetch = async () => {
        try {
          setLoading(true);
          const data = await getDocument(id);
          
          // 处理自动重定向的情况
          if (data._redirected && data.id && data.id !== id) {
            console.log(`自动重定向: ${id} -> ${data.id}`);
            // 更新URL但保持页面状态
            window.history.replaceState(
              {}, 
              '', 
              `/document/${data.id}`
            );
            
            // 显示一个一次性的提示消息
            const message = `已自动跳转到课程的第一篇文档`;
            const notifyDiv = document.createElement('div');
            notifyDiv.textContent = message;
            notifyDiv.style.cssText = `
              position: fixed;
              top: 80px;
              left: 50%;
              transform: translateX(-50%);
              background: rgba(0, 150, 255, 0.9);
              color: white;
              padding: 10px 20px;
              border-radius: 8px;
              z-index: 1000;
              font-size: 14px;
              box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            `;
            document.body.appendChild(notifyDiv);
            
            // 3秒后移除提示
            setTimeout(() => {
              notifyDiv.style.opacity = '0';
              notifyDiv.style.transition = 'opacity 0.5s';
              setTimeout(() => {
                document.body.removeChild(notifyDiv);
              }, 500);
            }, 3000);
          }
          
          setDocumentData(data);
          setLoading(false);
          setError(null); // 清除之前的错误
          return false; // 不需要重试
        } catch (err) {
          console.error('获取文档失败:', err);
          
          // 检查是否有具体错误信息
          const errorMessage = err.response?.data?.message || 
                              (language === 'zh_CN' ? '获取文档失败' : '獲取文檔失敗');
          
          // 如果是404错误，表示文档不存在
          if (err.response?.status === 404) {
            // 检查是否是课程ID格式
            if (/^\d{2}-\d{3}$/.test(id)) {
              setError(language === 'zh_CN' ? 
                `未找到课程 ${id} 的任何文档` : 
                `未找到課程 ${id} 的任何文檔`);
            } else {
              setError(language === 'zh_CN' ? 
                '文档不存在或已被删除' : 
                '文檔不存在或已被刪除');
            }
            setLoading(false);
            return false; // 不需要重试
          }
          
          // 如果是其他错误，并且还可以重试
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`重试获取文档(${retryCount}/${maxRetries})...`);
            return true; // 继续重试
          }
          
          // 已达最大重试次数或其他错误
          setError(errorMessage);
          setLoading(false);
          return false; // 不再重试
        }
      };
      
      // 执行首次获取
      const shouldRetry = await attemptFetch();
      
      // 如果需要重试，设置延迟
      if (shouldRetry) {
        const retryTimeout = setTimeout(async () => {
          const shouldContinue = await attemptFetch();
          
          // 如果需要第二次重试
          if (shouldContinue) {
            setTimeout(async () => {
              await attemptFetch();
            }, 2000); // 第二次重试等待更长时间
          }
        }, 1000);
        
        return () => clearTimeout(retryTimeout);
      }
    };

    fetchDocument();
  }, [id, language]);

  // 获取所有集数
  useEffect(() => {
    const fetchVolumes = async () => {
      try {
        const volumesData = await getVolumes();
        setVolumes(volumesData);
      } catch (err) {
        console.error('获取课程目录失败:', err);
      }
    };

    fetchVolumes();
  }, []);

  // 单独的效果处理滚动和高亮
  useEffect(() => {
    if (!documentData || loading) return;
    
    const paragraphIndex = parseInt(router.query.paragraph);
    
    if (!isNaN(paragraphIndex)) {
      const timer = setTimeout(() => {
        const element = window.document.getElementById(`p${paragraphIndex + 1}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedParagraph(paragraphIndex);
          
          setTimeout(() => {
            setHighlightedParagraph(null);
          }, 10000);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [documentData, loading, router.query.paragraph]);

  // 监听滚动事件
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        const scrollPosition = window.pageYOffset;
        console.log('Current scroll position:', scrollPosition);
        setShowScrollTop(scrollPosition > 300);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll);
      handleScroll(); // 初始检查
      console.log('Scroll listener added');
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', handleScroll);
        console.log('Scroll listener removed');
      }
    };
  }, []);

  // 获取文档标题
  const getTitle = () => {
    if (!documentData) return '';
    
    if (documentData.title && typeof documentData.title === 'object') {
      return language === 'zh_CN' ? documentData.title.zh_CN : documentData.title.zh_TW;
    }
    
    if (documentData.title && typeof documentData.title === 'string') {
      return documentData.title;
    }
    
    return documentData.doc_id || documentData.id || '';
  };

  // 获取卷册信息
  const getVolume = () => {
    if (!documentData) return '';
    
    if (documentData.volume) {
      if (typeof documentData.volume === 'object') {
        return documentData.volume[language] || documentData.volume.zh_CN || documentData.volume.zh_TW || '';
      }
      if (typeof documentData.volume === 'string') {
        return documentData.volume;
      }
    }
    
    return '';
  };

  // 获取段落文本
  const getParagraphText = (paragraph) => {
    if (!paragraph) return '';
    
    // 如果是对象格式
    if (typeof paragraph === 'object') {
      // 优先使用语言对应的文本
      const langKey = language === 'zh_CN' ? 'zh_CN' : 'zh_TW';
      if (paragraph[langKey]) {
        return paragraph[langKey];
      }
      
      // 如果没有对应语言的文本，尝试使用另一种语言
      const fallbackKey = language === 'zh_CN' ? 'zh_TW' : 'zh_CN';
      if (paragraph[fallbackKey]) {
        return paragraph[fallbackKey];
      }
      
      // 最后尝试使用通用文本字段
      if (paragraph.text) {
        return paragraph.text;
      }
    }
    
    // 如果是字符串，直接返回
    if (typeof paragraph === 'string') {
      return paragraph;
    }
    
    return '';
  };

  // 强制在语言变化时重新渲染
  useEffect(() => {
    if (documentData && documentData.paragraphs) {
      // 触发重新渲染
      setDocumentData({...documentData});
    }
  }, [language]);

  // 生成目录数据
  const generateToc = () => {
    if (!documentData?.paragraphs) return [];
    
    return documentData.paragraphs.map((paragraph, index) => ({
      id: `p${index + 1}`,
      title: getParagraphText(paragraph).substring(0, 30) + '...',
      index: index
    }));
  };

  // 滚动到指定段落
  const scrollToParagraph = (id) => {
    const element = window.document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedParagraph(parseInt(id.slice(1)) - 1);
      
      setTimeout(() => {
        setHighlightedParagraph(null);
      }, 3000);
    }
  };

  // 处理字体大小调整
  const handleFontSize = (type) => {
    // 阻止事件冒泡，防止在移动设备上的多次触发
    event?.preventDefault?.();
    event?.stopPropagation?.();
    
    if (type === 'increase') {
      setFontSize(prev => {
        const newSize = Math.min(prev + 0.1, 1.5);
        // 使用requestAnimationFrame确保视觉更新同步
        requestAnimationFrame(() => {
          document.documentElement.style.setProperty('--document-font-scale', newSize);
        });
        return newSize;
      });
    } else {
      setFontSize(prev => {
        const newSize = Math.max(prev - 0.1, 0.8);
        requestAnimationFrame(() => {
          document.documentElement.style.setProperty('--document-font-scale', newSize);
        });
        return newSize;
      });
    }
  };

  // 处理回到顶部
  const handleScrollTop = () => {
    console.log('Scroll to top clicked');
    if (typeof window !== 'undefined') {
      try {
        // 尝试多种滚动方法
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
        
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        
        console.log('Scroll methods executed');
      } catch (error) {
        console.error('Scroll error:', error);
      }
    }
  };

  // 处理护眼模式切换
  const toggleEyeCareMode = () => {
    setIsEyeCareMode(prev => !prev);
  };

  // 处理横线显示切换
  const toggleLines = () => {
    // 阻止事件冒泡，防止在移动设备上的多次触发
    event?.preventDefault?.();
    event?.stopPropagation?.();
    
    setShowLines(prev => !prev);
  };

  // 检查ID格式并处理
  useEffect(() => {
    if (!id) return;
    
    // 检查是否是课程ID格式（形如01-003）
    const isCourseId = /^\d{2}-\d{3}$/.test(id);
    if (isCourseId) {
      console.log(`检测到课程ID: ${id}，尝试重定向到第一篇文档`);
      
      const redirectToFirstDocument = async () => {
        try {
          // 获取卷数据
          const volumesData = await getVolumes();
          if (!volumesData || !Array.isArray(volumesData)) return;
          
          // 提取课程的类别ID
          const categoryId = id.split('-')[0];
          
          // 在volumes中找到对应类别
          const category = volumesData.find(vol => vol.id === categoryId);
          if (category && category.courses) {
            // 在该类别中找到对应课程
            const course = category.courses.find(c => c.id === id);
            if (course && course.firstDocumentId) {
              console.log(`从volumes找到课程 ${id} 的第一篇文档: ${course.firstDocumentId}`);
              
              // 更新URL但保持页面状态
              window.history.replaceState(
                {}, 
                '', 
                `/document/${course.firstDocumentId}`
              );
              
              // 显示一个一次性的提示消息
              const message = `已自动跳转到课程的第一篇文档`;
              const notifyDiv = document.createElement('div');
              notifyDiv.textContent = message;
              notifyDiv.style.cssText = `
                position: fixed;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 150, 255, 0.9);
                color: white;
                padding: 10px 20px;
                border-radius: 8px;
                z-index: 1000;
                font-size: 14px;
                box-shadow: 0 4px 10px rgba(0,0,0,0.2);
              `;
              document.body.appendChild(notifyDiv);
              
              // 3秒后移除提示
              setTimeout(() => {
                notifyDiv.style.opacity = '0';
                notifyDiv.style.transition = 'opacity 0.5s';
                setTimeout(() => {
                  document.body.removeChild(notifyDiv);
                }, 500);
              }, 3000);
              
              return true;
            }
          }
        } catch (error) {
          console.error('重定向到第一篇文档失败:', error);
        }
        return false;
      };
      
      redirectToFirstDocument().then(redirected => {
        if (!redirected) {
          // 如果无法找到第一篇文档，构造一个可能的文档ID
          const predictedFirstDocumentId = `${id}-0001`;
          console.log(`预测课程 ${id} 的第一篇文档ID: ${predictedFirstDocumentId}`);
          
          // 更新URL
          window.history.replaceState(
            {}, 
            '', 
            `/document/${predictedFirstDocumentId}`
          );
        }
      });
    }
  }, [id]);

  // 在useEffect中注入CSS变量
  useEffect(() => {
    // 设置全局CSS变量用于字体大小缩放
    document.documentElement.style.setProperty('--document-font-scale', fontSize);
    
    // 返回清理函数
    return () => {
      document.documentElement.style.removeProperty('--document-font-scale');
    };
  }, [fontSize]);

  return (
    <div className={theme === 'dark' ? 'dark-theme' : ''}>
      <Head>
        <title>
          {loading
            ? language === 'zh_CN' ? '加载中...' : '加載中...'
            : `${getTitle()} - ${language === 'zh_CN' ? '检索系统' : '檢索系統'}`}
        </title>
        <meta name="description" content={getTitle()} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <DocumentContainer theme={theme} $eyeCareMode={isEyeCareMode}>
        <Header className="glass" $eyeCareMode={isEyeCareMode}>
          <HeaderContent>
            <ButtonGroup>
              <HomeLink href="/">
                <FaHome />
              </HomeLink>
              
              <BackButton onClick={() => router.back()}>
                <FaArrowLeft />
                {language === 'zh_CN' ? '返回' : '返回'}
              </BackButton>
            </ButtonGroup>
            
            <Controls>
              <ThemeButton onClick={toggleTheme} title={language === 'zh_CN' ? (isDarkMode ? '切换亮色' : '切换暗色') : (isDarkMode ? '切換亮色' : '切換暗色')}>
                {isDarkMode ? <FaSun /> : <FaMoon />}
              </ThemeButton>
              <EyeCareButton 
                onClick={toggleEyeCareMode} 
                title={isEyeCareMode ? "关闭护眼" : "开启护眼"}
                $active={isEyeCareMode}
              >
                <FaLeaf />
              </EyeCareButton>
              <LangButton onClick={toggleLanguage} title={language === 'zh_CN' 
                ? '當前為簡體中文，點擊切換至繁體中文' 
                : '当前为繁体中文，点击切换至简体中文'
              }>
                {language === 'zh_CN' ? '简体' : '繁體'}
              </LangButton>
            </Controls>
          </HeaderContent>
        </Header>

        <MainContent>
          {loading ? (
            <LoadingContainer className="glass" $eyeCareMode={isEyeCareMode}>
              <LoadingSpinner theme={theme} />
              <LoadingText theme={theme}>
                {language === 'zh_CN' ? '正在加载文档...' : '正在加載文檔...'}
              </LoadingText>
              <LoadingProgress />
              <LoadingMessage>
                {language === 'zh_CN' 
                  ? '请稍候，我们正在准备文档内容...' 
                  : '請稍候，我們正在準備文檔內容...'}
              </LoadingMessage>
            </LoadingContainer>
          ) : error ? (
            <ErrorContainer className="glass" $eyeCareMode={isEyeCareMode}>
              <ErrorIcon>
                <FaBookOpen />
              </ErrorIcon>
              <ErrorTitle>
                {language === 'zh_CN' ? '无法加载文档' : '無法加載文檔'}
              </ErrorTitle>
              <ErrorMessage>{error}</ErrorMessage>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <ErrorButton onClick={() => router.push('/catalog')}>
                  {language === 'zh_CN' ? '返回目录' : '返回目錄'}
                </ErrorButton>
                <ErrorButton onClick={() => window.location.reload()}>
                  {language === 'zh_CN' ? '重新加载' : '重新加載'}
                </ErrorButton>
              </div>
            </ErrorContainer>
          ) : documentData ? (
            <DocumentLayout>
              <TableOfContents className="glass" $eyeCareMode={isEyeCareMode}>
                <TocList>
                  {volumes.map((volume) => {
                    // 获取当前文档的课程ID（前两段，如01-003）
                    const currentCourseId = id?.split('-').slice(0, 2).join('-');
                    // 检查是否是当前分类
                    const isCurrentVolume = volume.id === id?.split('-')[0];
                    
                    if (isCurrentVolume) {
                      // 找到当前课程
                      const currentCourse = volume.courses.find(course => 
                        course.id === currentCourseId
                      );
                      
                      if (currentCourse) {
                        // 生成当前课程的所有文档ID
                        const courseFiles = [];
                        for (let i = 1; i <= currentCourse.files; i++) {
                          const docId = `${currentCourse.id}-${i.toString().padStart(4, '0')}`;
                          courseFiles.push(docId);
                        }
                        
                        return (
                          <div key={currentCourse.id}>
                            <CourseTitle>
                              {language === 'zh_CN' ? currentCourse.title : currentCourse.titleTw}
                            </CourseTitle>
                            <EpisodeList>
                              {courseFiles.map((fileId) => {
                                const episodeNumber = parseInt(fileId.split('-')[2]);
                                const isCurrentEpisode = fileId === id;
                                return (
                                  <EpisodeItem
                                    key={fileId}
                                    $active={isCurrentEpisode}
                                    onClick={() => router.push(`/document/${fileId}`)}
                                  >
                                    {language === 'zh_CN' ? '第' : '第'}{episodeNumber}{language === 'zh_CN' ? '集' : '集'}
                                  </EpisodeItem>
                                );
                              })}
                            </EpisodeList>
                          </div>
                        );
                      }
                    }
                    return null;
                  })}
                </TocList>
              </TableOfContents>
              
              <DocumentSection $eyeCareMode={isEyeCareMode} style={{ fontSize: `${fontSize}rem` }}>
                <DocumentHeader theme={theme}>
                  <DocumentTitle theme={theme}>
                    {getTitle()}
                  </DocumentTitle>
                </DocumentHeader>
                
                <DocumentMeta>
                  {documentData.doc_number && (
                    <MetaItem>
                      <MetaLabel>{language === 'zh_CN' ? '文档编号:' : '文檔編號:'}</MetaLabel>
                      <MetaValue>{documentData.doc_number}</MetaValue>
                    </MetaItem>
                  )}
                  {id && (
                    <MetaItem>
                      <MetaLabel>{language === 'zh_CN' ? '分类:' : '分類:'}</MetaLabel>
                      <MetaValue>
                        {(() => {
                          const categoryId = id.split('-')[0];
                          if (categoryMap[categoryId]) {
                            return language === 'zh_CN' 
                              ? categoryMap[categoryId].name 
                              : categoryMap[categoryId].nameTw;
                          }
                          return categoryId;
                        })()}
                      </MetaValue>
                    </MetaItem>
                  )}
                  {getVolume() && (
                    <MetaItem>
                      <MetaLabel>{language === 'zh_CN' ? '卷册:' : '卷冊:'}</MetaLabel>
                      <MetaValue>{getVolume()}</MetaValue>
                    </MetaItem>
                  )}
                  {documentData.year && (
                    <MetaItem>
                      <MetaLabel>{language === 'zh_CN' ? '年份:' : '年份:'}</MetaLabel>
                      <MetaValue>{documentData.year}</MetaValue>
                    </MetaItem>
                  )}
                  {documentData.location && (
                    <MetaItem>
                      <MetaLabel>{language === 'zh_CN' ? '位置:' : '位置:'}</MetaLabel>
                      <MetaValue>
                        {typeof documentData.location === 'object' 
                          ? (language === 'zh_CN' ? documentData.location.zh_CN : documentData.location.zh_TW) 
                          : documentData.location}
                      </MetaValue>
                    </MetaItem>
                  )}
                </DocumentMeta>
                
                <DocumentContent $showLines={showLines} $fontSize={fontSize}>
                  {documentData.paragraphs && Array.isArray(documentData.paragraphs) ? (
                    documentData.paragraphs.map((paragraph, index) => (
                      <Paragraph 
                        key={paragraph.id || `p${index+1}`} 
                        id={`p${index+1}`}
                        data-highlighted={index === highlightedParagraph}
                        $showLines={showLines}
                      >
                        {getParagraphText(paragraph)}
                      </Paragraph>
                    ))
                  ) : (
                    <EmptyMessage>
                      {language === 'zh_CN' ? '暂无内容' : '暫無內容'}
                    </EmptyMessage>
                  )}
                </DocumentContent>
              </DocumentSection>

              <RightControls>
                <ControlButton 
                  onClick={(e) => handleFontSize('increase')} 
                  title={language === 'zh_CN' ? '放大字体' : '放大字體'}
                  aria-label={language === 'zh_CN' ? '放大字体' : '放大字體'}
                >
                  <FaPlus />
                </ControlButton>
                <ControlButton 
                  onClick={(e) => handleFontSize('decrease')} 
                  title={language === 'zh_CN' ? '缩小字体' : '縮小字體'}
                  aria-label={language === 'zh_CN' ? '缩小字体' : '縮小字體'}
                >
                  <FaMinus />
                </ControlButton>
                <ControlButton 
                  onClick={(e) => toggleLines()}
                  title={language === 'zh_CN' ? 
                    (showLines ? '隐藏辅助线' : '显示辅助线') : 
                    (showLines ? '隱藏輔助線' : '顯示輔助線')}
                  $active={showLines}
                  aria-label={language === 'zh_CN' ? 
                    (showLines ? '隐藏辅助线' : '显示辅助线') : 
                    (showLines ? '隱藏輔助線' : '顯示輔助線')}
                >
                  <FaGripLines />
                </ControlButton>
                <ControlButton 
                  onClick={handleScrollTop} 
                  title={language === 'zh_CN' ? '返回顶部' : '返回頂部'}
                  $active={showScrollTop}
                  style={{ cursor: 'pointer' }}
                >
                  <FaArrowUp />
                </ControlButton>
              </RightControls>
            </DocumentLayout>
          ) : (
            <NotFoundContainer className="glass" $eyeCareMode={isEyeCareMode}>
              <NotFoundText>
                {language === 'zh_CN' ? '未找到文档' : '未找到文檔'}
              </NotFoundText>
            </NotFoundContainer>
          )}
        </MainContent>
      </DocumentContainer>
    </div>
  );
}

// 样式组件
const DocumentContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: ${props => props.$eyeCareMode ? '#f5e6d3' : '#ffffff'};
  position: relative;
  overflow-x: hidden;
  
  body.dark-theme & {
    background-color: ${props => props.$eyeCareMode ? '#2c2722' : '#000000'};
  }
`;

const Header = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 15px 0;
  background: ${props => props.$eyeCareMode ? 'rgba(245, 230, 211, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  body.dark-theme & {
    background: ${props => props.$eyeCareMode ? 'rgba(44, 39, 34, 0.95)' : 'rgba(30, 30, 30, 0.95)'};
  }
`;

const HeaderContent = styled.div`
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const HomeLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--border-radius);
  background: var(--primary-color);
  color: white;
  transition: all 0.3s;
  text-decoration: none;
  
  &:hover {
    background: #3a7bc8;
    color: white;
  }
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  height: 40px;
  border-radius: var(--border-radius);
  background: rgba(255, 255, 255, 0.1);
  color: inherit;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  body.dark-theme & {
    background: rgba(0, 0, 0, 0.2);
    
    &:hover {
      background: rgba(0, 0, 0, 0.3);
    }
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 10px;
`;

const ThemeButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: none;
  border: 1px solid currentColor;
  color: inherit;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  svg {
    font-size: 1.2rem;
  }
`;

const EyeCareButton = styled(ThemeButton)`
  background: ${props => props.$active ? '#4CAF50' : 'none'};
  color: ${props => props.$active ? 'white' : 'inherit'};
  border-color: ${props => props.$active ? '#4CAF50' : 'currentColor'};

  &:hover {
    background: ${props => props.$active ? '#45a049' : 'rgba(255, 255, 255, 0.1)'};
  }
`;

const LangButton = styled(ThemeButton)``;

const LangLabel = styled.span`
  font-size: 0.8rem;
  opacity: 0.7;
`;

const MainContent = styled.main`
  flex: 1;
  width: 100%;
  margin: 70px auto 0;
  padding: 20px;
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 1;
`;

const LoadingContainer = styled.div`
  padding: 40px;
  border-radius: var(--border-radius);
  text-align: center;
  background: ${props => props.$eyeCareMode ? 'rgba(245, 230, 211, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  width: 70%;
  margin: 0 auto;
  animation: fadeIn 0.5s ease-out;
  ${fadeIn}
  
  body.dark-theme & {
    background: ${props => props.$eyeCareMode ? 'rgba(44, 39, 34, 0.95)' : 'rgba(30, 30, 30, 0.95)'};
  }
`;

const LoadingText = styled.p`
  font-size: 1.2rem;
  margin-bottom: 20px;
  color: var(--primary-color);
  font-weight: 500;
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 3px solid var(--border-color);
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingProgress = styled.div`
  width: 200px;
  height: 4px;
  background: var(--border-color);
  border-radius: 2px;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 30%;
    background: var(--primary-color);
    border-radius: 2px;
    animation: progress 1.5s ease-in-out infinite;
  }

  @keyframes progress {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(400%); }
  }
`;

const LoadingMessage = styled.p`
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 10px;
  font-style: italic;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  padding: 2rem;
  text-align: center;
  
  body.dark-theme &, .dark-theme & {
    color: #f0f0f0;
  }
`;

const ErrorIcon = styled.div`
  font-size: 4rem;
  color: #ff5252;
  margin-bottom: 1.5rem;
  
  body.dark-theme &, .dark-theme & {
    color: #ff7070;
  }
`;

const ErrorTitle = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 1rem;
  font-weight: 600;
  
  body.dark-theme &, .dark-theme & {
    color: #f0f0f0;
  }
`;

const ErrorMessage = styled.p`
  font-size: 1.1rem;
  margin-bottom: 2rem;
  color: #666;
  max-width: 600px;
  
  body.dark-theme &, .dark-theme & {
    color: #aaa;
  }
`;

const ErrorButton = styled.button`
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #2160dc;
    transform: translateY(-2px);
  }
  
  body.dark-theme &, .dark-theme & {
    background: #3773ff;
    
    &:hover {
      background: #4d84ff;
    }
  }
`;

const NotFoundContainer = styled(LoadingContainer)``;

const NotFoundText = styled.p`
  font-size: 1.2rem;
`;

const DocumentLayout = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  min-height: calc(100vh - 90px);
`;

const TableOfContents = styled.nav`
  position: fixed;
  top: 90px;
  left: calc(50% - 35% - 220px);
  width: 200px;
  height: calc(100vh - 110px);
  overflow-y: auto;
  padding: 15px;
  border-radius: var(--border-radius);
  background: ${props => props.$eyeCareMode ? 'rgba(245, 230, 211, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  
  body.dark-theme & {
    background: ${props => props.$eyeCareMode ? 'rgba(44, 39, 34, 0.95)' : 'rgba(30, 30, 30, 0.95)'};
  }
  
  /* 自定义滚动条样式 */
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: var(--primary-color);
    border-radius: 2px;
  }
  
  @media (max-width: 1024px) {
    position: fixed;
    top: auto;
    bottom: 20px;
    left: 20px;
    height: auto;
    max-height: 60vh;
    width: 180px;
    transform: translateX(${props => props.isOpen ? '0' : '-120%'});
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    z-index: 1000;
    backdrop-filter: blur(10px);
  }
  
  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    
    body.dark-theme & {
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
    }
  }
`;

const TocList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px;
`;

const TocItem = styled.button`
  text-align: left;
  padding: 10px 14px;
  border: none;
  background: ${props => props.active ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.active ? 'white' : 'inherit'};
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  line-height: 1.4;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-shadow: ${props => props.active ? '0 2px 8px rgba(0, 0, 0, 0.15)' : 'none'};
  
  &:hover {
    background: ${props => props.active ? 'var(--primary-dark)' : 'rgba(255, 255, 255, 0.1)'};
    transform: translateX(5px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  body.dark-theme & {
    box-shadow: ${props => props.active ? '0 2px 8px rgba(0, 0, 0, 0.3)' : 'none'};
    
    &:hover {
      background: ${props => props.active ? 'var(--primary-dark)' : 'rgba(0, 0, 0, 0.2)'};
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
  }
`;

const TocItemTitle = styled.span`
  font-weight: 500;
`;

const TocItemMeta = styled.span`
  font-size: 0.8rem;
  opacity: 0.7;
`;

const DocumentSection = styled.section`
  width: 70%;
  padding: 30px;
  border-radius: var(--border-radius);
  margin-left: 220px;
  background: ${props => props.$eyeCareMode ? 'rgba(245, 230, 211, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
  animation: fadeIn 0.5s ease-out;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
  ${fadeIn}
  
  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  }
  
  body.dark-theme & {
    background: ${props => props.$eyeCareMode ? 'rgba(44, 39, 34, 0.95)' : 'rgba(30, 30, 30, 0.95)'};
    border-color: rgba(255, 255, 255, 0.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    
    &:hover {
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
    }
  }
  
  @media (max-width: 1024px) {
    width: 100%;
    margin-left: 0;
  }
`;

const DocumentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
  flex-direction: column;
  text-align: center;
`;

const DocumentTitle = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  text-align: center;
`;

const DocumentMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
  justify-content: center;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 180px;
  justify-content: center;
  font-size: 0.95rem;
`;

const MetaLabel = styled.span`
  font-weight: 500;
  color: var(--primary-color);
`;

const MetaValue = styled.span``;

const DocumentContent = styled.div`
  line-height: 2;
  font-size: calc(1rem * var(--document-font-scale, ${props => props.$fontSize || 1}));
  transition: font-size 0.2s ease;
  
  ${props => props.$showLines && css`
    & > p {
      background-image: linear-gradient(
        transparent calc(2em - 1px),
        rgba(128, 128, 128, 0.2) calc(2em - 1px),
        rgba(128, 128, 128, 0.2) calc(2em),
        transparent calc(2em)
      );
      background-size: 100% 2em;
      background-position-y: 0.2em;
      line-height: 2em;
      margin: 1em 0;
    }
  `}
`;

const Paragraph = styled.p`
  margin: 1em 0;
  line-height: 2em;
  text-align: justify;
  transition: all 0.3s ease;
  padding: 10px;
  border-radius: var(--border-radius);
  position: relative;
  
  &[data-highlighted="true"] {
    background-color: ${props => props.theme.isDarkMode ? 'rgba(255, 255, 0, 0.15)' : 'rgba(255, 255, 0, 0.3)'};
    box-shadow: 0 0 10px rgba(255, 255, 0, 0.2);
    transform: scale(1.01);
  }
`;

const EmptyMessage = styled.p`
  text-align: center;
  color: var(--primary-color);
  font-style: italic;
`;

const TocToggleButton = styled.button`
  display: none;
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  border: none;
  cursor: pointer;
  z-index: 1001;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  
  @media (max-width: 1024px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const EpisodeList = styled.div`
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  width: 100%;
`;

const EpisodeItem = styled.button`
  width: 95%;
  text-align: center;
  padding: 8px 12px;
  border: none;
  background: ${props => props.$active ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.$active ? 'white' : 'inherit'};
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  box-shadow: ${props => props.$active ? 
    '0 4px 8px rgba(0, 0, 0, 0.2)' : 
    '0 2px 4px rgba(0, 0, 0, 0.05)'};
  
  &:hover {
    background: ${props => props.$active ? 'var(--primary-dark)' : 'rgba(255, 255, 255, 0.2)'};
    transform: translateX(5px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  body.dark-theme & {
    background: ${props => props.$active ? 'var(--primary-color)' : 'rgba(0, 0, 0, 0.2)'};
    box-shadow: ${props => props.$active ? 
      '0 4px 8px rgba(0, 0, 0, 0.4)' : 
      '0 2px 4px rgba(0, 0, 0, 0.2)'};
    
    &:hover {
      background: ${props => props.$active ? 'var(--primary-dark)' : 'rgba(0, 0, 0, 0.3)'};
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
  }
  
  &:active {
    transform: translateX(5px) scale(0.98);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const RightControls = styled.div`
  position: fixed;
  top: 50%;
  right: calc(50% - 35% - 220px);
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000;
  
  @media (max-width: 1024px) {
    right: 20px;
    top: auto;
    bottom: 20px;
    transform: none;
    flex-direction: row;
    
    button {
      width: 36px;
      height: 36px;
    }
  }
`;

const ControlButton = styled.button`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--border-radius);
  background: var(--primary-color);
  color: white;
  cursor: pointer !important;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  opacity: ${props => props.$active === false ? '0.5' : '1'};
  position: relative;
  z-index: 100;
  -webkit-tap-highlight-color: transparent; /* 防止移动设备上的点击高亮 */
  
  &:hover {
    background: var(--primary-dark);
    transform: translateX(-5px);
    opacity: 1;
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  svg {
    font-size: 1.2rem;
  }
  
  body.dark-theme & {
    background: var(--primary-color);
    
    &:hover {
      background: var(--primary-dark);
    }
  }
  
  body.eye-care-mode & {
    background: var(--eye-care-button);
    color: var(--eye-care-text);
    
    &:hover {
      background: var(--eye-care-button-hover);
    }
  }
  
  @media (max-width: 1024px) {
    font-size: 1rem;
    width: 45px;
    height: 45px;
    margin: 0 3px;
    
    &:hover {
      transform: scale(1.1);
    }
    
    /* 添加触摸设备优化 */
    &:active {
      transform: scale(0.92);
      transition: transform 0.1s;
    }
  }
`;

const CourseTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 600;
  margin: 15px 0;
  text-align: center;
  color: var(--primary-color);
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
`;

const Sidebar = styled.aside`
  position: fixed;
  top: 80px;
  left: 20px;
  width: 200px;
  height: calc(100vh - 100px);
  padding: 20px;
  overflow-y: auto;
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  body.dark-theme & {
    background: rgba(30, 30, 30, 0.95);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: var(--primary-color);
    border-radius: 2px;
  }
  
  @media (max-width: 1024px) {
    position: fixed;
    top: auto;
    bottom: 20px;
    left: 20px;
    height: auto;
    max-height: 60vh;
    width: 180px;
    transform: translateX(${props => props.isOpen ? '0' : '-120%'});
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    z-index: 1000;
    backdrop-filter: blur(10px);
  }
  
  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    
    body.dark-theme & {
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
    }
  }
`;