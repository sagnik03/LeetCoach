import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { LoginView } from './LoginView.js';
import { SignupView } from './SignupView.js';
import { Loader2 } from 'lucide-react';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const [showSignup, setShowSignup] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-indigo-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-xs text-slate-500 mt-2">Connecting to LeetCoach...</span>
      </div>
    );
  }

  if (!user) {
    if (showSignup) {
      return <SignupView onToggleView={() => setShowSignup(false)} />;
    }
    return <LoginView onToggleView={() => setShowSignup(true)} />;
  }

  return <>{children}</>;
};
