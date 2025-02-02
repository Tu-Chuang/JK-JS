import { Button } from 'antd';
import { useState } from 'react';
import styles from '../styles/LanguageSwitch.module.css';

interface LanguageSwitchProps {
  onChange: (lang: 'zh_CN' | 'zh_TW') => void;
}

const LanguageSwitch: React.FC<LanguageSwitchProps> = ({ onChange }) => {
  const [isSimplified, setIsSimplified] = useState(true);

  const toggleLanguage = () => {
    const newValue = !isSimplified;
    setIsSimplified(newValue);
    onChange(newValue ? 'zh_CN' : 'zh_TW');
  };

  return (
    <Button 
      type="link" 
      className={styles.switchButton}
      onClick={toggleLanguage}
      style={{ position: 'absolute', right: '24px' }}
    >
      {isSimplified ? '繁體' : '简体'}
    </Button>
  );
};

export default LanguageSwitch; 