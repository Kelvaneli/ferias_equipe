import React from 'react';
import { LogIn, Calendar, Shield, Users, BarChart3, Check } from 'lucide-react';

interface LoginPromptProps {
  onLogin: () => void;
  isLoading: boolean;
}

export const LoginPrompt: React.FC<LoginPromptProps> = ({ onLogin, isLoading }) => {
  return (
    <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl text-white p-8 sm:p-10 shadow-xl overflow-hidden relative border border-indigo-700/50">
      {/* Background glow decoration */}
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-4">
          <Shield className="w-3.5 h-3.5 text-indigo-300" />
          Autenticação Firebase Cloud Integrada
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
          Planeje e visualize as férias da sua equipe em tempo real
        </h2>

        <p className="text-slate-300 text-sm leading-relaxed mb-6">
          Acesse para cadastrar e gerenciar seus próprios períodos de férias. Todas as datas da equipe permanecem transparentes e visíveis para evitar conflitos de agenda no projeto.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <div className="flex items-center gap-2.5 text-xs text-indigo-100 bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xs">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Calendário visual com cores por funcionário</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-indigo-100 bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xs">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Dashboard com gráfico de dias totais</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-indigo-100 bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xs">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Sincronização instantânea no Firestore</span>
          </div>
        </div>

        <button
          onClick={onLogin}
          disabled={isLoading}
          className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 active:bg-slate-200 text-indigo-950 font-bold text-sm shadow-lg shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 cursor-pointer disabled:opacity-60"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-indigo-900 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {/* Google G logo SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Entrar com Conta Google</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
