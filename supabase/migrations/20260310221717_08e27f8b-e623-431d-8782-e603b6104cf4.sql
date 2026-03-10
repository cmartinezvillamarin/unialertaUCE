
-- ============================================
-- EVENTOS DEL CAMPUS
-- ============================================
CREATE TABLE public.eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descripcion text,
  fecha_inicio timestamp with time zone NOT NULL,
  fecha_fin timestamp with time zone,
  ubicacion text,
  lat double precision,
  lng double precision,
  color text DEFAULT '#3b82f6',
  activo boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT eventos_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

-- Todos los autenticados pueden ver eventos activos
CREATE POLICY "Authenticated users can view active events"
  ON public.eventos FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL AND activo = true);

-- Admins pueden ver todos
CREATE POLICY "Admins can view all events"
  ON public.eventos FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::user_role) OR 
    has_role(auth.uid(), 'administrador'::user_role)
  );

-- Admins pueden crear
CREATE POLICY "Admins can create events"
  ON public.eventos FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = get_profile_id_from_auth() AND (
      has_role(auth.uid(), 'super_admin'::user_role) OR 
      has_role(auth.uid(), 'administrador'::user_role) OR
      has_role(auth.uid(), 'seguridad_uce'::user_role)
    )
  );

-- Admins pueden editar
CREATE POLICY "Admins can update events"
  ON public.eventos FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::user_role) OR 
    has_role(auth.uid(), 'administrador'::user_role) OR
    created_by = get_profile_id_from_auth()
  );

-- Admins pueden eliminar
CREATE POLICY "Admins can delete events"
  ON public.eventos FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::user_role) OR 
    has_role(auth.uid(), 'administrador'::user_role)
  );

-- ============================================
-- VINCULACIÓN EVENTOS - REPORTES
-- ============================================
CREATE TABLE public.evento_reportes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  reporte_id uuid NOT NULL REFERENCES public.reportes(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id),
  UNIQUE(evento_id, reporte_id)
);

ALTER TABLE public.evento_reportes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view event reports"
  ON public.evento_reportes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage event reports"
  ON public.evento_reportes FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'super_admin'::user_role) OR 
    has_role(auth.uid(), 'administrador'::user_role) OR
    has_role(auth.uid(), 'seguridad_uce'::user_role)
  );

CREATE POLICY "Admins can delete event reports"
  ON public.evento_reportes FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::user_role) OR 
    has_role(auth.uid(), 'administrador'::user_role)
  );

-- ============================================
-- ENCUESTAS / VOTACIONES
-- ============================================
CREATE TABLE public.encuestas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pregunta text NOT NULL,
  descripcion text,
  tipo text NOT NULL DEFAULT 'simple' CHECK (tipo IN ('simple', 'multiple', 'si_no')),
  publicacion_id uuid REFERENCES public.publicaciones(id) ON DELETE CASCADE,
  fecha_cierre timestamp with time zone,
  activo boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.encuestas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view polls"
  ON public.encuestas FOR SELECT
  TO authenticated
  USING (activo = true);

CREATE POLICY "Users can create polls"
  ON public.encuestas FOR INSERT
  TO authenticated
  WITH CHECK (created_by = get_profile_id_from_auth());

CREATE POLICY "Users can update their polls"
  ON public.encuestas FOR UPDATE
  TO authenticated
  USING (created_by = get_profile_id_from_auth());

CREATE POLICY "Users can delete their polls"
  ON public.encuestas FOR DELETE
  TO authenticated
  USING (created_by = get_profile_id_from_auth());

-- ============================================
-- OPCIONES DE ENCUESTA
-- ============================================
CREATE TABLE public.encuesta_opciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encuesta_id uuid NOT NULL REFERENCES public.encuestas(id) ON DELETE CASCADE,
  texto text NOT NULL,
  orden integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.encuesta_opciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view poll options"
  ON public.encuesta_opciones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Poll creators can manage options"
  ON public.encuesta_opciones FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.encuestas 
      WHERE id = encuesta_opciones.encuesta_id 
      AND created_by = get_profile_id_from_auth()
    )
  );

CREATE POLICY "Poll creators can delete options"
  ON public.encuesta_opciones FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.encuestas 
      WHERE id = encuesta_opciones.encuesta_id 
      AND created_by = get_profile_id_from_auth()
    )
  );

-- ============================================
-- RESPUESTAS DE ENCUESTA
-- ============================================
CREATE TABLE public.encuesta_respuestas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encuesta_id uuid NOT NULL REFERENCES public.encuestas(id) ON DELETE CASCADE,
  opcion_id uuid NOT NULL REFERENCES public.encuesta_opciones(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(encuesta_id, user_id, opcion_id)
);

ALTER TABLE public.encuesta_respuestas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view poll results"
  ON public.encuesta_respuestas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can vote"
  ON public.encuesta_respuestas FOR INSERT
  TO authenticated
  WITH CHECK (user_id = get_profile_id_from_auth());

CREATE POLICY "Users can change their vote"
  ON public.encuesta_respuestas FOR DELETE
  TO authenticated
  USING (user_id = get_profile_id_from_auth());
