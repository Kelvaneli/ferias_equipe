import React, { useState } from 'react';
import { Vacation, calculateDaysBetween, formatDateBR } from '../types';
import { 
  Search, 
  Edit3, 
  Trash2, 
  Calendar, 
  Clock, 
  User, 
  AlertTriangle,
  Lock,
  CheckCircle2,
  ListFilter
} from 'lucide-react';

interface VacationTableProps {
  vacations: Vacation[];
  onEdit: (vacation: Vacation) => void;
  onDelete: (vacationId: string) => Promise<void>;
  currentUserId?: string;
  isAdmin?: boolean;
}

export const VacationTable: React.FC<VacationTableProps> = ({
  vacations,
  onEdit,
  onDelete,
  currentUserId,
  isAdmin
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'UPCOMING' | 'PAST'>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const getStatus = (startDate: string, endDate: string) => {
    if (todayStr >= startDate && todayStr <= endDate) {
      return { label: 'Em Andamento', type: 'ACTIVE', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (startDate > todayStr) {
      return { label: 'Agendado', type: 'UPCOMING', badgeClass: 'bg-sky-50 text-sky-700 border-sky-200' };
    }
    return { label: 'Concluído', type: 'PAST', badgeClass: 'bg-slate-100 text-slate-600 border-slate-200' };
  };

  const filteredVacations = vacations.filter(v => {
    const matchesSearch = v.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (v.notes && v.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;

    const status = getStatus(v.startDate, v.endDate);
    if (statusFilter === 'ACTIVE') return status.type === 'ACTIVE';
    if (statusFilter === 'UPCOMING') return status.type === 'UPCOMING';
    if (statusFilter === 'PAST') return status.type === 'PAST';
    return true;
  });

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      setIsDeleting(true);
      await onDelete(deletingId);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
      {/* Table Header and Filters */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-indigo-600" />
            Registros de Férias Cadastrados
          </h3>
          <p className="text-xs text-slate-500">
            {vacations.length} {vacations.length === 1 ? 'período cadastrado' : 'períodos cadastrados'} no sistema
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar colaborador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 hover:bg-white text-slate-800 w-48 sm:w-56 transition-all"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">Todos os Status</option>
            <option value="ACTIVE">Em Andamento</option>
            <option value="UPCOMING">Agendados</option>
            <option value="PAST">Concluídos</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <th className="py-3 px-4">Funcionário</th>
              <th className="py-3 px-4">Período de Férias</th>
              <th className="py-3 px-4">Duração</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Observações</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredVacations.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                  <p className="font-medium text-slate-500">Nenhum registro encontrado.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {searchTerm ? 'Tente ajustar sua busca ou filtro.' : 'Adicione novas férias usando o formulário ao lado.'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredVacations.map((vac) => {
                const days = calculateDaysBetween(vac.startDate, vac.endDate);
                const status = getStatus(vac.startDate, vac.endDate);
                const canModify = currentUserId && (vac.userId === currentUserId || isAdmin);

                return (
                  <tr key={vac.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Funcionário */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs border border-white"
                          style={{ backgroundColor: vac.color }}
                        />
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{vac.employeeName}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[160px]">
                            {vac.userEmail || 'Usuário'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Período */}
                    <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800">{formatDateBR(vac.startDate)}</span>
                        <span className="text-slate-400">até</span>
                        <span className="font-semibold text-slate-800">{formatDateBR(vac.endDate)}</span>
                      </div>
                    </td>

                    {/* Duração */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        <Clock className="w-3 h-3" />
                        {days} {days === 1 ? 'dia' : 'dias'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${status.badgeClass}`}>
                        {status.label}
                      </span>
                    </td>

                    {/* Observações */}
                    <td className="py-3.5 px-4 text-slate-600 max-w-[200px] truncate">
                      {vac.notes || <span className="text-slate-300 italic">Sem observações</span>}
                    </td>

                    {/* Ações */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {canModify ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => onEdit(vac)}
                            title="Editar este registro"
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(vac.id)}
                            title="Excluir este registro"
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="inline-flex items-center gap-1 text-[11px] text-slate-400 cursor-help"
                          title="Somente o autor deste registro ou administrador pode editar/excluir."
                        >
                          <Lock className="w-3.5 h-3.5 text-slate-300" />
                          <span className="text-[10px]">Protegido</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-800 mb-1">
              Confirmar exclusão de férias?
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Esta ação removerá o agendamento de férias de forma permanente do banco de dados na nuvem.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir Registro
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
