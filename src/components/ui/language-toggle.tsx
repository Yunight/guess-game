import { FC } from 'react';
import { Button } from './button';
import { useTranslation } from 'react-i18next';

export const LanguageToggle: FC = () => {
  const { i18n } = useTranslation();
  const isFrench = i18n.language === 'fr';

  const toggleLanguage = () => {
    const newLang = isFrench ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
    localStorage.setItem('i18nextLng', newLang);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      className="hover:bg-white/20 text-white hover:text-white/80 transition-colors relative h-9 w-9 p-0 overflow-hidden"
      title={isFrench ? 'Switch to English' : 'Passer en Français'}
    >
      {/* Show English flag when in French, French flag when in English */}
      {isFrench ? (
        // English Flag
        <div className="absolute inset-0 bg-[#012169] flex items-center justify-center">
          {/* White diagonal stripes */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-0 w-[200%] h-[6px] bg-white origin-top-left rotate-45 translate-x-[-50%]"></div>
            <div className="absolute bottom-0 right-0 w-[200%] h-[6px] bg-white origin-bottom-right rotate-45 translate-x-[50%]"></div>
            <div className="absolute top-0 right-0 w-[200%] h-[6px] bg-white origin-top-right -rotate-45 translate-x-[50%]"></div>
            <div className="absolute bottom-0 left-0 w-[200%] h-[6px] bg-white origin-bottom-left -rotate-45 translate-x-[-50%]"></div>
          </div>
          {/* Red diagonal stripes */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-0 w-[200%] h-[3px] bg-[#C8102E] origin-top-left rotate-45 translate-x-[-50%]"></div>
            <div className="absolute bottom-0 right-0 w-[200%] h-[3px] bg-[#C8102E] origin-bottom-right rotate-45 translate-x-[50%]"></div>
            <div className="absolute top-0 right-0 w-[200%] h-[3px] bg-[#C8102E] origin-top-right -rotate-45 translate-x-[50%]"></div>
            <div className="absolute bottom-0 left-0 w-[200%] h-[3px] bg-[#C8102E] origin-bottom-left -rotate-45 translate-x-[-50%]"></div>
          </div>
          {/* White cross */}
          <div className="absolute w-full h-[40%] bg-white"></div>
          <div className="absolute h-full w-[40%] bg-white"></div>
          {/* Red cross */}
          <div className="absolute w-full h-[24%] bg-[#C8102E]"></div>
          <div className="absolute h-full w-[24%] bg-[#C8102E]"></div>
        </div>
      ) : (
        // French Flag
        <div className="absolute inset-0 flex">
          <div className="flex-1 bg-[#002395]"></div>
          <div className="flex-1 bg-white"></div>
          <div className="flex-1 bg-[#ED2939]"></div>
        </div>
      )}
      <span className="sr-only">
        {isFrench ? 'Switch to English' : 'Passer en Français'}
      </span>
    </Button>
  );
}; 