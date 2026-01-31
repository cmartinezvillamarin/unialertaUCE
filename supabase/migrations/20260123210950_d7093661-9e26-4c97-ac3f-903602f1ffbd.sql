-- Primero eliminamos las políticas existentes que pueden estar mal configuradas
DROP POLICY IF EXISTS "Users can insert their own location" ON public.user_locations;
DROP POLICY IF EXISTS "Users can update their own location" ON public.user_locations;
DROP POLICY IF EXISTS "Users can delete their own location" ON public.user_locations;
DROP POLICY IF EXISTS "Users can view locations" ON public.user_locations;

-- Asegurar que RLS está habilitado
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Usuarios autenticados pueden ver ubicaciones de otros usuarios
-- Esto es necesario para geofencing y tracking de otros usuarios
CREATE POLICY "user_locations_select_authenticated"
ON public.user_locations
FOR SELECT
USING (
  get_profile_id_from_auth() IS NOT NULL
);

-- Política INSERT: Usuarios solo pueden insertar su propia ubicación
CREATE POLICY "user_locations_insert_own"
ON public.user_locations
FOR INSERT
WITH CHECK (
  user_id = get_profile_id_from_auth()
);

-- Política UPDATE: Usuarios solo pueden actualizar su propia ubicación
CREATE POLICY "user_locations_update_own"
ON public.user_locations
FOR UPDATE
USING (
  user_id = get_profile_id_from_auth()
)
WITH CHECK (
  user_id = get_profile_id_from_auth()
);

-- Política DELETE: Usuarios solo pueden eliminar su propia ubicación
CREATE POLICY "user_locations_delete_own"
ON public.user_locations
FOR DELETE
USING (
  user_id = get_profile_id_from_auth()
);