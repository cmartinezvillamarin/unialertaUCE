import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.91.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Edge Function para limpiar ubicaciones de usuarios inactivos.
 * 
 * Casos de uso:
 * 1. Llamada manual desde el cliente cuando detecta que un usuario se desconecta
 * 2. Llamada periódica (cron) para limpiar ubicaciones obsoletas
 * 3. Llamada desde el logout para limpiar la ubicación del usuario
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body = await req.json().catch(() => ({}));
    const { action, user_id, inactivity_minutes = 5 } = body;

    console.log(`[cleanup-user-locations] Action: ${action}, User ID: ${user_id || 'N/A'}, Inactivity: ${inactivity_minutes}min`);

    let result;

    switch (action) {
      case 'cleanup_user':
        // Eliminar ubicación de un usuario específico (usado en logout)
        if (!user_id) {
          return new Response(
            JSON.stringify({ error: 'user_id is required for cleanup_user action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { data: deleteResult, error: deleteError } = await supabase.rpc(
          'delete_user_location',
          { target_user_id: user_id }
        );

        if (deleteError) {
          console.error('[cleanup-user-locations] Error deleting user location:', deleteError);
          throw deleteError;
        }

        result = { success: true, deleted: deleteResult };
        console.log(`[cleanup-user-locations] Deleted location for user ${user_id}: ${deleteResult}`);
        break;

      case 'cleanup_stale':
        // Eliminar ubicaciones de usuarios inactivos
        const { data: cleanupResult, error: cleanupError } = await supabase.rpc(
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

      case 'cleanup_offline_users':
        // Eliminar ubicaciones de usuarios que ya no están en el canal de presencia
        // Este action requiere una lista de profile_ids de usuarios online
        const { online_user_ids = [] } = body;
        
        if (online_user_ids.length === 0) {
          // Si no hay usuarios online, eliminar todas las ubicaciones
          const { error: clearAllError } = await supabase
            .from('user_locations')
            .delete()
            .neq('user_id', '00000000-0000-0000-0000-000000000000'); // Workaround para DELETE all
          
          if (clearAllError) throw clearAllError;
          
          result = { success: true, message: 'All locations cleared (no online users)' };
        } else {
          // Eliminar ubicaciones de usuarios que NO están en la lista de online
          const { data: deleted, error: deleteOfflineError } = await supabase
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

      default:
        // Por defecto, limpiar ubicaciones obsoletas
        const { data: defaultResult, error: defaultError } = await supabase.rpc(
          'cleanup_stale_user_locations',
          { inactivity_minutes }
        );

        if (defaultError) throw defaultError;
        
        result = { success: true, deleted_count: defaultResult };
        console.log(`[cleanup-user-locations] Default cleanup: ${defaultResult} locations removed`);
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
