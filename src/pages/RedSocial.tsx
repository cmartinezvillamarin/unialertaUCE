/**
 * Página de Red Social
 * Feed con publicaciones y estados
 */
import { useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Users, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOptimizedProfile } from '@/hooks/entidades/useOptimizedProfile';
import { EntityPageHeader } from '@/components/ui/entity-page-header';
import { type SearchFilters } from '@/hooks/entidades';
import { useEncuestas } from '@/hooks/entidades/useEncuestas';
import { Button } from '@/components/ui/button';
import { 
  StatusSection, 
  FriendRequestsSection,
  CreatePostCard, 
  PostFeed,
  UserSearchCard,
  AdvancedSearchCard,
  UserStatsCard,
  TrendingHashtagsCard,
  TrendingPostsCard,
  SuggestedUsersCard,
  SocialSidebarMobile,
  StickyAside,
  PollCard,
  CreatePollCard,
} from '@/components/redsocial';

export default function RedSocial() {
  const { user } = useAuth();
  const { data: profile } = useOptimizedProfile(user?.id);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Estado para filtros de búsqueda avanzada
  const [searchFilters, setSearchFilters] = useState<SearchFilters | null>(null);
  const [showPollForm, setShowPollForm] = useState(false);
  
  // Encuestas
  const { encuestas, createEncuesta, votar, removeVote } = useEncuestas();
  
  // Obtener parámetros de query para abrir contenido específico
  const openEstadoId = searchParams.get('estado');

  const handleUserClick = (userId: string) => {
    navigate(`/perfil/id/${userId}`);
  };

  const handlePostClick = (postId: string) => {
    navigate(`/red-social/post/${postId}`);
  };

  const handleHashtagClick = useCallback((hashtag: string) => {
    // Agregar hashtag a los filtros de búsqueda
    const cleanTag = hashtag.startsWith('#') ? hashtag.slice(1) : hashtag;
    setSearchFilters(prev => {
      const currentHashtags = prev?.hashtags || [];
      // Evitar duplicados
      if (currentHashtags.includes(cleanTag.toLowerCase())) return prev;
      return {
        hashtags: [...currentHashtags, cleanTag.toLowerCase()],
        mentions: prev?.mentions || [],
      };
    });
  }, []);

  const handleMentionClick = useCallback((username: string) => {
    // Agregar mención a los filtros de búsqueda
    const cleanMention = username.startsWith('@') ? username.slice(1) : username;
    setSearchFilters(prev => {
      const currentMentions = prev?.mentions || [];
      // Evitar duplicados
      if (currentMentions.includes(cleanMention.toLowerCase())) return prev;
      return {
        hashtags: prev?.hashtags || [],
        mentions: [...currentMentions, cleanMention.toLowerCase()],
      };
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchFilters(null);
  }, []);

  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="flex flex-col gap-4 p-4 md:p-6 w-full">
        {/* Header con EntityPageHeader */}
        <EntityPageHeader
          title="Red Social"
          description="Feed con publicaciones y estados"
          icon={Users}
          entityKey="red-social"
          showCreate={false}
          showBulkUpload={false}
          rightContent={
            <div className="lg:hidden">
              <SocialSidebarMobile
                userId={profile?.id}
                userName={profile?.name}
                userAvatar={profile?.avatar}
                userEmail={profile?.email}
                onUserClick={handleUserClick}
                onPostClick={handlePostClick}
                onHashtagClick={handleHashtagClick}
                onViewAllTrending={() => navigate('/red-social/trending')}
              />
            </div>
          }
        />

        <div className="flex gap-4 lg:gap-6 items-start">
          {/* Feed principal */}
          <div className="flex-1 min-w-0 space-y-4">
            <StatusSection
              currentUserId={profile?.id}
              currentUserAvatar={profile?.avatar}
              currentUserName={profile?.name}
              openEstadoId={openEstadoId}
            />

            <FriendRequestsSection currentUserId={profile?.id} />

            <div className="flex items-center gap-2">
              <CreatePostCard
                userAvatar={profile?.avatar}
                userName={profile?.name}
                userUsername={profile?.username}
                userId={profile?.id}
              />
            </div>

            {/* Poll toggle button */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPollForm(!showPollForm)}
                className="gap-1.5 text-xs"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                {showPollForm ? 'Cerrar encuesta' : 'Crear encuesta'}
              </Button>
            </div>

            {showPollForm && (
              <CreatePollCard
                onSubmit={(data) => {
                  createEncuesta.mutate(data, {
                    onSuccess: () => setShowPollForm(false),
                  });
                }}
                isLoading={createEncuesta.isPending}
                onCancel={() => setShowPollForm(false)}
              />
            )}

            {/* Active polls */}
            {encuestas.length > 0 && (
              <div className="space-y-3">
                {encuestas.slice(0, 3).map(encuesta => (
                  <PollCard
                    key={encuesta.id}
                    encuesta={encuesta}
                    onVote={(eId, oId) => votar.mutate({ encuestaId: eId, opcionId: oId })}
                    onRemoveVote={(eId) => removeVote.mutate(eId)}
                  />
                ))}
              </div>
            )

            <PostFeed 
              userId={profile?.id} 
              placeholderCount={3}
              searchFilters={searchFilters}
              onClearFilters={handleClearFilters}
              onHashtagClick={handleHashtagClick}
              onMentionClick={handleMentionClick}
            />
          </div>

          {/* Sidebar derecho - sticky estilo X */}
          <StickyAside>
            <div className="space-y-4">
              <UserSearchCard onUserSelect={handleUserClick} />
              
              <AdvancedSearchCard 
                onFiltersChange={setSearchFilters}
                currentUserId={profile?.id}
              />
              
              <UserStatsCard
                userId={profile?.id}
                userName={profile?.name}
                userAvatar={profile?.avatar}
                userEmail={profile?.email}
              />
              
              <TrendingHashtagsCard onHashtagClick={handleHashtagClick} />
              
              <TrendingPostsCard 
                onPostClick={handlePostClick}
                onViewAll={() => navigate('/red-social/trending')}
              />
              
              <SuggestedUsersCard
                currentUserId={profile?.id}
                onUserClick={handleUserClick}
              />
            </div>
          </StickyAside>
        </div>
      </div>
    </div>
  );
}