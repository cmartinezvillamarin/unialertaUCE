
-- 1) Fix has_role to accept either auth.uid() or profiles.id
CREATE OR REPLACE FUNCTION public.has_role(profile_id uuid, role_name user_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE role_name = ANY(ur.roles)
      AND (
        ur.user_id = profile_id
        OR ur.user_id = (SELECT p.id FROM public.profiles p WHERE p.user_id = profile_id LIMIT 1)
      )
  );
$$;

-- 2) Restrict participantes_conversacion INSERT
DROP POLICY IF EXISTS "Usuarios pueden unirse a conversaciones" ON public.participantes_conversacion;
CREATE POLICY "Restricted conversation join"
ON public.participantes_conversacion
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversaciones c
    WHERE c.id = conversacion_id
      AND c.created_by = public.get_profile_id_from_auth()
  )
  OR public.is_conversation_admin(conversacion_id, public.get_profile_id_from_auth())
);

-- 3) Hide email column from general authenticated reads
REVOKE SELECT (email) ON public.profiles FROM authenticated;
REVOKE SELECT (email) ON public.profiles FROM anon;

-- 4) Block direct inserts into user_audit (SECURITY DEFINER triggers still work)
DROP POLICY IF EXISTS "Only system triggers can insert audit logs" ON public.user_audit;
CREATE POLICY "Block direct audit inserts"
ON public.user_audit
FOR INSERT TO authenticated, anon
WITH CHECK (false);

-- 5) Restrict user_locations SELECT
DROP POLICY IF EXISTS "Users can view active user locations" ON public.user_locations;
DROP POLICY IF EXISTS "user_locations_select_authenticated" ON public.user_locations;
CREATE POLICY "user_locations_select_own_or_authorized"
ON public.user_locations
FOR SELECT TO authenticated
USING (
  user_id = public.get_profile_id_from_auth()
  OR public.has_role(public.get_profile_id_from_auth(), 'super_admin'::user_role)
  OR public.has_role(public.get_profile_id_from_auth(), 'administrador'::user_role)
  OR public.has_role(public.get_profile_id_from_auth(), 'seguridad_uce'::user_role)
  OR EXISTS (
    SELECT 1 FROM public.active_trackings t
    WHERE t.asignado_a = user_locations.user_id
      AND t.ended_at IS NULL
      AND (
        t.creador_id = public.get_profile_id_from_auth()
        OR t.asignado_a = public.get_profile_id_from_auth()
      )
  )
);

-- 6) Remove sensitive tables from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.user_roles;
ALTER PUBLICATION supabase_realtime DROP TABLE public.user_audit;
