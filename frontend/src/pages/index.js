import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styled from 'styled-components';
import Navbar from '../components/Navbar';
import { useTheme } from '../components/ThemeContext';
import { FaSearch, FaBook, FaTags, FaDatabase, FaHistory, FaChartLine, FaEye, FaLanguage } from 'react-icons/fa';

export default function Home() {
  const { language } = useTheme();
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return (
    <div>
      <Head>
        <title>{language === 'zh_CN' ? '  检索中心' : '檢索中心'}</title>
        <meta name="description" content="高性能检索系统" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {isClient && <Navbar />}

      <HeroSection>
        <HeroContent>
          <HeroTitle className="gradient-text">
            {language === 'zh_CN' ? '检索中心' : '檢索中心'}
          </HeroTitle>
          <HeroSubtitle>
            {language === 'zh_CN' 
              ? '智能、高效、精准的检索' 
              : '智能、高效、精準的檢索'}
          </HeroSubtitle>
          
          <IntroText>
            {language === 'zh_CN'
              ? '本系统收录大量老法师的经文，采用先进的全文检索技术，为大家提供便捷的检索服务。'
              : '本系統收錄大量老法師的經文，採用先進的全文檢索技術，為大家提供便捷的檢索服務。'}
          </IntroText>

          <ActionButtonContainer>
            <ActionButton href="/catalog">
              <ActionButtonIcon>
                <FaBook />
              </ActionButtonIcon>
              <ActionButtonText>
                {language === 'zh_CN' ? '进入目录' : '進入目錄'}
              </ActionButtonText>
            </ActionButton>
            <ActionButton href="/search">
              <ActionButtonIcon>
                <FaSearch />
              </ActionButtonIcon>
              <ActionButtonText>
                {language === 'zh_CN' ? '开始检索' : '開始檢索'}
              </ActionButtonText>
            </ActionButton>
          </ActionButtonContainer>
          
          <FeatureSection>
            <FeatureCard>
              <FeatureIcon>
                <FaSearch />
              </FeatureIcon>
              <FeatureTitle>{language === 'zh_CN' ? '精准检索' : '精準檢索'}</FeatureTitle>
              <FeatureDescription>
                {language === 'zh_CN' 
                  ? '支持检索精准定位、分词匹配、让检索结果更加准确' 
                  : '支持檢索精準定位、分詞匹配、讓檢索結果更加準確'}
              </FeatureDescription>
            </FeatureCard>
            
            <FeatureCard>
              <FeatureIcon>
                <FaLanguage />
              </FeatureIcon>
              <FeatureTitle>{language === 'zh_CN' ? '简繁互通' : '簡繁互通'}</FeatureTitle>
              <FeatureDescription>
                {language === 'zh_CN' 
                  ? '支持简体、繁体智能转换，输入任意字体均可查询对应经文' 
                  : '支持簡體、繁體智能轉換，輸入任意字體均可查詢對應經文'}
              </FeatureDescription>
            </FeatureCard>
            
            <FeatureCard>
              <FeatureIcon>
                <FaBook />
              </FeatureIcon>
              <FeatureTitle>{language === 'zh_CN' ? '目录体系' : '目錄體系'}</FeatureTitle>
              <FeatureDescription>
                {language === 'zh_CN' 
                  ? '完整的目录体系，支持分类浏览、层级导航、快速定位' 
                  : '完整的目錄體系，支持分類瀏覽、層級導航、快速定位'}
              </FeatureDescription>
            </FeatureCard>

            <FeatureCard>
              <FeatureIcon>
                <FaEye />
              </FeatureIcon>
              <FeatureTitle>{language === 'zh_CN' ? '护眼阅读' : '護眼閱讀'}</FeatureTitle>
              <FeatureDescription>
                {language === 'zh_CN' 
                  ? '提供护眼模式、字体大小调节等人性化阅读体验' 
                  : '提供護眼模式、字體大小調節等人性化閱讀體驗'}
              </FeatureDescription>
            </FeatureCard>
          </FeatureSection>
        </HeroContent>
      </HeroSection>
    </div>
  );
}

const IntroText = styled.p`
  font-size: 1.1rem;
  margin: 0 auto 40px;
  max-width: 800px;
  line-height: 1.7;
  opacity: 0.9;
  text-align: center;
  padding: 0 20px;
`;

const ActionButtonContainer = styled.div`
  display: flex;
  gap: 30px;
  margin-bottom: 70px;
  flex-wrap: wrap;
  justify-content: center;
  
  @media (max-width: 600px) {
    gap: 20px;
    margin-bottom: 60px;
    flex-direction: column;
    align-items: center;
  }
`;

const ActionButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 36px;
  border-radius: 50px;
  background: var(--primary-color);
  color: white;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 200px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    background: #0058e2;
  }
  
  body.dark-theme & {
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  }
`;

const ActionButtonIcon = styled.span`
  font-size: 1.2rem;
  display: flex;
  align-items: center;
`;

const ActionButtonText = styled.span`
  font-size: 1.1rem;
`;

const HeroSection = styled.div`
  min-height: 100vh;
  padding-top: 100px;
  padding-bottom: 60px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  
  body.dark-theme & {
    background: linear-gradient(135deg, #1f2122 0%, #1a1e21 100%);
  }
`;

const HeroContent = styled.main`
  max-width: 1200px;
  width: 100%;
  padding: 40px 20px 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const HeroTitle = styled.h1`
  font-size: 4rem;
  font-weight: 800;
  margin-bottom: 24px;
  background: linear-gradient(45deg, var(--primary-color), #4a90e2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  
  @media (max-width: 768px) {
    font-size: 2.8rem;
    margin-bottom: 20px;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.5rem;
  margin-bottom: 36px;
  max-width: 600px;
  opacity: 0.8;
  font-weight: 500;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
    margin-bottom: 28px;
  }
`;

const FeatureSection = styled.div`
  display: flex;
  gap: 35px;
  margin: 0 0 60px;
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;
  max-width: 1200px;
  
  @media (max-width: 768px) {
    gap: 25px;
  }
`;

const FeatureCard = styled.div`
  flex: 1;
  min-width: 250px;
  max-width: 270px;
  padding: 40px 25px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  margin-bottom: 20px;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.12);
  }
  
  body.dark-theme & {
    background: rgba(30, 30, 30, 0.9);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }

  @media (max-width: 1100px) {
    min-width: calc(50% - 35px);
    padding: 35px 22px;
  }

  @media (max-width: 768px) {
    min-width: 100%;
    max-width: 100%;
    padding: 30px 20px;
  }
`;

const FeatureIcon = styled.div`
  font-size: 2.5rem;
  color: var(--primary-color);
  margin-bottom: 25px;
`;

const FeatureTitle = styled.h3`
  font-size: 1.4rem;
  margin-bottom: 18px;
  font-weight: 600;
`;

const FeatureDescription = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  opacity: 0.85;
`; 