import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsOpen(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
    setIsOpen(false);
  };

  if (!deferredPrompt) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center gap-4">
            <img src="/pwa-192x192.png" alt="App Icon" className="w-16 h-16 rounded-xl" />
            <div>
              <h2 className="text-xl font-bold">Pokemon Guess Game</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('installPrompt')}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              {t('later')}
            </Button>
            <Button onClick={handleInstall}>
              {t('install')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 