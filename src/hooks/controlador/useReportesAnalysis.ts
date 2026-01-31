import { useMemo } from 'react';
import { subDays, format, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { useOptimizedReportes } from '@/hooks/entidades/useOptimizedReportes';
import { getDerivedReportStatus, DERIVED_STATUS_NAMES, DERIVED_STATUS_COLORS, DerivedReportStatus } from '@/lib/reportStatus';

export interface ReportesAnalysisStats {
  totalReportes: number;
  tasaResolucion: number;
  tiempoPromedioResolucion: string;
  reportesCriticos: number;
}

export interface ReportesStatusData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

export interface ReportesPriorityData {
  name: string;
  value: number;
  color: string;
}

export interface ReportesTrendData {
  date: string;
  label: string;
  value: number;
}

export interface ReportesVisibilityData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

// Colores para prioridades
const PRIORITY_COLORS = {
  bajo: 'hsl(142, 76%, 36%)',         // Green
  medio: 'hsl(217, 91%, 60%)',        // Blue
  alto: 'hsl(38, 92%, 50%)',          // Amber
  urgente: 'hsl(0, 84%, 60%)',        // Red
};

const VISIBILITY_COLORS = {
  publico: 'hsl(142, 76%, 36%)',      // Green
  privado: 'hsl(0, 84%, 60%)',        // Red
};

const PRIORITY_NAMES: Record<string, string> = {
  bajo: 'Bajo',
  medio: 'Medio',
  alto: 'Alto',
  urgente: 'Urgente',
};

const VISIBILITY_NAMES: Record<string, string> = {
  publico: 'Público',
  privado: 'Privado',
};

export function useReportesAnalysis() {
  const { data: reportes = [], isLoading, refetch } = useOptimizedReportes();

  // Filtrar solo reportes no eliminados y calcular status derivado
  const reportesConStatus = useMemo(() => {
    return reportes
      .filter(r => !r.deleted_at)
      .map(r => ({
        ...r,
        derivedStatus: getDerivedReportStatus({
          activo: r.activo,
          assigned_to: r.assigned_to,
          deleted_at: r.deleted_at,
          status: r.status,
        }),
      }));
  }, [reportes]);

  // Estadísticas principales
  const stats = useMemo<ReportesAnalysisStats>(() => {
    const total = reportesConStatus.length;
    const resueltos = reportesConStatus.filter(r => r.derivedStatus === 'resuelto');
    const criticos = reportesConStatus.filter(
      r => r.priority === 'alto' || r.priority === 'urgente'
    );

    // Calcular tasa de resolución
    const tasaResolucion = total > 0 ? Math.round((resueltos.length / total) * 100) : 0;

    // Calcular tiempo promedio de resolución
    let tiempoPromedio = '24h';
    if (resueltos.length > 0) {
      const tiemposResolucion = resueltos.map(r => {
        const created = new Date(r.created_at);
        const updated = new Date(r.updated_at);
        return differenceInHours(updated, created);
      });
      const promedioHoras = tiemposResolucion.reduce((a, b) => a + b, 0) / tiemposResolucion.length;
      
      if (promedioHoras < 24) {
        tiempoPromedio = `${Math.round(promedioHoras)}h`;
      } else {
        tiempoPromedio = `${Math.round(promedioHoras / 24)}d`;
      }
    }

    return {
      totalReportes: total,
      tasaResolucion,
      tiempoPromedioResolucion: tiempoPromedio,
      reportesCriticos: criticos.length,
    };
  }, [reportesConStatus]);

  // Distribución por estado (usando status derivado)
  const statusDistribution = useMemo<ReportesStatusData[]>(() => {
    const total = reportesConStatus.length;
    const statusCount: Record<DerivedReportStatus, number> = {
      pendiente: 0,
      en_progreso: 0,
      resuelto: 0,
      rechazado: 0,
      cancelado: 0,
      eliminado: 0,
    };

    reportesConStatus.forEach(r => {
      if (statusCount[r.derivedStatus] !== undefined) {
        statusCount[r.derivedStatus]++;
      }
    });

    // No mostrar 'eliminado' ya que filtramos por deleted_at
    const statusesToShow: DerivedReportStatus[] = ['pendiente', 'en_progreso', 'resuelto', 'rechazado', 'cancelado'];
    
    return statusesToShow
      .filter(status => statusCount[status] > 0)
      .map(status => ({
        name: DERIVED_STATUS_NAMES[status],
        value: statusCount[status],
        color: DERIVED_STATUS_COLORS[status],
        percentage: total > 0 ? Math.round((statusCount[status] / total) * 100) : 0,
      }));
  }, [reportesConStatus]);

  // Distribución por prioridad
  const priorityDistribution = useMemo<ReportesPriorityData[]>(() => {
    const priorityCount: Record<string, number> = {
      bajo: 0,
      medio: 0,
      alto: 0,
      urgente: 0,
    };

    reportesConStatus.forEach(r => {
      if (r.priority && priorityCount[r.priority] !== undefined) {
        priorityCount[r.priority]++;
      }
    });

    // Devolver en orden: Bajo, Medio, Alto, Urgente
    return ['bajo', 'medio', 'alto', 'urgente'].map(priority => ({
      name: PRIORITY_NAMES[priority],
      value: priorityCount[priority],
      color: PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS],
    }));
  }, [reportesConStatus]);

  // Tendencia últimos 7 días
  const trendData = useMemo<ReportesTrendData[]>(() => {
    const today = new Date();
    const days: ReportesTrendData[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const count = reportes.filter(r => {
        const createdAt = new Date(r.created_at);
        return createdAt >= startOfDay && createdAt <= endOfDay;
      }).length;

      days.push({
        date: dateStr,
        label: format(date, 'd MMM', { locale: es }),
        value: count,
      });
    }

    return days;
  }, [reportes]);

  // Distribución por visibilidad
  const visibilityDistribution = useMemo<ReportesVisibilityData[]>(() => {
    const total = reportesConStatus.length;
    const visibilityCount: Record<string, number> = {
      publico: 0,
      privado: 0,
    };

    reportesConStatus.forEach(r => {
      const visibility = r.visibility || 'publico';
      if (visibilityCount[visibility] !== undefined) {
        visibilityCount[visibility]++;
      }
    });

    return Object.entries(visibilityCount)
      .filter(([_, count]) => count > 0)
      .map(([visibility, count]) => ({
        name: VISIBILITY_NAMES[visibility] || visibility,
        value: count,
        color: VISIBILITY_COLORS[visibility as keyof typeof VISIBILITY_COLORS] || 'hsl(142, 76%, 36%)',
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }));
  }, [reportesConStatus]);

  return {
    stats,
    statusDistribution,
    priorityDistribution,
    trendData,
    visibilityDistribution,
    isLoading,
    refetch,
  };
}
