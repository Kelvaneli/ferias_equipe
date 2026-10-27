import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { Vacation, calculateDaysBetween } from '../types';
import { BarChart3, Users, CalendarCheck, Clock } from 'lucide-react';

interface VacationChartProps {
  vacations: Vacation[];
}

export const VacationChart: React.FC<VacationChartProps> = ({ vacations }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  // Group days and colors by employee
  const employeeDataMap = new Map<string, { totalDays: number; color: string; count: number }>();

  vacations.forEach(v => {
    const name = v.employeeName.trim();
    if (!name) return;
    const days = calculateDaysBetween(v.startDate, v.endDate);
    const existing = employeeDataMap.get(name);
    if (existing) {
      existing.totalDays += days;
      existing.count += 1;
    } else {
      employeeDataMap.set(name, {
        totalDays: days,
        color: v.color || '#3b82f6',
        count: 1,
      });
    }
  });

  const labels = Array.from(employeeDataMap.keys());
  const dataValues = labels.map(l => employeeDataMap.get(l)!.totalDays);
  const backgroundColors = labels.map(l => employeeDataMap.get(l)!.color);
  const borderColors = labels.map(l => employeeDataMap.get(l)!.color);

  // KPIs
  const totalEmployees = labels.length;
  const totalDays = dataValues.reduce((acc, curr) => acc + curr, 0);
  const averageDays = totalEmployees > 0 ? (totalDays / totalEmployees).toFixed(1) : '0';
  
  // Currently on vacation
  const today = new Date().toISOString().split('T')[0];
  const activeNowCount = vacations.filter(v => today >= v.startDate && today <= v.endDate).length;

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    if (labels.length === 0) {
      return;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Total de Dias de Férias',
            data: dataValues,
            backgroundColor: backgroundColors.map(c => c + 'CC'), // slight opacity
            borderColor: borderColors,
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
            maxBarThickness: 48,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleFont: { size: 13, weight: 'bold' },
            bodyFont: { size: 12 },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const empName = context.label;
                const info = employeeDataMap.get(empName);
                return [
                  ` Dias totais: ${context.parsed.y} dias`,
                  ` Períodos agendados: ${info?.count || 1}`,
                ];
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#64748b',
              font: { weight: 600, size: 12 },
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: '#e2e8f0',
            },
            ticks: {
              color: '#64748b',
              stepSize: 5,
              callback: (val) => `${val} d`,
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [vacations]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Membros com Férias</p>
            <p className="text-xl font-bold text-slate-800">{totalEmployees}</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total de Dias</p>
            <p className="text-xl font-bold text-slate-800">{totalDays} <span className="text-xs font-normal text-slate-400">dias</span></p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Em Férias Hoje</p>
            <p className="text-xl font-bold text-slate-800">{activeNowCount} <span className="text-xs font-normal text-slate-400">ativos</span></p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Média por Colaborador</p>
            <p className="text-xl font-bold text-slate-800">{averageDays} <span className="text-xs font-normal text-slate-400">dias</span></p>
          </div>
        </div>
      </div>

      {/* Bar Chart Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Métricas Globais: Dias de Férias por Funcionário
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparativo de dias totais agendados/tirados por cada colaborador com cores sincronizadas.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full self-start sm:self-auto">
            {labels.length} {labels.length === 1 ? 'colaborador' : 'colaboradores'} mapeados
          </span>
        </div>

        <div className="pt-4 h-72 w-full">
          {labels.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
              <BarChart3 className="w-10 h-10 stroke-[1.5] mb-2 text-slate-300" />
              <p className="text-sm font-medium">Nenhum dado de férias cadastrado ainda.</p>
              <p className="text-xs text-slate-400">Cadastre férias no formulário para visualizar os gráficos.</p>
            </div>
          ) : (
            <canvas ref={canvasRef} />
          )}
        </div>
      </div>
    </div>
  );
};
