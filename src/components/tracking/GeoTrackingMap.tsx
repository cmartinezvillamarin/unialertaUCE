import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Navigation, Clock, Activity, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { TrackingWithDetails, UserLocationRealtime } from '@/hooks/controlador/useActiveTracking';
import { useGlobalLocation } from '@/contexts/LocationContext';
import { useUserPresence } from '@/hooks/messages/useUserPresence';

interface DestinationPoint {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
}

interface GeoTrackingMapProps {
  /** Para tracking de usuario asignado */
  tracking?: TrackingWithDetails;
  assignedUserLocation?: UserLocationRealtime | null;
  /** Para navegación directa a un punto (desde mensaje) */
  destination?: DestinationPoint;
  className?: string;
}

// Icono para el usuario asignado (persona en movimiento)
const createAssignedUserIcon = () => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="relative">
        <div class="absolute -top-1 -left-1 w-10 h-10 bg-primary/30 rounded-full animate-ping"></div>
        <div class="relative w-8 h-8 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="8" r="4"></circle>
            <path d="M6 20v-2a6 6 0 0 1 12 0v2"></path>
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Icono para el reporte (destino)
const createReportIcon = (priority: string) => {
  const colors: Record<string, string> = {
    urgente: '#ef4444',
    alto: '#f97316',
    medio: '#eab308',
    bajo: '#22c55e',
  };
  const color = colors[priority] || colors.medio;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="relative">
        <div class="w-10 h-10 rounded-full border-4 border-white shadow-lg flex items-center justify-center" style="background: ${color}">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45" style="background: ${color}"></div>
      </div>
    `,
    iconSize: [40, 48],
    iconAnchor: [20, 48],
  });
};

// Calcular distancia en metros
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

// Crear icono para la ubicación del usuario actual
const createUserLocationIcon = () => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="relative">
        <div class="absolute -top-1 -left-1 w-8 h-8 bg-blue-500/30 rounded-full animate-ping"></div>
        <div class="relative w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
          <div class="w-2 h-2 bg-white rounded-full"></div>
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export function GeoTrackingMap({ tracking, assignedUserLocation, destination, className }: GeoTrackingMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const reportMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const myLocationMarkerRef = useRef<L.Marker | null>(null);
  
  // Obtener ubicación del usuario actual (para navegación directa)
  const { location: myLocation } = useGlobalLocation();
  
  // Hook de presencia global (mismo que mensajes)
  const { isUserOnline } = useUserPresence();
  
  // Verificar si el usuario asignado está online usando el sistema de presencia global
  const isAssignedUserOnline = useMemo(() => {
    if (!tracking?.asignado_a) return false;
    return isUserOnline(tracking.asignado_a);
  }, [tracking?.asignado_a, isUserOnline]);

  // Modo de operación: tracking de usuario o navegación directa
  const isDirectNavigation = !tracking && !!destination;

  // Extraer ubicación del reporte (tracking mode) o destino (direct mode)
  const reportLocation = useMemo(() => {
    if (destination) {
      return { lat: destination.lat, lng: destination.lng };
    }
    const location = tracking?.reporte?.location as { lat?: number; lng?: number } | undefined;
    if (location?.lat && location?.lng) {
      return { lat: location.lat, lng: location.lng };
    }
    return null;
  }, [tracking?.reporte, destination]);

  // Calcular estadísticas para modo tracking
  const trackingStats = useMemo(() => {
    if (!assignedUserLocation || !reportLocation) return null;

    const distance = calculateDistance(
      assignedUserLocation.latitude,
      assignedUserLocation.longitude,
      reportLocation.lat,
      reportLocation.lng
    );

    // Estimar tiempo caminando (1.4 m/s promedio)
    const speed = assignedUserLocation.speed && assignedUserLocation.speed > 0.5 
      ? assignedUserLocation.speed 
      : 1.4;
    const estimatedMinutes = Math.round(distance / speed / 60);

    return {
      distance,
      distanceFormatted: formatDistance(distance),
      estimatedMinutes,
      heading: assignedUserLocation.heading,
      speed: assignedUserLocation.speed,
      accuracy: assignedUserLocation.accuracy,
      lastUpdate: assignedUserLocation.updated_at,
    };
  }, [assignedUserLocation, reportLocation]);
  
  // Calcular estadísticas para navegación directa
  const directStats = useMemo(() => {
    if (!isDirectNavigation || !myLocation || !reportLocation) return null;

    const distance = calculateDistance(
      myLocation.latitude,
      myLocation.longitude,
      reportLocation.lat,
      reportLocation.lng
    );

    const estimatedMinutes = Math.round(distance / 1.4 / 60); // 1.4 m/s caminando

    return {
      distance,
      distanceFormatted: formatDistance(distance),
      estimatedMinutes,
    };
  }, [isDirectNavigation, myLocation, reportLocation]);

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter = reportLocation 
      ? [reportLocation.lat, reportLocation.lng] as [number, number]
      : [-0.1807, -78.4678] as [number, number]; // Quito por defecto

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 16,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Actualizar marcador del reporte/destino
  useEffect(() => {
    if (!mapRef.current || !reportLocation) return;

    if (reportMarkerRef.current) {
      reportMarkerRef.current.remove();
    }

    const priority = isDirectNavigation ? 'alto' : ((tracking?.reporte?.priority as string) || 'medio');
    const reportName = isDirectNavigation ? (destination?.name || 'Destino') : (tracking?.reporte?.nombre || 'Reporte');
    const reportDesc = isDirectNavigation ? (destination?.address || '') : (tracking?.reporte?.descripcion || '');
    
    const marker = L.marker([reportLocation.lat, reportLocation.lng], {
      icon: createReportIcon(priority),
    }).addTo(mapRef.current);

    marker.bindPopup(`
      <div class="p-2">
        <strong>${reportName}</strong>
        <p class="text-xs text-muted-foreground mt-1">${reportDesc}</p>
      </div>
    `);

    reportMarkerRef.current = marker;
  }, [reportLocation, tracking?.reporte, destination, isDirectNavigation]);

  // Actualizar marcador del usuario asignado y línea de ruta
  useEffect(() => {
    if (!mapRef.current) return;

    // Remover marcador anterior
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    // Remover línea anterior
    if (routeLineRef.current) {
      routeLineRef.current.remove();
    }

    if (!assignedUserLocation) return;

    // Crear marcador del usuario
    const userMarker = L.marker(
      [assignedUserLocation.latitude, assignedUserLocation.longitude],
      { icon: createAssignedUserIcon() }
    ).addTo(mapRef.current);

    userMarker.bindPopup(`
      <div class="p-2">
        <strong>${tracking.asignado?.name || 'Usuario asignado'}</strong>
        <p class="text-xs mt-1">Última actualización: ${formatDistanceToNow(new Date(assignedUserLocation.updated_at), { addSuffix: true, locale: es })}</p>
      </div>
    `);

    userMarkerRef.current = userMarker;

    // Crear línea de ruta si hay destino
    if (reportLocation) {
      const routeLine = L.polyline(
        [
          [assignedUserLocation.latitude, assignedUserLocation.longitude],
          [reportLocation.lat, reportLocation.lng],
        ],
        {
          color: 'hsl(var(--primary))',
          weight: 3,
          opacity: 0.7,
          dashArray: '10, 10',
        }
      ).addTo(mapRef.current);

      routeLineRef.current = routeLine;

      // Ajustar vista para mostrar ambos puntos
      const bounds = L.latLngBounds([
        [assignedUserLocation.latitude, assignedUserLocation.longitude],
        [reportLocation.lat, reportLocation.lng],
      ]);
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
    } else {
      // Solo centrar en el usuario
      mapRef.current.setView(
        [assignedUserLocation.latitude, assignedUserLocation.longitude],
        16
      );
    }
  }, [assignedUserLocation, reportLocation, tracking?.asignado]);

  // Para navegación directa, mostrar ubicación del usuario
  useEffect(() => {
    if (!mapRef.current || !isDirectNavigation || !myLocation) return;

    if (myLocationMarkerRef.current) {
      myLocationMarkerRef.current.remove();
    }

    const marker = L.marker([myLocation.latitude, myLocation.longitude], {
      icon: createUserLocationIcon(),
    }).addTo(mapRef.current);

    marker.bindPopup('Tu ubicación');
    myLocationMarkerRef.current = marker;

    // Dibujar línea al destino
    if (routeLineRef.current) routeLineRef.current.remove();
    if (reportLocation) {
      const routeLine = L.polyline(
        [[myLocation.latitude, myLocation.longitude], [reportLocation.lat, reportLocation.lng]],
        { color: 'hsl(var(--primary))', weight: 3, opacity: 0.7, dashArray: '10, 10' }
      ).addTo(mapRef.current);
      routeLineRef.current = routeLine;

      const bounds = L.latLngBounds([
        [myLocation.latitude, myLocation.longitude],
        [reportLocation.lat, reportLocation.lng],
      ]);
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
    }
  }, [isDirectNavigation, myLocation, reportLocation]);

  // Modo navegación directa: panel simplificado
  if (isDirectNavigation) {
    return (
      <div className={cn('relative flex flex-col h-full', className)}>
        <div ref={mapContainerRef} className="flex-1 min-h-[300px] rounded-lg overflow-hidden" />
        <Card className="mt-4 bg-card/95 backdrop-blur-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Navigation className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Navegando al reporte</p>
                <p className="text-xs text-muted-foreground">{destination?.name}</p>
              </div>
            </div>
            {directStats && (
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <MapPin className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <p className="text-sm font-semibold">{directStats.distanceFormatted}</p>
                  <p className="text-xs text-muted-foreground">Distancia</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <Clock className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <p className="text-sm font-semibold">{directStats.estimatedMinutes < 1 ? '< 1' : directStats.estimatedMinutes} min</p>
                  <p className="text-xs text-muted-foreground">Est. llegada</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Modo tracking: panel completo
  return (
    <div className={cn('relative flex flex-col h-full', className)}>
      <div ref={mapContainerRef} className="flex-1 min-h-[300px] rounded-lg overflow-hidden" />
      <Card className="mt-4 bg-card/95 backdrop-blur-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarImage src={tracking?.asignado?.avatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {tracking?.asignado?.name?.charAt(0) || <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-foreground">{tracking?.asignado?.name || 'Usuario asignado'}</p>
              <p className="text-xs text-muted-foreground">Asignado a: {tracking?.reporte?.nombre || 'Reporte'}</p>
            </div>
            {isAssignedUserOnline ? (
              <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                <Activity className="h-3 w-3 mr-1 animate-pulse" />En línea
              </Badge>
            ) : (
              <Badge variant="secondary"><Activity className="h-3 w-3 mr-1" />Desconectado</Badge>
            )}
          </div>
          {trackingStats ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <MapPin className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-sm font-semibold">{trackingStats.distanceFormatted}</p>
                <p className="text-xs text-muted-foreground">Distancia</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <Clock className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-sm font-semibold">{trackingStats.estimatedMinutes < 1 ? '< 1' : trackingStats.estimatedMinutes} min</p>
                <p className="text-xs text-muted-foreground">Est. llegada</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <Navigation className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-sm font-semibold">{trackingStats.speed ? `${(trackingStats.speed * 3.6).toFixed(1)} km/h` : '-'}</p>
                <p className="text-xs text-muted-foreground">Velocidad</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">Esperando ubicación del usuario asignado...</div>
          )}
          {trackingStats?.lastUpdate && (
            <p className="text-xs text-center text-muted-foreground">
              Última actualización: {formatDistanceToNow(new Date(trackingStats.lastUpdate), { addSuffix: true, locale: es })}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
