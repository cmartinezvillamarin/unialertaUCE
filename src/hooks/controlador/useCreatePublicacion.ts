/**
 * Hook para crear publicaciones con caché optimista
 */
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCloudinaryUpload } from './useCloudinaryUpload';
import { toast } from 'sonner';
import type { Publicacion } from '@/hooks/entidades/usePublicaciones';

export interface CreatePublicacionInput {
  contenido: string;
  imagenes?: File[];
  visibilidad?: 'publico' | 'amigos' | 'privado';
}

export interface UseCreatePublicacionOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

// Tipo para la publicación optimista temporal
interface OptimisticPost extends Publicacion {
  _isOptimistic?: boolean;
}

/**
 * Extrae hashtags de un texto (sin el #)
 */
function extractHashtags(text: string): string[] {
  if (!text) return [];
  const regex = /#(\w+)/g;
  const matches = text.matchAll(regex);
  const hashtags = [...matches].map(m => m[1].toLowerCase());
  // Eliminar duplicados
  return [...new Set(hashtags)];
}

/**
 * Extrae menciones de un texto (sin el @)
 */
function extractMentions(text: string): string[] {
  if (!text) return [];
  const regex = /@(\w+)/g;
  const matches = text.matchAll(regex);
  const mentions = [...matches].map(m => m[1].toLowerCase());
  // Eliminar duplicados
  return [...new Set(mentions)];
}

/**
 * Procesa menciones: busca los usuarios que existen y retorna sus IDs
 */
async function processMentions(mentions: string[]): Promise<string[]> {
  if (mentions.length === 0) return [];

  // Buscar usuarios con esos usernames
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id')
    .in('username', mentions)
    .is('deleted_at', null);

  if (error) {
    console.error('[processMentions] Error fetching users:', error);
    return [];
  }

  return users?.map(u => u.id) || [];
}

/**
 * Vincula menciones a una publicación
 */
async function linkMentionsToPost(publicacionId: string, mentionedUserIds: string[]): Promise<void> {
  if (mentionedUserIds.length === 0) return;

  const links = mentionedUserIds.map(mentioned_user_id => ({
    publicacion_id: publicacionId,
    mentioned_user_id,
  }));

  const { error } = await supabase.from('publicacion_menciones').insert(links);
  if (error) {
    console.error('[linkMentionsToPost] Error linking mentions:', error);
    throw error;
  }
}

/**
 * Procesa hashtags: crea los que no existen y retorna sus IDs
 */
async function processHashtags(hashtags: string[]): Promise<string[]> {
  if (hashtags.length === 0) return [];

  const hashtagIds: string[] = [];

  for (const nombre of hashtags) {
    // Buscar si ya existe
    const { data: existing } = await supabase
      .from('hashtags')
      .select('id, uso_count')
      .eq('nombre', nombre)
      .single();

    if (existing) {
      hashtagIds.push(existing.id);
      // Incrementar uso_count
      await supabase
        .from('hashtags')
        .update({ 
          uso_count: (existing.uso_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // Crear nuevo hashtag
      const { data: newHashtag, error } = await supabase
        .from('hashtags')
        .insert({ nombre, uso_count: 1 })
        .select('id')
        .single();

      if (!error && newHashtag) {
        hashtagIds.push(newHashtag.id);
      }
    }
  }

  return hashtagIds;
}

/**
 * Vincula hashtags a una publicación
 */
async function linkHashtagsToPost(publicacionId: string, hashtagIds: string[]): Promise<void> {
  if (hashtagIds.length === 0) return;

  const links = hashtagIds.map(hashtag_id => ({
    publicacion_id: publicacionId,
    hashtag_id,
  }));

  const { error } = await supabase.from('publicacion_hashtags').insert(links);
  if (error) {
    console.error('[linkHashtagsToPost] Error linking hashtags:', error);
    throw error;
  }
}

export function useCreatePublicacion(options: UseCreatePublicacionOptions = {}) {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();
  const { uploadMultiple, isUploading: isUploadingImages, progress: uploadProgress } = useCloudinaryUpload();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mutation = useMutation({
    mutationFn: async (input: CreatePublicacionInput & { 
      userId: string; 
      imageUrls?: string[];
      userProfile?: { name: string | null; avatar: string | null; username: string | null };
    }) => {
      // Extraer hashtags y menciones del contenido
      const hashtags = extractHashtags(input.contenido);
      const mentions = extractMentions(input.contenido);

      const { data, error } = await supabase
        .from('publicaciones')
        .insert({
          contenido: input.contenido || null,
          imagenes: input.imageUrls || null,
          visibilidad: input.visibilidad || 'publico',
          user_id: input.userId,
          activo: true,
        })
        .select(`
          id,
          contenido,
          imagenes,
          visibilidad,
          created_at,
          updated_at,
          user_id,
          repost_of,
          repost_comentario,
          estado_id,
          activo,
          author:profiles!publicaciones_user_id_fkey(
            id,
            name,
            avatar,
            username
          )
        `)
        .single();

      if (error) throw error;

      // Procesar y vincular hashtags después de crear la publicación
      if (hashtags.length > 0) {
        console.log('[useCreatePublicacion] Processing hashtags:', hashtags, 'for post:', data.id);
        try {
          const hashtagIds = await processHashtags(hashtags);
          console.log('[useCreatePublicacion] Hashtag IDs:', hashtagIds);
          await linkHashtagsToPost(data.id, hashtagIds);
          console.log('[useCreatePublicacion] Hashtags linked successfully');
        } catch (hashtagError) {
          console.error('[useCreatePublicacion] Error processing hashtags:', hashtagError);
          // No fallar la publicación por hashtags
        }
      }

      // Procesar y vincular menciones después de crear la publicación
      if (mentions.length > 0) {
        console.log('[useCreatePublicacion] Processing mentions:', mentions, 'for post:', data.id);
        try {
          const mentionedUserIds = await processMentions(mentions);
          console.log('[useCreatePublicacion] Mentioned user IDs:', mentionedUserIds);
          await linkMentionsToPost(data.id, mentionedUserIds);
          console.log('[useCreatePublicacion] Mentions linked successfully');
        } catch (mentionError) {
          console.error('[useCreatePublicacion] Error processing mentions:', mentionError);
          // No fallar la publicación por menciones
        }
      }

      return data;
    },
    onMutate: async (newPost) => {
      // La queryKey incluye el userId
      const queryKey = ['publicaciones-feed', newPost.userId];
      
      // Cancelar queries en progreso
      await queryClient.cancelQueries({ queryKey });

      // Snapshot del estado anterior
      const previousData = queryClient.getQueryData(queryKey);

      // Crear publicación optimista
      const optimisticPost: OptimisticPost = {
        id: `temp-${Date.now()}`,
        contenido: newPost.contenido || null,
        imagenes: newPost.imageUrls || null,
        visibilidad: newPost.visibilidad || 'publico',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: newPost.userId,
        repost_of: null,
        repost_comentario: null,
        estado_id: null,
        activo: true,
        author: newPost.userProfile ? {
          id: newPost.userId,
          name: newPost.userProfile.name,
          avatar: newPost.userProfile.avatar,
          username: newPost.userProfile.username,
        } : null,
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        has_liked: false,
        has_saved: false,
        _isOptimistic: true,
      };

      // Actualizar el caché inmediatamente
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old?.pages) return old;
        
        return {
          ...old,
          pages: old.pages.map((page: any, index: number) => {
            if (index === 0) {
              return {
                ...page,
                data: [optimisticPost, ...page.data],
              };
            }
            return page;
          }),
        };
      });

      return { previousData, queryKey };
    },
    onSuccess: async (data, variables, context) => {
      toast.success('Publicación creada');
      onSuccess?.();
      
      const queryKey = context?.queryKey || ['publicaciones-feed', variables.userId];
      
      // Reemplazar publicación optimista con la real
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old?.pages) return old;
        
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((post: OptimisticPost) => 
              post._isOptimistic ? {
                ...data,
                author: Array.isArray(data.author) ? data.author[0] : data.author,
                likes_count: 0,
                comments_count: 0,
                shares_count: 0,
                has_liked: false,
                has_saved: false,
              } : post
            ),
          })),
        };
      });
    },
    onError: (error: Error, variables, context) => {
      console.error('[useCreatePublicacion] Error:', error);
      toast.error('Error al crear publicación');
      
      const queryKey = context?.queryKey || ['publicaciones-feed', variables.userId];
      
      // Revertir al estado anterior
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      
      onError?.(error);
    },
  });

  const createPublicacion = useCallback(async (
    input: CreatePublicacionInput,
    userId: string,
    userProfile?: { name: string | null; avatar: string | null; username: string | null }
  ) => {
    setIsSubmitting(true);
    
    try {
      let imageUrls: string[] = [];

      // Subir imágenes si las hay
      if (input.imagenes && input.imagenes.length > 0) {
        const results = await uploadMultiple(input.imagenes, {
          folder: 'publicaciones',
          tags: ['publicacion', userId],
        });
        imageUrls = results.map(r => r.secure_url);
      }

      // Crear publicación con datos del usuario para optimistic update
      await mutation.mutateAsync({
        ...input,
        userId,
        imageUrls,
        userProfile,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [mutation, uploadMultiple]);

  return {
    createPublicacion,
    isSubmitting: isSubmitting || mutation.isPending,
    isUploadingImages,
    uploadProgress,
    error: mutation.error as Error | null,
  };
}

/**
 * Hook para interacciones con publicaciones (like, guardar, compartir)
 */
export function usePublicacionInteractions(userId?: string | null) {
  const queryClient = useQueryClient();

  const toggleLike = useMutation({
    mutationFn: async ({ publicacionId, hasLiked }: { publicacionId: string; hasLiked: boolean }) => {
      if (!userId) throw new Error('Usuario no autenticado');

      if (hasLiked) {
        // Quitar like
        const { error } = await supabase
          .from('interacciones')
          .delete()
          .eq('publicacion_id', publicacionId)
          .eq('user_id', userId)
          .eq('tipo_interaccion', 'me_gusta');
        
        if (error) throw error;
      } else {
        // Agregar like
        const { error } = await supabase
          .from('interacciones')
          .insert({
            publicacion_id: publicacionId,
            user_id: userId,
            tipo_interaccion: 'me_gusta',
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicaciones-feed'] });
    },
  });

  const toggleSave = useMutation({
    mutationFn: async ({ publicacionId, hasSaved }: { publicacionId: string; hasSaved: boolean }) => {
      if (!userId) throw new Error('Usuario no autenticado');

      if (hasSaved) {
        const { error } = await supabase
          .from('publicacion_guardadas')
          .delete()
          .eq('publicacion_id', publicacionId)
          .eq('user_id', userId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('publicacion_guardadas')
          .insert({
            publicacion_id: publicacionId,
            user_id: userId,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicaciones-feed'] });
    },
  });

  return {
    toggleLike: toggleLike.mutate,
    toggleSave: toggleSave.mutate,
    isLiking: toggleLike.isPending,
    isSaving: toggleSave.isPending,
  };
}
