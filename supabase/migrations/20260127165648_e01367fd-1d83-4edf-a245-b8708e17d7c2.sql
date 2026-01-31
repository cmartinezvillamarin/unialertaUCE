-- Crear tabla para trackings activos de reportes
CREATE TABLE public.active_trackings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporte_id uuid NOT NULL REFERENCES public.reportes(id) ON DELETE CASCADE,
  asignado_a uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creador_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  ended_reason text, -- 'estado_cambiado', 'manual', 'llegada', 'timeout'
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(reporte_id) -- Solo un tracking activo por reporte
);

-- Habilitar RLS
ALTER TABLE public.active_trackings ENABLE ROW LEVEL SECURITY;

-- Políticas: Creador + admin + seguridad_uce + super_admin pueden ver
CREATE POLICY "Authorized users can view trackings"
  ON public.active_trackings FOR SELECT
  USING (
    creador_id = get_profile_id_from_auth() OR
    has_role(auth.uid(), 'super_admin'::user_role) OR
    has_role(auth.uid(), 'administrador'::user_role) OR
    has_role(auth.uid(), 'seguridad_uce'::user_role)
  );

-- El asignado también puede ver su tracking
CREATE POLICY "Assigned user can view their tracking"
  ON public.active_trackings FOR SELECT
  USING (asignado_a = get_profile_id_from_auth());

-- Insertar trackings (sistema o usuarios autorizados)
CREATE POLICY "Authorized users can create trackings"
  ON public.active_trackings FOR INSERT
  WITH CHECK (
    creador_id = get_profile_id_from_auth() OR
    has_role(auth.uid(), 'super_admin'::user_role) OR
    has_role(auth.uid(), 'administrador'::user_role)
  );

-- Actualizar trackings (para cerrar)
CREATE POLICY "Authorized users can update trackings"
  ON public.active_trackings FOR UPDATE
  USING (
    creador_id = get_profile_id_from_auth() OR
    asignado_a = get_profile_id_from_auth() OR
    has_role(auth.uid(), 'super_admin'::user_role) OR
    has_role(auth.uid(), 'administrador'::user_role) OR
    has_role(auth.uid(), 'seguridad_uce'::user_role)
  );

-- Eliminar trackings
CREATE POLICY "Authorized users can delete trackings"
  ON public.active_trackings FOR DELETE
  USING (
    creador_id = get_profile_id_from_auth() OR
    has_role(auth.uid(), 'super_admin'::user_role) OR
    has_role(auth.uid(), 'administrador'::user_role)
  );

-- Trigger para updated_at
CREATE TRIGGER update_active_trackings_updated_at
  BEFORE UPDATE ON public.active_trackings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices
CREATE INDEX idx_active_trackings_reporte ON public.active_trackings(reporte_id);
CREATE INDEX idx_active_trackings_asignado ON public.active_trackings(asignado_a);
CREATE INDEX idx_active_trackings_creador ON public.active_trackings(creador_id);
CREATE INDEX idx_active_trackings_active ON public.active_trackings(ended_at) WHERE ended_at IS NULL;