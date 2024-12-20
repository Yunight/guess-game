import { FC } from 'react';
import { Button } from './button';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export const LanguageToggle: FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
    localStorage.setItem('preferredLanguage', newLang);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      className="hover:bg-white/20 text-white hover:text-white/80 transition-colors"
      title={i18n.language === 'fr' ? 'Switch to English' : 'Passer en Français'}
    >
      <Languages className="h-5 w-5" />
      <span className="sr-only">
        {i18n.language === 'fr' ? 'Switch to English' : 'Passer en Français'}
      </span>
    </Button>
  );
}; 