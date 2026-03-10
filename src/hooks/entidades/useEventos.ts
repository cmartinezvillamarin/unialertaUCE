import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Evento {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  ubicacion: string | null;
  lat: number | null;
  lng: number | null;
  color: string | null;
  activo: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  creator?: { name: string | null; avatar: string | null };
  reportes_count?: number;
}

export interface CreateEventoInput {
  titulo: string;
  descripcion?: string;
  fecha_inicio: string;
  fecha_fin?: string;
  ubicacion?: string;
  lat?: number;
  lng?: number;
  color?: string;
}

export function useEventos() {
  const queryClient = useQueryClient();

  const eventosQuery = useQuery({
    queryKey: ['eventos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eventos')
        .select('*, creator:profiles!eventos_created_by_fkey(name, avatar)')
        .is('deleted_at', null)
        .eq('activo', true)
        .order('fecha_inicio', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as Evento[];
    },
  });

  const createEvento = useMutation({
    mutationFn: async (input: CreateEventoInput) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')
        .single();

      if (!profile) throw new Error('Perfil no encontrado');

      const { data, error } = await supabase
        .from('eventos')
        .insert({ ...input, created_by: profile.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos'] });
      toast.success('Evento creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error('Error al crear evento: ' + error.message);
    },
  });

  const updateEvento = useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateEventoInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('eventos')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos'] });
      toast.success('Evento actualizado');
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar evento: ' + error.message);
    },
  });

  const deleteEvento = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('eventos')
        .update({ deleted_at: new Date().toISOString(), activo: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos'] });
      toast.success('Evento eliminado');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar evento: ' + error.message);
    },
  });

  const linkReporte = useMutation({
    mutationFn: async ({ eventoId, reporteId }: { eventoId: string; reporteId: string }) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')
        .single();

      const { error } = await supabase
        .from('evento_reportes')
        .insert({ evento_id: eventoId, reporte_id: reporteId, created_by: profile?.id });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos'] });
      queryClient.invalidateQueries({ queryKey: ['evento-reportes'] });
      toast.success('Reporte vinculado al evento');
    },
    onError: (error: Error) => {
      toast.error('Error al vincular reporte: ' + error.message);
    },
  });

  return {
    eventos: eventosQuery.data || [],
    isLoading: eventosQuery.isLoading,
    error: eventosQuery.error,
    createEvento,
    updateEvento,
    deleteEvento,
    linkReporte,
  };
}

export function useEventoReportes(eventoId: string | undefined) {
  return useQuery({
    queryKey: ['evento-reportes', eventoId],
    queryFn: async () => {
      if (!eventoId) return [];
      const { data, error } = await supabase
        .from('evento_reportes')
        .select('*, reporte:reportes(id, titulo, estado, prioridad, created_at)')
        .eq('evento_id', eventoId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!eventoId,
  });
}
