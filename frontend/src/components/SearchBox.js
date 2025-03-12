import React, { useState } from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import { FaSearch } from 'react-icons/fa';
import { useTheme } from './ThemeContext';

const SearchBox = ({ showControls = true }) => {
  const router = useRouter();
  const { language } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push({
        pathname: '/search',
        query: { q: searchQuery.trim() }
      });
    }
  };

  return (
    <SearchForm onSubmit={handleSubmit}>
      <SearchInputGroup>
        <SearchIcon>
          <FaSearch />
        </SearchIcon>
        <SearchInput
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={language === 'zh_CN' ? '输入关键词搜索...' : '輸入關鍵詞搜索...'}
        />
      </SearchInputGroup>
      
      {showControls && (
        <SearchHint>
          {language === 'zh_CN' 
            ? '提示: 可以使用引号搜索完整短语，例如 "阿弥陀经"' 
            : '提示: 可以使用引號搜索完整短語，例如 "阿彌陀經"'}
        </SearchHint>
      )}
    </SearchForm>
  );
};

const SearchForm = styled.form`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`;

const SearchInputGroup = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  background: white;
  border-radius: 50px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover, &:focus-within {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  body.dark-theme & {
    background: rgba(30, 30, 30, 0.8);
    box-shadow: 0 2px 15px rgba(0, 0, 0, 0.2);

    &:hover, &:focus-within {
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 20px;
  color: #999;
  font-size: 1rem;
  display: flex;
  align-items: center;
  pointer-events: none;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 15px 20px 15px 50px;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  background: transparent;
  color: inherit;
  outline: none;

  &::placeholder {
    color: #999;
  }
`;

const SearchHint = styled.div`
  font-size: 0.8rem;
  opacity: 0.7;
  text-align: center;
`;

export default SearchBox;