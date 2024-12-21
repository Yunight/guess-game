import { FC, useState } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { LogOut, Mail } from 'lucide-react';
import { EmailAuthDialog } from './EmailAuthDialog';

interface AuthButtonsProps {
  isAuthenticated: boolean;
  userName: string | null;
}

const formatGmailDisplayName = (name: string | null): string => {
  if (!name) return '';
  
  // Check if it's a Gmail user (has Gmail in email)
  const isGmailUser = auth.currentUser?.email?.includes('@gmail.com');
  
  if (isGmailUser) {
    // Split the full name into parts
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      // Get first name and first letter of last name
      const firstName = nameParts[0];
      const lastNameInitial = nameParts[nameParts.length - 1][0].toUpperCase();
      return `${firstName} .${lastNameInitial}`;
    }
  }
  
  return name;
};

export const AuthButtons: FC<AuthButtonsProps> = ({ isAuthenticated, userName }) => {
  const { t } = useTranslation();
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Erreur de connexion Google:', error);
    }
  };

  const handleEmailSignIn = () => {
    setShowEmailDialog(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2">
        <span className="text-sm text-gray-700 font-medium">{formatGmailDisplayName(userName) || t('trainerName')}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors"
        >
          <LogOut className="h-4 w-4 mr-1" />
          {t('logout')}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleGoogleSignIn}
          className="h-8 w-8 bg-black hover:bg-gray-800 text-white hover:text-white"
          title={t('connectWithGoogle')}
        >
          G
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleEmailSignIn}
          className="h-8 w-8 bg-black hover:bg-gray-800 text-white hover:text-white"
          title={t('connectWithEmail')}
        >
          <Mail className="h-4 w-4" />
        </Button>
      </div>
      <EmailAuthDialog
        isOpen={showEmailDialog}
        onClose={() => setShowEmailDialog(false)}
      />
    </>
  );
}; 