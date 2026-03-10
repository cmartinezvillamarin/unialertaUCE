import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EncuestaOpcion {
  id: string;
  encuesta_id: string;
  texto: string;
  orden: number;
  votos_count?: number;
}

export interface Encuesta {
  id: string;
  pregunta: string;
  descripcion: string | null;
  tipo: 'simple' | 'multiple' | 'si_no';
  publicacion_id: string | null;
  fecha_cierre: string | null;
  activo: boolean;
  created_by: string;
  created_at: string;
  opciones: EncuestaOpcion[];
  total_votos: number;
  user_voted: boolean;
  user_votes: string[];
}

export interface CreateEncuestaInput {
  pregunta: string;
  descripcion?: string;
  tipo?: 'simple' | 'multiple' | 'si_no';
  publicacion_id?: string;
  fecha_cierre?: string;
  opciones: string[];
}

export function useEncuestas(publicacionId?: string) {
  const queryClient = useQueryClient();

  const encuestasQuery = useQuery({
    queryKey: ['encuestas', publicacionId],
    queryFn: async () => {
      let query = supabase
        .from('encuestas')
        .select('*, opciones:encuesta_opciones(*), respuestas:encuesta_respuestas(*)')
        .eq('activo', true)
        .order('created_at', { ascending: false });

      if (publicacionId) {
        query = query.eq('publicacion_id', publicacionId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')
        .single();

      const currentUserId = profile?.id;

      return (data || []).map((encuesta: any) => {
        const opciones = (encuesta.opciones || []).map((op: any) => ({
          ...op,
          votos_count: (encuesta.respuestas || []).filter((r: any) => r.opcion_id === op.id).length,
        }));
        const userVotes = (encuesta.respuestas || [])
          .filter((r: any) => r.user_id === currentUserId)
          .map((r: any) => r.opcion_id);

        return {
          id: encuesta.id,
          pregunta: encuesta.pregunta,
          descripcion: encuesta.descripcion,
          tipo: encuesta.tipo,
          publicacion_id: encuesta.publicacion_id,
          fecha_cierre: encuesta.fecha_cierre,
          activo: encuesta.activo,
          created_by: encuesta.created_by,
          created_at: encuesta.created_at,
          opciones: opciones.sort((a: any, b: any) => a.orden - b.orden),
          total_votos: (encuesta.respuestas || []).length,
          user_voted: userVotes.length > 0,
          user_votes: userVotes,
        } as Encuesta;
      });
    },
  });

  const createEncuesta = useMutation({
    mutationFn: async (input: CreateEncuestaInput) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')
        .single();

      if (!profile) throw new Error('Perfil no encontrado');

      const opcionesData = input.tipo === 'si_no'
        ? ['Sí', 'No']
        : input.opciones;

      const { data: encuesta, error } = await supabase
        .from('encuestas')
        .insert({
          pregunta: input.pregunta,
          descripcion: input.descripcion,
          tipo: input.tipo || 'simple',
          publicacion_id: input.publicacion_id,
          fecha_cierre: input.fecha_cierre,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;

      const opcionesInsert = opcionesData.map((texto, index) => ({
        encuesta_id: encuesta.id,
        texto,
        orden: index,
      }));

      const { error: opError } = await supabase
        .from('encuesta_opciones')
        .insert(opcionesInsert);

      if (opError) throw opError;

      return encuesta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encuestas'] });
      toast.success('Encuesta creada');
    },
    onError: (error: Error) => {
      toast.error('Error al crear encuesta: ' + error.message);
    },
  });

  const votar = useMutation({
    mutationFn: async ({ encuestaId, opcionId }: { encuestaId: string; opcionId: string }) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')
        .single();

      if (!profile) throw new Error('Perfil no encontrado');

      // Remove existing vote for simple polls
      await supabase
        .from('encuesta_respuestas')
        .delete()
        .eq('encuesta_id', encuestaId)
        .eq('user_id', profile.id);

      const { error } = await supabase
        .from('encuesta_respuestas')
        .insert({
          encuesta_id: encuestaId,
          opcion_id: opcionId,
          user_id: profile.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encuestas'] });
    },
    onError: (error: Error) => {
      toast.error('Error al votar: ' + error.message);
    },
  });

  const removeVote = useMutation({
    mutationFn: async (encuestaId: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')
        .single();

      if (!profile) throw new Error('Perfil no encontrado');

      const { error } = await supabase
        .from('encuesta_respuestas')
        .delete()
        .eq('encuesta_id', encuestaId)
        .eq('user_id', profile.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encuestas'] });
      toast.success('Voto eliminado');
    },
  });

  return {
    encuestas: encuestasQuery.data || [],
    isLoading: encuestasQuery.isLoading,
    createEncuesta,
    votar,
    removeVote,
  };
}
