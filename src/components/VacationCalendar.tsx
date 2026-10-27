import React, { useState } from 'react';
import { Vacation, calculateDaysBetween, formatDateBR } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  X, 
  Info,
  Filter
} from 'lucide-react';

interface VacationCalendarProps {
  vacations: Vacation[];
  onSelectVacationForEdit?: (vacation: Vacation) => void;
  currentUserId?: string;
  isAdmin?: boolean;
}

const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const VacationCalendar: React.FC<VacationCalendarProps> = ({ 
  vacations, 
  onSelectVacationForEdit,
  currentUserId,
  isAdmin
}) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0-indexed
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);
  const [employeeFilter, setEmployeeFilter] = useState<string>('ALL');

  // Filter vacations if filter selected
  const activeVacations = employeeFilter === 'ALL'
    ? vacations
    : vacations.filter(v => v.employeeName === employeeFilter);

  // Distinct employees for the filter
  const uniqueEmployees = Array.from(new Set(vacations.map(v => v.employeeName))).sort();

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  // Calendar calculations
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Grid cells: prev month padding + current month days + next month padding to reach full weeks (multiple of 7)
  const totalDays = startingDayOfWeek + daysInMonth;
  const totalCells = Math.ceil(totalDays / 7) * 7;

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Find vacations for a specific day string (YYYY-MM-DD)
  const getVacationsForDate = (dateStr: string) => {
    return activeVacations.filter(v => dateStr >= v.startDate && dateStr <= v.endDate);
  };

  // Selected day details
  const selectedDayVacations = selectedDayDate ? getVacationsForDate(selectedDayDate) : [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col gap-5">
      {/* Calendar Header with Navigation and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {MONTH_NAMES_PT[currentMonth]} de {currentYear}
            </h2>
            <p className="text-xs text-slate-500">
              Navegue pelos meses para acompanhar as ausências da equipe
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Employee Filter */}
          {uniqueEmployees.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="bg-transparent text-slate-700 outline-none cursor-pointer font-medium"
              >
                <option value="ALL">Todos os Funcionários ({uniqueEmployees.length})</option>
                {uniqueEmployees.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Today button */}
          <button
            onClick={handleGoToday}
            className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 rounded-lg transition-colors cursor-pointer"
          >
            Hoje
          </button>

          {/* Prev/Next Navigation */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={handlePrevMonth}
              title="Mês anterior"
              className="p-1.5 hover:bg-white rounded-md text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              title="Próximo mês"
              className="p-1.5 hover:bg-white rounded-md text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[680px]">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-center">
            {WEEKDAYS_PT.map((day, idx) => (
              <div 
                key={day} 
                className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg ${
                  idx === 0 || idx === 6 ? 'text-slate-400 bg-slate-50/60' : 'text-slate-600 bg-slate-50'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: totalCells }).map((_, index) => {
              let dayNumber: number;
              let isCurrentMonth = true;
              let dateYear = currentYear;
              let dateMonth = currentMonth;

              if (index < startingDayOfWeek) {
                isCurrentMonth = false;
                dayNumber = daysInPrevMonth - (startingDayOfWeek - index - 1);
                dateMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                dateYear = currentMonth === 0 ? currentYear - 1 : currentYear;
              } else if (index >= startingDayOfWeek + daysInMonth) {
                isCurrentMonth = false;
                dayNumber = index - (startingDayOfWeek + daysInMonth) + 1;
                dateMonth = currentMonth === 11 ? 0 : currentMonth + 1;
                dateYear = currentMonth === 11 ? currentYear + 1 : currentYear;
              } else {
                dayNumber = index - startingDayOfWeek + 1;
              }

              const dateString = `${dateYear}-${String(dateMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
              const isToday = dateString === todayStr;
              const isSelected = dateString === selectedDayDate;
              const dayVacations = getVacationsForDate(dateString);
              const hasVacations = dayVacations.length > 0;

              return (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedDayDate(dateString);
                  }}
                  className={`min-h-[96px] p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group relative ${
                    isCurrentMonth
                      ? isToday
                        ? 'bg-indigo-50/40 border-indigo-300 ring-2 ring-indigo-200'
                        : isSelected
                        ? 'bg-slate-50 border-indigo-400 shadow-sm'
                        : hasVacations
                        ? 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-indigo-200'
                        : 'bg-white hover:bg-slate-50/50 border-slate-200/80 hover:border-slate-300'
                      : 'bg-slate-50/50 border-slate-100 text-slate-300'
                  }`}
                >
                  {/* Top row: day number & badge indicator */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : isCurrentMonth
                          ? 'text-slate-700 group-hover:text-slate-900'
                          : 'text-slate-400'
                      }`}
                    >
                      {dayNumber}
                    </span>

                    {hasVacations && (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {dayVacations.length}
                      </span>
                    )}
                  </div>

                  {/* Vacation pills for this day */}
                  <div className="flex flex-col gap-1 overflow-hidden max-h-[64px]">
                    {dayVacations.slice(0, 2).map((vac) => {
                      const isStart = vac.startDate === dateString;
                      const isEnd = vac.endDate === dateString;

                      return (
                        <div
                          key={vac.id}
                          title={`${vac.employeeName} (${formatDateBR(vac.startDate)} até ${formatDateBR(vac.endDate)})`}
                          style={{
                            backgroundColor: `${vac.color}20`,
                            borderColor: vac.color,
                            color: '#0f172a',
                          }}
                          className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md border-l-[3px] truncate flex items-center gap-1 shadow-2xs hover:brightness-95 transition-all ${
                            isStart ? 'ring-1 ring-offset-1 ring-slate-300' : ''
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: vac.color }}
                          />
                          <span className="truncate">{vac.employeeName}</span>
                          {isStart && <span className="text-[9px] text-slate-500 shrink-0 font-normal">início</span>}
                          {isEnd && <span className="text-[9px] text-slate-500 shrink-0 font-normal">fim</span>}
                        </div>
                      );
                    })}

                    {dayVacations.length > 2 && (
                      <span className="text-[10px] font-bold text-slate-500 px-1.5 py-0.2 text-center bg-slate-100/90 rounded">
                        +{dayVacations.length - 2} mais...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Day Modal */}
      {selectedDayDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Detalhes do Dia: {formatDateBR(selectedDayDate)}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedDayVacations.length === 0
                      ? 'Nenhum funcionário em férias nesta data.'
                      : `${selectedDayVacations.length} funcionário(s) em férias neste dia.`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDayDate(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {selectedDayVacations.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Info className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-medium">Dia livre sem ausências agendadas.</p>
                  <p className="text-xs text-slate-400 mt-1">Todos os colaboradores estão ativos.</p>
                </div>
              ) : (
                selectedDayVacations.map((vac) => {
                  const duration = calculateDaysBetween(vac.startDate, vac.endDate);
                  const isOwner = currentUserId && (vac.userId === currentUserId || isAdmin);

                  return (
                    <div
                      key={vac.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col gap-2 hover:bg-slate-50 transition-colors"
                      style={{ borderLeftColor: vac.color, borderLeftWidth: '5px' }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: vac.color }}
                          />
                          <span className="font-bold text-slate-800 text-sm">
                            {vac.employeeName}
                          </span>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {duration} dias totais
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-y-1 gap-x-3 mt-1">
                        <span>
                          <strong className="text-slate-700">Período:</strong> {formatDateBR(vac.startDate)} até {formatDateBR(vac.endDate)}
                        </span>
                        <span>
                          <strong className="text-slate-700">Cadastrado por:</strong> {vac.userEmail || 'Equipe'}
                        </span>
                      </div>

                      {vac.notes && (
                        <p className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200/70 italic">
                          "{vac.notes}"
                        </p>
                      )}

                      {isOwner && onSelectVacationForEdit && (
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => {
                              setSelectedDayDate(null);
                              onSelectVacationForEdit(vac);
                            }}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                          >
                            Editar este registro →
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedDayDate(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
