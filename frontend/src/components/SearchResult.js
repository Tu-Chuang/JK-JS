import React, { useState } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { FaBookOpen, FaChevronDown, FaChevronRight } from 'react-icons/fa';

// 安全渲染文本 - 确保不渲染对象
const SafeText = ({ text, fallback = '' }) => {
  if (text === null || text === undefined) {
    return <>{fallback}</>;
  }
  
  if (typeof text === 'string') {
    return <>{text}</>;
  }
  
  // 如果是对象或其他类型，使用备用文本
  return <>{fallback}</>;
};

// 安全地高亮显示匹配的文本
const HighlightedText = ({ text, query, fallback = '' }) => {
  // 安全检查
  if (!text || typeof text !== 'string') {
    return <SafeText text={fallback} />;
  }
  
  if (!query || typeof query !== 'string') {
    return <>{text}</>;
  }
  
  try {
    // 划分文本为匹配和非匹配部分
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    if (parts.length === 1) {
      // 没有匹配项，直接返回原文本
      return <>{text}</>;
    }
    
    return (
      <>
        {parts.map((part, i) => {
          // 检查是否匹配查询词（忽略大小写）
          if (part.toLowerCase() === query.toLowerCase()) {
            return <span key={i} className="highlight">{part}</span>;
          }
          return <React.Fragment key={i}>{part}</React.Fragment>;
        })}
      </>
    );
  } catch (e) {
    console.error('高亮处理错误:', e);
    return <>{text}</>;
  }
};

// 主组件
const SearchResult = ({ result, query, language }) => {
  const [showAllParagraphs, setShowAllParagraphs] = useState(false);
  
  if (!result || typeof result !== 'object') {
    console.error('搜索结果无效:', result);
    return null;
  }
  
  // 获取全部包含关键词的段落
  const getMatchingParagraphs = () => {
    if (!result.paragraphs || !Array.isArray(result.paragraphs) || result.paragraphs.length === 0) {
      return [];
    }
    
    try {
      const langKey = language === 'zh_CN' ? 'zh_CN' : 'zh_TW';
      const matchingParagraphs = [];
      
      // 搜索所有匹配段落
      for (const [index, paragraph] of result.paragraphs.entries()) {
        if (!paragraph || typeof paragraph !== 'object') continue;
        
        // 获取对应语言的文本
        const paragraphText = paragraph[langKey];
        
        // 如果没有文本，跳过此段落
        if (typeof paragraphText !== 'string') continue;
        
        // 使用正则表达式进行不区分大小写的搜索
        const searchRegex = new RegExp(query, 'i');
        if (searchRegex.test(paragraphText)) {
          matchingParagraphs.push({
            index,
            text: paragraphText,
            id: paragraph.id || `p${index + 1}`
          });
        }
      }
      
      // 如果没有找到任何匹配的段落，返回空数组
      if (matchingParagraphs.length === 0) {
        return [];
      }
      
      return matchingParagraphs;
    } catch (e) {
      console.error('获取匹配段落错误:', e);
      return [];
    }
  };
  
  // 获取段落内容摘要（包含查询词的上下文）
  const getExcerpt = (content, query) => {
    if (typeof content !== 'string' || !content) return '';
    if (typeof query !== 'string' || !query) return content.substring(0, 200) + '...';
    
    try {
      const lowerContent = content.toLowerCase();
      const lowerQuery = query.toLowerCase();
      const index = lowerContent.indexOf(lowerQuery);
      
      if (index === -1) return content.substring(0, 200) + '...';
      
      // 计算摘要的起始和结束位置
      const start = Math.max(0, index - 50);
      const end = Math.min(content.length, index + query.length + 150);
      
      // 添加省略号表示内容被截断
      const prefix = start > 0 ? '...' : '';
      const suffix = end < content.length ? '...' : '';
      
      return prefix + content.substring(start, end) + suffix;
    } catch (e) {
      console.error('获取摘要错误:', e);
      return content.substring(0, 200) + '...';
    }
  };
  
  // 获取标题
  const getTitle = () => {
    try {
      const langKey = language === 'zh_CN' ? 'zh_CN' : 'zh_TW';
      
      // 尝试从title对象获取对应语言的标题
      if (result.title) {
        if (typeof result.title === 'object' && typeof result.title[langKey] === 'string') {
          return result.title[langKey];
        }
        if (typeof result.title === 'string') {
          return result.title;
        }
      }
      
      // 使用文档ID或其他标识作为标题
      const docId = result.doc_id || result.id;
      if (typeof docId === 'string') {
        return docId;
      }
      
      // 最后的备用选项
      return language === 'zh_CN' ? '未命名文档' : '未命名文檔';
    } catch (e) {
      console.error('获取标题错误:', e);
      return language === 'zh_CN' ? '未知标题' : '未知標題';
    }
  };
  
  // 安全获取各种值
  const title = getTitle();
  const matchingParagraphs = getMatchingParagraphs();
  const docId = typeof result.doc_id === 'string' ? result.doc_id : '';
  const docNumber = typeof result.doc_number === 'string' || typeof result.doc_number === 'number' ? result.doc_number : '';
  const year = typeof result.year === 'string' || typeof result.year === 'number' ? result.year : '';
  const volume = typeof result.volume === 'string' || typeof result.volume === 'number' ? result.volume : '';
  const documentId = typeof result.id === 'string' ? result.id : '';
  
  // 显示的段落数量
  const paragraphsToShow = showAllParagraphs ? matchingParagraphs : matchingParagraphs.slice(0, 1);
  
  return matchingParagraphs.length > 0 ? (
    <ResultContainer>
      <ResultIcon>
        <FaBookOpen />
      </ResultIcon>
      
      <ResultContent>
        <ResultTitle>
          <TitleWrapper>
            {documentId ? (
              <Link href={`/document/${documentId}`} passHref legacyBehavior>
                <StyledTitleLink>
                  <HighlightedText 
                    text={title} 
                    query={query} 
                    fallback={language === 'zh_CN' ? '未知标题' : '未知標題'} 
                  />
                </StyledTitleLink>
              </Link>
            ) : (
              <span>
                <HighlightedText 
                  text={title} 
                  query={query} 
                  fallback={language === 'zh_CN' ? '未知标题' : '未知標題'} 
                />
              </span>
            )}
          </TitleWrapper>
        </ResultTitle>
        
        <ResultMeta>
          {docNumber && (
            <MetaItem highlight="true">
              <MetaLabel>{language === 'zh_CN' ? '编号：' : '編號：'}</MetaLabel>
              <MetaValue>{docNumber}</MetaValue>
            </MetaItem>
          )}
          {docId && (
            <MetaItem>
              <MetaLabel>{language === 'zh_CN' ? '文档：' : '文檔：'}</MetaLabel>
              <MetaValue>{docId}</MetaValue>
            </MetaItem>
          )}
          {volume && (
            <MetaItem highlight="true">
              <MetaLabel>{language === 'zh_CN' ? '集数：' : '集數：'}</MetaLabel>
              <MetaValue>{volume}</MetaValue>
            </MetaItem>
          )}
          {year && (
            <MetaItem>
              <MetaLabel>{language === 'zh_CN' ? '年份：' : '年份：'}</MetaLabel>
              <MetaValue>{year}</MetaValue>
            </MetaItem>
          )}
          <MetaItem>
            <MetaLabel>{language === 'zh_CN' ? '匹配：' : '匹配：'}</MetaLabel>
            <MetaValue>{matchingParagraphs.length}</MetaValue>
          </MetaItem>
        </ResultMeta>
        
        <ParagraphList>
          {paragraphsToShow.map((paragraph, index) => (
            <ParagraphItem key={index}>
              <Link 
                href={`/document/${documentId}?highlight=${encodeURIComponent(query)}&paragraph=${paragraph.index}`}
                passHref 
                legacyBehavior
              >
                <ParagraphLink>
                  <ParagraphHeader>
                    <ParagraphNumber>
                      {language === 'zh_CN' ? `段落 ${paragraph.index + 1}` : `段落 ${paragraph.index + 1}`}
                    </ParagraphNumber>
                  </ParagraphHeader>
                  <ParagraphContent>
                    <HighlightedText 
                      text={getExcerpt(paragraph.text, query)} 
                      query={query} 
                      fallback={language === 'zh_CN' ? '无法显示内容' : '無法顯示內容'} 
                    />
                  </ParagraphContent>
                </ParagraphLink>
              </Link>
            </ParagraphItem>
          ))}
          
          {matchingParagraphs.length > 1 && (
            <ShowMoreButton onClick={() => setShowAllParagraphs(!showAllParagraphs)}>
              {showAllParagraphs 
                ? <> <FaChevronUp /> {language === 'zh_CN' ? '收起' : '收起'} </>
                : <> <FaChevronDown /> {language === 'zh_CN' ? `显示全部 ${matchingParagraphs.length} 处匹配` : `顯示全部 ${matchingParagraphs.length} 處匹配`} </>
              }
            </ShowMoreButton>
          )}
        </ParagraphList>
      </ResultContent>
    </ResultContainer>
  ) : null; // 如果没有匹配的段落，不显示任何内容
};

// 样式组件
const ResultContainer = styled.div`
  display: flex;
  gap: 15px;
  padding: 20px;
  border-radius: var(--border-radius);
  background: rgba(255, 255, 255, 0.5);
  transition: all 0.3s;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  
  &:hover {
    background: rgba(255, 255, 255, 0.8);
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }
  
  body.dark-theme & {
    background: rgba(30, 30, 30, 0.5);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    
    &:hover {
      background: rgba(40, 40, 40, 0.7);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    }
  }
`;

const ResultIcon = styled.div`
  font-size: 1.5rem;
  color: var(--primary-color);
  padding-top: 5px;
`;

const ResultContent = styled.div`
  flex: 1;
`;

const ResultTitle = styled.h3`
  margin: 0 0 10px;
  font-size: 1.2rem;
  line-height: 1.4;
  color: var(--text-color);
`;

const TitleWrapper = styled.div`
  display: inline-block;
`;

const StyledTitleLink = styled.a`
  color: var(--primary-color);
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ResultMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 15px;
  font-size: 0.9rem;
  opacity: 0.85;
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  ${props => props.highlight && `
    font-weight: 500;
    color: var(--primary-color);
  `}
`;

const MetaLabel = styled.span`
  color: var(--text-color-secondary);
  body.dark-theme & {
    color: var(--dark-text-secondary);
  }
`;

const MetaValue = styled.span`
  white-space: nowrap;
`;

const ParagraphList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 15px;
`;

const ParagraphItem = styled.div`
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.1);
  
  body.dark-theme & {
    border-color: rgba(255, 255, 255, 0.1);
  }
`;

const ParagraphHeader = styled.div`
  background-color: rgba(0, 0, 0, 0.05);
  padding: 8px 12px;
  font-size: 0.85rem;
  display: flex;
  justify-content: space-between;
  
  body.dark-theme & {
    background-color: rgba(255, 255, 255, 0.05);
  }
`;

const ParagraphNumber = styled.span`
  font-weight: 500;
`;

const ParagraphContent = styled.div`
  padding: 12px;
  line-height: 1.6;
  
  .highlight {
    background-color: var(--highlight-color);
    padding: 0 2px;
    border-radius: 2px;
    font-weight: 500;
  }
  
  body.dark-theme & .highlight {
    background-color: var(--dark-highlight-color);
  }
`;

const ShowMoreButton = styled.button`
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 2px auto;
  padding: 1px 15px;
  color: var(--primary-color);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: var(--border-radius);
  
  &:hover {
    background-color: rgba(74, 144, 226, 0.1);
  }
  
  body.dark-theme &:hover {
    background-color: rgba(74, 144, 226, 0.2);
  }
`;

const FaChevronUp = styled(FaChevronDown)`
  transform: rotate(180deg);
`;

const NoMatchingText = styled.div`
  padding: 15px;
  text-align: center;
  opacity: 0.7;
  font-style: italic;
`;

const ViewDocumentLink = styled.div`
  margin-top: 15px;
  text-align: right;
`;

const StyledViewLink = styled.a`
  color: var(--primary-color);
  text-decoration: none;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s;
  
  &:hover {
    transform: translateX(3px);
    text-decoration: underline;
  }
`;

const ParagraphLink = styled.a`
  display: block;
  text-decoration: none;
  color: inherit;
  padding: 10px;
  border-radius: var(--border-radius);
  transition: all 0.3s ease;
  
  &:hover {
    background: var(--hover-color);
    transform: translateX(5px);
  }
  
  &:active {
    transform: translateX(2px);
  }
`;

const DocNumber = styled.span`
  color: var(--primary-color);
  font-weight: 500;
  margin-right: 8px;
`;

export default SearchResult; 