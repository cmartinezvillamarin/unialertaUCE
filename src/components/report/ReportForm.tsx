import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Camera, FileText, MapPin, Navigation, X, Loader2 } from 'lucide-react';
import { useCloudinaryUpload } from '@/hooks/controlador/useCloudinaryUpload';
import { useSimilarReports } from '@/hooks/controlador/useSimilarReports';
import { useOSMLocationData } from '@/hooks/controlador/useOSMLocationData';
import { useAutoShareReport } from '@/hooks/controlador/useAutoShareReport';
import { toast } from 'sonner';
import { FormHeader } from '@/components/ui/form-header';
import { FormFooter } from '@/components/ui/form-footer';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CameraCapture } from '@/components/ui/camera-capture';
import { ReportFormMap } from '@/components/Map';
import { SimilarReportsFound } from './SimilarReportsFound';
import { useFormNavigation } from '@/hooks/controlador/useFormNavigation';
import { useReportAssignmentNotification } from '@/hooks/controlador/useReportAssignmentNotification';
import {
  useOptimizedReportes,
  ReporteInsert,
  ReporteWithDistance,
} from '@/hooks/entidades/useOptimizedReportes';
import {
  useOptimizedProfile,
  useOptimizedCategories,
  useOptimizedTipoReportes,
  useOptimizedUsers,
  useUserDataReady,
  useOptimizedUserRolesList,
} from '@/hooks/entidades';
import { useGlobalLocation } from '@/contexts/LocationContext';
import { animationClasses } from '@/hooks/optimizacion';
import { cn } from '@/lib/utils';
import { hasRole } from '@/hooks/entidades/useOptimizedUserRoles';
import type { Database } from '@/integrations/supabase/types';
import { ReporteEvidencia } from '@/components/ui/ReporteEvidencia';

type UserRole = Database['public']['Enums']['user_role'];

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  reference?: string;
  // Datos OSM automáticos
  osmEdificio?: string;
  osmPiso?: string;
  osmAulaSala?: string;
  osmPuntoReferencia?: string;
}

interface ReportFormProps {
  /** Reporte a editar (si es null, es modo crear) */
  reporte?: ReporteWithDistance | null;
  /** Callback al guardar exitosamente */
  onSuccess?: () => void;
  /** Ruta por defecto para volver */
  defaultBackRoute?: string;
  /** Valores iniciales (p.ej. desde SmartReportCapture) */
  initialDraft?: Partial<{
    nombre: string;
    descripcion: string;
    categoriaId: string;
    tipoReporteId: string;
    priority: string;
    status: string;
    visibility: string;
    assignedTo: string;
    activo: boolean;
    imagenes: string[];
    selectedLocation: LocationData;
    puntoReferencia: string;
    edificio: string;
    piso: string;
    aulaSala: string;
    infoAdicional: string;
    /** Indica que el borrador proviene de SmartReportCapture */
    fromSmartCapture: boolean;
    /** Bloquea edición de ubicación (mapa/botón mi ubicación) */
    lockLocation: boolean;
  }>;
}

const PRIORITY_OPTIONS = [
  { value: 'bajo', label: 'Baja' },
  { value: 'medio', label: 'Media' },
  { value: 'alto', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
];

const STATUS_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_progreso', label: 'En Progreso' },
  { value: 'resuelto', label: 'Resuelto' },
  { value: 'rechazado', label: 'Rechazado' },
  { value: 'cancelado', label: 'Cancelado' },
];

const VISIBILITY_OPTIONS = [
  { value: 'publico', label: 'Público' },
  { value: 'privado', label: 'Privado' },
];

// Roles que pueden ver Estado y Configuración
const ADMIN_ROLES: UserRole[] = ['super_admin', 'administrador', 'mantenimiento', 'operador_analista', 'seguridad_uce'];

export function ReportForm({ reporte, onSuccess, defaultBackRoute = '/mis-reportes', initialDraft }: ReportFormProps) {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { create, update } = useOptimizedReportes();
  const { data: profile } = useOptimizedProfile();
  const { data: categories = [], isLoading: categoriesLoading } = useOptimizedCategories();
  const { data: tipoReportes = [], isLoading: tipoReportesLoading } = useOptimizedTipoReportes();
  const { data: users = [] } = useOptimizedUsers();
  const { data: allUserRoles = [] } = useOptimizedUserRolesList();
  const globalLocation = useGlobalLocation();
  const { notifyAssignment, endReportTracking } = useReportAssignmentNotification();
  
  // Hook para obtener datos de ubicación OSM
  const { fetchOSMLocationData } = useOSMLocationData();
  const isEditing = !!reporte;
  const isFromSmartCapture = !!initialDraft?.fromSmartCapture && !isEditing;
  const lockLocation = !!initialDraft?.lockLocation && !isEditing;

  // Obtener roles del usuario desde el caché de React Query
  const { userRoles } = useUserDataReady();

  // Verificar si el usuario puede ver Estado y Configuración
  const canViewConfigSection = useMemo(() => {
    if (!userRoles) return false;
    return ADMIN_ROLES.some(role => hasRole(userRoles, role));
  }, [userRoles]);

  // Estado del formulario - Información del Reporte
  const [nombre, setNombre] = useState(reporte?.nombre || '');
  const [descripcion, setDescripcion] = useState(reporte?.descripcion || '');
  const [categoriaId, setCategoriaId] = useState(reporte?.categoria_id || '');
  const [tipoReporteId, setTipoReporteId] = useState(reporte?.tipo_reporte_id || '');

  // Estado y Configuración
  const [priority, setPriority] = useState<string>(reporte?.priority || 'medio');
  const [status, setStatus] = useState<string>(reporte?.status || 'pendiente');
  const [visibility, setVisibility] = useState<string>(reporte?.visibility || 'publico');
  const [assignedTo, setAssignedTo] = useState(reporte?.assigned_to || '');
  const [activo, setActivo] = useState(reporte?.activo ?? true);

  // Imágenes
  const [imagenes, setImagenes] = useState<string[]>(reporte?.imagenes || []);

  // Ubicación
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [puntoReferencia, setPuntoReferencia] = useState('');
  const [edificio, setEdificio] = useState('');
  const [piso, setPiso] = useState('');
  const [aulaSala, setAulaSala] = useState('');
  const [infoAdicional, setInfoAdicional] = useState('');

  // Aplicar prefill (solo en modo crear y solo una vez)
  const didApplyDraftRef = useRef(false);
  useEffect(() => {
    if (isEditing) return;
    if (!initialDraft) return;
    if (didApplyDraftRef.current) return;

    didApplyDraftRef.current = true;

    if (typeof initialDraft.nombre === 'string') setNombre(initialDraft.nombre);
    if (typeof initialDraft.descripcion === 'string') setDescripcion(initialDraft.descripcion);
    if (typeof initialDraft.categoriaId === 'string') setCategoriaId(initialDraft.categoriaId);
    if (typeof initialDraft.tipoReporteId === 'string') setTipoReporteId(initialDraft.tipoReporteId);

    if (typeof initialDraft.priority === 'string') setPriority(initialDraft.priority);
    if (typeof initialDraft.status === 'string') setStatus(initialDraft.status);
    if (typeof initialDraft.visibility === 'string') setVisibility(initialDraft.visibility);
    if (typeof initialDraft.assignedTo === 'string') setAssignedTo(initialDraft.assignedTo);
    if (typeof initialDraft.activo === 'boolean') setActivo(initialDraft.activo);

    if (Array.isArray(initialDraft.imagenes)) setImagenes(initialDraft.imagenes);

    if (initialDraft.selectedLocation) {
      setSelectedLocation(initialDraft.selectedLocation);
    }

    if (typeof initialDraft.puntoReferencia === 'string') setPuntoReferencia(initialDraft.puntoReferencia);
    if (typeof initialDraft.edificio === 'string') setEdificio(initialDraft.edificio);
    if (typeof initialDraft.piso === 'string') setPiso(initialDraft.piso);
    if (typeof initialDraft.aulaSala === 'string') setAulaSala(initialDraft.aulaSala);
    if (typeof initialDraft.infoAdicional === 'string') setInfoAdicional(initialDraft.infoAdicional);
  }, [isEditing, initialDraft]);

  // Referencia para rastrear la última ubicación conocida
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  // Efecto unificado para manejar cambios de ubicación y datos OSM
  // Los campos se limpian automáticamente cuando la ubicación cambia (osmX viene undefined)
  // y se actualizan solo cuando hay datos válidos del OSM
  useEffect(() => {
    if (!selectedLocation || isEditing) return;
    
    const currentLocation = { lat: selectedLocation.latitude, lng: selectedLocation.longitude };
    const locationChanged = lastLocationRef.current && 
      (lastLocationRef.current.lat !== currentLocation.lat || 
       lastLocationRef.current.lng !== currentLocation.lng);
    
    // Actualizar referencia de ubicación
    lastLocationRef.current = currentLocation;
    
    // Manejar los campos OSM:
    // - Si osmX es undefined (ubicación recién cambiada), limpiar el campo
    // - Si osmX tiene valor válido (datos de OSM recibidos), actualizar el campo
    // - Si osmX es string vacío, mantener en blanco
    
    // Punto de Referencia
    if (selectedLocation.osmPuntoReferencia === undefined && locationChanged) {
      setPuntoReferencia('');
    } else if (selectedLocation.osmPuntoReferencia) {
      setPuntoReferencia(selectedLocation.osmPuntoReferencia);
    }
    
    // Edificio
    if (selectedLocation.osmEdificio === undefined && locationChanged) {
      setEdificio('');
    } else if (selectedLocation.osmEdificio) {
      setEdificio(selectedLocation.osmEdificio);
    }
    
    // Piso
    if (selectedLocation.osmPiso === undefined && locationChanged) {
      setPiso('');
    } else if (selectedLocation.osmPiso) {
      setPiso(selectedLocation.osmPiso);
    }
    
    // Aula/Sala
    if (selectedLocation.osmAulaSala === undefined && locationChanged) {
      setAulaSala('');
    } else if (selectedLocation.osmAulaSala) {
      setAulaSala(selectedLocation.osmAulaSala);
    }
  }, [
    selectedLocation?.latitude, 
    selectedLocation?.longitude, 
    selectedLocation?.osmEdificio, 
    selectedLocation?.osmPiso, 
    selectedLocation?.osmAulaSala, 
    selectedLocation?.osmPuntoReferencia, 
    isEditing
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  
  // Estado para reportes similares
  const [showSimilarReports, setShowSimilarReports] = useState(false);
  const [similarChecked, setSimilarChecked] = useState(false);
  const [isConfirmingReport, setIsConfirmingReport] = useState(false);

  // Cloudinary upload hook
  const { uploadFromDataUrl, isUploading } = useCloudinaryUpload();
  
  // Similar reports hook
  const { 
    similarReports, 
    isLoading: isLoadingSimilar, 
    fetchSimilarReports, 
    confirmReport,
    clearReports 
  } = useSimilarReports({ radioMetros: 100, horasAtras: 24 });

  // Hook para auto-compartir reportes según settings del usuario (usa caché)
  const { autoShareReport, isAutoShareEnabled } = useAutoShareReport();

  // Navegación del formulario
  const { goBack, handleCancel } = useFormNavigation({
    defaultBackRoute,
  });

  // Inicializar ubicación desde reporte existente
  useEffect(() => {
    if (reporte?.location) {
      const loc = reporte.location as { lat?: number; lng?: number; address?: string; puntoReferencia?: string; edificio?: string; piso?: string; aulaSala?: string; infoAdicional?: string };
      if (loc.lat && loc.lng) {
        setSelectedLocation({
          latitude: loc.lat,
          longitude: loc.lng,
          address: loc.address || '',
        });
        setPuntoReferencia(loc.puntoReferencia || '');
        setEdificio(loc.edificio || '');
        setPiso(loc.piso || '');
        setAulaSala(loc.aulaSala || '');
        setInfoAdicional(loc.infoAdicional || '');
      }
    }
  }, [reporte]);

  // Filtrar categorías y tipos activos
  const activeCategories = categories.filter((cat) => cat.activo && !cat.deleted_at);
  const activeTipoReportes = tipoReportes.filter((tipo) => {
    if (!tipo.activo || tipo.deleted_at) return false;
    if (categoriaId && tipo.category_id !== categoriaId) return false;
    return true;
  });

  // Si llega un tipo preseleccionado (p.ej. desde SmartReportCapture) pero la categoría no,
  // inferir la categoría automáticamente desde el tipo.
  useEffect(() => {
    if (!tipoReporteId) return;
    const tipo = tipoReportes.find((t) => t.id === tipoReporteId);
    const inferredCategoryId = (tipo?.category_id || '').toString();
    if (inferredCategoryId && inferredCategoryId !== categoriaId) {
      setCategoriaId(inferredCategoryId);
    }
  }, [tipoReporteId, categoriaId, tipoReportes]);

  // Si cambia la categoría y el tipo ya no pertenece, limpiar el tipo para evitar inconsistencias.
  useEffect(() => {
    if (!tipoReporteId || !categoriaId) return;
    const tipo = tipoReportes.find((t) => t.id === tipoReporteId);
    if (tipo?.category_id && tipo.category_id !== categoriaId) {
      setTipoReporteId('');
    }
  }, [categoriaId, tipoReporteId, tipoReportes]);

  // Usuarios activos con permiso "editar_reporte" y email confirmado para asignar
  const activeUsers = useMemo(() => {
    return users.filter((user) => {
      // Debe estar activo, no eliminado y con email confirmado
      if (user.deleted_at || user.estado !== 'activo') return false;
      if (!user.confirmed) return false; // Debe tener el email confirmado
      
      // Buscar los roles/permisos del usuario
      const userRole = allUserRoles.find((role) => role.user_id === user.id);
      if (!userRole?.permisos) return false;
      
      // Debe tener el permiso "editar_reporte"
      return userRole.permisos.includes('editar_reporte');
    });
  }, [users, allUserRoles]);

  // Validación
  const isValid = nombre.trim().length >= 2 && selectedLocation !== null;

  // Manejar captura de imagen
  const handleImageCapture = (imageUrl: string) => {
    setImagenes((prev) => [...prev, imageUrl]);
  };

  // En flujo SmartReportCapture: volver a la cámara inteligente para agregar más imágenes
  const handleOpenSmartCaptureToAppendImages = () => {
    navigate('/crear-reporte', {
      state: {
        mode: 'append-images',
        returnTo: routerLocation.pathname,
        backTo: defaultBackRoute,
        draft: {
          nombre,
          descripcion,
          categoriaId,
          tipoReporteId,
          priority,
          status,
          visibility,
          assignedTo,
          activo,
          imagenes,
          selectedLocation: selectedLocation || undefined,
          puntoReferencia,
          edificio,
          piso,
          aulaSala,
          infoAdicional,
          fromSmartCapture: true,
          lockLocation: true,
        },
      },
    });
  };

  const handleRemoveImage = useCallback(async (index: number) => {
    setImagenes((prev) => prev.filter((_, i) => i !== index));

    if (!isFromSmartCapture) return;

    // Recalcular el contexto IA quitando la imagen eliminada para evitar sobrecargar el análisis
    const aiState = (initialDraft as any)?.aiState as { perImage?: Array<{ image: string; analysis: any; categoriaId: string; tipoReporteId: string }> } | undefined;
    const perImage = (aiState?.perImage || []).filter((_, i) => i !== index);

    if (!perImage.length) {
      // Si ya no quedan imágenes analizadas, limpiar selección sugerida
      setCategoriaId('');
      setTipoReporteId('');
      return;
    }

    // Usar el primer análisis restante como base (simple y rápido)
    const mergedTitle = perImage.find((p) => (p.analysis?.titulo || '').trim())?.analysis?.titulo || '';
    const mergedDesc = perImage.map((p) => (p.analysis?.descripcion || '').trim()).filter(Boolean).join('\n\n');
    const mergedInfo = perImage.map((p) => (p.analysis?.infoAdicional || '').trim()).filter(Boolean).join('\n\n');

    setNombre((prev) => prev || mergedTitle);
    setDescripcion((prev) => prev || mergedDesc);
    if (mergedInfo) setInfoAdicional(mergedInfo);
    const cat = perImage.find((p) => p.categoriaId)?.categoriaId || '';
    const tipo = perImage.find((p) => p.tipoReporteId)?.tipoReporteId || '';
    if (cat) setCategoriaId(cat);
    if (tipo) setTipoReporteId(tipo);
  }, [isFromSmartCapture, initialDraft]);

  // Usar ubicación actual
  const handleUseMyLocation = async () => {
    if (lockLocation) return;
    if (globalLocation.location) {
      const { latitude, longitude } = globalLocation.location;
      
      // Mostrar ubicación inmediatamente con coordenadas como placeholder
      setSelectedLocation({
        latitude,
        longitude,
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        // Campos OSM undefined para indicar que aún no hay datos
        osmEdificio: undefined,
        osmPiso: undefined,
        osmAulaSala: undefined,
        osmPuntoReferencia: undefined,
      });
      
      // Obtener datos de Nominatim y OSM en paralelo
      const nominatimPromise = fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=es`,
        { signal: AbortSignal.timeout(5000) }
      )
        .then(response => response.json())
        .catch(() => null);
      
      const osmPromise = fetchOSMLocationData(latitude, longitude).catch(() => ({}));
      
      // Actualizar con los datos que lleguen
      Promise.all([nominatimPromise, osmPromise]).then(([nominatimData, osmData]) => {
        const address = nominatimData?.display_name?.trim() || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        const osmResult = osmData as { edificio?: string; piso?: string; aulaSala?: string; puntoReferencia?: string };
        
        setSelectedLocation({
          latitude,
          longitude,
          address,
          // Solo incluir campos OSM si tienen valores reales
          osmEdificio: osmResult.edificio || undefined,
          osmPiso: osmResult.piso || undefined,
          osmAulaSala: osmResult.aulaSala || undefined,
          osmPuntoReferencia: osmResult.puntoReferencia || undefined,
        });
      });
    } else {
      globalLocation.startTracking();
      toast.info('Obteniendo tu ubicación...');
    }
  };

  // Buscar reportes similares cuando cambia la ubicación (solo en modo crear)
  const checkSimilarReports = useCallback(async () => {
    if (isEditing || !selectedLocation) return;
    
    const reports = await fetchSimilarReports(
      selectedLocation.latitude,
      selectedLocation.longitude,
      categoriaId || undefined,
      tipoReporteId || undefined
    );
    
    if (reports.length > 0) {
      setShowSimilarReports(true);
    }
    setSimilarChecked(true);
  }, [isEditing, selectedLocation, categoriaId, tipoReporteId, fetchSimilarReports]);

  // Manejar confirmación de reporte similar ("Yo también lo vi")
  const handleConfirmSimilarReport = async (reportId: string) => {
    if (!profile?.id) {
      toast.error('Debes iniciar sesión para confirmar un reporte');
      return;
    }

    setIsConfirmingReport(true);
    const success = await confirmReport(reportId, profile.id);
    setIsConfirmingReport(false);

    if (success) {
      toast.success('¡Gracias por confirmar el reporte!');
      navigate(defaultBackRoute);
    } else {
      toast.error('No se pudo confirmar el reporte');
    }
  };

  // Manejar "Es diferente, continuar creando" - crear el reporte directamente
  const handleContinueCreating = async () => {
    clearReports();
    await createReport();
    setShowSimilarReports(false);
  };

  // Subir imágenes a Cloudinary
  const uploadImagesToCloudinary = async (images: string[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      setUploadProgress(`Subiendo imagen ${i + 1} de ${images.length}...`);
      
      // Si ya es una URL de Cloudinary, no subir de nuevo
      if (image.startsWith('https://res.cloudinary.com')) {
        uploadedUrls.push(image);
        continue;
      }
      
      // Subir data URL a Cloudinary
      const result = await uploadFromDataUrl(image, {
        folder: 'reportes',
        tags: ['reporte'],
      });
      
      uploadedUrls.push(result.secure_url);
    }
    
    return uploadedUrls;
  };

  // Función para crear/actualizar el reporte
  const createReport = async (): Promise<boolean> => {
    if (!selectedLocation) {
      toast.error('Debes seleccionar una ubicación en el mapa');
      return false;
    }

    setIsSubmitting(true);
    setUploadProgress('');

    try {
      if (!profile?.id) {
        toast.error('Debes iniciar sesión para crear un reporte');
        setIsSubmitting(false);
        return false;
      }

      // Subir imágenes a Cloudinary primero
      let cloudinaryUrls: string[] = [];
      if (imagenes.length > 0) {
        try {
          cloudinaryUrls = await uploadImagesToCloudinary(imagenes);
          setUploadProgress('Guardando reporte...');
        } catch (uploadError) {
          console.error('Error al subir imágenes:', uploadError);
          toast.error('Error al subir las imágenes');
          setIsSubmitting(false);
          setUploadProgress('');
          return false;
        }
      }

      // Construir objeto location con toda la información
      const locationData = {
        lat: selectedLocation.latitude,
        lng: selectedLocation.longitude,
        address: selectedLocation.address,
        puntoReferencia,
        edificio,
        piso,
        aulaSala,
        infoAdicional,
      };

      // Estados terminales que desasignan automáticamente al usuario
      const TERMINAL_STATUSES = ['resuelto', 'rechazado', 'cancelado', 'eliminado'];
      
      // LÓGICA DE ESTADO Y ASIGNACIÓN (aplica tanto a creación como edición):
      // 1. Si el estado seleccionado es terminal → desasignar usuario automáticamente, status = terminal
      // 2. Si hay usuario asignado → status = 'en_progreso' 
      // 3. Si no hay usuario asignado (y no es terminal) → status = 'pendiente'
      const isTerminalStatus = TERMINAL_STATUSES.includes(status);
      const finalAssignedTo = isTerminalStatus ? null : (assignedTo || null);
      
      // El estado se deriva automáticamente de la asignación, salvo estados terminales
      let finalStatus: 'pendiente' | 'en_progreso' | 'resuelto' | 'rechazado' | 'cancelado' | 'eliminado';
      if (isTerminalStatus) {
        // Estados terminales se respetan tal cual
        finalStatus = status as 'resuelto' | 'rechazado' | 'cancelado' | 'eliminado';
      } else {
        // Estados operativos se derivan de la asignación
        finalStatus = finalAssignedTo ? 'en_progreso' : 'pendiente';
      }

      const reporteData: ReporteInsert = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        categoria_id: categoriaId || null,
        tipo_reporte_id: tipoReporteId || null,
        priority: priority as 'bajo' | 'medio' | 'alto' | 'urgente',
        status: finalStatus,
        visibility: visibility as 'publico' | 'privado',
        assigned_to: finalAssignedTo,
        activo,
        imagenes: cloudinaryUrls.length > 0 ? cloudinaryUrls : null,
        location: locationData,
        user_id: profile.id,
      };

      if (isEditing && reporte) {
        const previousAssignedTo = reporte.assigned_to;
        const newAssignedTo = reporteData.assigned_to;
        
        await update({ id: reporte.id, updates: reporteData });
        
        // Caso 1: Se desasignó el reporte (tenía asignado y ahora no tiene)
        if (previousAssignedTo && !newAssignedTo) {
          console.log('[ReportForm] Reporte desasignado, cerrando geotracking...');
          await endReportTracking(reporte.id, 'Reporte desasignado');
        }
        // Caso 2: Estado terminal - cerrar geotracking si había uno activo
        else if (isTerminalStatus && previousAssignedTo) {
          console.log('[ReportForm] Estado terminal, cerrando geotracking...');
          await endReportTracking(reporte.id, `Estado cambiado a: ${finalStatus}`);
        }
        // Caso 3: Se reasignó a un usuario diferente
        else if (
          newAssignedTo && 
          newAssignedTo !== previousAssignedTo &&
          newAssignedTo !== profile.id // No notificar si te asignas a ti mismo
        ) {
          // Obtener nombres de categoría y tipo para el mensaje
          const categoryName = categories.find(c => c.id === categoriaId)?.nombre || null;
          const typeName = tipoReportes.find(t => t.id === tipoReporteId)?.nombre || null;
          
          await notifyAssignment({
            reportId: reporte.id,
            reportName: nombre,
            assignedToUserId: newAssignedTo,
            assignedByUserId: profile.id,
            assignedByName: profile.name || 'Sistema',
            reportDetails: {
              id: reporte.id,
              nombre: nombre.trim(),
              descripcion: descripcion.trim() || null,
              estado: finalStatus,
              priority: priority,
              direccion: locationData?.address || null,
              latitud: locationData?.lat || null,
              longitud: locationData?.lng || null,
              imagenes: cloudinaryUrls.length > 0 ? cloudinaryUrls : null,
              categoria_nombre: categoryName,
              tipo_nombre: typeName,
              created_at: reporte.created_at,
            },
          });
        }
        
        toast.success('Reporte actualizado exitosamente');
      } else {
        const createdReporte = await create(reporteData);
        
        // Enviar notificación y mensaje si se asignó a alguien al crear
        if (createdReporte && reporteData.assigned_to && reporteData.assigned_to !== profile.id) {
          // Obtener nombres de categoría y tipo para el mensaje
          const categoryName = categories.find(c => c.id === categoriaId)?.nombre || null;
          const typeName = tipoReportes.find(t => t.id === tipoReporteId)?.nombre || null;
          
          await notifyAssignment({
            reportId: createdReporte.id,
            reportName: nombre,
            assignedToUserId: reporteData.assigned_to,
            assignedByUserId: profile.id,
            assignedByName: profile.name || 'Sistema',
            reportDetails: {
              id: createdReporte.id,
              nombre: nombre.trim(),
              descripcion: descripcion.trim() || null,
              estado: finalStatus,
              priority: priority,
              direccion: locationData?.address || null,
              latitud: locationData?.lat || null,
              longitud: locationData?.lng || null,
              imagenes: cloudinaryUrls.length > 0 ? cloudinaryUrls : null,
              categoria_nombre: categoryName,
              tipo_nombre: typeName,
              created_at: createdReporte.created_at,
            },
          });
        }
        
        toast.success('Reporte creado exitosamente');
        
        // Auto-compartir en estado/feed si está habilitado en settings (usa caché)
        if (createdReporte && isAutoShareEnabled()) {
          try {
            const shareResult = await autoShareReport(createdReporte);
            if (shareResult.estadoCreated || shareResult.publicacionCreated) {
              toast.success('Reporte compartido automáticamente', {
                description: shareResult.estadoCreated && shareResult.publicacionCreated
                  ? 'Publicado en estado y feed'
                  : shareResult.estadoCreated
                    ? 'Publicado como estado'
                    : 'Publicado en el feed',
              });
            }
          } catch (shareError) {
            console.error('Error al auto-compartir reporte:', shareError);
            // No bloquear el flujo si falla el auto-share
          }
        }
      }

      onSuccess?.();
      navigate(defaultBackRoute);
      return true;
    } catch (error) {
      console.error('Error al guardar reporte:', error);
      toast.error(isEditing ? 'Error al actualizar el reporte' : 'Error al crear el reporte');
      return false;
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      if (nombre.trim().length < 2) {
        toast.error('El título debe tener al menos 2 caracteres');
      } else if (!selectedLocation) {
        toast.error('Debes seleccionar una ubicación en el mapa');
      }
      return;
    }

    // Verificar reportes similares antes de crear (solo si no se ha verificado aún)
    if (!isEditing && !similarChecked && selectedLocation) {
      const reports = await fetchSimilarReports(
        selectedLocation.latitude,
        selectedLocation.longitude,
        categoriaId || undefined,
        tipoReporteId || undefined
      );
      
      setSimilarChecked(true);
      
      if (reports.length > 0) {
        setShowSimilarReports(true);
        return; // No continuar con la creación
      }
    }

    await createReport();
  };

  return (
    <div className={cn('flex flex-col h-full', animationClasses.fadeIn)}>
      <FormHeader
        title={isEditing ? 'Editar Reporte' : 'Crear Nuevo Reporte'}
        description={
          isEditing
            ? 'Modifica los datos del reporte'
            : 'Completa los datos para crear un nuevo reporte'
        }
        icon={FileText}
        onBack={goBack}
        showBackButton={true}
      />

      {/* Modal de reportes similares */}
      <SimilarReportsFound
        reports={similarReports}
        open={showSimilarReports && similarReports.length > 0}
        onOpenChange={(open) => {
          if (!open) {
            setShowSimilarReports(false);
            // Resetear similarChecked para que se vuelva a verificar si cierra el modal
            setSimilarChecked(false);
          }
        }}
        onContinue={handleContinueCreating}
        onConfirm={handleConfirmSimilarReport}
        isConfirming={isConfirmingReport}
        isCreating={isSubmitting}
      />

      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Sección: Información del Reporte */}
          <Card className="border border-border shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <h2 className="text-base font-medium text-foreground">
                  Información del Reporte
                </h2>
              </div>

              <div className="space-y-6">
                {/* Título */}
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="text-sm font-medium">
                    Título del Reporte <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nombre"
                    type="text"
                    placeholder="Ingresa el título del reporte"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="bg-input border-border"
                    required
                    minLength={2}
                    maxLength={200}
                  />
                </div>

                {/* Descripción */}
                <div className="space-y-2">
                  <Label htmlFor="descripcion" className="text-sm font-medium">
                    Descripción
                  </Label>
                  <Textarea
                    id="descripcion"
                    placeholder="Ingresa una descripción detallada (opcional)"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className="bg-input border-border min-h-[100px] resize-y"
                    maxLength={2000}
                  />
                </div>

                {/* Categoría y Tipo de Reporte */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoria" className="text-sm font-medium">
                      Categoría
                    </Label>
                    <Select value={categoriaId} onValueChange={(value) => {
                      setCategoriaId(value);
                      setTipoReporteId(''); // Reset tipo when category changes
                    }}>
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesLoading ? (
                          <SelectItem value="loading" disabled>
                            Cargando...
                          </SelectItem>
                        ) : activeCategories.length === 0 ? (
                          <SelectItem value="empty" disabled>
                            No hay categorías disponibles
                          </SelectItem>
                        ) : (
                          activeCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.nombre}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipoReporte" className="text-sm font-medium">
                      Tipo de Reporte
                    </Label>
                    <Select value={tipoReporteId} onValueChange={setTipoReporteId} disabled={!categoriaId}>
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue placeholder={categoriaId ? "Seleccionar tipo" : "Selecciona una categoría primero"} />
                      </SelectTrigger>
                      <SelectContent>
                        {tipoReportesLoading ? (
                          <SelectItem value="loading" disabled>
                            Cargando...
                          </SelectItem>
                        ) : activeTipoReportes.length === 0 ? (
                          <SelectItem value="empty" disabled>
                            {categoriaId ? 'No hay tipos para esta categoría' : 'Selecciona una categoría primero'}
                          </SelectItem>
                        ) : (
                          activeTipoReportes.map((tipo) => (
                            <SelectItem key={tipo.id} value={tipo.id}>
                              {tipo.nombre}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección: Estado y Configuración - Solo visible para roles administrativos */}
          {canViewConfigSection && (
            <Card className="border border-border shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <h2 className="text-base font-medium text-foreground">
                    Estado y Configuración
                  </h2>
                </div>

                <div className="space-y-6">
                  {/* Prioridad, Estado, Visibilidad */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-amber-600">Prioridad</Label>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger className="bg-input border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-green-600">Estado</Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="bg-input border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-blue-600">Visibilidad</Label>
                      <Select value={visibility} onValueChange={setVisibility}>
                        <SelectTrigger className="bg-input border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VISIBILITY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Asignar a */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Asignar a</Label>
                    <Select value={assignedTo || 'none'} onValueChange={(val) => setAssignedTo(val === 'none' ? '' : val)}>
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue placeholder="Sin asignar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin asignar</SelectItem>
                        {activeUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name || user.username || user.email || 'Usuario sin nombre'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Switch Reporte activo */}
                  <div className="flex items-center gap-3">
                    <Switch
                      id="activo"
                      checked={activo}
                      onCheckedChange={setActivo}
                    />
                    <Label htmlFor="activo" className="text-sm font-medium cursor-pointer">
                      Reporte activo
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sección: Imágenes */}
          <Card className="border border-border shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <h2 className="text-base font-medium text-foreground">
                  Imágenes
                </h2>
              </div>

              <div className="space-y-4">
                {isFromSmartCapture ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleOpenSmartCaptureToAppendImages}
                    className="gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    Capturar Imagen
                  </Button>
                ) : (
                  <CameraCapture
                    onCapture={handleImageCapture}
                    buttonText="Capturar Imagen"
                    buttonVariant="outline"
                    maxFileSize={5242880} // 5MB
                    allowedFormats={['jpg', 'png', 'jpeg', 'gif', 'webp']}
                    showLimits={true}
                  />
                )}

                {/* Preview de imágenes con ReporteEvidencia */}
                {imagenes.length > 0 && (
                  <div className="mt-4">
                    <ReporteEvidencia imagenes={imagenes} />
                    {/* Botones para eliminar imágenes */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                      {imagenes.map((_, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="w-full"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Eliminar {index + 1}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sección: Ubicación */}
          <Card className="border border-border shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-base font-medium text-foreground">
                    Ubicación
                  </h2>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUseMyLocation}
                  className="gap-2"
                  disabled={lockLocation}
                >
                  <Navigation className="h-4 w-4" />
                  Usar mi ubicación
                </Button>
              </div>

              <div className="space-y-6">
                {/* Mapa */}
                <ReportFormMap
                  selectedLocation={selectedLocation}
                  onLocationSelect={setSelectedLocation}
                  className="rounded-lg overflow-hidden"
                  readOnly={lockLocation}
                />

                {/* Dirección */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Dirección</Label>
                  <Input
                    type="text"
                    placeholder="La dirección se mostrará automáticamente al seleccionar en el mapa"
                    value={selectedLocation?.address || ''}
                    readOnly
                    className="bg-muted border-border"
                  />
                </div>

                {/* Punto de Referencia y Edificio */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Punto de Referencia</Label>
                    <Input
                      type="text"
                      placeholder="Ej: Cerca del auditorio principal"
                      value={puntoReferencia}
                      onChange={(e) => setPuntoReferencia(e.target.value)}
                      className="bg-input border-border"
                      maxLength={200}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Edificio</Label>
                    <Input
                      type="text"
                      placeholder="Ej: Edificio A, Torre Norte"
                      value={edificio}
                      onChange={(e) => setEdificio(e.target.value)}
                      className="bg-input border-border"
                      maxLength={200}
                    />
                  </div>
                </div>

                {/* Piso y Aula/Sala */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Piso</Label>
                    <Input
                      type="text"
                      placeholder="Ej: 3er piso, Planta baja"
                      value={piso}
                      onChange={(e) => setPiso(e.target.value)}
                      className="bg-input border-border"
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Aula/Sala</Label>
                    <Input
                      type="text"
                      placeholder="Ej: Aula 301, Laboratorio 2"
                      value={aulaSala}
                      onChange={(e) => setAulaSala(e.target.value)}
                      className="bg-input border-border"
                      maxLength={100}
                    />
                  </div>
                </div>

                {/* Información Adicional */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Información Adicional</Label>
                  <Textarea
                    placeholder="Cualquier información adicional que ayude a ubicar el incidente..."
                    value={infoAdicional}
                    onChange={(e) => setInfoAdicional(e.target.value)}
                    className="bg-input border-border min-h-[80px] resize-y"
                    maxLength={500}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <FormFooter
          cancelText="Cancelar"
          submitText={
            uploadProgress 
              ? uploadProgress 
              : isEditing 
                ? 'Guardar Cambios' 
                : 'Crear Reporte'
          }
          onCancel={handleCancel}
          isSubmitting={isSubmitting || isUploading}
          isValid={isValid}
          submitButtonType="submit"
        />
      </form>
    </div>
  );
}
