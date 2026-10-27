export interface Vacation {
  id: string;
  employeeName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  color: string;     // Hex color
  notes?: string;
  userId: string;
  userEmail: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  email: string;
  photoURL?: string;
  jobTitle?: string;
  department?: string;
  favoriteColor: string;
  phone?: string;
  bio?: string;
  updatedAt?: string;
}

export const DEPARTMENTS = [
  'Engenharia de Software',
  'Design & UX/UI',
  'Produto',
  'Marketing & Growth',
  'Vendas & Comercial',
  'Recursos Humanos (RH)',
  'Financeiro & Controladoria',
  'Operações & Suporte',
  'Tecnologia da Informação (TI)',
  'Jurídico & Compliance'
];

export const PALETTE_COLORS = [
  '#3b82f6', // Azul Royal
  '#10b981', // Esmeralda
  '#f59e0b', // Âmbar
  '#8b5cf6', // Violeta
  '#ec4899', // Rosa Pink
  '#06b6d4', // Ciano
  '#f97316', // Laranja
  '#14b8a6', // Azul Petróleo
  '#6366f1', // Índigo
  '#84cc16', // Lima
  '#e11d48', // Carmim
  '#0284c7', // Azul Céu
];

export const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&h=256&q=80',
];

export function getAutoColor(name: string, existingVacations: Vacation[] = []): string {
  // If this employee already has a color assigned in an existing vacation, keep consistency
  const existing = existingVacations.find(v => v.employeeName.trim().toLowerCase() === name.trim().toLowerCase());
  if (existing && existing.color) {
    return existing.color;
  }

  // Hash the name to consistently select a palette color
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE_COLORS.length;
  return PALETTE_COLORS[index];
}

export function calculateDaysBetween(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 0;
  const start = new Date(startDateStr + 'T00:00:00');
  const end = new Date(endDateStr + 'T00:00:00');
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  if (end < start) return 0;
  const diffTime = end.getTime() - start.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function isDateWithinRange(checkDateStr: string, startStr: string, endStr: string): boolean {
  return checkDateStr >= startStr && checkDateStr <= endStr;
}
