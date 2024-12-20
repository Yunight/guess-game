import { FC, useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { updateProfile } from 'firebase/auth';

interface EmailAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailAuthDialog: FC<EmailAuthDialogProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isSignUp) {
        if (!trainerName.trim()) {
          setError(t('trainerNameRequired'));
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: trainerName
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      }
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 bg-black text-white rounded-full p-1 hover:bg-gray-800 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        
        <h2 className="text-2xl font-bold mb-6">
          {isSignUp ? t('signUp') : t('signIn')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('trainerName')}
              </label>
              <Input
                type="text"
                value={trainerName}
                onChange={(e) => setTrainerName(e.target.value)}
                required
                className="w-full"
                placeholder={t('enterName')}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('email')}
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('password')}
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <div className="flex flex-col gap-2">
            <Button 
              type="submit" 
              className="w-full bg-black hover:bg-gray-800 text-white"
            >
              {isSignUp ? t('signUp') : t('signIn')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={toggleMode}
              className="w-full text-black hover:text-black hover:bg-gray-100"
            >
              {isSignUp ? t('alreadyHaveAccount') : t('needAccount')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}; 