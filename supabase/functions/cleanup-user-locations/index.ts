import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.91.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Edge Function para limpiar ubicaciones de usuarios inactivos.
 * 
 * Casos de uso:
 * 1. Llamada manual desde el cliente cuando detecta que un usuario se desconecta
 * 2. Llamada periódica (cron) para limpiar ubicaciones obsoletas
 * 3. Llamada desde el logout para limpiar la ubicación del usuario
 * 
 * Seguridad:
 * - Requiere JWT válido para todas las acciones
 * - cleanup_user: solo puede eliminar su propia ubicación
 * - cleanup_stale / cleanup_offline_users: requiere rol admin
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Service role client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // --- Authentication ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create user-scoped client for auth validation
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authUserId = claimsData.claims.sub;

    // Get profile_id for the authenticated user
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', authUserId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callerProfileId = profile.id;

    const body = await req.json().catch(() => ({}));
    const { action, user_id, inactivity_minutes = 5 } = body;

    console.log(`[cleanup-user-locations] Action: ${action}, User: ${callerProfileId}, Target: ${user_id || 'N/A'}`);

    let result;

    switch (action) {
      case 'cleanup_user': {
        // Users can only delete their own location
        const targetId = user_id || callerProfileId;
        if (targetId !== callerProfileId) {
          // Check if caller is admin
          const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
            _user_id: authUserId,
            _role: 'super_admin',
          });
          if (!isAdmin) {
            return new Response(
              JSON.stringify({ error: 'Forbidden: can only delete your own location' }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        const { data: deleteResult, error: deleteError } = await supabaseAdmin.rpc(
          'delete_user_location',
          { target_user_id: targetId }
        );

        if (deleteError) {
          console.error('[cleanup-user-locations] Error deleting user location:', deleteError);
          throw deleteError;
        }

        result = { success: true, deleted: deleteResult };
        console.log(`[cleanup-user-locations] Deleted location for user ${targetId}: ${deleteResult}`);
        break;
      }

      case 'cleanup_stale': {
        // Admin-only action
        const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
          _user_id: authUserId,
          _role: 'super_admin',
        });
        const { data: isAdministrador } = await supabaseAdmin.rpc('has_role', {
          _user_id: authUserId,
          _role: 'administrador',
        });

        if (!isAdmin && !isAdministrador) {
          return new Response(
            JSON.stringify({ error: 'Forbidden: admin role required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: cleanupResult, error: cleanupError } = await supabaseAdmin.rpc(
          'cleanup_stale_user_locations',
          { inactivity_minutes }
        );

        if (cleanupError) {
          console.error('[cleanup-user-locations] Error cleaning stale locations:', cleanupError);
          throw cleanupError;
        }

        result = { success: true, deleted_count: cleanupResult };
        console.log(`[cleanup-user-locations] Cleaned up ${cleanupResult} stale locations`);
        break;
      }

      case 'cleanup_offline_users': {
        // Admin-only action
        const { data: isAdminOffline } = await supabaseAdmin.rpc('has_role', {
          _user_id: authUserId,
          _role: 'super_admin',
        });
        const { data: isAdministradorOffline } = await supabaseAdmin.rpc('has_role', {
          _user_id: authUserId,
          _role: 'administrador',
        });

        if (!isAdminOffline && !isAdministradorOffline) {
          return new Response(
            JSON.stringify({ error: 'Forbidden: admin role required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { online_user_ids = [] } = body;
        
        if (online_user_ids.length === 0) {
          const { error: clearAllError } = await supabaseAdmin
            .from('user_locations')
            .delete()
            .neq('user_id', '00000000-0000-0000-0000-000000000000');
          
          if (clearAllError) throw clearAllError;
          
          result = { success: true, message: 'All locations cleared (no online users)' };
        } else {
          const { data: deleted, error: deleteOfflineError } = await supabaseAdmin
            .from('user_locations')
            .delete()
            .not('user_id', 'in', `(${online_user_ids.join(',')})`)
            .select('user_id');
          
          if (deleteOfflineError) throw deleteOfflineError;
          
          result = { 
            success: true, 
            deleted_count: deleted?.length || 0,
            online_count: online_user_ids.length
          };
          console.log(`[cleanup-user-locations] Cleaned ${deleted?.length || 0} offline user locations`);
        }
        break;
      }

      default: {
        // Default: cleanup stale - also admin-only
        const { data: isAdminDefault } = await supabaseAdmin.rpc('has_role', {
          _user_id: authUserId,
          _role: 'super_admin',
        });
        const { data: isAdministradorDefault } = await supabaseAdmin.rpc('has_role', {
          _user_id: authUserId,
          _role: 'administrador',
        });

        if (!isAdminDefault && !isAdministradorDefault) {
          return new Response(
            JSON.stringify({ error: 'Forbidden: admin role required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: defaultResult, error: defaultError } = await supabaseAdmin.rpc(
          'cleanup_stale_user_locations',
          { inactivity_minutes }
        );

        if (defaultError) throw defaultError;
        
        result = { success: true, deleted_count: defaultResult };
        console.log(`[cleanup-user-locations] Default cleanup: ${defaultResult} locations removed`);
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[cleanup-user-locations] Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
