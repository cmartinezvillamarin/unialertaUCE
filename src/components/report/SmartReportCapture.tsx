import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Camera, Loader2, MapPin, AlertTriangle, CheckCircle, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SimilarReportsFound } from './SimilarReportsFound';
import { useGlobalLocation } from '@/contexts/LocationContext';
import { useUserDataReady, useOptimizedProfile, useOptimizedCategories, useOptimizedTipoReportes } from '@/hooks/entidades';
import { useOptimizedReportes, ReporteInsert } from '@/hooks/entidades/useOptimizedReportes';
import { useCloudinaryUpload } from '@/hooks/controlador/useCloudinaryUpload';
import { useSimilarReports } from '@/hooks/controlador/useSimilarReports';
import { useOSMLocationData } from '@/hooks/controlador/useOSMLocationData';
import { useSmartReportAnalysis, findBestCategoryMatch, findBestTipoMatch, type AnalysisResult, type AnalyzeImageOptions } from '@/hooks/controlador/useSmartReportAnalysis';
import { useNearbyAssignableUsers } from '@/hooks/controlador/useNearbyAssignableUsers';
import { useAutoShareReport } from '@/hooks/controlador/useAutoShareReport';
import { useReportAssignmentNotification } from '@/hooks/controlador/useReportAssignmentNotification';
import { useActiveTracking } from '@/hooks/controlador/useActiveTracking';
import { animationClasses, transitionClasses } from '@/hooks/optimizacion';

interface SmartReportCaptureProps {
  onSuccess?: () => void;
  defaultBackRoute?: string;
}

type CaptureStep = 'camera' | 'analyzing' | 'review' | 'saving' | 'complete';

type PerImageAnalysis = {
  image: string;
  analysis: AnalysisResult;
  categoriaId: string;
  tipoReporteId: string;
};

type DraftAIState = {
  perImage: PerImageAnalysis[];
};

const PRIORITY_RANK: Record<AnalysisResult['prioridad'], number> = {
  bajo: 0,
  medio: 1,
  alto: 2,
  urgente: 3,
};

function normalizeText(s?: string) {
  return (s || '').trim();
}

function uniqueJoin(parts: string[], separator = '\n\n') {
  const out: string[] = [];
  for (const p of parts.map((x) => x.trim()).filter(Boolean)) {
    if (!out.some((o) => o.toLowerCase() === p.toLowerCase())) out.push(p);
  }
  return out.join(separator);
}

function mergeAnalyses(perImage: PerImageAnalysis[]) {
  const merged = {
    titulo: '',
    descripcion: '',
    prioridad: 'medio' as AnalysisResult['prioridad'],
    infoAdicional: '',
    categoriaId: '',
    tipoReporteId: '',
  };

  if (!perImage.length) return merged;

  // prioridad = la más alta
  merged.prioridad = perImage
    .map((p) => p.analysis.prioridad)
    .sort((a, b) => PRIORITY_RANK[b] - PRIORITY_RANK[a])[0];

  // título: usar el primero no vacío (o el más reciente si todos vacíos)
  merged.titulo =
    perImage.map((p) => normalizeText(p.analysis.titulo)).find(Boolean) ||
    normalizeText(perImage[perImage.length - 1].analysis.titulo) ||
    'Reporte';

  merged.descripcion = uniqueJoin(perImage.map((p) => normalizeText(p.analysis.descripcion)));
  merged.infoAdicional = uniqueJoin(perImage.map((p) => normalizeText(p.analysis.infoAdicional)));

  // categoría/tipo: tomar el primero válido
  merged.categoriaId = perImage.map((p) => p.categoriaId).find((x) => !!x) || '';
  merged.tipoReporteId = perImage.map((p) => p.tipoReporteId).find((x) => !!x) || '';

  return merged;
}

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  bajo: { label: 'Baja', color: 'bg-green-500' },
  medio: { label: 'Media', color: 'bg-yellow-500' },
  alto: { label: 'Alta', color: 'bg-orange-500' },
  urgente: { label: 'Urgente', color: 'bg-red-500' },
};

export function SmartReportCapture({ onSuccess, defaultBackRoute = '/mis-reportes' }: SmartReportCaptureProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  type SmartCaptureNavState = {
    mode?: 'append-images';
    returnTo?: string;
    backTo?: string;
    draft?: {
      nombre?: string;
      descripcion?: string;
      categoriaId?: string;
      tipoReporteId?: string;
      priority?: string;
      status?: string;
      visibility?: string;
      assignedTo?: string;
      activo?: boolean;
      imagenes?: string[];
      selectedLocation?: {
        latitude: number;
        longitude: number;
        address: string;
        osmPuntoReferencia?: string;
        osmEdificio?: string;
        osmPiso?: string;
        osmAulaSala?: string;
      };
      puntoReferencia?: string;
      edificio?: string;
      piso?: string;
      aulaSala?: string;
      infoAdicional?: string;
      fromSmartCapture?: boolean;
      lockLocation?: boolean;
    };
  };

  type ReportDraft = SmartCaptureNavState['draft'];

  const navState = (location.state || {}) as SmartCaptureNavState;
  const isAppendImagesMode = navState.mode === 'append-images' && !!navState.returnTo;
  const incomingAIState = (navState.draft as any)?.aiState as DraftAIState | undefined;

  // Hooks de datos
  const { profile } = useUserDataReady();
  const { data: profileData } = useOptimizedProfile();
  const { data: categories = [], isLoading: categoriesLoading } = useOptimizedCategories();
  const { data: tipoReportes = [], isLoading: tiposLoading } = useOptimizedTipoReportes();
  const { create } = useOptimizedReportes();
  const globalLocation = useGlobalLocation();
  const { uploadFromDataUrl, isUploading } = useCloudinaryUpload();
  const { fetchOSMLocationData } = useOSMLocationData();
  const { analyzeImage, isAnalyzing } = useSmartReportAnalysis();
  
  // CRÍTICO: Usar profileData.id como ID del reportante (más confiable que profile?.id)
  // Este ID se usa para EXCLUIR al usuario que reporta de la asignación
  const currentReporterId = profileData?.id || profile?.id;
  
  // Excluir al usuario actual de los usuarios asignables
  const { findNearbyUsers, selectBestUser, isLoading: isLoadingUsers } = useNearbyAssignableUsers({
    currentUserId: currentReporterId,
  });
  const { similarReports, fetchSimilarReports, confirmReport, clearReports } = useSimilarReports({ radioMetros: 100, horasAtras: 24 });
  const { autoShareReport, isAutoShareEnabled } = useAutoShareReport();
  const { notifyAssignment } = useReportAssignmentNotification();
  const { createTracking } = useActiveTracking();

  // Estado del componente
  const [step, setStep] = useState<CaptureStep>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [progress, setProgress] = useState(0);

  // Datos analizados
  const [analysisResult, setAnalysisResult] = useState<{
    titulo: string;
    descripcion: string;
    prioridad: 'bajo' | 'medio' | 'alto' | 'urgente';
    infoAdicional: string;
  } | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedTipoId, setSelectedTipoId] = useState<string>('');
  const [osmData, setOsmData] = useState<{
    puntoReferencia?: string;
    edificio?: string;
    piso?: string;
    aulaSala?: string;
  } | null>(null);
  const [assignedUserId, setAssignedUserId] = useState<string | null>(null);
  const [assignedUserName, setAssignedUserName] = useState<string | null>(null);

  // Similar reports
  const [showSimilarReports, setShowSimilarReports] = useState(false);

  // Filtrar categorías y tipos activos
  const activeCategories = useMemo(() => 
    categories.filter(cat => cat.activo && !cat.deleted_at), 
    [categories]
  );
  
  const filteredTipos = useMemo(() => 
    tipoReportes.filter(t => t.activo && !t.deleted_at && (!selectedCategoryId || t.category_id === selectedCategoryId)),
    [tipoReportes, selectedCategoryId]
  );

  // Si el usuario (o la IA) selecciona primero un tipo, derivar automáticamente su categoría.
  useEffect(() => {
    if (!selectedTipoId) return;
    const tipo = tipoReportes.find((t) => t.id === selectedTipoId);
    const tipoCategoryId = (tipo?.category_id || '').toString();
    if (tipoCategoryId && tipoCategoryId !== selectedCategoryId) {
      setSelectedCategoryId(tipoCategoryId);
    }
  }, [selectedTipoId, selectedCategoryId, tipoReportes]);

  // Si cambia la categoría y el tipo ya no pertenece, limpiar el tipo para evitar inconsistencias.
  useEffect(() => {
    if (!selectedTipoId || !selectedCategoryId) return;
    const tipo = tipoReportes.find((t) => t.id === selectedTipoId);
    if (tipo?.category_id && tipo.category_id !== selectedCategoryId) {
      setSelectedTipoId('');
    }
  }, [selectedCategoryId, selectedTipoId, tipoReportes]);

  // Verificar cámaras disponibles
  useEffect(() => {
    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      });
    }
  }, []);

  // Iniciar cámara automáticamente
  const startCamera = useCallback(async () => {
    try {
      setIsCameraReady(false);
      const constraints = {
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => setIsCameraReady(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('No se pudo acceder a la cámara. Por favor verifica los permisos.');
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsCameraReady(false);
    }
  }, []);

  // Iniciar cámara al montar
  useEffect(() => {
    if (step === 'camera') {
      startCamera();
    }
    return () => stopCamera();
  }, [step, startCamera, stopCamera]);

  // Cambiar cámara
  const switchCamera = useCallback(() => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, [stopCamera]);

  useEffect(() => {
    if (step === 'camera' && !isCameraReady) {
      startCamera();
    }
  }, [facingMode, step, isCameraReady, startCamera]);

  // Capturar foto
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(imageUrl);
      stopCamera();

      // Modo "agregar más imágenes": analizar la nueva imagen y volver al ReportForm
      if (isAppendImagesMode) {
        stopCamera();
        processAppendImage(imageUrl);
        return;
      }

      processCapture(imageUrl);
    }
  }, [stopCamera, isAppendImagesMode, navigate]);

  const buildContextString = useCallback((draft?: ReportDraft, aiState?: DraftAIState) => {
    const parts: string[] = [];
    if (draft?.nombre) parts.push(`Título: ${draft.nombre}`);
    if (draft?.descripcion) parts.push(`Descripción: ${draft.descripcion}`);
    if (draft?.categoriaId) parts.push(`CategoríaId: ${draft.categoriaId}`);
    if (draft?.tipoReporteId) parts.push(`TipoReporteId: ${draft.tipoReporteId}`);
    if (draft?.priority) parts.push(`Prioridad: ${draft.priority}`);
    if (draft?.status) parts.push(`Estado: ${draft.status}`);
    if (draft?.visibility) parts.push(`Visibilidad: ${draft.visibility}`);
    if (draft?.assignedTo) parts.push(`AsignadoA: ${draft.assignedTo}`);
    if (draft?.infoAdicional) parts.push(`InfoAdicional: ${draft.infoAdicional}`);
    if (draft?.selectedLocation) {
      parts.push(`Ubicación: ${draft.selectedLocation.latitude}, ${draft.selectedLocation.longitude}`);
      if (draft.selectedLocation.address) parts.push(`Dirección: ${draft.selectedLocation.address}`);
      if (draft.selectedLocation.osmEdificio) parts.push(`OSM Edificio: ${draft.selectedLocation.osmEdificio}`);
      if (draft.selectedLocation.osmPiso) parts.push(`OSM Piso: ${draft.selectedLocation.osmPiso}`);
      if (draft.selectedLocation.osmAulaSala) parts.push(`OSM Aula/Sala: ${draft.selectedLocation.osmAulaSala}`);
      if (draft.selectedLocation.osmPuntoReferencia) parts.push(`OSM PuntoReferencia: ${draft.selectedLocation.osmPuntoReferencia}`);
    }
    if (aiState?.perImage?.length) {
      parts.push(`Imágenes analizadas: ${aiState.perImage.length}`);
    }
    return parts.join('\n');
  }, []);

  const resolveCategoryTipoIds = useCallback((analysis: AnalysisResult) => {
    // Prefer IDs devueltos por la IA
    const categoriaIdFromAI = (analysis.categoriaId || '').trim();
    const tipoIdFromAI = (analysis.tipoReporteId || '').trim();
    if (categoriaIdFromAI || tipoIdFromAI) {
      const tipoRow = tipoIdFromAI ? tipoReportes.find((t) => t.id === tipoIdFromAI) : undefined;
      const inferredCategoryId = categoriaIdFromAI || (tipoRow?.category_id || '').toString();

      // Si el tipo devuelto no pertenece a la categoría (o no existe), escoger un tipo válido asociado.
      if (inferredCategoryId && tipoIdFromAI) {
        const belongs = !!tipoRow && (tipoRow.category_id || '').toString() === inferredCategoryId;
        if (!belongs) {
          const firstTipoForCategory = tipoReportes
            .filter((t) => t.activo && !t.deleted_at && (t.category_id || '').toString() === inferredCategoryId)
            .at(0);
          return {
            categoriaId: inferredCategoryId,
            tipoReporteId: firstTipoForCategory?.id || '',
          };
        }
      }

      // Si viene categoría pero no tipo, escoger un tipo válido asociado (primer tipo activo)
      if (inferredCategoryId && !tipoIdFromAI) {
        const firstTipoForCategory = tipoReportes
          .filter((t) => t.activo && !t.deleted_at && (t.category_id || '').toString() === inferredCategoryId)
          .at(0);

        return {
          categoriaId: inferredCategoryId,
          tipoReporteId: firstTipoForCategory?.id || '',
        };
      }

      return {
        categoriaId: inferredCategoryId,
        tipoReporteId: tipoIdFromAI,
      };
    }

    const bestCategory = findBestCategoryMatch(analysis.categoriaKeywords, activeCategories);
    const bestTipo = findBestTipoMatch(
      analysis.tipoKeywords,
      tipoReportes.filter((t) => t.activo && !t.deleted_at),
      bestCategory?.id
    );
    return {
      categoriaId: bestCategory?.id || '',
      tipoReporteId: bestTipo?.id || '',
    };
  }, [activeCategories, tipoReportes]);

  const getAddressForLocation = useCallback(async (lat: number, lon: number) => {
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=es`,
        { signal: AbortSignal.timeout(5000) }
      );
      const data = await resp.json();
      const display = typeof data?.display_name === 'string' ? data.display_name.trim() : '';
      return display || `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    }
  }, []);

  const processAppendImage = useCallback(async (imageUrl: string) => {
    const baseDraft = navState.draft || {};
    setStep('analyzing');
    setProgress(0);

    try {
      setProgress(30);

      const context = buildContextString(baseDraft, incomingAIState);
      const analysis = await analyzeImage(imageUrl, {
        context,
        categories: activeCategories.map(c => ({ id: c.id, nombre: c.nombre })),
        tipoReportes: tipoReportes
          .filter(t => t.activo && !t.deleted_at)
          .map(t => ({ id: t.id, nombre: t.nombre, category_id: t.category_id })),
      });
      if (!analysis) {
        toast.error('No se pudo analizar la imagen. Intenta de nuevo.');
        setStep('camera');
        return;
      }

      setProgress(70);

      const ids = resolveCategoryTipoIds(analysis);
      const perImage: PerImageAnalysis[] = [
        ...(incomingAIState?.perImage || []),
        { image: imageUrl, analysis, categoriaId: ids.categoriaId, tipoReporteId: ids.tipoReporteId },
      ];

      const merged = mergeAnalyses(perImage);

      // Mantener ubicación bloqueada. Solo poner coordenadas si Nominatim no devuelve dirección.
      const nextSelectedLocation = baseDraft.selectedLocation
        ? {
            ...baseDraft.selectedLocation,
            address:
              normalizeText(baseDraft.selectedLocation.address) ||
              `${baseDraft.selectedLocation.latitude.toFixed(6)}, ${baseDraft.selectedLocation.longitude.toFixed(6)}`,
          }
        : undefined;

      const nextImages = [...(baseDraft.imagenes || []), imageUrl];

      navigate(navState.returnTo!, {
        state: {
          backTo: navState.backTo,
          prefill: {
            ...baseDraft,
            nombre: merged.titulo || baseDraft.nombre,
            descripcion: merged.descripcion || baseDraft.descripcion,
            categoriaId: merged.categoriaId || baseDraft.categoriaId,
            tipoReporteId: merged.tipoReporteId || baseDraft.tipoReporteId,
            priority: merged.prioridad || baseDraft.priority,
            infoAdicional: merged.infoAdicional || baseDraft.infoAdicional,
            imagenes: nextImages,
            selectedLocation: nextSelectedLocation,
            fromSmartCapture: true,
            lockLocation: true,
            aiState: { perImage },
          } as any,
        },
      });
    } catch (e) {
      console.error('[SmartReportCapture] processAppendImage error:', e);
      toast.error('Error al analizar la imagen');
      setStep('camera');
    }
  }, [navState, incomingAIState, buildContextString, analyzeImage, activeCategories, tipoReportes, resolveCategoryTipoIds, navigate]);

  // Procesar captura con IA y geolocalización
  const processCapture = useCallback(async (imageBase64: string) => {
    setStep('analyzing');
    setProgress(0);

    try {
      // Paso 1: Obtener ubicación actual (10%)
      setProgress(10);
      const location = globalLocation.location;
      if (!location) {
        toast.error('No se pudo obtener la ubicación. Activa el GPS.');
        setStep('camera');
        return;
      }

       // Paso 2: Obtener datos OSM (30%)
      setProgress(30);
      const osmResult = await fetchOSMLocationData(location.latitude, location.longitude);
      console.log('[SmartReportCapture] OSM result:', osmResult);
      setOsmData(osmResult || null);

       // Paso 2.1: Obtener dirección (Nominatim) (40%)
       setProgress(40);
       const address = await getAddressForLocation(location.latitude, location.longitude);

       // Paso 3: Analizar imagen con IA (60%)
      setProgress(50);
      // Pasar categorías y tipos para que la IA tenga contexto completo
      const analyzeOptions: AnalyzeImageOptions = {
        categories: activeCategories.map(c => ({ id: c.id, nombre: c.nombre })),
        tipoReportes: tipoReportes
          .filter(t => t.activo && !t.deleted_at)
          .map(t => ({ id: t.id, nombre: t.nombre, category_id: t.category_id })),
      };
      const analysis = await analyzeImage(imageBase64, analyzeOptions);
      
      if (!analysis) {
        toast.error('No se pudo analizar la imagen. Intenta de nuevo.');
        setStep('camera');
        return;
      }

      setProgress(70);

       // Paso 4: Encontrar mejor categoría y tipo
       const ids = resolveCategoryTipoIds(analysis);
       console.log('[SmartReportCapture] Category/Type resolved:', ids);
       console.log('[SmartReportCapture] AI returned categoriaId:', analysis.categoriaId, 'tipoReporteId:', analysis.tipoReporteId);

       setSelectedCategoryId(ids.categoriaId);
       setSelectedTipoId(ids.tipoReporteId);

      setAnalysisResult({
        titulo: analysis.titulo,
        descripcion: analysis.descripcion,
        prioridad: analysis.prioridad,
        infoAdicional: analysis.infoAdicional,
      });

      // Paso 5: Buscar usuarios cercanos para asignación automática (80%)
      // CRÍTICO: Nunca asignar al usuario que crea el reporte
      setProgress(80);
      
      // Usar currentReporterId definido a nivel de componente (más confiable)
      const reporterId = currentReporterId;
      if (!reporterId) {
        console.error('[SmartReportCapture] ¡ERROR CRÍTICO! No se pudo obtener ID del reportante. No se asignará el reporte.');
        setAssignedUserId(null);
        setAssignedUserName(null);
      } else {
        console.log('[SmartReportCapture] ID del reportante (a excluir):', reporterId);
        
        const nearbyUsers = await findNearbyUsers(
          location.latitude, 
          location.longitude, 
          analysis.prioridad,
          reporterId // IMPORTANTE: Excluir al reportante
        );
        
        console.log('[SmartReportCapture] Usuarios cercanos encontrados:', nearbyUsers.length);
        nearbyUsers.forEach(u => console.log(`  - ${u.name} (${u.id}) - ${u.isOnline ? 'ONLINE' : 'offline'} - ${Math.round(u.distance)}m`));
        
        // Doble verificación: pasar reporterId a selectBestUser también
        const bestUser = selectBestUser(nearbyUsers, analysis.prioridad, reporterId);
        
        if (bestUser) {
          // Verificación TRIPLE: nunca asignar al mismo usuario que reporta
          if (bestUser.id === reporterId) {
            console.error('[SmartReportCapture] ¡ERROR CRÍTICO! Se intentó asignar al reportante. ID coincidente:', reporterId);
            console.error('[SmartReportCapture] Esto NO debería ocurrir. Cancelando asignación.');
            setAssignedUserId(null);
            setAssignedUserName(null);
          } else {
            setAssignedUserId(bestUser.id);
            setAssignedUserName(bestUser.name || bestUser.email);
            console.log('[SmartReportCapture] Usuario asignado correctamente:', {
              name: bestUser.name,
              id: bestUser.id,
              roles: bestUser.roles,
              isOnline: bestUser.isOnline,
              distance: `${Math.round(bestUser.distance)}m`
            });
          }
        } else {
          console.log('[SmartReportCapture] No se encontraron usuarios elegibles para asignar');
          setAssignedUserId(null);
          setAssignedUserName(null);
        }
      }

      // Paso 6: Verificar reportes similares (90%)
      setProgress(90);
       const similarFound = await fetchSimilarReports(
        location.latitude,
        location.longitude,
         ids.categoriaId || undefined,
         ids.tipoReporteId || undefined
      );

      setProgress(100);

      // Si es prioridad alta/urgente, guardar automáticamente
      if (analysis.prioridad === 'alto' || analysis.prioridad === 'urgente') {
        if (similarFound.length > 0) {
          setShowSimilarReports(true);
          setStep('review');
        } else {
           await saveReport(imageBase64, analysis, ids.categoriaId || undefined, ids.tipoReporteId || undefined, osmResult);
        }
      } else {
        // Para baja/media: continuar en el mismo formulario estándar (ReportForm) con prefill
        // para no duplicar lógica y respetar el flujo completo (incluyendo auto-compartido por settings).
        const loc = globalLocation.location;
        if (!loc) {
          toast.error('No se pudo obtener la ubicación. Activa el GPS.');
          setStep('camera');
          return;
        }

          // Guardar contexto IA por imagen para soportar análisis incremental al agregar/quitar
          const perImage: PerImageAnalysis[] = [{ image: imageBase64, analysis, categoriaId: ids.categoriaId, tipoReporteId: ids.tipoReporteId }];
          const merged = mergeAnalyses(perImage);

          navigate('/reportes/nuevo', {
          state: {
            backTo: defaultBackRoute,
            prefill: {
               fromSmartCapture: true,
               lockLocation: true,
               nombre: merged.titulo,
               descripcion: merged.descripcion,
               categoriaId: merged.categoriaId,
               tipoReporteId: merged.tipoReporteId,
               priority: merged.prioridad,
              status: 'pendiente',
              visibility: 'publico',
              assignedTo: assignedUserId || '',
              activo: true,
              imagenes: [imageBase64],
              selectedLocation: {
                latitude: loc.latitude,
                longitude: loc.longitude,
                  address,
                osmPuntoReferencia: osmResult?.puntoReferencia,
                osmEdificio: osmResult?.edificio,
                osmPiso: osmResult?.piso,
                osmAulaSala: osmResult?.aulaSala,
              },
              puntoReferencia: osmResult?.puntoReferencia || '',
              edificio: osmResult?.edificio || '',
              piso: osmResult?.piso || '',
              aulaSala: osmResult?.aulaSala || '',
               infoAdicional: merged.infoAdicional || '',
               aiState: { perImage },
            },
          },
        });
      }
    } catch (error) {
      console.error('Error processing capture:', error);
      toast.error('Error al procesar la captura');
      setStep('camera');
    }
  }, [globalLocation.location, fetchOSMLocationData, analyzeImage, activeCategories, tipoReportes, findNearbyUsers, selectBestUser, fetchSimilarReports, navigate, defaultBackRoute, assignedUserId, resolveCategoryTipoIds, getAddressForLocation, currentReporterId]);

  // Guardar reporte
  const saveReport = useCallback(async (
    imageBase64: string,
    analysis: { titulo: string; descripcion: string; prioridad: 'bajo' | 'medio' | 'alto' | 'urgente'; infoAdicional: string },
    categoryId?: string,
    tipoId?: string,
    osmResult?: { puntoReferencia?: string; edificio?: string; piso?: string; aulaSala?: string } | null
  ) => {
    if (!profileData?.id || !globalLocation.location) {
      toast.error('Datos de usuario o ubicación no disponibles');
      return;
    }

    setStep('saving');

    try {
      // Subir imagen a Cloudinary
      const uploadResult = await uploadFromDataUrl(imageBase64, {
        folder: 'reportes',
        tags: ['reporte', 'smart-capture'],
      });

      const locationData = {
        lat: globalLocation.location.latitude,
        lng: globalLocation.location.longitude,
        address: '',
        puntoReferencia: osmResult?.puntoReferencia || '',
        edificio: osmResult?.edificio || '',
        piso: osmResult?.piso || '',
        aulaSala: osmResult?.aulaSala || '',
        infoAdicional: analysis.infoAdicional,
      };

      // VALIDACIÓN CRÍTICA: Nunca asignar al reportante
      const safeAssignedUserId = (assignedUserId && assignedUserId !== profileData.id) 
        ? assignedUserId 
        : null;
      
      if (assignedUserId && assignedUserId === profileData.id) {
        console.error('[SmartReportCapture] Bloqueando auto-asignación en saveReport');
      }

      // LÓGICA DE ESTADO: si hay usuario asignado → 'en_progreso', si no → 'pendiente'
      const derivedStatus = safeAssignedUserId ? 'en_progreso' : 'pendiente';

      const reporteData: ReporteInsert = {
        nombre: analysisResult?.titulo || analysis.titulo,
        descripcion: analysisResult?.descripcion || analysis.descripcion,
        categoria_id: selectedCategoryId || categoryId || null,
        tipo_reporte_id: selectedTipoId || tipoId || null,
        priority: analysisResult?.prioridad || analysis.prioridad,
        status: derivedStatus,
        visibility: 'publico',
        assigned_to: safeAssignedUserId, // Usar el valor validado
        activo: true,
        imagenes: [uploadResult.secure_url],
        location: locationData,
        user_id: profileData.id,
      };

      const createdReporte = await create(reporteData);

      // Enviar notificación PWA + in-app + mensaje automático si se asignó a alguien
      if (createdReporte && safeAssignedUserId) {
        // Obtener nombres de categoría y tipo para el mensaje
        const categoryName = categories?.find(c => c.id === (selectedCategoryId || categoryId))?.nombre || null;
        const typeName = tipoReportes?.find(t => t.id === (selectedTipoId || tipoId))?.nombre || null;
        
        await notifyAssignment({
          reportId: createdReporte.id,
          reportName: analysisResult?.titulo || analysis.titulo,
          assignedToUserId: safeAssignedUserId,
          assignedByUserId: profileData.id, // Necesario para crear mensaje automático
          assignedByName: profileData.name || 'Sistema',
          reportDetails: {
            id: createdReporte.id,
            nombre: (analysisResult?.titulo || analysis.titulo).trim(),
            descripcion: (analysisResult?.descripcion || analysis.descripcion)?.trim() || null,
            estado: derivedStatus,
            priority: analysisResult?.prioridad || analysis.prioridad,
            direccion: locationData?.address || null,
            latitud: locationData?.lat || null,
            longitud: locationData?.lng || null,
            imagenes: [uploadResult.secure_url],
            categoria_nombre: categoryName,
            tipo_nombre: typeName,
            created_at: createdReporte.created_at,
          },
        });
      }

      // Crear tracking para prioridad alta o urgente con asignación
      const finalPriority = analysisResult?.prioridad || analysis.prioridad;
      const shouldTrack = (finalPriority === 'alto' || finalPriority === 'urgente') && 
                          safeAssignedUserId &&
                          createdReporte;
      
      let trackingId: string | null = null;
      if (shouldTrack && createdReporte) {
        try {
          const tracking = await createTracking({
            reporteId: createdReporte.id,
            asignadoA: safeAssignedUserId,
            creadorId: profileData.id,
          });
          trackingId = tracking?.id || null;
        } catch (trackingError) {
          console.error('[SmartReportCapture] Error al crear tracking:', trackingError);
        }
      }

      // Respetar configuraciones del usuario para auto-compartir (mismo hook que ReportForm)
      if (createdReporte && isAutoShareEnabled()) {
        try {
          await autoShareReport(createdReporte);
        } catch (shareError) {
          console.error('[SmartReportCapture] Error al auto-compartir reporte:', shareError);
        }
      }
      
      setStep('complete');
      toast.success('¡Reporte creado exitosamente!', {
        description: assignedUserId 
          ? `Asignado automáticamente a ${assignedUserName}` 
          : undefined,
      });

      // Si hay tracking, redirigir al mapa de seguimiento
      setTimeout(() => {
        onSuccess?.();
        if (trackingId) {
          navigate('/geotracking', { state: { trackingId } });
        } else {
          navigate(defaultBackRoute);
        }
      }, 2000);
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('Error al guardar el reporte');
      setStep('review');
    }
  }, [profileData, globalLocation.location, uploadFromDataUrl, create, navigate, defaultBackRoute, onSuccess, analysisResult, selectedCategoryId, selectedTipoId, assignedUserId, assignedUserName, autoShareReport, isAutoShareEnabled, notifyAssignment]);

  // Manejar confirmación de reporte similar
  const handleConfirmSimilarReport = async (reportId: string) => {
    if (!profileData?.id) return;
    
    const success = await confirmReport(reportId, profileData.id);
    if (success) {
      toast.success('¡Gracias por confirmar el reporte!');
      navigate(defaultBackRoute);
    }
  };

  // Continuar creando después de ver similares
  const handleContinueCreating = async () => {
    clearReports();
    setShowSimilarReports(false);
    
    if (capturedImage && analysisResult && osmData) {
      await saveReport(capturedImage, analysisResult, selectedCategoryId, selectedTipoId, osmData);
    }
  };

  // Reiniciar captura
  const handleRetake = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setOsmData(null);
    setAssignedUserId(null);
    setAssignedUserName(null);
    setSelectedCategoryId('');
    setSelectedTipoId('');
    setShowSimilarReports(false);
    clearReports();
    setStep('camera');
  };

  // Cancelar y volver
  const handleCancel = () => {
    stopCamera();

    // En modo append-images, cancelar debe volver al ReportForm sin perder borrador
    if (isAppendImagesMode && navState.returnTo) {
      navigate(navState.returnTo, {
        state: {
          backTo: navState.backTo,
          prefill: navState.draft,
        },
      });
      return;
    }

    navigate(defaultBackRoute);
  };

  // Guardar desde revisión
  const handleSaveFromReview = async () => {
    if (!capturedImage || !analysisResult) return;
    await saveReport(capturedImage, analysisResult, selectedCategoryId, selectedTipoId, osmData);
  };

  // Renderizar paso de cámara
  if (step === 'camera') {
    return (
      <div className={cn("fixed inset-0 bg-black z-50 flex flex-col", animationClasses.fadeIn)}>
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={handleCancel} className="text-white">
              <X className="h-6 w-6" />
            </Button>
            <span className="text-white font-medium">Captura Inteligente</span>
            {hasMultipleCameras && (
              <Button variant="ghost" size="icon" onClick={switchCamera} className="text-white">
                <RefreshCw className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Video */}
        <div className="flex-1 relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              "w-full h-full object-cover",
              !isCameraReady && "opacity-0"
            )}
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {!isCameraReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-12 w-12 text-white animate-spin" />
            </div>
          )}

          {/* Location indicator */}
          {globalLocation.location && (
            <div className="absolute top-20 left-4 right-4">
              <Badge variant="secondary" className="bg-black/50 text-white border-0">
                <MapPin className="h-3 w-3 mr-1" />
                GPS Activo
              </Badge>
            </div>
          )}
        </div>

        {/* Capture button */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
          {/* Indicador de carga de datos */}
          {(categoriesLoading || tiposLoading) && (
            <div className="flex items-center justify-center gap-2 text-white/80 mb-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Cargando categorías...</span>
            </div>
          )}
          {!categoriesLoading && !tiposLoading && activeCategories.length === 0 && (
            <div className="flex items-center justify-center gap-2 text-yellow-400 mb-3">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">No hay categorías disponibles</span>
            </div>
          )}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={capturePhoto}
              disabled={!isCameraReady || categoriesLoading || tiposLoading || activeCategories.length === 0}
              className="h-16 w-16 rounded-full bg-white hover:bg-gray-100 disabled:opacity-50"
            >
              <Camera className="h-8 w-8 text-black" />
            </Button>
          </div>
          <p className="text-center text-white/70 text-sm mt-3">
            {activeCategories.length > 0 
              ? 'Captura la imagen del incidente'
              : 'Espera a que se carguen las categorías'}
          </p>
        </div>
      </div>
    );
  }

  // Renderizar paso de análisis
  if (step === 'analyzing') {
    return (
      <div className={cn("fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-6", animationClasses.fadeIn)}>
        <div className="w-full max-w-md space-y-6">
          {capturedImage && (
            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
              <img src={capturedImage} alt="Captura" className="w-full h-full object-cover" />
            </div>
          )}
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm font-medium">Analizando imagen...</span>
            </div>
            
            <Progress value={progress} className="h-2" />
            
            <div className="space-y-2 text-sm text-muted-foreground">
              {progress >= 10 && <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Ubicación obtenida</p>}
              {progress >= 30 && <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Área detectada</p>}
              {progress >= 60 && <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Imagen analizada</p>}
              {progress >= 80 && <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Asignación verificada</p>}
              {progress >= 100 && <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Proceso completado</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar paso de revisión
  if (step === 'review' && analysisResult) {
    return (
      <div className={cn("fixed inset-0 bg-background z-50 overflow-y-auto", animationClasses.fadeIn)}>
        <div className="p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <X className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold">Revisar Reporte</h1>
            <Button variant="ghost" size="icon" onClick={handleRetake}>
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>

          {/* Similar reports dialog */}
          <SimilarReportsFound
            reports={similarReports}
            open={showSimilarReports}
            onOpenChange={setShowSimilarReports}
            onConfirm={handleConfirmSimilarReport}
            onContinue={handleContinueCreating}
            isConfirming={false}
          />

          {/* Image preview */}
          {capturedImage && (
            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
              <img src={capturedImage} alt="Captura" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Priority badge */}
          <div className="flex items-center gap-2">
            <Badge className={cn("text-white", PRIORITY_LABELS[analysisResult.prioridad].color)}>
              {PRIORITY_LABELS[analysisResult.prioridad].label}
            </Badge>
            {assignedUserName && (
              <Badge variant="outline">
                Asignado a: {assignedUserName}
              </Badge>
            )}
          </div>

          {/* Editable fields */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Información del Reporte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={analysisResult.titulo}
                  onChange={(e) => setAnalysisResult(prev => prev ? { ...prev, titulo: e.target.value } : null)}
                />
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={analysisResult.descripcion}
                  onChange={(e) => setAnalysisResult(prev => prev ? { ...prev, descripcion: e.target.value } : null)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeCategories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={selectedTipoId} onValueChange={setSelectedTipoId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTipos.map(tipo => (
                        <SelectItem key={tipo.id} value={tipo.id}>{tipo.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select 
                  value={analysisResult.prioridad} 
                  onValueChange={(v) => setAnalysisResult(prev => prev ? { ...prev, prioridad: v as 'bajo' | 'medio' | 'alto' | 'urgente' } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bajo">Baja</SelectItem>
                    <SelectItem value="medio">Media</SelectItem>
                    <SelectItem value="alto">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Location info */}
          {osmData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Ubicación Detectada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {osmData.edificio && <p><span className="text-muted-foreground">Edificio:</span> {osmData.edificio}</p>}
                {osmData.piso && <p><span className="text-muted-foreground">Referencia:</span> {osmData.piso}</p>}
                {osmData.puntoReferencia && <p><span className="text-muted-foreground">Punto de referencia:</span> {osmData.puntoReferencia}</p>}
                {osmData.aulaSala && <p><span className="text-muted-foreground">Área:</span> {osmData.aulaSala}</p>}
              </CardContent>
            </Card>
          )}

          {/* Additional info */}
          {analysisResult.infoAdicional && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{analysisResult.infoAdicional}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
            <div className="max-w-2xl mx-auto flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleRetake}>
                Volver a capturar
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleSaveFromReview}
                disabled={isUploading}
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Guardar Reporte
              </Button>
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // Renderizar paso de guardando
  if (step === 'saving') {
    return (
      <div className={cn("fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-6", animationClasses.fadeIn)}>
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Guardando reporte...</p>
      </div>
    );
  }

  // Renderizar paso completado
  if (step === 'complete') {
    return (
      <div className={cn("fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-6", animationClasses.fadeIn)}>
        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
        <p className="text-xl font-medium mb-2">¡Reporte Creado!</p>
        {assignedUserName && (
          <p className="text-muted-foreground">Asignado a {assignedUserName}</p>
        )}
      </div>
    );
  }

  return null;
}
