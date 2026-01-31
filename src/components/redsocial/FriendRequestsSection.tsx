/**
 * Sección de Solicitudes de Amistad Pendientes
 * Estilo similar a Facebook con cards horizontales
 */
import { useNavigate } from 'react-router-dom';
import { UserPlus, Check, X, ChevronRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { usePendingFriendRequests } from '@/hooks/entidades/usePendingFriendRequests';
import { useUserRelations } from '@/hooks/entidades/useUserRelations';
import { animationClasses } from '@/hooks/optimizacion';

interface FriendRequestsSectionProps {
  currentUserId?: string;
  maxVisible?: number;
}

export function FriendRequestsSection({ 
  currentUserId,
  maxVisible = 5,
}: FriendRequestsSectionProps) {
  const navigate = useNavigate();
  const { pendingRequests, isLoading, count } = usePendingFriendRequests({ 
    userId: currentUserId 
  });
  const { acceptFriendRequest, rejectFriendRequest, isPending } = useUserRelations({ 
    currentUserId 
  });

  // No mostrar si no hay solicitudes pendientes
  if (!isLoading && count === 0) {
    return null;
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <Card className={cn("mb-6", animationClasses.fadeIn)}>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <Skeleton className="h-4 w-40" />
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 w-[160px]">
                <Skeleton className="h-[200px] w-full rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const visibleRequests = pendingRequests.slice(0, maxVisible);
  const hasMore = count > maxVisible;

  const handleAccept = (senderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    acceptFriendRequest(senderId);
  };

  const handleReject = (senderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    rejectFriendRequest(senderId);
  };

  const handleViewProfile = (userId: string) => {
    navigate(`/perfil/id/${userId}`);
  };

  return (
    <Card className={cn("mb-6", animationClasses.fadeIn)}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Solicitudes de amistad
          </h3>
          <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
        {hasMore && (
          <Button 
            variant="link" 
            size="sm" 
            className="text-primary p-0 h-auto font-medium"
            onClick={() => navigate('/notificaciones?tab=solicitudes')}
          >
            Ver todas
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="pb-4">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-3 pb-2">
            {visibleRequests.map((request) => (
              <div
                key={request.id}
                className="flex-shrink-0 w-[160px] bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => handleViewProfile(request.sender.id)}
              >
                {/* Avatar grande estilo Facebook */}
                <div className="relative aspect-square bg-muted overflow-hidden">
                  <Avatar className="w-full h-full rounded-none">
                    <AvatarImage 
                      src={request.sender.avatar || undefined} 
                      alt={request.sender.name || 'Usuario'}
                      className="object-cover"
                    />
                    <AvatarFallback className="rounded-none text-4xl bg-gradient-to-br from-primary/20 to-primary/40">
                      {(request.sender.name || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Info y acciones */}
                <div className="p-3 space-y-2">
                  <div className="min-h-[40px]">
                    <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                      {request.sender.name || 'Usuario'}
                    </p>
                    {request.sender.username && (
                      <p className="text-xs text-muted-foreground truncate">
                        @{request.sender.username}
                      </p>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="space-y-1.5">
                    <Button
                      size="sm"
                      className="w-full h-8 text-xs font-medium"
                      onClick={(e) => handleAccept(request.sender.id, e)}
                      disabled={isPending}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Confirmar
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full h-8 text-xs font-medium"
                      onClick={(e) => handleReject(request.sender.id, e)}
                      disabled={isPending}
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
