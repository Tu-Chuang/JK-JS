import React from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { FaMoon, FaSun, FaHome, FaBook, FaList } from 'react-icons/fa';
import { useTheme } from './ThemeContext';
import { useRouter } from 'next/router';

const Navbar = () => {
  const { isDarkMode, toggleTheme, language, toggleLanguage } = useTheme();
  const router = useRouter();

  const languageText = language === 'zh_CN' ? '简体' : '繁體';
  const isAdminPage = router.pathname === '/admin';
  const handleLogout = () => {
    // Implement logout functionality
  };

  return (
    <NavbarContainer className="nav-container">
      <NavbarContent>
        <LogoSection>
          <Link href="/" passHref legacyBehavior>
            <Logo>
              <FaBook className="logo-icon" />
              <LogoText>
                {language === 'zh_CN' ? '检索系统' : '檢索系統'}
              </LogoText>
            </Logo>
          </Link>
        </LogoSection>
        
        <NavLinks>
          <NavLink href="/" active={router.pathname === '/'}>
            <FaHome />
            <span>{language === 'zh_CN' ? '首页' : '首頁'}</span>
          </NavLink>
          
          <NavLink href="/catalog" active={router.pathname === '/catalog'}>
            <FaList />
            <span>{language === 'zh_CN' ? '目录' : '目錄'}</span>
          </NavLink>
        </NavLinks>
        
        <Controls>
          <ThemeToggle onClick={toggleTheme}>
            {isDarkMode ? <FaSun /> : <FaMoon />}
          </ThemeToggle>
          
          <LanguageToggle onClick={toggleLanguage}>
            {languageText}
          </LanguageToggle>
          
          {isAdminPage && <AdminLogout onClick={handleLogout}>退出</AdminLogout>}
        </Controls>
      </NavbarContent>
    </NavbarContainer>
  );
};

const NavbarContainer = styled.nav`
  width: 100%;
  height: 64px;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  body.dark-theme & {
    background: rgba(18, 18, 18, 0.8);
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.3);
  }
`;

const NavbarContent = styled.div`
  max-width: var(--max-width);
  height: 100%;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
`;

const Logo = styled.a`
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--primary-color);
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  
  .logo-icon {
    font-size: 1.5rem;
  }
  
  &:hover {
    opacity: 0.9;
  }
`;

const LogoText = styled.span`
  font-size: 1.3rem;
  font-weight: 700;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 20px;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = ({ href, active, children }) => {
  return (
    <Link href={href} passHref legacyBehavior>
      <NavLinkAnchor $active={active}>
        {children}
      </NavLinkAnchor>
    </Link>
  );
};

const NavLinkAnchor = styled.a`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  color: ${props => props.$active ? 'var(--primary-color)' : 'var(--text-primary)'};
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.2s;
  font-weight: ${props => props.$active ? '500' : 'normal'};
  
  &:hover {
    background: var(--item-hover-bg);
  }
  
  svg {
    font-size: 1rem;
  }
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const ThemeToggle = styled.button`
  background: none;
  border: none;
  color: inherit;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s;
  
  &:hover {
    transform: rotate(15deg);
    color: var(--primary-color);
  }
`;

const LanguageToggle = styled.button`
  background: none;
  border: 1px solid currentColor;
  border-radius: var(--border-radius);
  color: inherit;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
  
  &:hover {
    background: rgba(74, 144, 226, 0.1);
    color: var(--primary-color);
  }
`;

const AdminLogout = styled.button`
  background: none;
  border: none;
  color: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 5px 10px;
  transition: all 0.3s;
  
  &:hover {
    color: var(--primary-color);
  }
`;

export default Navbar; 