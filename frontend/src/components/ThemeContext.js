import React, { createContext, useState, useEffect, useContext } from 'react';

// 创建主题上下文
const ThemeContext = createContext();

// 主题提供者组件
export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState('zh_CN'); // 'zh_CN' 简体中文, 'zh_TW' 繁体中文
  const [isEyeCareMode, setIsEyeCareMode] = useState(false); // 添加护眼模式状态
  const [mounted, setMounted] = useState(false);

  // 初始化时检查用户首选主题和语言
  useEffect(() => {
    // 组件挂载后才运行
    setMounted(true);
    
    // 检查localStorage中的主题设置
    const savedTheme = localStorage.getItem('theme');
    const savedLanguage = localStorage.getItem('language');
    const savedEyeCareMode = localStorage.getItem('eyeCareMode'); // 获取保存的护眼模式设置
    
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      // 检查系统首选主题
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
    
    // 设置语言（如果有保存的语言设置）
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    // 设置护眼模式（如果有保存的设置）
    if (savedEyeCareMode) {
      setIsEyeCareMode(savedEyeCareMode === 'true');
    }
    
    // 添加系统颜色方案变化监听
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleDarkModeChange = (e) => {
      if (localStorage.getItem('theme') === null) {
        setIsDarkMode(e.matches);
      }
    };
    
    // 添加监听器
    if (darkModeMediaQuery.addEventListener) {
      darkModeMediaQuery.addEventListener('change', handleDarkModeChange);
    } else if (darkModeMediaQuery.addListener) {
      // 兼容旧版浏览器
      darkModeMediaQuery.addListener(handleDarkModeChange);
    }
    
    // 清理监听器
    return () => {
      if (darkModeMediaQuery.removeEventListener) {
        darkModeMediaQuery.removeEventListener('change', handleDarkModeChange);
      } else if (darkModeMediaQuery.removeListener) {
        darkModeMediaQuery.removeListener(handleDarkModeChange);
      }
    };
  }, []);

  // 当主题改变时更新文档类和localStorage
  useEffect(() => {
    if (!mounted) return;
    
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode, mounted]);

  // 当护眼模式改变时更新文档类和localStorage
  useEffect(() => {
    if (!mounted) return;
    
    if (isEyeCareMode) {
      document.body.classList.add('eye-care-mode');
      localStorage.setItem('eyeCareMode', 'true');
    } else {
      document.body.classList.remove('eye-care-mode');
      localStorage.setItem('eyeCareMode', 'false');
    }
  }, [isEyeCareMode, mounted]);

  // 当语言改变时更新localStorage
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('language', language);
  }, [language, mounted]);

  // 切换主题函数
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // 切换语言函数
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'zh_CN' ? 'zh_TW' : 'zh_CN');
  };
  
  // 设置特定主题
  const setTheme = (theme) => {
    setIsDarkMode(theme === 'dark');
  };

  // 判断当前是否为简体中文
  const isSimplifiedChinese = language === 'zh_CN';
  
  // 判断当前是否为繁体中文
  const isTraditionalChinese = language === 'zh_TW';

  // 切换护眼模式函数
  const toggleEyeCareMode = () => {
    setIsEyeCareMode(!isEyeCareMode);
  };

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleTheme,
        setTheme,
        language,
        isSimplifiedChinese,
        isTraditionalChinese,
        toggleLanguage,
        setLanguage,
        isEyeCareMode,
        toggleEyeCareMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// 自定义钩子，用于在组件中访问主题上下文
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 