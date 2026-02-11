-- Fix: Convert profiles_public view to SECURITY INVOKER
-- This ensures the view respects the querying user's RLS policies on the underlying profiles table
-- instead of using the view creator's privileges

CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = true)
AS
SELECT 
    id,
    avatar,
    bio,
    confirmed,
    created_at,
    deleted_at,
    estado,
    name,
    updated_at,
    username
FROM profiles
WHERE deleted_at IS NULL AND estado = 'activo'::user_status;