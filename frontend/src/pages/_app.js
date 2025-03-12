import '../styles/globals.css';
import { ThemeProvider } from '../components/ThemeContext';
import { ConfigProvider } from 'antd';
import { useEffect, useState } from 'react';
import { StyleSheetManager } from 'styled-components';
import axios from 'axios';
import Head from 'next/head';
import { theme } from '../styles/theme';

// 解决服务端渲染和客户端渲染不匹配的问题
const shouldComponentUpdate = (prop) => {
  return typeof window !== 'undefined';
};

function MyApp({ Component, pageProps }) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    // 标记客户端渲染
    setIsClient(true);
    
    // 在客户端重置axios默认配置
    if (typeof window !== 'undefined') {
      // 获取当前页面的主机名和端口
      const currentOrigin = window.location.origin;
      
      // 重置axios默认配置
      axios.defaults.baseURL = `${currentOrigin}/api`;
      
      console.log('Axios默认baseURL已重置为:', axios.defaults.baseURL);
    }
  }, []);

  return (
    <StyleSheetManager shouldForwardProp={shouldComponentUpdate}>
      <ConfigProvider>
        <ThemeProvider theme={theme}>
          <Head>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
          </Head>
          {isClient ? <Component {...pageProps} /> : null}
        </ThemeProvider>
      </ConfigProvider>
    </StyleSheetManager>
  );
}

export default MyApp; 