import React from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { UserProfile } from '../types';
import { 
  CalendarDays, 
  LogIn, 
  LogOut, 
  UserCircle,
  Sparkles,
  Settings
} from 'lucide-react';

interface NavbarProps {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenProfile: () => void;
  onSeedDemoData: () => void;
  onClearMyData: () => void;
  hasVacations: boolean;
  isAdmin: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  userProfile,
  onLogin,
  onLogout,
  onOpenProfile,
  onSeedDemoData,
  hasVacations,
  isAdmin
}) => {
  const currentPhoto = userProfile?.photoURL || user?.photoURL;
  const currentName = userProfile?.displayName || user?.displayName || 'Colaborador';
  const favoriteColor = userProfile?.favoriteColor || '#3b82f6';

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                Férias<span className="text-indigo-600">Equipe</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                Firestore Nuvem
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden md:block">
              Gestão visual e compartilhada de férias e ausências da equipe
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Demo Data Seed if empty */}
          {!hasVacations && user && (
            <button
              onClick={onSeedDemoData}
              title="Carregar dados de demonstração da equipe"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Carregar Exemplo
            </button>
          )}

          {/* User profile & Auth */}
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:border-l sm:border-slate-200">
              {/* Profile clickable button */}
              <button
                onClick={onOpenProfile}
                title="Abrir meu perfil e editar dados"
                className="flex items-center gap-2.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer text-left group"
              >
                <div className="relative">
                  {currentPhoto ? (
                    <img
                      src={currentPhoto}
                      alt={currentName}
                      className="w-8 h-8 rounded-full border-2 border-white shadow-xs object-cover"
                    />
                  ) : (
                    <div 
                      className="w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: favoriteColor }}
                    >
                      {currentName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span 
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                    style={{ backgroundColor: favoriteColor }}
                  />
                </div>

                <div className="hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                      {currentName}
                    </p>
                    {isAdmin && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[130px]">
                    {userProfile?.department || user.email}
                  </p>
                </div>

                <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors hidden sm:block" />
              </button>

              {/* Logout button */}
              <button
                onClick={onLogout}
                title="Sair da conta"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Entrar com Google</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
