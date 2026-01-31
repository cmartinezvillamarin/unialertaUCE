import type { Database } from '@/integrations/supabase/types';

type Reporte = Database['public']['Tables']['reportes']['Row'];

export type DerivedReportStatus = 
  | 'pendiente' 
  | 'en_progreso' 
  | 'resuelto' 
  | 'rechazado' 
  | 'cancelado' 
  | 'eliminado';

/**
 * Estados terminales que liberan la asignación del usuario
 */
export const TERMINAL_STATUSES: DerivedReportStatus[] = ['resuelto', 'rechazado', 'cancelado', 'eliminado'];

/**
 * Deriva el status del reporte basándose en los campos de la base de datos:
 * 
 * Prioridad de evaluación:
 * 1. deleted_at IS NOT NULL → 'eliminado'
 * 2. Se usa el campo status directamente si está definido y es un estado terminal
 * 3. Lógica basada en activo + assigned_to para estados operativos:
 *    - activo = false AND status = 'resuelto' → 'resuelto'
 *    - activo = false AND status = 'rechazado' → 'rechazado'  
 *    - activo = false AND status = 'cancelado' → 'cancelado'
 *    - activo = false → 'rechazado' (fallback)
 *    - activo = true AND assigned_to IS NOT NULL → 'en_progreso'
 *    - activo = true AND assigned_to IS NULL → 'pendiente'
 * 
 * IMPORTANTE: Cuando un reporte pasa a estado terminal (resuelto/rechazado/cancelado),
 * el assigned_to debe limpiarse a NULL para liberar al usuario asignado.
 */
export function getDerivedReportStatus(reporte: {
  activo: boolean;
  assigned_to: string | null;
  deleted_at: string | null;
  status?: string;
}): DerivedReportStatus {
  // 1. Si tiene deleted_at, está eliminado
  if (reporte.deleted_at) {
    return 'eliminado';
  }

  // 2. Si está inactivo, verificar el status explícito o derivar
  if (!reporte.activo) {
    // Usar el status explícito si está definido
    if (reporte.status === 'resuelto') return 'resuelto';
    if (reporte.status === 'rechazado') return 'rechazado';
    if (reporte.status === 'cancelado') return 'cancelado';
    
    // Fallback para compatibilidad: inactivo sin status explícito → rechazado
    return 'rechazado';
  }

  // 3. Si está activo
  if (reporte.activo) {
    // Con usuario asignado → en progreso
    if (reporte.assigned_to) {
      return 'en_progreso';
    }
    // Sin usuario asignado → pendiente
    return 'pendiente';
  }

  return 'pendiente';
}

/**
 * Nombres legibles para los estados derivados
 */
export const DERIVED_STATUS_NAMES: Record<DerivedReportStatus, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En Proceso',
  resuelto: 'Resuelto',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
  eliminado: 'Eliminado',
};

/**
 * Colores para los estados derivados
 */
export const DERIVED_STATUS_COLORS: Record<DerivedReportStatus, string> = {
  pendiente: 'hsl(38, 92%, 50%)',      // Amber
  en_progreso: 'hsl(217, 91%, 60%)',   // Blue
  resuelto: 'hsl(142, 76%, 36%)',      // Green
  rechazado: 'hsl(0, 84%, 60%)',       // Red
  cancelado: 'hsl(280, 84%, 60%)',     // Purple
  eliminado: 'hsl(0, 0%, 50%)',        // Gray
};

/**
 * Verifica si un estado es terminal (libera asignación)
 */
export function isTerminalStatus(status: DerivedReportStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}
