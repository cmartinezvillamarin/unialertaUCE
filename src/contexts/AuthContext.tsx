import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { resetLayoutShown } from '@/components/AppLayout';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  hasInitialized: boolean;
  isSigningOut: boolean;
}

interface AuthContextType extends AuthState {
  refreshSession: () => Promise<void>;
  clearSession: () => void;
  setSigningOut: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Provider global de autenticación.
 * Mantiene el estado de sesión persistente durante toda la vida de la app,
 * evitando reinicios durante navegaciones internas.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false,
    hasInitialized: false,
    isSigningOut: false,
  });
  
  // Ref para evitar actualizaciones después del primer init
  const initializedRef = useRef(false);
  // Ref para rastrear el userId actual y detectar cambios de usuario
  const previousUserIdRef = useRef<string | null>(null);

  /**
   * Limpia datos del usuario anterior cuando se detecta un cambio de cuenta
   * en el mismo dispositivo/navegador.
   */
  const cleanupPreviousUser = useCallback((previousUserId: string) => {
    console.log('[AuthContext] User switch detected, cleaning up previous user:', previousUserId);
    
    // Limpiar caché de localStorage del usuario anterior
    try {
      localStorage.removeItem('user_cache:profile');
      localStorage.removeItem('user_cache:settings');
      localStorage.removeItem('user_cache:userRoles');
      localStorage.removeItem('user_cache:userId');
      localStorage.removeItem('user_cache:timestamp');
    } catch (error) {
      console.warn('[AuthContext] Error clearing previous user cache:', error);
    }

    // Resetear el flag del layout para que cargue datos frescos
    resetLayoutShown();

    // Limpiar ubicación del usuario anterior en background
    (async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', previousUserId)
          .maybeSingle();

        if (profile?.id) {
          await supabase
            .from('user_locations')
            .delete()
            .eq('user_id', profile.id);
          console.log('[AuthContext] Previous user location cleared');
        }
      } catch (err) {
        console.warn('[AuthContext] Error clearing previous user location:', err);
      }
    })();
  }, []);

  const updateSessionState = useCallback((session: Session | null, isInitial = false) => {
    const newUserId = session?.user?.id ?? null;
    const previousUserId = previousUserIdRef.current;

    // Detectar cambio de usuario: había un usuario diferente al nuevo
    if (previousUserId && newUserId && previousUserId !== newUserId) {
      cleanupPreviousUser(previousUserId);
    }

    previousUserIdRef.current = newUserId;

    setState(prev => ({
      ...prev,
      user: session?.user ?? null,
      session,
      loading: false,
      isAuthenticated: !!session,
      hasInitialized: true,
      isSigningOut: session ? false : prev.isSigningOut,
    }));
    
    if (isInitial) {
      initializedRef.current = true;
    }
  }, [cleanupPreviousUser]);

  const setSigningOut = useCallback((value: boolean) => {
    setState(prev => ({ ...prev, isSigningOut: value }));
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Error al refrescar sesión:', error.message);
        updateSessionState(null);
        return;
      }
      updateSessionState(session);
    } catch (error) {
      console.error('Error inesperado al refrescar sesión:', error);
      updateSessionState(null);
    }
  }, [updateSessionState]);

  const clearSession = useCallback(() => {
    updateSessionState(null);
  }, [updateSessionState]);

  useEffect(() => {
    // Evitar reinicialización si ya se hizo
    if (initializedRef.current) {
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        updateSessionState(session);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[AuthContext] Auth event:', event, session ? 'Session active' : 'No session');
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error al obtener sesión:', error.message);
        updateSessionState(null, true);
        return;
      }
      updateSessionState(session, true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [updateSessionState]);

  return (
    <AuthContext.Provider value={{ ...state, refreshSession, clearSession, setSigningOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para acceder al contexto de autenticación.
 * Debe usarse dentro de AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
