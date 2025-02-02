import { Layout, Typography } from 'antd';
import { useState } from 'react';
import SearchBox from '../components/SearchBox';
import CategoryNav from '../components/CategoryNav';
import LanguageSwitch from '../components/LanguageSwitch';
import styles from '../styles/Home.module.css';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

export default function Home() {
  const [language, setLanguage] = useState<'zh_CN' | 'zh_TW'>('zh_CN');
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [selectedSeries, setSelectedSeries] = useState<string>();

  const handleCategorySelect = (categoryId: string, seriesId?: string) => {
    setSelectedCategory(categoryId);
    setSelectedSeries(seriesId);
  };

  return (
    <Layout className={styles.layout}>
      <Header className={styles.header}>
        <div className={styles.headerContent}>
          <Title level={2} className={styles.title}>
            {language === 'zh_CN' ? '佛经智能检索系统' : '佛經智能檢索系統'}
          </Title>
          <div className={styles.switchContainer}>
            <LanguageSwitch onChange={setLanguage} />
          </div>
        </div>
      </Header>

      <Layout className={styles.mainLayout}>
        <CategoryNav 
          language={language}
          onSelect={handleCategorySelect}
        />
        
        <Content className={styles.content}>
          <div className={styles.container}>
            <SearchBox 
              language={language}
              categoryId={selectedCategory}
              seriesId={selectedSeries}
            />
          </div>
        </Content>
      </Layout>

      <Footer className={styles.footer}>
        {language === 'zh_CN' ? '佛经智能检索系统' : '佛經智能檢索系統'} ©2025
      </Footer>
    </Layout>
  );
} 