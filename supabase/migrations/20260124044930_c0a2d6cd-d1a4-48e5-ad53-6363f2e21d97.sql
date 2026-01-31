-- Update RLS policy so users who can view a report can also view its assignment history

-- Ensure RLS remains enabled
ALTER TABLE public.reporte_historial ENABLE ROW LEVEL SECURITY;

-- Replace existing SELECT policy
DROP POLICY IF EXISTS "Users can view report historial" ON public.reporte_historial;

CREATE POLICY "Users can view report historial"
ON public.reporte_historial
FOR SELECT
TO public
USING (
  -- Direct participants in the assignment event
  get_profile_id_from_auth() = assigned_by
  OR get_profile_id_from_auth() = assigned_from
  OR get_profile_id_from_auth() = assigned_to

  -- Or anyone allowed to view the underlying report (owner/assignee/public/permission)
  OR EXISTS (
    SELECT 1
    FROM public.reportes r
    WHERE r.id = public.reporte_historial.reporte_id
      AND (
        r.visibility = 'publico'::public.report_visibility
        OR r.user_id = get_profile_id_from_auth()
        OR r.assigned_to = get_profile_id_from_auth()
        OR has_permission(get_profile_id_from_auth(), 'ver_reporte'::public.user_permission)
        OR has_permission(get_profile_id_from_auth(), 'editar_reporte'::public.user_permission)
        OR has_permission(get_profile_id_from_auth(), 'eliminar_reporte'::public.user_permission)
      )
  )

  -- Backward-compatible role/permission array checks (if present)
  OR EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND (ur.permisos)::text[] && ARRAY['ver_reportes'::text, 'editar_reporte'::text, 'eliminar_reporte'::text]
  )
);
