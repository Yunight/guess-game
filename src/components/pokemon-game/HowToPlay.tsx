import { FC } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface HowToPlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlay: FC<HowToPlayProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-gradient-to-br from-blue-500 to-blue-600 border-4 border-white p-0 shadow-2xl sm:max-h-[90vh] max-h-[95vh] overflow-y-auto">
        <DialogTitle className="sr-only">{t('howToPlay')}</DialogTitle>
        <DialogDescription className="sr-only">{t('howToPlayDesc')}</DialogDescription>
        
        <div className="p-6 text-white relative">
          <div className="fixed inset-0 bg-[radial-gradient(circle,_transparent_20%,_rgba(255,255,255,0.1)_20%)] bg-[length:20px_20px] opacity-50 pointer-events-none"></div>
          <div className="fixed inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
          
          <div className="relative mb-8 pt-8">
            <h2 className="text-4xl font-bold text-center mb-2 drop-shadow-lg">{t('howToPlay')}</h2>
            <div className="flex justify-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse delay-100"></div>
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse delay-200"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Game Features */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-300" />
                {t('gameFeatures')}
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-300 rounded-full mt-1.5"></div>
                  <span>{t('feature1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-300 rounded-full mt-1.5"></div>
                  <span>{t('feature2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-300 rounded-full mt-1.5"></div>
                  <span>{t('feature3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-300 rounded-full mt-1.5"></div>
                  <span>{t('feature4')}</span>
                </li>
              </ul>
            </div>

            {/* Special Features */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-300" />
                {t('specialFeatures')}
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-300 rounded-full mt-1.5"></div>
                  <span>{t('special1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-300 rounded-full mt-1.5"></div>
                  <span>{t('special2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-300 rounded-full mt-1.5"></div>
                  <span>{t('special3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-300 rounded-full mt-1.5"></div>
                  <span>{t('special4')}</span>
                </li>
              </ul>
            </div>

            {/* Scoring System */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-300" />
                {t('scoringSystem')}
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-300 rounded-full mt-1.5"></div>
                  <span>{t('scoring1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-300 rounded-full mt-1.5"></div>
                  <span>{t('scoring2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-300 rounded-full mt-1.5"></div>
                  <span>{t('scoring3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-300 rounded-full mt-1.5"></div>
                  <span>{t('scoring4')}</span>
                </li>
              </ul>
            </div>

            {/* Tips & Tricks */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-300" />
                {t('tipsAndTricks')}
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-300 rounded-full mt-1.5"></div>
                  <span>{t('tip1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-300 rounded-full mt-1.5"></div>
                  <span>{t('tip2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-300 rounded-full mt-1.5"></div>
                  <span>{t('tip3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-300 rounded-full mt-1.5"></div>
                  <span>{t('tip4')}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <Button
              onClick={onClose}
              className="bg-white text-blue-600 hover:bg-blue-50 border-none shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
            >
              {t('understood')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 