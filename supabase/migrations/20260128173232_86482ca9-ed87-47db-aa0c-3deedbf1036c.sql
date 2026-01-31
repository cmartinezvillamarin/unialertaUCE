-- Crear enum para tipos de acción en historial de reportes
CREATE TYPE public.reporte_historial_tipo AS ENUM (
  'asignacion',
  'reasignacion', 
  'resolucion',
  'rechazo',
  'reapertura',
  'escalacion',
  'desactivacion',
  'activacion',
  'cambio_estado',
  'cambio_prioridad',
  'otro'
);

-- Agregar columnas al historial de reportes
ALTER TABLE public.reporte_historial
ADD COLUMN tipo_accion public.reporte_historial_tipo NOT NULL DEFAULT 'asignacion',
ADD COLUMN evidencias text[] DEFAULT '{}',
ADD COLUMN estado_anterior text,
ADD COLUMN estado_nuevo text,
ADD COLUMN prioridad_anterior text,
ADD COLUMN prioridad_nuevo text,
ADD COLUMN es_bulk boolean DEFAULT false,
ADD COLUMN bulk_session_id uuid;

-- Comentarios para documentación
COMMENT ON COLUMN public.reporte_historial.tipo_accion IS 'Tipo de acción realizada en el reporte';
COMMENT ON COLUMN public.reporte_historial.evidencias IS 'URLs de imágenes o archivos de evidencia';
COMMENT ON COLUMN public.reporte_historial.estado_anterior IS 'Estado anterior del reporte';
COMMENT ON COLUMN public.reporte_historial.estado_nuevo IS 'Nuevo estado del reporte';
COMMENT ON COLUMN public.reporte_historial.es_bulk IS 'Indica si fue parte de una acción masiva';
COMMENT ON COLUMN public.reporte_historial.bulk_session_id IS 'ID de sesión para agrupar acciones masivas';

-- Crear índice para búsquedas por tipo de acción
CREATE INDEX idx_reporte_historial_tipo_accion ON public.reporte_historial(tipo_accion);
CREATE INDEX idx_reporte_historial_bulk_session ON public.reporte_historial(bulk_session_id) WHERE bulk_session_id IS NOT NULL;