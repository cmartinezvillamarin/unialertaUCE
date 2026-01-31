# Documento de Arquitectura - UniAlerta UCE

## Información del Documento

| Campo | Valor |
|-------|-------|
| **Proyecto** | UniAlerta UCE |
| **Versión** | 1.0 |
| **Fecha** | Enero 2026 |
| **Autor** | Equipo de Desarrollo |

---

## 1. Introducción

### 1.1 Propósito

Este documento describe la arquitectura técnica de la plataforma **UniAlerta UCE**, un sistema integral de gestión de reportes y alertas universitarias con capacidades de red social, mensajería en tiempo real y geolocalización.

### 1.2 Alcance

El documento cubre:
- Arquitectura general del sistema
- Stack tecnológico
- Patrones de diseño implementados
- Flujos de datos
- Componentes principales
- Integraciones externas

### 1.3 Definiciones y Acrónimos

| Término | Definición |
|---------|------------|
| **PWA** | Progressive Web Application |
| **RLS** | Row Level Security (Supabase) |
| **SPA** | Single Page Application |
| **CDN** | Content Delivery Network |
| **API** | Application Programming Interface |
| **CRUD** | Create, Read, Update, Delete |

---

## 2. Vista General de la Arquitectura

### 2.1 Diagrama de Arquitectura de Alto Nivel

*Imagen de: diagrama_arquitectura_general*

### 2.2 Descripción General

UniAlerta UCE es una **Progressive Web Application (PWA)** construida con una arquitectura moderna de tres capas:

1. **Capa de Presentación**: React + Vite + Tailwind CSS
2. **Capa de Servicios**: Supabase (Auth, Database, Realtime, Edge Functions)
3. **Capa de Almacenamiento**: PostgreSQL (Supabase) + Cloudinary (Media)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENTE (Browser/PWA)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React 18 + TypeScript + Vite + Tailwind CSS             │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌──────────────────┐   │  │
│  │  │  Componentes│ │   Contextos │ │  React Query     │   │  │
│  │  │  UI/UX      │ │   Globales  │ │  (Cache/State)   │   │  │
│  │  └─────────────┘ └─────────────┘ └──────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICIOS EXTERNOS                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Supabase   │  │  Cloudinary  │  │   OpenStreetMap      │  │
│  │  (Backend)   │  │   (Media)    │  │   (Mapas/Tiles)      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Stack Tecnológico

### 3.1 Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **React** | 18.3.x | Framework principal de UI |
| **TypeScript** | 5.x | Tipado estático |
| **Vite** | 6.x | Build tool y dev server |
| **Tailwind CSS** | 3.x | Framework de estilos |
| **React Router** | 6.x | Enrutamiento SPA |
| **TanStack Query** | 5.x | Estado del servidor y cache |
| **React Hook Form** | 7.x | Gestión de formularios |
| **Zod** | 3.x | Validación de esquemas |
| **Radix UI** | - | Componentes accesibles |
| **shadcn/ui** | - | Sistema de diseño |
| **Lucide React** | - | Iconografía |
| **Recharts** | 2.x | Gráficos y visualizaciones |
| **Framer Motion** | - | Animaciones |
| **Leaflet** | 1.9.x | Mapas interactivos |

*Imagen de: stack_frontend*

### 3.2 Backend (Supabase)

| Servicio | Propósito |
|----------|-----------|
| **Supabase Auth** | Autenticación y autorización |
| **Supabase Database** | PostgreSQL con extensiones |
| **Supabase Realtime** | Suscripciones en tiempo real |
| **Supabase Edge Functions** | Lógica serverless (Deno) |
| **Supabase Storage** | Almacenamiento de archivos |
| **PostGIS** | Extensión geoespacial |

*Imagen de: servicios_supabase*

### 3.3 Servicios Externos

| Servicio | Propósito |
|----------|-----------|
| **Cloudinary** | CDN y procesamiento de imágenes/videos |
| **OpenStreetMap** | Tiles de mapas gratuitos |
| **Leaflet** | Biblioteca de mapas JavaScript |
| **Lovable** | Plataforma de desarrollo AI-assisted |

*Imagen de: integraciones_externas*

---

## 4. Arquitectura de Componentes

### 4.1 Estructura de Directorios

```
src/
├── components/           # Componentes React
│   ├── ui/              # Componentes base (shadcn/ui)
│   ├── Map/             # Componentes de mapas (Leaflet)
│   ├── audit/           # Auditoría del sistema
│   ├── auth/            # Autenticación
│   ├── categories/      # Gestión de categorías
│   ├── dashboard/       # Dashboard y estadísticas
│   ├── details/         # Vistas de detalle
│   ├── estados/         # Estados/Stories
│   ├── form/            # Formularios de login/registro
│   ├── messages/        # Sistema de mensajería
│   ├── notifications/   # Notificaciones
│   ├── profile/         # Perfil de usuario
│   ├── redsocial/       # Red social
│   ├── report/          # Gestión de reportes
│   ├── report-types/    # Tipos de reportes
│   ├── settings/        # Configuración
│   ├── table/           # Tablas de datos
│   ├── tracking/        # Rastreo en tiempo real
│   └── users/           # Gestión de usuarios
├── contexts/            # Contextos React globales
├── hooks/               # Custom hooks
│   ├── controlador/     # Hooks de lógica de negocio
│   ├── entidades/       # Hooks de acceso a datos
│   ├── estados/         # Hooks de estados/stories
│   ├── messages/        # Hooks de mensajería
│   ├── optimizacion/    # Hooks de rendimiento
│   └── users/           # Hooks CRUD de usuarios
├── integrations/        # Integraciones externas
│   └── supabase/        # Cliente y tipos de Supabase
├── lib/                 # Utilidades
└── pages/               # Páginas/Rutas
```

*Imagen de: estructura_directorios*

### 4.2 Patrón de Componentes

La aplicación sigue el patrón de **Composición de Componentes** con separación clara:

```
┌─────────────────────────────────────────────────────────────┐
│                        PAGES                                 │
│  (Contenedores de ruta - composición de componentes)        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    FEATURE COMPONENTS                        │
│  (Componentes específicos de funcionalidad)                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │  PostCard   │ │  ReportForm │ │  ConversationList   │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     UI COMPONENTS                            │
│  (Componentes base reutilizables - shadcn/ui)               │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│  │ Button │ │  Card  │ │ Dialog │ │ Input  │ │ Table  │   │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘   │
└─────────────────────────────────────────────────────────────┘
```

*Imagen de: patron_componentes*

---

## 5. Gestión de Estado

### 5.1 Arquitectura de Estado

La aplicación utiliza una estrategia híbrida de gestión de estado:

```
┌─────────────────────────────────────────────────────────────┐
│                    GESTIÓN DE ESTADO                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐    Estado Global Persistente           │
│  │  React Context  │    • AuthContext (Autenticación)       │
│  │                 │    • ThemeContext (Tema UI)            │
│  │                 │    • LocationContext (Geolocalización) │
│  │                 │    • UserPresenceContext (Presencia)   │
│  │                 │    • NotificationsContext              │
│  │                 │    • MessagingContext                  │
│  │                 │    • NearbyReportNotificationsContext  │
│  └─────────────────┘                                        │
│                                                              │
│  ┌─────────────────┐    Estado del Servidor (Cache)         │
│  │  TanStack Query │    • Reportes, Usuarios, Categorías    │
│  │                 │    • Publicaciones, Mensajes           │
│  │                 │    • Optimistic updates                │
│  │                 │    • Background refetching             │
│  └─────────────────┘                                        │
│                                                              │
│  ┌─────────────────┐    Estado Local de Componente          │
│  │   useState/     │    • Formularios                       │
│  │   useReducer    │    • UI temporal                       │
│  └─────────────────┘                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

*Imagen de: gestion_estado*

### 5.2 Contextos Globales

| Contexto | Responsabilidad |
|----------|-----------------|
| **AuthContext** | Sesión de usuario, tokens, estado de autenticación |
| **ThemeContext** | Tema claro/oscuro, preferencias de UI |
| **LocationContext** | Posición GPS del usuario, permisos |
| **UserPresenceContext** | Estado online/offline de usuarios |
| **NotificationsContext** | Notificaciones del sistema |
| **MessagingContext** | Estado de mensajería y conversaciones |
| **NearbyReportNotificationsContext** | Alertas de reportes cercanos |

*Imagen de: contextos_react*

---

## 6. Flujos de Datos

### 6.1 Flujo de Autenticación

```
┌──────────┐     ┌──────────────┐     ┌─────────────────┐
│  Usuario │────▶│  LoginForm   │────▶│  Supabase Auth  │
└──────────┘     └──────────────┘     └─────────────────┘
                                              │
                        ┌─────────────────────┘
                        ▼
              ┌─────────────────┐
              │  AuthContext    │
              │  (JWT Token)    │
              └─────────────────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ Profile  │  │  Roles   │  │ Settings │
    │ (DB)     │  │  (DB)    │  │  (DB)    │
    └──────────┘  └──────────┘  └──────────┘
```

*Imagen de: flujo_autenticacion*

### 6.2 Flujo de Creación de Reporte

```
┌──────────────────────────────────────────────────────────────┐
│                 FLUJO: CREAR REPORTE                          │
└──────────────────────────────────────────────────────────────┘

1. Usuario completa formulario
        │
        ▼
┌──────────────────┐
│   ReportForm     │
│   - Título       │
│   - Descripción  │
│   - Categoría    │
│   - Ubicación    │
│   - Imágenes     │
└──────────────────┘
        │
        ├────────────────────────┐
        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐
│   Cloudinary     │    │    Leaflet       │
│   (Subir imgs)   │    │  (Geolocation)   │
└──────────────────┘    └──────────────────┘
        │                        │
        └──────────┬─────────────┘
                   ▼
        ┌──────────────────┐
        │   Supabase       │
        │   (Insert DB)    │
        └──────────────────┘
                   │
                   ▼
        ┌──────────────────┐
        │   Realtime       │
        │   (Broadcast)    │
        └──────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│  Dashboard       │  │  Notificaciones  │
│  (Actualizar)    │  │  (Push/Toast)    │
└──────────────────┘  └──────────────────┘
```

*Imagen de: flujo_crear_reporte*

### 6.3 Flujo de Mensajería en Tiempo Real

```
┌──────────────────────────────────────────────────────────────┐
│              FLUJO: MENSAJERÍA EN TIEMPO REAL                 │
└──────────────────────────────────────────────────────────────┘

┌─────────────┐                           ┌─────────────┐
│  Usuario A  │                           │  Usuario B  │
└─────────────┘                           └─────────────┘
       │                                         ▲
       ▼                                         │
┌─────────────────┐                     ┌─────────────────┐
│  MessageInput   │                     │  MessageBubble  │
└─────────────────┘                     └─────────────────┘
       │                                         ▲
       ▼                                         │
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE REALTIME                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Channel: mensajes                                       ││
│  │  Event: INSERT                                          ││
│  │  Broadcast to: conversacion_id subscribers              ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                    POSTGRESQL                                │
│  Tablas: mensajes, conversaciones, participantes            │
└─────────────────────────────────────────────────────────────┘
```

*Imagen de: flujo_mensajeria_realtime*

---

## 7. Módulos del Sistema

### 7.1 Módulo de Autenticación

**Componentes:**
- `LoginForm` - Formulario de inicio de sesión
- `RegisterForm` - Registro de usuarios
- `ForgotPasswordForm` - Recuperación de contraseña
- `MandatoryPasswordChange` - Cambio obligatorio de contraseña
- `ProtectedRoute` - HOC para rutas protegidas

**Hooks:**
- `useSignIn` - Lógica de inicio de sesión
- `useSignOut` - Cierre de sesión
- `useRegisterForm` - Validación de registro
- `useResetPassword` - Recuperación de contraseña
- `useSessionPersistence` - Persistencia de sesión
- `useLoginAttempts` - Control de intentos fallidos

**Características:**
- Autenticación por email/contraseña
- Control de intentos de login (anti-brute force)
- Cambio de contraseña obligatorio
- Confirmación de email
- Roles y permisos granulares

*Imagen de: modulo_autenticacion*

### 7.2 Módulo de Reportes

**Componentes:**
- `ReportForm` - Formulario de creación/edición
- `ReportFormEmbedded` - Versión embebida del formulario
- `ReportDetailsModal` - Modal de detalles
- `SimilarReportsFound` - Reportes similares detectados
- `ReportesTable` - Tabla de reportes

**Hooks:**
- `useOptimizedReportes` - Carga optimizada de reportes
- `useSimilarReports` - Detección de reportes similares
- `useAutoShareReport` - Compartir automático en red social
- `useReporteHistorial` - Historial de cambios

**Características:**
- CRUD completo de reportes
- Geolocalización con mapas
- Subida de imágenes a Cloudinary
- Detección de reportes similares
- Estados y prioridades
- Asignación a usuarios
- Historial de cambios
- Carga masiva (bulk upload)

*Imagen de: modulo_reportes*

### 7.3 Módulo de Mapas y Geolocalización

**Componentes:**
- `ReportFormMap` - Mapa para selección de ubicación
- `SingleReportMap` - Mapa de un reporte individual
- `LiveTrackingMap` - Rastreo en tiempo real
- `LiveNavigationMap` - Navegación en vivo
- `ReportLocationMap` - Visualización de ubicación

**Hooks:**
- `useUserLocation` - Obtención de posición GPS
- `useRealtimeNavigation` - Navegación en tiempo real

**Tecnologías:**
- **Leaflet**: Biblioteca de mapas JavaScript
- **OpenStreetMap**: Proveedor de tiles gratuito
- **PostGIS**: Extensión espacial de PostgreSQL

**Características:**
- Selección de ubicación interactiva
- Geocodificación inversa
- Rastreo en tiempo real
- Cálculo de rutas
- Alertas por proximidad

*Imagen de: modulo_mapas_leaflet*

### 7.4 Módulo de Red Social

**Componentes:**
- `CreatePostCard` - Creación de publicaciones
- `PostCard` - Tarjeta de publicación
- `PostFeed` - Feed de publicaciones
- `PostDetailView` - Vista detallada de post
- `CommentSection` - Sección de comentarios
- `SocialProfileView` - Perfil de usuario
- `TrendingHashtagsCard` - Hashtags trending
- `TrendingPostsCard` - Posts populares
- `StatusSection` - Estados/Stories

**Hooks:**
- `usePublicaciones` - Gestión de publicaciones
- `useComentarios` - Gestión de comentarios
- `usePublicacionInteractions` - Likes, shares, saves
- `useTrendingHashtags` - Hashtags populares
- `useTrendingPosts` - Posts trending
- `useUserRelations` - Seguidores/Siguiendo
- `useEstados` - Estados/Stories

**Características:**
- Publicaciones con texto e imágenes
- Sistema de comentarios anidados
- Likes, compartir, guardar
- Menciones (@usuario)
- Hashtags con trending
- Estados/Stories temporales
- Perfiles de usuario
- Sistema de seguimiento
- Reposts con comentario

*Imagen de: modulo_red_social*

### 7.5 Módulo de Mensajería

**Componentes:**
- `MessagesLayout` - Layout principal
- `ConversationList` - Lista de conversaciones
- `ConversationItem` - Item de conversación
- `ChatView` - Vista de chat
- `ChatHeader` - Cabecera del chat
- `MessageBubble` - Burbuja de mensaje
- `MessageInput` - Input de mensaje
- `TypingIndicator` - Indicador de escritura
- `NewConversationModal` - Nuevo chat
- `NewGroupModal` - Nuevo grupo
- `GroupMembersPanel` - Panel de miembros

**Hooks:**
- `useConversations` - Gestión de conversaciones
- `useMessages` - Gestión de mensajes
- `useGroupManagement` - Gestión de grupos
- `useUserPresence` - Estado online/offline
- `useMutedUsers` - Usuarios silenciados

**Características:**
- Chat privado 1:1
- Grupos con roles (admin, member)
- Mensajes en tiempo real
- Indicador de escritura
- Estado de lectura
- Compartir publicaciones
- Reacciones con emoji
- Silenciar usuarios/conversaciones

*Imagen de: modulo_mensajeria*

### 7.6 Módulo de Notificaciones

**Componentes:**
- `NotificationsPanel` - Panel principal
- `NotificationsDropdown` - Dropdown de notificaciones
- `NotificationList` - Lista de notificaciones
- `NotificationItem` - Item de notificación
- `NearbyReportToast` - Toast de reporte cercano
- `NotificationPermissionPrompt` - Solicitud de permisos

**Hooks:**
- `useNotifications` - Gestión de notificaciones
- `useNotificationCount` - Contador de no leídas
- `usePushNotifications` - Notificaciones push
- `useNearbyReportNotifications` - Alertas de reportes cercanos
- `useFriendRequestNotifications` - Solicitudes de amistad

**Características:**
- Notificaciones en tiempo real
- Notificaciones push (PWA)
- Alertas de reportes cercanos
- Filtros por tipo
- Marcar como leída
- Acciones bulk

*Imagen de: modulo_notificaciones*

### 7.7 Módulo de Dashboard y Estadísticas

**Componentes:**
- `DashboardView` - Vista principal
- `DashboardStats` - Tarjetas de estadísticas
- `DashboardCharts` - Gráficos
- `TrendingDashboard` - Tendencias
- `ReportesStatistics` - Estadísticas de reportes
- `UsuariosStatistics` - Estadísticas de usuarios
- `CategoriasStatistics` - Estadísticas de categorías

**Hooks:**
- `useDashboardStats` - Estadísticas generales
- `useDashboardRefresh` - Actualización automática
- `useReportesAnalysis` - Análisis de reportes
- `useUsuariosAnalysis` - Análisis de usuarios
- `useTrendingAnalytics` - Análisis de tendencias
- `useActivityPeak` - Picos de actividad

**Características:**
- KPIs en tiempo real
- Gráficos interactivos (Recharts)
- Análisis comparativo
- Filtros por fecha
- Distribución por estado/prioridad
- Mapa de calor de actividad

*Imagen de: modulo_dashboard*

### 7.8 Módulo de Auditoría

**Componentes:**
- `AuditPanel` - Panel de auditoría
- `ActivityDashboard` - Dashboard de actividad
- `AuditDetailsModal` - Detalles de registro
- `ActividadesTable` - Tabla de actividades

**Hooks:**
- `useAuditLog` - Registro de auditoría
- `useAuditFilter` - Filtros de auditoría
- `useOptimizedUserAudit` - Carga optimizada

**Características:**
- Registro de todas las operaciones
- Filtros avanzados
- Exportación de datos
- Valores anteriores/nuevos
- IP y user-agent
- Timeline de actividad

*Imagen de: modulo_auditoria*

### 7.9 Módulo de Administración de Usuarios

**Componentes:**
- `UserForm` - Formulario de usuario
- `UserFormEmbedded` - Formulario embebido
- `UserRolesManager` - Gestión de roles
- `UserPermissionsManager` - Gestión de permisos
- `UsuariosTable` - Tabla de usuarios

**Hooks:**
- `useOptimizedUsers` - Carga de usuarios
- `useCreateUser` - Crear usuario
- `useUpdateUser` - Actualizar usuario
- `useDeleteUser` - Eliminar usuario
- `useRolePermissions` - Roles y permisos
- `useOptimizedUserRoles` - Roles del usuario

**Características:**
- CRUD de usuarios
- Sistema de roles (admin, moderador, operador, usuario)
- Permisos granulares
- Bloqueo de usuarios
- Estados (activo, inactivo, suspendido)
- Carga masiva

*Imagen de: modulo_usuarios*

---

## 8. Integraciones Externas

### 8.1 Supabase

**Proyecto ID:** `tgrfsuewkayqrobdfesa`

**Servicios utilizados:**

| Servicio | Uso en la aplicación |
|----------|---------------------|
| **Auth** | Autenticación de usuarios, JWT tokens, confirmación de email |
| **Database** | PostgreSQL con 43+ tablas, RLS policies |
| **Realtime** | Suscripciones a mensajes, notificaciones, reportes |
| **Edge Functions** | Lógica serverless (si aplica) |
| **PostGIS** | Consultas geoespaciales, proximidad |

**Tablas principales:**
- `profiles` - Perfiles de usuario
- `user_roles` - Roles y permisos
- `reportes` - Reportes del sistema
- `categories` - Categorías de reportes
- `tipo_categories` - Tipos de reportes
- `publicaciones` - Posts de red social
- `comentarios` - Comentarios
- `mensajes` - Mensajes de chat
- `conversaciones` - Conversaciones
- `notifications` - Notificaciones
- `estados` - Estados/Stories
- `user_audit` - Auditoría

*Imagen de: integracion_supabase*

### 8.2 Cloudinary

**Cloud Name:** `dwhl67ka5`
**Upload Preset:** `ml_default`

**Uso:**
```typescript
const CLOUDINARY_UPLOAD_URL = 
  `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
```

**Características:**
- Subida directa desde el cliente (unsigned uploads)
- Soporte para imágenes y videos
- Transformaciones automáticas
- CDN global
- Organización por carpetas
- Progress tracking

**Flujo de subida:**
```
┌──────────┐     ┌──────────────┐     ┌─────────────┐
│  File    │────▶│  FormData    │────▶│  Cloudinary │
│  Input   │     │  + preset    │     │  API        │
└──────────┘     └──────────────┘     └─────────────┘
                                             │
                                             ▼
                                      ┌─────────────┐
                                      │  secure_url │
                                      │  public_id  │
                                      └─────────────┘
                                             │
                                             ▼
                                      ┌─────────────┐
                                      │  Supabase   │
                                      │  (Save URL) │
                                      └─────────────┘
```

*Imagen de: integracion_cloudinary*

### 8.3 Leaflet + OpenStreetMap

**Configuración:**
- **Leaflet:** Biblioteca de mapas JavaScript
- **Tiles:** OpenStreetMap (gratuito, sin API key)
- **Geocoding:** Nominatim (OpenStreetMap)

**Componentes de mapa:**
```
┌─────────────────────────────────────────────────────────────┐
│                    MAPAS (LEAFLET)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │  ReportFormMap      │  │  SingleReportMap    │          │
│  │  - Selector ubicación│  │  - Vista individual │          │
│  └─────────────────────┘  └─────────────────────┘          │
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │  LiveTrackingMap    │  │  ReportLocationMap  │          │
│  │  - Rastreo tiempo   │  │  - Vista ubicación  │          │
│  │    real             │  │                     │          │
│  └─────────────────────┘  └─────────────────────┘          │
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │  LiveNavigationMap  │  │  NavigationMap      │          │
│  │  - Navegación en    │  │  - Rutas estáticas  │          │
│  │    vivo             │  │                     │          │
│  └─────────────────────┘  └─────────────────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

*Imagen de: integracion_leaflet_osm*

### 8.4 Lovable

**Características utilizadas:**
- Desarrollo AI-assisted
- Deploy automático
- Preview en tiempo real
- Integración con Supabase
- PWA support

*Imagen de: plataforma_lovable*

---

## 9. Seguridad

### 9.1 Autenticación y Autorización

```
┌─────────────────────────────────────────────────────────────┐
│                    MODELO DE SEGURIDAD                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  SUPABASE AUTH                       │   │
│  │  • JWT Tokens                                        │   │
│  │  • Refresh tokens                                    │   │
│  │  • Email confirmation                                │   │
│  │  • Password reset                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  RLS POLICIES                        │   │
│  │  • Row Level Security en todas las tablas           │   │
│  │  • Políticas por usuario/rol                        │   │
│  │  • Validación a nivel de base de datos             │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  ROLES Y PERMISOS                    │   │
│  │  • admin: Acceso total                              │   │
│  │  • moderador: Gestión de contenido                  │   │
│  │  • operador: Gestión de reportes                    │   │
│  │  • usuario: Acceso básico                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

*Imagen de: modelo_seguridad*

### 9.2 Roles del Sistema

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **admin** | Administrador total | Todos los permisos |
| **moderador** | Moderador de contenido | Gestión de publicaciones, usuarios |
| **operador** | Operador de reportes | Gestión de reportes asignados |
| **usuario** | Usuario estándar | Crear reportes, usar red social |

### 9.3 Permisos Granulares

- `ver_dashboard` - Ver estadísticas
- `gestionar_usuarios` - CRUD usuarios
- `gestionar_reportes` - CRUD reportes
- `gestionar_categorias` - CRUD categorías
- `gestionar_tipos` - CRUD tipos de reporte
- `ver_auditoria` - Ver logs de auditoría
- `moderar_contenido` - Moderar publicaciones
- `asignar_reportes` - Asignar reportes a usuarios

*Imagen de: permisos_sistema*

---

## 10. PWA (Progressive Web App)

### 10.1 Configuración

La aplicación está configurada como PWA con:

- **Service Worker** (vite-plugin-pwa)
- **Manifest** para instalación
- **Iconos** en múltiples tamaños
- **Notificaciones push**
- **Modo offline** (cache)

**Iconos disponibles:**
```
public/icons/
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-192x192.png
├── icon-384x384.png
└── icon-512x512.png
```

*Imagen de: configuracion_pwa*

### 10.2 Características PWA

- ✅ Instalable en dispositivos
- ✅ Funciona offline (básico)
- ✅ Notificaciones push
- ✅ Actualizaciones automáticas
- ✅ Responsive design
- ✅ HTTPS requerido

---

## 11. Rendimiento

### 11.1 Optimizaciones Implementadas

| Área | Optimización |
|------|--------------|
| **React** | Lazy loading de rutas, memo, useCallback |
| **Queries** | TanStack Query con staleTime de 5 min |
| **Imágenes** | Cloudinary CDN, lazy loading |
| **Bundle** | Vite code splitting |
| **CSS** | Tailwind CSS purging |

### 11.2 Hooks de Optimización

```
src/hooks/optimizacion/
├── useAnimations.ts      # Animaciones optimizadas
├── useDesignSystem.ts    # Sistema de diseño
├── useLoadingState.ts    # Estados de carga
├── useOptimizedComponent.ts  # Componentes optimizados
└── useResponsive.ts      # Responsive breakpoints
```

*Imagen de: optimizaciones*

---

## 12. Despliegue

### 12.1 Arquitectura de Despliegue

```
┌─────────────────────────────────────────────────────────────┐
│                    DESPLIEGUE                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────┐                                    │
│  │     LOVABLE         │                                    │
│  │  (Frontend Host)    │                                    │
│  │  - Build automático │                                    │
│  │  - CDN              │                                    │
│  │  - SSL/HTTPS        │                                    │
│  └─────────────────────┘                                    │
│            │                                                 │
│            ▼                                                 │
│  ┌─────────────────────┐    ┌─────────────────────┐        │
│  │     SUPABASE        │    │    CLOUDINARY       │        │
│  │  (Backend)          │    │    (Media CDN)      │        │
│  │  - PostgreSQL       │    │    - Imágenes       │        │
│  │  - Auth             │    │    - Videos         │        │
│  │  - Realtime         │    │    - Transformación │        │
│  │  - Edge Functions   │    │                     │        │
│  └─────────────────────┘    └─────────────────────┘        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

*Imagen de: arquitectura_despliegue*

---

## 13. Anexos

### 13.1 Diagrama de Base de Datos

*Imagen de: diagrama_base_datos*

### 13.2 Flujo Completo de Usuario

*Imagen de: flujo_completo_usuario*

### 13.3 Mapa de Navegación

```
┌─────────────────────────────────────────────────────────────┐
│                    MAPA DE NAVEGACIÓN                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PÚBLICAS                    PROTEGIDAS                     │
│  ─────────                   ──────────                     │
│  /                           /bienvenida                    │
│  /login                      /dashboard                     │
│  /instalar                   /reportes                      │
│  /forgot-password            /mis-reportes                  │
│  /reset-password             /crear-reporte                 │
│  /change-password            /rastreo                       │
│                              /tipo-reportes                 │
│                              /usuarios                      │
│                              /categorias                    │
│                              /mensajes                      │
│                              /notificaciones                │
│                              /red-social                    │
│                              /auditoria                     │
│                              /perfil                        │
│                              /configuracion                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

*Imagen de: mapa_navegacion*

### 13.4 Referencias

- [React Documentation](https://react.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [OpenStreetMap](https://www.openstreetmap.org)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TanStack Query](https://tanstack.com/query)
- [Lovable Documentation](https://docs.lovable.dev)

---

## Historial de Versiones

| Versión | Fecha | Descripción | Autor |
|---------|-------|-------------|-------|
| 1.0 | Enero 2026 | Versión inicial | Equipo de Desarrollo |

---

*Documento generado para UniAlerta UCE - Sistema de Gestión de Reportes y Alertas Universitarias*
