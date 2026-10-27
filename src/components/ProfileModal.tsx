import React, { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { UserProfile, PALETTE_COLORS, DEPARTMENTS, AVATAR_PRESETS } from '../types';
import { 
  X, 
  User, 
  Mail, 
  Briefcase, 
  Building2, 
  Palette, 
  Phone, 
  FileText, 
  Check, 
  Camera, 
  Calendar, 
  Save, 
  Sparkles,
  ShieldCheck,
  Clock
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: FirebaseUser;
  profile: UserProfile | null;
  onSaveProfile: (updatedData: Partial<UserProfile>, syncPastVacations: boolean) => Promise<void>;
  userTotalVacationDays: number;
  userVacationCount: number;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  profile,
  onSaveProfile,
  userTotalVacationDays,
  userVacationCount,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [favoriteColor, setFavoriteColor] = useState(PALETTE_COLORS[0]);
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [syncPastVacations, setSyncPastVacations] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDisplayName(profile?.displayName || currentUser.displayName || '');
      setPhotoURL(profile?.photoURL || currentUser.photoURL || '');
      setJobTitle(profile?.jobTitle || '');
      setDepartment(profile?.department || DEPARTMENTS[0]);
      setFavoriteColor(profile?.favoriteColor || PALETTE_COLORS[0]);
      setPhone(profile?.phone || '');
      setBio(profile?.bio || '');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, profile, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setErrorMsg('Por favor, informe seu nome de exibição.');
      return;
    }

    try {
      setIsSaving(true);
      await onSaveProfile({
        displayName: trimmedName,
        photoURL: photoURL.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
        department: department.trim() || undefined,
        favoriteColor: favoriteColor || PALETTE_COLORS[0],
        phone: phone.trim() || undefined,
        bio: bio.trim() || undefined,
      }, syncPastVacations);

      setSuccessMsg('Perfil atualizado com sucesso no Firebase!');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar alterações no perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200/90 overflow-hidden my-8">
        
        {/* Header with profile banner background */}
        <div 
          className="relative px-6 pt-6 pb-12 text-white transition-colors"
          style={{
            background: `linear-gradient(135deg, ${favoriteColor}dd 0%, #1e1b4b 100%)`
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs">
                Perfil do Colaborador
              </span>
              <span className="flex items-center gap-1 text-[11px] text-white/80">
                <ShieldCheck className="w-3.5 h-3.5" />
                Firebase Auth & Firestore
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4">
            <h2 className="text-xl font-extrabold">{displayName || 'Meu Perfil'}</h2>
            <p className="text-xs text-white/80">{currentUser.email}</p>
          </div>
        </div>

        {/* Profile Content Body */}
        <div className="px-6 -mt-8 pb-6">
          {/* Avatar and Stats */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            {/* Avatar preview */}
            <div className="relative group w-20 h-20">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={displayName}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg bg-slate-100"
                />
              ) : (
                <div 
                  className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-white text-2xl font-black"
                  style={{ backgroundColor: favoriteColor }}
                >
                  {(displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div 
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-xs"
                style={{ backgroundColor: favoriteColor }}
                title="Sua cor exclusiva no calendário"
              >
                <Palette className="w-3 h-3 text-white" />
              </div>
            </div>

            {/* Quick Vacation stats pills */}
            <div className="flex items-center gap-2 text-xs">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <div>
                  <span className="block font-bold text-slate-800">{userVacationCount}</span>
                  <span className="text-[10px] text-slate-400">períodos</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <div>
                  <span className="block font-bold text-slate-800">{userTotalVacationDays} dias</span>
                  <span className="text-[10px] text-slate-400">agendados</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <Check className="w-4 h-4" />
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Nome de exibição */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Nome Completo / Exibição <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome como aparecerá para a equipe"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-slate-50 hover:bg-white"
                />
              </div>
            </div>

            {/* Email (Read-only from Google Auth) */}
            <div>
              <label className="block font-bold text-slate-500 uppercase tracking-wider text-[11px] mb-1">
                Email Google (Identificador da Conta)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  disabled
                  value={currentUser.email || ''}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-500 bg-slate-100 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Cargo e Departamento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Cargo / Função
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Ex: Desenvolvedor Front-end"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Departamento / Área
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-slate-50 cursor-pointer"
                  >
                    {DEPARTMENTS.map(dep => (
                      <option key={dep} value={dep}>{dep}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Cor Exclusiva de Férias */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-indigo-600" />
                  Sua Cor Exclusiva no Calendário da Equipe
                </label>
                <span className="font-mono text-[10px] text-slate-400 uppercase">{favoriteColor}</span>
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="color"
                  value={favoriteColor}
                  onChange={(e) => setFavoriteColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300"
                />
                <div className="flex flex-wrap items-center gap-1.5 flex-1">
                  {PALETTE_COLORS.map(c => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setFavoriteColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-md transition-all cursor-pointer ${
                        favoriteColor.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-indigo-600 ring-offset-2 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* URL da foto de perfil / Avatares Rápidos */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Foto de Perfil (URL ou Sugestões)
              </label>
              <div className="relative mb-2">
                <Camera className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  placeholder="https://exemplo.com/sua-foto.jpg"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-slate-50"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">Sugestões de avatar:</span>
                <div className="flex items-center gap-1.5">
                  {AVATAR_PRESETS.map((url, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setPhotoURL(url)}
                      className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                        photoURL === url ? 'border-indigo-600 scale-110' : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="Preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Telefone e Bio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Telefone / Contato (Opcional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Bio / Preferências de Férias
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Ex: Costumo tirar férias em Julho/Dezembro"
                    maxLength={200}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-slate-50"
                  />
                </div>
              </div>
            </div>

            {/* Sync with existing vacation entries checkbox */}
            {userVacationCount > 0 && (
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-indigo-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncPastVacations}
                  onChange={(e) => setSyncPastVacations(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-[11px]">
                  <strong>Sincronizar minhas férias:</strong> Atualizar meu nome e cor exclusiva em todos os meus períodos já cadastrados no calendário ({userVacationCount} agendamentos).
                </span>
              </label>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
