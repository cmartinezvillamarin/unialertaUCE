import { supabase } from '@/integrations/supabase/client';
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];
type UserPermission = Database['public']['Enums']['user_permission'];

interface CreateUserData {
  email: string;
  password: string;
  name?: string;
  username?: string;
  roles?: UserRole[];
  permisos?: UserPermission[];
  creatorProfileId?: string;
}

interface CreateUserResult {
  user: { id: string } | null;
  error: string | null;
}

interface BulkCreateResult {
  total: number;
  success: number;
  failed: number;
  results: Array<{ email: string; success: boolean; error?: string }>;
}

export function useCreateUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const restoreSessionIfNeeded = useCallback(async (session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']) => {
    if (!session?.access_token || !session.refresh_token) return;

    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user?.id === session.user?.id) return;

    // Restablecer la sesión previa (admin) si signUp cambia la sesión del navegador.
    // Esto evita que la app se recargue con los datos del usuario recién creado.
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  }, []);

  const normalizeSignUpError = useCallback((message: string) => {
    if (message.includes('Error sending confirmation email')) {
      return 'SMTP_ERROR: El usuario fue creado pero Supabase no pudo enviar el correo de confirmación. Revisa Authentication → Email (SMTP) en Supabase.';
    }
    return message;
  }, []);

  const isSmtpError = useCallback((message: string) => {
    return message.includes('Error sending confirmation email') || message.startsWith('SMTP_ERROR:');
  }, []);

  const createUser = useCallback(async (data: CreateUserData): Promise<CreateUserResult> => {
    setLoading(true);
    setError(null);

    // Guardar sesión actual para evitar que signUp “loguee” al navegador como el usuario recién creado.
    const { data: { session: sessionToRestore } } = await supabase.auth.getSession();

    try {
      const redirectUrl = `${window.location.origin}/`;

      // Si se proporciona creatorProfileId (que es el auth.user.id), buscar el profile.id correspondiente
      let actualCreatorProfileId = data.creatorProfileId;
      if (data.creatorProfileId) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', data.creatorProfileId)
          .single();

        if (profileData) {
          actualCreatorProfileId = profileData.id;
        }
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: data.name,
            username: data.username,
            password: data.password,
            roles: data.roles,
            permisos: data.permisos,
            creator_profile_id: actualCreatorProfileId,
          },
        },
      });

      // Si por configuración de Supabase la cuenta se auto-confirma, authData.session vendrá poblado.
      // Restablecemos la sesión previa para no “cambiar” la sesión del admin.
      await restoreSessionIfNeeded(sessionToRestore);

      if (signUpError) {
        throw new Error(normalizeSignUpError(signUpError.message));
      }

      // Invalidar caché de usuarios y roles para refrescar la tabla
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await queryClient.invalidateQueries({ queryKey: ['userRolesList'] });

      return { user: authData.user, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear usuario';
      setError(message);
      return { user: null, error: message };
    } finally {
      await restoreSessionIfNeeded(sessionToRestore);
      setLoading(false);
    }
  }, [queryClient, restoreSessionIfNeeded, normalizeSignUpError]);

  /**
   * Crear un solo usuario (para uso en bulk upload)
   * No invalida queries hasta el final del proceso bulk
   */
  const createSingleUser = useCallback(async (data: CreateUserData): Promise<CreateUserResult> => {
    const { data: { session: sessionToRestore } } = await supabase.auth.getSession();

    try {
      const redirectUrl = `${window.location.origin}/`;

      // Si se proporciona creatorProfileId (que es el auth.user.id), buscar el profile.id correspondiente
      let actualCreatorProfileId = data.creatorProfileId;
      if (data.creatorProfileId) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', data.creatorProfileId)
          .single();

        if (profileData) {
          actualCreatorProfileId = profileData.id;
        }
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: data.name,
            username: data.username,
            password: data.password,
            roles: data.roles,
            permisos: data.permisos,
            creator_profile_id: actualCreatorProfileId,
          },
        },
      });

      await restoreSessionIfNeeded(sessionToRestore);

      if (signUpError) {
        return { user: null, error: normalizeSignUpError(signUpError.message) };
      }

      return { user: authData.user, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear usuario';
      return { user: null, error: message };
    } finally {
      await restoreSessionIfNeeded(sessionToRestore);
    }
  }, [restoreSessionIfNeeded, normalizeSignUpError]);

  /**
   * Crear múltiples usuarios en bulk
   */
  const createUsersBulk = useCallback(async (users: CreateUserData[]): Promise<BulkCreateResult> => {
    setLoading(true);
    setError(null);

    const results: Array<{ email: string; success: boolean; error?: string }> = [];
    let successCount = 0;
    let failedCount = 0;

    for (const userData of users) {
      const result = await createSingleUser(userData);

      if (result.error) {
        results.push({ email: userData.email, success: false, error: result.error });
        failedCount++;
      } else {
        results.push({ email: userData.email, success: true });
        successCount++;
      }
    }

    // Invalidar queries solo una vez al final
    await queryClient.invalidateQueries({ queryKey: ['users'] });
    await queryClient.invalidateQueries({ queryKey: ['userRolesList'] });

    setLoading(false);

    return {
      total: users.length,
      success: successCount,
      failed: failedCount,
      results,
    };
  }, [createSingleUser, queryClient]);

  return {
    createUser,
    createSingleUser,
    createUsersBulk,
    loading,
    error,
  };
}
