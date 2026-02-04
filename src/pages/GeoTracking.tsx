import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, History, Activity, ArrowLeft, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { GeoTrackingMap } from '@/components/tracking/GeoTrackingMap';
import { useActiveTracking, TrackingWithDetails } from '@/hooks/controlador/useActiveTracking';
import { useReportResolutionModal } from '@/components/report/ReportResolutionModal';
import { useOptimizedProfile } from '@/hooks/entidades/useOptimizedProfile';
import { useOptimizedReportes } from '@/hooks/entidades/useOptimizedReportes';
import { useReporteHistorialActions } from '@/hooks/controlador/useReporteHistorialActions';
import { animationClasses } from '@/hooks/optimizacion';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

const PRIORITY_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  urgente: { label: 'Urgente', variant: 'destructive' },
  alto: { label: 'Alta', variant: 'destructive' },
  medio: { label: 'Media', variant: 'secondary' },
  bajo: { label: 'Baja', variant: 'outline' },
};

export default function GeoTracking() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'activos' | 'historial'>('activos');
  const [directNavigation, setDirectNavigation] = useState<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);
  // Flag para evitar auto-selección cuando el usuario presiona "atrás"
  const [userNavigatedBack, setUserNavigatedBack] = useState(false);
  
  const {
    activeTrackings,
    trackingHistory,
    currentTracking,
    assignedUserLocation,
    isLoading,
    error,
    fetchActiveTrackings,
    fetchTrackingHistory,
    selectTracking,
    clearCurrentTracking,
    endTracking,
    activeCount,
  } = useActiveTracking();

  // Obtener el perfil del usuario actual para validar permisos
  const { data: currentProfile } = useOptimizedProfile();
  
  // Hook para actualizar reportes
  const { update: updateReporte } = useOptimizedReportes();
  
  // Hook para registrar historial
  const { createHistorial } = useReporteHistorialActions();
  
  // Modal de resolución con evidencia
  const resolutionModal = useReportResolutionModal();
  // Verificar si viene de SmartReportCapture con un tracking específico
  // O de un mensaje con navegación directa a un reporte
  const navState = location.state as { 
    trackingId?: string;
    navigateToReport?: {
      id: string;
      name: string;
      latitude: number;
      longitude: number;
      address?: string;
    };
  } | undefined;

  // Manejar navegación directa desde mensaje
  useEffect(() => {
    if (navState?.navigateToReport) {
      setDirectNavigation(navState.navigateToReport);
      // Limpiar el state para evitar que persista en navegación
      window.history.replaceState({}, document.title);
    }
  }, [navState?.navigateToReport]);

  useEffect(() => {
    if (navState?.trackingId && activeTrackings.length > 0) {
      selectTracking(navState.trackingId);
      // Resetear flag si viene con tracking específico
      setUserNavigatedBack(false);
    }
  }, [navState?.trackingId, activeTrackings, selectTracking]);

  // Cargar historial cuando cambia a esa tab
  useEffect(() => {
    if (activeTab === 'historial') {
      fetchTrackingHistory();
    }
  }, [activeTab, fetchTrackingHistory]);

  // Auto-seleccionar si solo hay un tracking activo (solo si no vino de "atrás")
  useEffect(() => {
    if (!currentTracking && activeTrackings.length === 1 && !userNavigatedBack) {
      selectTracking(activeTrackings[0].id);
    }
  }, [activeTrackings, currentTracking, selectTracking, userNavigatedBack]);

  // Verificar si el usuario actual puede finalizar el tracking
  const canEndTracking = useCallback((tracking: TrackingWithDetails) => {
    if (!currentProfile?.id) return false;
    // Solo el usuario asignado puede finalizar
    return tracking.asignado_a === currentProfile.id;
  }, [currentProfile?.id]);

  // Abrir modal de resolución para finalizar tracking
  const handleOpenEndTrackingModal = useCallback((tracking: TrackingWithDetails) => {
    if (!canEndTracking(tracking)) {
      toast.error('Solo el usuario asignado puede finalizar el seguimiento');
      return;
    }

    resolutionModal.open({
      type: 'resolucion',
      reportName: tracking.reporte?.nombre || 'Reporte',
      requireEvidence: true,
      isBulk: false,
      onConfirm: async (comentario: string, evidencias: string[]) => {
        try {
          // 1. Finalizar el tracking
          const success = await endTracking(tracking.id, 'resuelto_con_evidencia');
          if (!success) {
            throw new Error('Error al finalizar el seguimiento');
          }

          // 2. Marcar el reporte como resuelto
          if (tracking.reporte_id) {
            await updateReporte({
              id: tracking.reporte_id,
              updates: {
                status: 'resuelto',
                activo: false,
                assigned_to: null,
                updated_at: new Date().toISOString(),
              },
            });

            // 3. Registrar en el historial del reporte
            await createHistorial({
              reporteId: tracking.reporte_id,
              tipoAccion: 'resolucion',
              comentario,
              evidencias,
              estadoAnterior: 'en_progreso',
              estadoNuevo: 'resuelto',
            });
          }

          toast.success('Seguimiento finalizado y reporte resuelto');
          setUserNavigatedBack(true);
        } catch (error) {
          console.error('Error finalizando tracking:', error);
          throw error; // Re-throw para que el modal muestre el error
        }
      },
    });
  }, [canEndTracking, resolutionModal, endTracking, updateReporte, createHistorial]);

  const handleBack = () => {
    if (directNavigation) {
      setDirectNavigation(null);
    } else if (currentTracking) {
      setUserNavigatedBack(true); // Marcar que el usuario navegó atrás
      clearCurrentTracking();
    } else {
      navigate(-1);
    }
  };
  
  const handleGoToReportDetail = () => {
    if (directNavigation) {
      navigate(`/reportes/${directNavigation.id}`);
    }
  };

  const renderTrackingCard = (tracking: TrackingWithDetails, isHistory = false) => {
    const priority = (tracking.reporte?.priority as string) || 'medio';
    const priorityBadge = PRIORITY_BADGES[priority] || PRIORITY_BADGES.medio;
    
    return (
      <Card
        key={tracking.id}
        className={cn(
          'cursor-pointer transition-all hover:shadow-md',
          currentTracking?.id === tracking.id && 'ring-2 ring-primary'
        )}
        onClick={() => !isHistory && selectTracking(tracking.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={tracking.asignado?.avatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {tracking.asignado?.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-foreground truncate">
                  {tracking.asignado?.name || 'Usuario asignado'}
                </p>
                <Badge variant={priorityBadge.variant} className="text-xs">
                  {priorityBadge.label}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {tracking.reporte?.nombre || 'Reporte'}
              </p>
              
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                {isHistory ? (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>
                      Finalizado {formatDistanceToNow(new Date(tracking.ended_at!), { addSuffix: true, locale: es })}
                    </span>
                    {tracking.ended_reason && (
                      <Badge variant="outline" className="text-[10px]">
                        {tracking.ended_reason === 'estado_cambiado' ? 'Estado cambiado' : 
                         tracking.ended_reason === 'manual' ? 'Manual' : tracking.ended_reason}
                      </Badge>
                    )}
                  </>
                ) : (
                  <>
                    <Activity className="h-3 w-3 text-green-500 animate-pulse" />
                    <span>
                      Iniciado {formatDistanceToNow(new Date(tracking.started_at), { addSuffix: true, locale: es })}
                    </span>
                  </>
                )}
              </div>
            </div>

            {!isHistory && canEndTracking(tracking) && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEndTrackingModal(tracking);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Vista de navegación directa desde mensaje
  if (directNavigation) {
    return (
      <div className={cn('flex flex-col h-full overflow-hidden', animationClasses.fadeIn)}>
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border bg-background">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Navegación al reporte</h1>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {directNavigation.name}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleGoToReportDetail}>
            Ver detalles
          </Button>
        </div>

        {/* Info del reporte */}
        <div className="px-4 py-3 bg-primary/5 border-b border-primary/10">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground line-clamp-1">
                {directNavigation.name}
              </p>
              {directNavigation.address && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                  {directNavigation.address}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                📍 {directNavigation.latitude.toFixed(6)}, {directNavigation.longitude.toFixed(6)}
              </p>
            </div>
          </div>
        </div>

        {/* Mapa con navegación */}
        <div className="flex-1 p-4 overflow-auto">
          <GeoTrackingMap
            destination={{
              lat: directNavigation.latitude,
              lng: directNavigation.longitude,
              name: directNavigation.name,
              address: directNavigation.address,
            }}
            className="h-full"
          />
        </div>
        
        {/* Modal de resolución con evidencia */}
        {resolutionModal.Modal}
      </div>
    );
  }

  // Vista del mapa cuando hay tracking seleccionado
  if (currentTracking) {
    return (
      <div className={cn('flex flex-col h-full overflow-hidden', animationClasses.fadeIn)}>
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border bg-background">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Seguimiento en tiempo real</h1>
            <p className="text-xs text-muted-foreground">
              {currentTracking.reporte?.nombre}
            </p>
          </div>
          {canEndTracking(currentTracking) && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-destructive"
              onClick={() => handleOpenEndTrackingModal(currentTracking)}
            >
              Finalizar
            </Button>
          )}
        </div>

        {/* Mapa */}
        <div className="flex-1 p-4 overflow-auto">
          <GeoTrackingMap
            tracking={currentTracking}
            assignedUserLocation={assignedUserLocation}
            className="h-full"
          />
        </div>
        
        {/* Modal de resolución con evidencia */}
        {resolutionModal.Modal}
      </div>
    );
  }

  // Vista de lista
  return (
    <div className={cn('flex flex-col h-full overflow-hidden', animationClasses.fadeIn)}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-background">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">GeoTracking</h1>
          <p className="text-xs text-muted-foreground">
            Seguimiento de usuarios asignados
          </p>
        </div>
        {activeCount > 0 && (
          <Badge className="bg-primary text-primary-foreground">
            {activeCount} activo{activeCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'activos' | 'historial')}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="mx-4 mt-4 grid w-auto grid-cols-2">
          <TabsTrigger value="activos" className="gap-2">
            <Activity className="h-4 w-4" />
            Activos
            {activeCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {activeCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="historial" className="gap-2">
            <History className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activos" className="flex-1 overflow-hidden m-0 p-4">
          <ScrollArea className="h-full">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
            ) : activeTrackings.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <CardTitle className="text-lg mb-2">Sin seguimientos activos</CardTitle>
                  <CardDescription className="max-w-sm">
                    Los seguimientos se inician automáticamente cuando creas un reporte 
                    de prioridad alta o urgente con asignación automática.
                  </CardDescription>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {activeTrackings.map((tracking) => renderTrackingCard(tracking))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="historial" className="flex-1 overflow-hidden m-0 p-4">
          <ScrollArea className="h-full">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
            ) : trackingHistory.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <CardTitle className="text-lg mb-2">Sin historial</CardTitle>
                  <CardDescription>
                    Aquí aparecerán los seguimientos finalizados.
                  </CardDescription>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {trackingHistory.map((tracking) => renderTrackingCard(tracking, true))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {error && (
        <div className="p-4 bg-destructive/10 border-t border-destructive/20">
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        </div>
      )}

      {/* Modal de resolución con evidencia */}
      {resolutionModal.Modal}
    </div>
  );
}
