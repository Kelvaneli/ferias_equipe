import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { User as FirebaseUser } from 'firebase/auth';
import { CalendarDays } from 'lucide-react';
import { LoginPrompt } from './LoginPrompt';

interface LoginPageProps {
  user: FirebaseUser | null;
  onLogin: () => void;
  isLoading: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ user, onLogin, isLoading }) => {
  const location = useLocation();

  // Already authenticated: go back to the page that required login (or home)
  if (user) {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-10 font-sans text-slate-800">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
          <CalendarDays className="w-5 h-5" />
        </div>
        <span className="font-extrabold text-xl tracking-tight text-slate-900">
          Férias<span className="text-indigo-600">Equipe</span>
        </span>
      </div>

      <div className="w-full max-w-3xl">
        <LoginPrompt onLogin={onLogin} isLoading={isLoading} />
      </div>

      <p className="text-[11px] text-slate-400 mt-6 text-center">
        Acesso restrito à equipe. Entre com sua conta Google para continuar.
      </p>
    </div>
  );
};
