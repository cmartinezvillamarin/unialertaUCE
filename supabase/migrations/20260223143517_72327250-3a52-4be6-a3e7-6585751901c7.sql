
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_first_user BOOLEAN;
  v_username TEXT;
  v_roles user_role[];
  v_permisos user_permission[];
  v_existing_profile_id UUID;
  v_creator_profile_id UUID;
  v_name TEXT;
  v_password TEXT;
  v_confirmed BOOLEAN;
  v_is_admin_created BOOLEAN;
BEGIN
  v_is_first_user := NOT EXISTS (SELECT 1 FROM profiles LIMIT 1);
  
  v_existing_profile_id := (NEW.raw_user_meta_data->>'existing_profile_id')::UUID;
  
  IF v_existing_profile_id IS NOT NULL THEN
    UPDATE profiles
    SET 
      user_id = NEW.id,
      email = NEW.email,
      confirmed = FALSE,
      updated_at = now()
    WHERE id = v_existing_profile_id;
    
    RETURN NEW;
  END IF;
  
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  v_username := generate_unique_username(NEW.email);
  v_password := NEW.raw_user_meta_data->>'password';
  v_creator_profile_id := (NEW.raw_user_meta_data->>'creator_profile_id')::UUID;
  
  -- Determine if this user was created by an admin (has creator_profile_id)
  v_is_admin_created := v_creator_profile_id IS NOT NULL;
  
  IF v_is_first_user THEN
    v_roles := ARRAY['super_admin']::user_role[];
    v_permisos := ARRAY[
      'ver_reporte', 'crear_reporte', 'editar_reporte', 'eliminar_reporte',
      'ver_usuario', 'crear_usuario', 'editar_usuario', 'eliminar_usuario',
      'ver_categoria', 'crear_categoria', 'editar_categoria', 'eliminar_categoria',
      'ver_estado', 'crear_estado', 'editar_estado', 'eliminar_estado'
    ]::user_permission[];
  ELSE
    v_roles := COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'roles'))::user_role[],
      ARRAY['usuario_regular']::user_role[]
    );
    
    v_permisos := COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'permisos'))::user_permission[],
      ARRAY['ver_reporte', 'crear_reporte']::user_permission[]
    );
  END IF;
  
  v_confirmed := FALSE;
  
  INSERT INTO profiles (
    id, user_id, email, name, username, confirmed,
    must_change_password, temp_password_used,
    created_at, updated_at
  ) VALUES (
    gen_random_uuid(), NEW.id, NEW.email, v_name, v_username, v_confirmed,
    -- Only require password change when an admin created the user with a temp password
    v_is_admin_created AND v_password IS NOT NULL AND NOT v_is_first_user,
    v_is_admin_created AND v_password IS NOT NULL AND NOT v_is_first_user,
    now(), now()
  )
  RETURNING id INTO v_existing_profile_id;
  
  INSERT INTO user_roles (user_id, roles, permisos, assigned_by, created_at, updated_at)
  VALUES (v_existing_profile_id, v_roles, v_permisos, v_creator_profile_id, now(), now());
  
  INSERT INTO settings (user_id, real_time_tracking_enabled, enabled, created_at, updated_at)
  VALUES (v_existing_profile_id, true, true, now(), now());
  
  INSERT INTO user_audit (
    performed_by, user_id, action, tabla_afectada, registro_id, details,
    ip_address, user_agent, metadata, valores_nuevos
  ) VALUES (
    COALESCE(v_creator_profile_id, v_existing_profile_id),
    COALESCE(v_creator_profile_id, v_existing_profile_id),
    'CREATE', 'profiles', v_existing_profile_id,
    format('Usuario creado: %s (pendiente confirmación)', NEW.email),
    inet_client_addr(),
    NEW.raw_user_meta_data->>'user_agent',
    jsonb_build_object(
      'is_first_user', v_is_first_user,
      'signup_source', COALESCE(NEW.raw_user_meta_data->>'signup_source', 'direct'),
      'auth_method', 'email',
      'user_confirmed', v_confirmed,
      'requires_email_confirmation', TRUE,
      'created_at', now(),
      'screen_resolution', NEW.raw_user_meta_data->>'screen_resolution',
      'timezone', NEW.raw_user_meta_data->>'timezone',
      'language', NEW.raw_user_meta_data->>'language',
      'platform', NEW.raw_user_meta_data->>'platform',
      'created_from_path', NEW.raw_user_meta_data->>'created_from_path'
    ),
    jsonb_build_object(
      'email', NEW.email, 'name', v_name, 'username', v_username,
      'roles', v_roles, 'permisos', v_permisos,
      'confirmed', v_confirmed, 'is_first_user', v_is_first_user
    )
  );
  
  RETURN NEW;
END;
$$;
