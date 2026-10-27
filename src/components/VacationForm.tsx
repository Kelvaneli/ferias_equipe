import React, { useState, useEffect } from 'react';
import { Vacation, UserProfile, PALETTE_COLORS, getAutoColor, calculateDaysBetween } from '../types';
import { 
  UserPlus, 
  Calendar, 
  Palette, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  X,
  FileText,
  UserCheck
} from 'lucide-react';

interface VacationFormProps {
  onSaveVacation: (vacationData: Omit<Vacation, 'id' | 'userId' | 'userEmail' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  editingVacation: Vacation | null;
  onCancelEdit: () => void;
  existingVacations: Vacation[];
  isSubmitting: boolean;
  currentUserProfile?: UserProfile | null;
  currentUserEmail?: string;
}

export const VacationForm: React.FC<VacationFormProps> = ({
  onSaveVacation,
  editingVacation,
  onCancelEdit,
  existingVacations,
  isSubmitting,
  currentUserProfile,
  currentUserEmail
}) => {
  const [employeeName, setEmployeeName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [color, setColor] = useState(PALETTE_COLORS[0]);
  const [isAutoColor, setIsAutoColor] = useState(true);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Populate when editingVacation changes
  useEffect(() => {
    if (editingVacation) {
      setEmployeeName(editingVacation.employeeName);
      setStartDate(editingVacation.startDate);
      setEndDate(editingVacation.endDate);
      setColor(editingVacation.color || PALETTE_COLORS[0]);
      setIsAutoColor(false);
      setNotes(editingVacation.notes || '');
      setErrorMsg(null);
    } else {
      // Default to user profile if available, or empty
      if (currentUserProfile?.displayName) {
        setEmployeeName(currentUserProfile.displayName);
        setColor(currentUserProfile.favoriteColor || PALETTE_COLORS[0]);
        setIsAutoColor(false);
      } else {
        setEmployeeName('');
        setColor(PALETTE_COLORS[0]);
        setIsAutoColor(true);
      }
      setStartDate('');
      setEndDate('');
      setNotes('');
      setErrorMsg(null);
    }
  }, [editingVacation, currentUserProfile]);

  // When employeeName changes and isAutoColor is on, compute color
  const handleNameChange = (newName: string) => {
    setEmployeeName(newName);
    if (isAutoColor && newName.trim().length > 0) {
      const generated = getAutoColor(newName.trim(), existingVacations);
      setColor(generated);
    }
  };

  const handleUseMyProfile = () => {
    if (currentUserProfile) {
      setEmployeeName(currentUserProfile.displayName);
      setColor(currentUserProfile.favoriteColor || PALETTE_COLORS[0]);
      setIsAutoColor(false);
      if (currentUserProfile.department) {
        setNotes(`Área: ${currentUserProfile.department}`);
      }
    }
  };

  // Calculate day count
  const daysCount = calculateDaysBetween(startDate, endDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = employeeName.trim();
    if (!trimmedName) {
      setErrorMsg('Por favor, informe o nome do funcionário.');
      return;
    }

    if (!startDate || !endDate) {
      setErrorMsg('Por favor, selecione as datas de início e término.');
      return;
    }

    if (endDate < startDate) {
      setErrorMsg('A data de término não pode ser anterior à data de início.');
      return;
    }

    try {
      await onSaveVacation({
        employeeName: trimmedName,
        startDate,
        endDate,
        color: color || PALETTE_COLORS[0],
        notes: notes.trim() || undefined,
      });

      if (!editingVacation) {
        // Reset form on new creation
        if (currentUserProfile?.displayName) {
          setEmployeeName(currentUserProfile.displayName);
          setColor(currentUserProfile.favoriteColor || PALETTE_COLORS[0]);
        } else {
          setEmployeeName('');
          setColor(PALETTE_COLORS[0]);
          setIsAutoColor(true);
        }
        setStartDate('');
        setEndDate('');
        setNotes('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar férias.');
    }
  };

  // Distinct known employee names for autocomplete suggestion chips
  const knownEmployees = Array.from(new Set(existingVacations.map(v => v.employeeName))).slice(0, 5);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            {editingVacation ? <Save className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {editingVacation ? 'Editar Férias da Equipe' : 'Cadastrar Período de Férias'}
            </h3>
            <p className="text-xs text-slate-500">
              {editingVacation 
                ? 'Atualize as informações do agendamento' 
                : 'Mapeie as férias de um colaborador no calendário compartilhado'}
            </p>
          </div>
        </div>

        {editingVacation ? (
          <button
            type="button"
            onClick={onCancelEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Cancelar Edição
          </button>
        ) : (
          currentUserProfile && (
            <button
              type="button"
              onClick={handleUseMyProfile}
              title="Preencher com meus dados e cor de perfil"
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/70 rounded-lg transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Usar Meus Dados</span>
            </button>
          )
        )}
      </div>

      {errorMsg && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nome do funcionário */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            1. Nome do Funcionário <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={employeeName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Ex: Carlos Silva, Marina Rocha..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 hover:bg-white transition-all text-slate-800"
          />

          {/* Suggestion pills if available */}
          {knownEmployees.length > 0 && !editingVacation && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400">Sugestões:</span>
              {knownEmployees.map(name => (
                <button
                  type="button"
                  key={name}
                  onClick={() => handleNameChange(name)}
                  className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors cursor-pointer"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Datas: Início e Fim */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              2. Data de Início <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate && e.target.value > endDate) {
                    setEndDate(e.target.value);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 hover:bg-white transition-all text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              3. Data de Término <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                min={startDate || undefined}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 hover:bg-white transition-all text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Days calculated preview */}
        {startDate && endDate && (
          <div className={`p-2.5 rounded-xl text-xs flex items-center justify-between border ${
            endDate >= startDate 
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50/80 border-rose-200 text-rose-800'
          }`}>
            <span className="font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {endDate >= startDate ? 'Duração Calculada:' : 'Erro nas datas:'}
            </span>
            <span className="font-bold">
              {endDate >= startDate 
                ? `${daysCount} dia(s) consecutivos` 
                : 'Data final anterior à data inicial'}
            </span>
          </div>
        )}

        {/* Cor do funcionário */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-600" />
              4. Cor de Destaque no Calendário
            </label>
            <button
              type="button"
              onClick={() => {
                const toggled = !isAutoColor;
                setIsAutoColor(toggled);
                if (toggled && employeeName.trim()) {
                  setColor(getAutoColor(employeeName.trim(), existingVacations));
                }
              }}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              {isAutoColor ? 'Cor: Automática (Ativada)' : 'Definir Manualmente'}
            </button>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-200">
            {/* Color preview square and native picker */}
            <label className="relative cursor-pointer shrink-0">
              <input
                type="color"
                value={color}
                onChange={(e) => {
                  setColor(e.target.value);
                  setIsAutoColor(false);
                }}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
              <div 
                className="w-9 h-9 rounded-xl shadow-xs border-2 border-white ring-2 ring-slate-200 flex items-center justify-center transition-transform hover:scale-105"
                style={{ backgroundColor: color }}
              >
                <Palette className="w-4 h-4 text-white drop-shadow-sm opacity-80" />
              </div>
            </label>

            {/* Quick Palette swatches */}
            <div className="flex flex-wrap items-center gap-1.5 flex-1">
              {PALETTE_COLORS.slice(0, 8).map(swatch => (
                <button
                  type="button"
                  key={swatch}
                  onClick={() => {
                    setColor(swatch);
                    setIsAutoColor(false);
                  }}
                  style={{ backgroundColor: swatch }}
                  className={`w-6 h-6 rounded-lg transition-transform hover:scale-110 cursor-pointer ${
                    color.toLowerCase() === swatch.toLowerCase() ? 'ring-2 ring-indigo-600 ring-offset-2 scale-110' : 'opacity-85'
                  }`}
                  title={swatch}
                />
              ))}
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">{color}</span>
              <span className="text-[10px] font-semibold text-slate-500">
                {isAutoColor ? 'Automático' : 'Personalizado'}
              </span>
            </div>
          </div>
        </div>

        {/* Observações opcionais */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Observações / Motivo (Opcional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Férias anuais, recesso coletivo, compensação..."
            maxLength={300}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 hover:bg-white transition-all text-slate-800"
          />
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : editingVacation ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Salvar Alterações
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Adicionar / Mapear Férias
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
