-- Función para limpiar ubicaciones de usuarios inactivos
-- Se considera inactivo si no ha actualizado su ubicación en los últimos 5 minutos
CREATE OR REPLACE FUNCTION public.cleanup_stale_user_locations(inactivity_minutes integer DEFAULT 5)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.user_locations
  WHERE updated_at < NOW() - (inactivity_minutes || ' minutes')::interval;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- Función para eliminar ubicación de un usuario específico
CREATE OR REPLACE FUNCTION public.delete_user_location(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_locations
  WHERE user_id = target_user_id;
  
  RETURN FOUND;
END;
$$;

-- Trigger function para limpiar ubicación cuando el perfil se desactiva/elimina
CREATE OR REPLACE FUNCTION public.cleanup_location_on_profile_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si el perfil se elimina (soft delete) o se desactiva
  IF NEW.deleted_at IS NOT NULL OR NEW.estado = 'inactivo' THEN
    DELETE FROM public.user_locations WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS trigger_cleanup_location_on_profile_change ON public.profiles;
CREATE TRIGGER trigger_cleanup_location_on_profile_change
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_location_on_profile_change();

-- Comentarios para documentación
COMMENT ON FUNCTION public.cleanup_stale_user_locations IS 'Elimina ubicaciones de usuarios que no han actualizado su posición en X minutos';
COMMENT ON FUNCTION public.delete_user_location IS 'Elimina la ubicación de un usuario específico por su profile ID';
COMMENT ON FUNCTION public.cleanup_location_on_profile_change IS 'Trigger que limpia ubicaciones cuando un perfil se elimina o desactiva';