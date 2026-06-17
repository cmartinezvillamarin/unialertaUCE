# UniAlerta UCE

**Plataforma de Gestión de Incidentes con Sistemas de Información Geográfica (SIG)**

[![Estado](https://img.shields.io/badge/estado-PoC-blueviolet)](https://unialerta.lovable.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-BaaS-3FCF8E)](https://supabase.com)
[![PostGIS](https://img.shields.io/badge/PostGIS-3.x-316192)](https://postgis.net)
[![PWA](https://img.shields.io/badge/PWA-habilitado-5A0FC8)](https://developer.mozilla.org/es/docs/Web/Progressive_web_apps)

> **Prueba de Concepto (PoC)** — Todos los datos son simulados. Este proyecto es una demostración técnica de viabilidad y **no** una implementación en producción.
>
> **URL en vivo:** [https://unialerta.lovable.app](https://unialerta.lovable.app)

---

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Objetivos](#objetivos)
- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Módulos Funcionales](#módulos-funcionales)
- [Sistema de Información Geográfica (SIG)](#sistema-de-información-geográfica-sig)
- [Seguridad](#seguridad)
- [Configuración de Supabase](#configuración-de-supabase)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Requisitos Previos](#requisitos-previos)
- [Instalación y Configuración](#instalación-y-configuración)
- [Variables de Entorno](#variables-de-entorno)
- [Ejecución en Desarrollo](#ejecución-en-desarrollo)
- [Construcción y Producción](#construcción-y-producción)
- [Edge Functions (Supabase)](#edge-functions-supabase)
- [Progressive Web App (PWA)](#progressive-web-app-pwa)
- [Base de Datos y PostGIS](#base-de-datos-y-postgis)
- [Pruebas](#pruebas)
- [Comandos Disponibles](#comandos-disponibles)
- [Flujo de Despliegue](#flujo-de-despliegue)
- [Datos Simulados](#datos-simulados)
- [Guía de Contribución](#guía-de-contribución)
- [Buenas Prácticas](#buenas-prácticas)
- [Solución de Problemas Comunes](#solución-de-problemas-comunes)
- [Documentación Adicional](#documentación-adicional)
- [Limitaciones del PoC](#limitaciones-del-poc)
- [Suposiciones y Pendientes](#suposiciones-y-pendientes)
- [Licencia](#licencia)

---

## Descripción General

UniAlerta UCE es una **prueba de concepto** que demuestra la viabilidad técnica de integrar **Sistemas de Información Geográfica (SIG)** en la gestión de incidentes dentro de un campus universitario. La plataforma permite reportar, geolocalizar, rastrear y analizar incidentes de forma integral, combinando capacidades geoespaciales con herramientas sociales y de comunicación.

El sistema sigue una arquitectura **cliente-servidor moderna** con un frontend React SPA, un backend **Backend-as-a-Service (BaaS)** basado en Supabase (PostgreSQL + PostGIS + Realtime + Edge Functions), y capacidades **PWA** para experiencia offline parcial.

---

## Objetivos

- **Demostrar factibilidad técnica** de un sistema SIG aplicado a la gestión de incidentes universitarios
- **Validar la arquitectura** cliente-servidor con componentes geoespaciales (PostGIS, Leaflet, OpenStreetMap)
- **Explorar la trazabilidad geográfica** desde el reporte de un incidente hasta su resolución en campo
- **Evaluar la integración** de módulos complementarios: red social, mensajería, calendario y notificaciones
- **Probar la escalabilidad funcional** mediante carga masiva de datos y análisis en dashboard

---

## Stack Tecnológico

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **React** | ^18.3.1 | Framework de interfaz de usuario |
| **TypeScript** | ^5.8.3 | Tipado estático y seguridad en tiempo de desarrollo |
| **Vite** | ^5.4.19 | Bundler y servidor de desarrollo con HMR |
| **Tailwind CSS** | ^3.4.17 | Framework de estilos utilitario |
| **shadcn/ui** | — | Componentes accesibles basados en Radix UI |
| **TanStack React Query** | ^5.83.0 | Gestión de estado del servidor, caching y sincronización |
| **React Router DOM** | ^6.30.1 | Enrutamiento declarativo del lado del cliente |
| **React Hook Form + Zod** | ^7.61.1 / ^3.25.76 | Formularios con validación tipada |
| **Framer Motion** | ^12.29.0 | Animaciones de interfaz |
| **Leaflet + leaflet.heat** | ^1.9.4 / ^0.2.0 | Mapas interactivos y mapas de calor |
| **Recharts** | ^2.15.4 | Gráficos y visualizaciones del dashboard |
| **date-fns** | ^3.6.0 | Manipulación de fechas |
| **Lucide React** | ^0.462.0 | Iconografía |
| **Sonner** | ^1.7.4 | Notificaciones toast |
| **Vaul** | ^0.9.9 | Drawer/cajón inferior |
| **next-themes** | ^0.3.0 | Gestión de temas claro/oscuro/sistema |

### Backend (BaaS)

| Tecnología | Propósito |
|------------|-----------|
| **Supabase** | Autenticación JWT, base de datos PostgreSQL, Realtime WebSocket, Edge Functions (Deno), Storage |
| **PostgreSQL 15+** | Base de datos relacional |
| **PostGIS 3.x** | Extensión geoespacial (geography, GIST indexes, ST_* functions) |
| **Cloudinary** | Almacenamiento y optimización de imágenes |
| **Lovable AI Gateway** | Proxy para modelos de IA |
| **Google Gemini 2.5 Flash** | Análisis de imágenes de incidentes |

### Servicios Externos

| Servicio | Propósito |
|----------|-----------|
| **OpenStreetMap** | Tiles de mapas base para Leaflet |
| **Nominatim** | Geocodificación inversa (coordenadas → dirección legible) |
| **Overpass API** | Consulta de infraestructura del campus (edificios, aulas, pisos) |

### Herramientas de Desarrollo

| Herramienta | Propósito |
|-------------|-----------|
| **Vite (SWC)** | Compilación rápida con SWC (en lugar de Babel) |
| **Vitest + jsdom** | Testing unitario con entorno DOM simulado |
| **Testing Library (jest-dom)** | Aserciones DOM accesibles |
| **ESLint** (flat config) | Linter con TypeScript ESLint y React Hooks |
| **PostCSS + Autoprefixer** | Procesamiento CSS post-compilación |
| **@tailwindcss/typography** | Estilos tipográficos para contenido markdown |
| **lovable-tagger** | Tagging de componentes para Lovable (solo dev) |
| **vite-plugin-pwa** | Generación de Service Worker y manifiesto PWA |

---

## Arquitectura del Sistema

### Jerarquía de Providers

La aplicación sigue un modelo de **composición de contextos** anidados. El orden es crítico porque cada contexto puede depender del anterior:

```
QueryClientProvider (TanStack Query)
  └── ThemeProvider (next-themes)
      └── TooltipProvider (Radix)
          └── BrowserRouter (React Router)
              └── AuthProvider (sesión JWT)
                  └── UserPresenceProvider (presencia online/offline)
                      └── LocationProvider (geolocalización del dispositivo)
                          └── NearbyReportNotificationsProvider (alertas de proximidad)
                              └── Routes
                                  ├── Rutas Públicas
                                  └── AppLayout (layout protegido)
                                      └── NotificationsProvider (notificaciones en tiempo real)
                                          └── MessagingProvider (chat/mensajería)
                                              └── ThemeSync (sincronización de tema)
                                                  └── AppSidebar + PageHeader + Outlet
```

### Patrones de Diseño Implementados

| Patrón | Implementación |
|--------|----------------|
| **Context-driven State** | 7 contextos React para estado global (Auth, Theme, Location, UserPresence, Notifications, NearbyReportNotifications, Messaging) |
| **Server State Management** | TanStack React Query con stale time de 5 minutos y refetch on window focus deshabilitado |
| **Factory Pattern (Hooks)** | `createOptimizedEntityHook()` y `createOptimizedEntityListHook()` para estandarizar CRUD de entidades |
| **Server-side Pagination** | Hook `useServerPagination` con paginación basada en rango (`Range` header de Supabase) |
| **Realtime Subscriptions** | Supabase Realtime para chat, notificaciones, presencia y tracking |
| **Row Level Security (RLS)** | Políticas de acceso a nivel de fila en PostgreSQL |
| **Composite Pattern (UI)** | shadcn/ui con composición de componentes Radix primitives |
| **Strategy Pattern** | `reportStatus.ts` para lógica de estados derivados de reportes |

### Enrutamiento

**Rutas públicas** (sin autenticación):
| Ruta | Página |
|------|--------|
| `/` | Index (registro) |
| `/login` | Login |
| `/instalar` | Guía de instalación PWA |
| `/registro` | Registro de usuario |
| `/forgot-password` | Recuperar contraseña |
| `/reset-password` | Restablecer contraseña |
| `/change-password` | Cambiar contraseña |

**Rutas protegidas** (dentro de `AppLayout` con sidebar):
| Ruta | Página |
|------|--------|
| `/bienvenida` | Onboarding |
| `/dashboard` | Dashboard analítico |
| `/reportes` | Lista de reportes |
| `/reportes/nuevo` | Crear reporte |
| `/reportes/:id` | Detalle de reporte |
| `/reportes/:id/editar` | Editar reporte |
| `/reportes/carga-masiva` | Carga masiva de reportes |
| `/mis-reportes` | Reportes del usuario |
| `/crear-reporte` | Reporte rápido |
| `/rastreo` | Rastreo de reportes |
| `/tipo-reportes` | Tipos de reporte |
| `/tipo-reportes/nuevo` | Nuevo tipo |
| `/tipo-reportes/:id` | Detalle de tipo |
| `/tipo-reportes/:id/editar` | Editar tipo |
| `/tipo-reportes/carga-masiva` | Carga masiva de tipos |
| `/categorias` | Categorías |
| `/categorias/nueva` | Nueva categoría |
| `/categorias/:id` | Detalle de categoría |
| `/categorias/:id/editar` | Editar categoría |
| `/categorias/carga-masiva` | Carga masiva de categorías |
| `/usuarios` | Usuarios (admin) |
| `/usuarios/nuevo` | Nuevo usuario |
| `/usuarios/:id` | Detalle de usuario |
| `/usuarios/:id/editar` | Editar usuario |
| `/usuarios/carga-masiva` | Carga masiva de usuarios |
| `/mensajes` | Mensajería |
| `/notificaciones` | Notificaciones |
| `/red-social` | Red social |
| `/red-social/post/:postId` | Detalle de publicación |
| `/red-social/trending` | Tendencias |
| `/perfil/:username` | Perfil público |
| `/perfil/id/:userId` | Perfil por ID |
| `/perfil` | Mi perfil |
| `/perfil/editar` | Editar perfil |
| `/auditoria` | Panel de auditoría |
| `/configuracion` | Configuración |
| `/geotracking` | Geotracking en vivo |
| `/calendario` | Calendario de eventos |
| `*` | NotFound (404) |

### Flujo de Datos Geográfico (6 etapas)

```
Captura GPS → Enriquecimiento → Almacenamiento PostGIS → Procesamiento Espacial → Seguimiento Realtime → Visualización
     │               │                    │                       │                       │                 │
     ▼               ▼                    ▼                       ▼                       ▼                 ▼
Geolocation       Nominatim +         geography(POINT,    ST_DWithin / ST_Distance   Supabase Realtime   Leaflet.heat
API / Leaflet     Overpass API        4326) + GIST        + RPC (has_role)                              + OSM tiles
```

---

## Módulos Funcionales

### 1. Gestión de Reportes
- Creación con geolocalización automática (GPS) o selección manual en mapa interactivo
- Captura inteligente con análisis de imagen vía IA (Gemini 2.5 Flash)
- Asignación a operadores por proximidad geográfica (`ST_DWithin`, `ST_Distance`)
- Ciclo de vida con historial: pendiente → en progreso → resuelto
- Timeline de cambios y asignación
- Detección de reportes similares en radio configurable
- Carga masiva (bulk upload con CSV/Excel)
- Adjuntos de imágenes subidos a Cloudinary

### 2. Geotracking y Rastreo
- Seguimiento en tiempo real de operadores en campo vía Supabase Realtime
- Verificación de llegada al punto del incidente
- Mapa de navegación con ruta al destino
- Estadísticas de rastreo activo
- Historial de ubicaciones del usuario

### 3. Dashboard Analítico
- Estadísticas generales (reportes, usuarios, categorías, tipos)
- Análisis comparativo por entidad
- Gráficos de tendencias y distribución (Recharts)
- Filtros por período, categoría y tipo de reporte
- Métricas de actividad (picos horarios, días de mayor actividad)
- Análisis por roles y permisos

### 4. Red Social
- Publicaciones con texto, imágenes, hashtags y menciones (`@usuario`)
- Encuestas y votaciones comunitarias
- Comentarios con respuestas anidadas
- Sistema de seguimiento (follow) y solicitudes de amistad
- Estados temporales (tipo stories) con expiración automática
- Trending: publicaciones y hashtags populares
- Búsqueda avanzada de usuarios y contenido
- Perfiles de usuario públicos

### 5. Mensajería
- Conversaciones individuales y grupales
- Compartir reportes y publicaciones en el chat
- Indicador de escritura y presencia en línea
- Recibos de lectura y entrega (`message_receipts`)
- Galería de imágenes compartidas en la conversación
- Gestión de grupos (miembros, roles, historial de cambios)
- Reacciones a mensajes

### 6. Calendario de Eventos
- Creación manual de eventos del campus
- Vinculación de reportes a eventos
- Vista mensual y semanal
- Notificaciones de eventos próximos

### 7. Notificaciones
- Sistema de notificaciones en tiempo real (Supabase Realtime)
- Alertas por proximidad geográfica
- Notificaciones de la red social (solicitudes de amistad, comentarios, likes)
- Gestión y filtrado por tipo de notificación
- Notificaciones push (vía Service Worker)
- Contador de notificaciones no leídas en sidebar
- Solicitud de permiso de notificaciones

### 8. Auditoría
- Registro de acciones del sistema (`audit_log`)
- Historial de cambios por entidad
- Panel de actividad con filtros avanzados (fecha, usuario, entidad, acción)

### 9. Gestión de Usuarios y Roles
- CRUD completo de usuarios con permisos granulares
- Sistema de roles: `super_admin`, `administrador`, `operador`, `usuario`
- Row Level Security (RLS) en PostgreSQL para aislamiento de datos
- Carga masiva de usuarios (bulk upload)
- Gestión de permisos por entidad
- Bloqueo por intentos fallidos de inicio de sesión (`login_attempts`)
- Cambio obligatorio de contraseña en primer inicio de sesión
- Limpieza automática de datos al cambiar de usuario en el mismo dispositivo

---

## Sistema de Información Geográfica (SIG)

El núcleo del proyecto es su infraestructura GIS, estructurada en seis etapas:

| Etapa | Descripción | Tecnología |
|-------|-------------|------------|
| **Captura de datos** | GPS automático del dispositivo o selección manual en mapa interactivo | `Geolocation API`, Leaflet `onclick` |
| **Enriquecimiento contextual** | Geocodificación inversa y obtención de infraestructura (edificio, piso, aula) | Nominatim API, Overpass API |
| **Almacenamiento geoespacial** | Persistencia de coordenadas como `geography(POINT, 4326)` con indexación GIST | PostGIS |
| **Procesamiento espacial** | Detección de reportes similares por proximidad y asignación de operadores | `ST_DWithin`, `ST_Distance` |
| **Seguimiento en tiempo real** | Rastreo de operadores en campo con verificación de llegada | Supabase Realtime, `user_locations` |
| **Visualización analítica** | Mapas de calor, distribución geográfica y filtrado espacial | Leaflet.heat, capas OSM |

### Funciones GIS Implementadas

- **Geolocalización de reportes**: Captura automática (GPS del dispositivo) o selección manual en mapa al crear un reporte
- **Geocodificación inversa**: Conversión de coordenadas a dirección legible mediante Nominatim API
- **Detección de reportes cercanos**: Identificación de incidentes similares en un radio configurable usando `ST_DWithin`
- **Asignación por proximidad**: Selección del operador más cercano al incidente mediante `ST_Distance`
- **Geotracking**: Seguimiento en tiempo real de operadores asignados a reportes activos
- **Mapas de calor (heatmaps)**: Visualización de zonas con mayor concentración de incidentes vía `leaflet.heat`
- **Áreas OSM**: Superposición de datos de infraestructura del campus (edificios, aulas, pisos) desde OpenStreetMap vía Overpass API
- **Notificaciones por proximidad**: Alertas automáticas cuando se detectan reportes cercanos a la ubicación actual del usuario
- **Cálculo de distancias**: Función Haversine implementada en `lib/distance.ts` para cálculos en frontend

---

## Seguridad

| Capa | Implementación |
|------|----------------|
| **Autenticación** | JWT con expiración, refresh tokens automáticos, persistencia en localStorage |
| **Bloqueo de cuentas** | Tabla `login_attempts` para detectar y bloquear intentos fallidos |
| **Autorización** | Row Level Security (RLS) a nivel de base de datos PostgreSQL |
| **Roles** | Tabla separada `user_roles` con función `has_role()` definida como `SECURITY DEFINER` |
| **Aislamiento** | Usuarios ven solo datos propios (`user_id`) o según permisos asignados |
| **Auditoría** | Registro de accesos, cambios y acciones en tabla `audit_log` |
| **Datos sensibles** | Soft delete (`deleted_at`), minimización en vistas públicas, exclusión de contraseñas |
| **Edge Functions** | Verificación JWT con `supabase.auth.getUser()` en cada función |
| **Cambio de usuario** | Limpieza automática de caché local y ubicaciones al cambiar de cuenta en el mismo navegador |

---

## Configuración de Supabase

Supabase es el backend del proyecto y proporciona autenticación, base de datos PostgreSQL con PostGIS, Realtime (WebSockets), Edge Functions (Deno) y Storage. A continuación se detalla la configuración completa.

### Requisitos del Proyecto Supabase

- **Proyecto activo** en [supabase.com](https://supabase.com) (plan Free es suficiente para la PoC)
- **PostGIS** habilitado como extensión de base de datos
- Proveedor de autenticación **Email/Password** activado
- **Supabase CLI** instalada para migraciones y Edge Functions:
  ```bash
  npm install -g supabase
  # o: scoop install supabase (Windows)
  # o: brew install supabase/tap/supabase (macOS)
  ```

### Configuración Inicial

```bash
# 1. Crear proyecto en https://supabase.com/dashboard
# 2. Anotar Project ID, URL y anon key
# 3. Habilitar PostGIS:
#    SQL Editor → CREATE EXTENSION IF NOT EXISTS postgis;
# 4. Configurar Auth:
#    Authentication → Settings → Site URL: http://localhost:8080
#    Authentication → Settings → Redirect URLs: http://localhost:8080/**
#    Authentication → Providers → Email: habilitado
# 5. Vincular proyecto local:
supabase login
supabase link --project-ref tgrfsuewkayqrobdfesa
```

### Migraciones de Base de Datos

El proyecto incluye **11 migraciones SQL** en `supabase/migrations/` que deben aplicarse en orden cronológico:

| Archivo | Fecha | Contenido |
|---------|-------|-----------|
| `20260123_*.sql` | 23 Ene 2026 | Políticas RLS para `user_locations` |
| `20260124_*.sql` (1) | 24 Ene 2026 | Políticas RLS para `reporte_historial` |
| `20260124_*.sql` (2) | 24 Ene 2026 | Funciones: `cleanup_stale_user_locations()`, `delete_user_location()`, trigger de limpieza |
| `20260127_*.sql` | 27 Ene 2026 | Tabla `active_trackings` + RLS + índices |
| `20260128_*.sql` | 28 Ene 2026 | Tipo enum `reporte_historial_tipo`, índices en `reporte_historial` |
| `20260211_*.sql` | 11 Feb 2026 | Vista `profiles_public` con `security_invoker` |
| `20260212_*.sql` | 12 Feb 2026 | Fix `search_path` en funciones existentes |
| `20260223_*.sql` | 23 Feb 2026 | Función `handle_new_user()` — registro automático con roles, permisos y auditoría |
| `20260310_*.sql` | 10 Mar 2026 | Tablas: `eventos`, `evento_reportes`, `encuestas`, `encuesta_opciones`, `encuesta_respuestas` + RLS |
| `20260617_*.sql` (1) | 17 Jun 2026 | Ajustes menores de políticas |
| `20260617_*.sql` (2) | 17 Jun 2026 | Grant `SELECT(email)` en `profiles` para usuarios autenticados |

```bash
# Aplicar migraciones
supabase db push

# Descargar esquema actual (si cambió desde el dashboard)
supabase db pull

# Regenerar tipos TypeScript locales (después de cambios en el esquema)
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

### Esquema de Base de Datos (~30 tablas de negocio)

Las tablas están agrupadas por módulo funcional:

**Auth y Perfiles**
| Tabla | Propósito |
|-------|-----------|
| `profiles` | Perfiles de usuario (name, username, avatar, email, estado) |
| `user_roles` | Roles y permisos granulares por usuario |
| `login_attempts` | Registro de intentos de inicio de sesión (seguridad) |
| `settings` | Preferencias de usuario (tracking en tiempo real, etc.) |
| `user_audit` | Auditoría de cambios en usuarios |

**Reportes e Incidentes**
| Tabla | Propósito |
|-------|-----------|
| `reportes` | Reportes de incidentes con geolocalización (`geography POINT`) |
| `incidents` | Tabla adicional de incidentes con ubicación |
| `incident_history` | Historial de cambios de incidentes |
| `reporte_historial` | Historial de asignaciones y cambios de estado |
| `reporte_confirmaciones` | Confirmaciones de reportes |
| `active_trackings` | Seguimientos activos de operadores en campo |
| `categories` | Categorías de reportes |
| `tipo_categories` | Tipos de reporte dentro de cada categoría |

**Red Social**
| Tabla | Propósito |
|-------|-----------|
| `publicaciones` | Publicaciones del muro social |
| `comentarios` | Comentarios en publicaciones |
| `comentario_menciones` | Menciones (@usuario) en comentarios |
| `interacciones` | Likes/reacciones a publicaciones |
| `encuestas` | Encuestas asociadas a publicaciones |
| `encuesta_opciones` | Opciones de respuesta de encuestas |
| `encuesta_respuestas` | Votos/respuestas de usuarios a encuestas |
| `hashtags` | Hashtags del sistema |
| `publicacion_hashtags` | Relación publicaciones-hashtags |
| `publicacion_menciones` | Menciones en publicaciones |
| `publicacion_compartidos` | Veces compartida una publicación |
| `publicacion_guardadas` | Publicaciones guardadas por usuarios |
| `publicacion_vistas` | Vistas de publicaciones |
| `relaciones` | Relaciones de amistad/seguimiento entre usuarios |
| `user_blocks` | Bloqueos entre usuarios |
| `usuarios_silenciados` | Usuarios silenciados |
| `user_hashtag_follows` | Seguimiento de hashtags |

**Mensajería**
| Tabla | Propósito |
|-------|-----------|
| `conversaciones` | Conversaciones (individuales y grupales) |
| `participantes_conversacion` | Miembros de cada conversación con roles |
| `mensajes` | Mensajes con contenido, tipo y metadatos |
| `mensaje_reacciones` | Reacciones a mensajes |
| `message_receipts` | Recibos de entrega y lectura |
| `group_history` | Historial de cambios en grupos |

**Notificaciones**
| Tabla | Propósito |
|-------|-----------|
| `notifications` | Notificaciones en tiempo real con tipo, origen y destino |

**GIS y Geolocalización**
| Tabla | Propósito |
|-------|-----------|
| `user_locations` | Ubicaciones de usuarios (`geography POINT`) para tracking |
| `eventos` | Eventos del campus con coordenadas (lat, lng) |
| `evento_reportes` | Vinculación entre eventos y reportes |

**Estados Temporales (Stories)**
| Tabla | Propósito |
|-------|-----------|
| `estados` | Estados temporales tipo stories con expiración |
| `estado_reacciones` | Reacciones a estados |
| `estado_vistas` | Vistas de estados |

**Multimedia**
| Tabla | Propósito |
|-------|-----------|
| `attachments` | Archivos adjuntos (imágenes subidas a Cloudinary/Supabase) |

**Vistas**
| Vista | Propósito |
|-------|-----------|
| `profiles_public` | Perfiles públicos (excluye email, deleted, inactivos) — `security_invoker` |
| `public_reportes_anonymized` | Reportes anonimizados para visualización pública |

### Tipos Enums Personalizados (12)

| Enum | Valores |
|------|---------|
| `user_status` | `activo`, `inactivo`, `bloqueado` |
| `user_role` | `super_admin`, `administrador`, `operador`, `usuario_regular`, `seguridad_uce` |
| `user_permission` | `ver_reporte`, `crear_reporte`, `editar_reporte`, `eliminar_reporte`, `ver_usuario`, `crear_usuario`, `editar_usuario`, `eliminar_usuario`, `ver_categoria`, `crear_categoria`, `editar_categoria`, `eliminar_categoria`, `ver_estado`, `crear_estado`, `editar_estado`, `eliminar_estado` |
| `incident_status` | `pendiente`, `en_progreso`, `resuelto`, `cancelado` |
| `incident_severity` | `bajo`, `medio`, `alto`, `urgente` |
| `notification_type` | `system`, `report_assigned`, `report_status`, `friend_request`, `message`, `nearby_report`, `comment`, `like`, `event` |
| `conversation_role` | `admin`, `member` |
| `tipo_interaccion` | `like`, `love`, `haha`, `wow`, `sad`, `angry` |
| `media_provider` | `cloudinary`, `supabase` |
| `report_visibility` | `publico`, `privado`, `internal` |
| `reporte_historial_tipo` | `creacion`, `asignacion`, `cambio_estado`, `comentario`, `reabierto`, `escalado` |
| `friend_request_status` | `pendiente`, `aceptada`, `rechazada`, `bloqueada` |

### Funciones RPC (Procedimientos Almacenados)

**Seguridad y Roles:**
| Función | Propósito |
|---------|-----------|
| `has_role(user_id uuid, role user_role)` → `boolean` | Verifica si un usuario tiene un rol específico (SECURITY DEFINER) |
| `has_permission(profile_id uuid, permission user_permission)` → `boolean` | Verifica si un perfil tiene un permiso específico |
| `get_profile_id_from_auth()` → `uuid` | Obtiene el profile_id del usuario autenticado actual |
| `get_profile_id_from_user_id(auth_user_id uuid)` → `uuid` | Convierte auth.users.id a profiles.id |
| `is_authenticated()` → `boolean` | Verifica si hay una sesión activa |
| `check_login_lockout(profile_id uuid)` → `boolean` | Verifica si una cuenta está bloqueada por intentos fallidos |

**GIS y Ubicaciones:**
| Función | Propósito |
|---------|-----------|
| `cleanup_stale_user_locations(inactivity_minutes int)` → `int` | Elimina ubicaciones de usuarios inactivos (admin) |
| `delete_user_location(target_user_id uuid)` → `boolean` | Elimina ubicación de un usuario específico |
| `get_reportes_similares_cercanos(...)` | Busca reportes similares por proximidad geográfica |
| `get_reportes_with_distance(...)` | Reportes con cálculo de distancia |
| `get_nearby_assignable_users(...)` | Usuarios asignables cerca de un punto |

**Mensajería:**
| Función | Propósito |
|---------|-----------|
| `mark_messages_read(conversation_id uuid)` | Marca mensajes como leídos |
| `mark_messages_delivered(conversation_id uuid)` | Marca mensajes como entregados |
| `hide_conversation_for_user(conversation_id uuid)` | Oculta conversación |
| `delete_message_for_everyone(message_id uuid)` | Elimina mensaje para todos |
| `is_conversation_participant(conversation_id uuid)` | Verifica participación |

**Auditoría y Utilidades:**
| Función | Propósito |
|---------|-----------|
| `handle_new_user()` | Trigger automático al registrar usuario (crea profile, roles, settings, audit_log) |
| `audit_user_login()` | Registra inicio de sesión en auditoría |
| `audit_user_logout()` | Registra cierre de sesión |
| `generate_unique_username(email text)` → `text` | Genera username único basado en email |
| `cleanup_expired_estados()` | Limpia estados temporales expirados |

### Autenticación

**Proveedor configurado:**
- **Email/Password** — registro con confirmación de email opcional

**Flujo de registro (`handle_new_user` trigger):**
1. Se crea el usuario en `auth.users`
2. El trigger `handle_new_user()` se ejecuta automáticamente
3. Crea perfil en `profiles` con username único y metadatos
4. Asigna roles según metadatos (`raw_user_meta_data.roles`)
5. Asigna permisos según metadatos (`raw_user_meta_data.permisos`)
6. Crea registro en `settings` con valores por defecto
7. Crea registro de auditoría en `user_audit`
8. Si el primer usuario del sistema → rol `super_admin` con todos los permisos
9. Si es creado por admin con contraseña temporal → `must_change_password = true`

**Seguridad de sesión:**
- JWT con expiración configurable (por defecto 1 hora)
- Refresh tokens automáticos (configurado en `client.ts`)
- Bloqueo por intentos fallidos vía `login_attempts`
- Persistencia de sesión en `localStorage`

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado. Principios generales:

| Principio | Implementación |
|-----------|----------------|
| **Propios datos** | `user_id = get_profile_id_from_auth()` en tablas de usuario |
| **Roles** | `has_role(auth.uid(), 'super_admin')` para operaciones administrativas |
| **Permisos** | `has_permission(get_profile_id_from_auth(), 'ver_reporte')` para acciones específicas |
| **Autenticados** | `get_profile_id_from_auth() IS NOT NULL` para vistas generales |
| **Público** | Solo vistas anonimizadas (`public_reportes_anonymized`) |

Las políticas se definen por tabla con nombres descriptivos, ej.:
- `user_locations_insert_own` — solo insertar propia ubicación
- `reportes_select_authorized` — ver reportes según visibilidad y permisos
- `active_trackings_update_assigned` — el asignado puede actualizar su tracking

### Edge Functions en Supabase

Las 3 Edge Functions se ejecutan en el runtime de **Deno** y se configuran desde `supabase/config.toml`:

```toml
project_id = "tgrfsuewkayqrobdfesa"

[functions.cleanup-user-locations]
verify_jwt = false

[functions.analyze-report-image]
verify_jwt = false

[functions.cloudinary-upload]
verify_jwt = false
```

**Variables de entorno requeridas por cada función:**

| Función | Variables |
|---------|-----------|
| `analyze-report-image` | `LOVABLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` (o `SUPABASE_SERVICE_ROLE_KEY`) |
| `cloudinary-upload` | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| `cleanup-user-locations` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` |

**Despliegue:**
```bash
supabase functions deploy analyze-report-image
supabase functions deploy cloudinary-upload
supabase functions deploy cleanup-user-locations

# Establecer secrets
supabase secrets set LOVABLE_API_KEY=tu_valor
supabase secrets set CLOUDINARY_CLOUD_NAME=tu_valor
supabase secrets set CLOUDINARY_API_KEY=tu_valor
supabase secrets set CLOUDINARY_API_SECRET=tu_valor

# Ejecución local
supabase functions serve analyze-report-image --env-file .env
```

### Realtime

Configuración de canales WebSocket desde Supabase Dashboard → Realtime:

| Canal | Tablas | Propósito |
|-------|--------|-----------|
| `notifications` | `notifications` | Notificaciones en tiempo real |
| `messages` | `mensajes`, `message_receipts` | Mensajería instantánea |
| `tracking` | `user_locations` | Seguimiento de ubicaciones de operadores |
| `presence` | — | Presencia online/offline de usuarios |
| `reportes` | `reportes` | Actualizaciones de estado de reportes |

La suscripción se realiza desde el frontend mediante el cliente de Supabase:
```typescript
supabase
  .channel('notifications')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profileId}` },
    (payload) => { /* manejar notificación */ }
  )
  .subscribe();
```

### Storage

Actualmente no se utilizan buckets de Supabase Storage directamente. Las imágenes se suben a **Cloudinary** mediante la Edge Function `cloudinary-upload`. Si se desea usar Supabase Storage:

1. Crear bucket desde Dashboard → Storage
2. Configurar políticas RLS:
   ```sql
   CREATE POLICY "Authenticated users can upload images"
   ON storage.objects FOR INSERT TO authenticated
   WITH CHECK (bucket_id = 'report-images');
   ```
3. Subir archivos mediante `supabase.storage.from('report-images').upload()`

---

## Estructura del Proyecto

```
unialertaUCE/
│
├── src/                                # Código fuente del frontend
│   ├── main.tsx                        # Punto de entrada + registro Service Worker
│   ├── App.tsx                         # Componente raíz con enrutamiento y providers
│   ├── index.css                       # Variables CSS, tokens de diseño, temas
│   │
│   ├── components/                     # 243 componentes de interfaz de usuario
│   │   ├── AppLayout.tsx               # Layout principal (sidebar + header + outlet)
│   │   ├── AppSidebar.tsx              # Barra de navegación lateral
│   │   ├── ProtectedRoute.tsx          # Guardia de autenticación
│   │   ├── LoadingScreen.tsx           # Pantalla de carga
│   │   ├── audit/                      # Panel de auditoría
│   │   ├── auth/                       # Formularios de autenticación
│   │   ├── calendario/                 # Calendario de eventos
│   │   ├── categories/                 # Gestión de categorías
│   │   ├── dashboard/                  # Dashboard analítico (17 componentes)
│   │   ├── details/                    # Vistas de detalle
│   │   ├── estados/                    # Estados temporales (tipo stories)
│   │   ├── form/                       # Formularios de login/registro
│   │   ├── Map/                        # Componentes GIS/Leaflet (7 componentes)
│   │   ├── messages/                   # Sistema de mensajería
│   │   ├── notifications/              # Sistema de notificaciones
│   │   ├── profile/                    # Perfil de usuario
│   │   ├── redsocial/                  # Red social (publicaciones, comentarios, etc.)
│   │   ├── report/                     # Formularios y detalle de reportes
│   │   ├── report-types/               # Gestión de tipos de reporte
│   │   ├── settings/                   # Configuración de usuario
│   │   ├── table/                      # Tablas de datos
│   │   ├── tracking/                   # Componentes de geotracking
│   │   ├── ui/                         # ~100 componentes base shadcn/ui
│   │   └── users/                      # Gestión de usuarios
│   │
│   ├── contexts/                       # 7 React Contexts (providers globales)
│   │   ├── AuthContext.tsx             # Autenticación (usuario, sesión, loading)
│   │   ├── ThemeContext.tsx            # Tema (claro/oscuro/sistema)
│   │   ├── LocationContext.tsx         # Geolocalización del usuario
│   │   ├── UserPresenceContext.tsx     # Presencia online/offline
│   │   ├── NotificationsContext.tsx    # Notificaciones en tiempo real
│   │   ├── NearbyReportNotificationsContext.tsx  # Alertas de proximidad
│   │   └── MessagingContext.tsx        # Estado del chat
│   │
│   ├── hooks/                          # 126 hooks personalizados
│   │   ├── controlador/                # 63 hooks de lógica de negocio
│   │   ├── entidades/                  # 33 hooks de acceso a datos (CRUD optimizado)
│   │   ├── estados/                    # 5 hooks de estados temporales
│   │   ├── messages/                   # 7 hooks de mensajería
│   │   ├── optimizacion/               # 5 hooks de rendimiento
│   │   └── users/                      # 4 hooks CRUD de usuarios
│   │
│   ├── integrations/supabase/          # Integración con Supabase
│   │   ├── client.ts                   # Cliente Supabase inicializado
│   │   └── types.ts                    # Tipos de base de datos (auto-generados)
│   │
│   ├── lib/                            # Utilidades
│   │   ├── utils.ts                    # Función cn() (clsx + tailwind-merge)
│   │   ├── distance.ts                 # Cálculo Haversine de distancia
│   │   └── reportStatus.ts             # Lógica de estados derivados de reportes
│   │
│   ├── pages/                          # 41 páginas (una por ruta)
│   │   ├── Index.tsx, Login.tsx, Registro.tsx, ForgotPassword.tsx
│   │   ├── Dashboard.tsx, Bienvenida.tsx
│   │   ├── Reportes.tsx, ReporteForm.tsx, CrearReporte.tsx, ReporteDetalle.tsx, MisReportes.tsx
│   │   ├── Categorias.tsx, CategoriaForm.tsx, CategoriaDetalle.tsx, CategoriasBulkUpload.tsx
│   │   ├── TipoReportes.tsx, TipoReporteForm.tsx, TipoReporteDetalle.tsx, TipoReportesBulkUpload.tsx
│   │   ├── Usuarios.tsx, UsuarioForm.tsx, UsuarioDetalle.tsx, UsuariosBulkUpload.tsx
│   │   ├── RedSocial.tsx, PostDetalle.tsx, TrendingPosts.tsx, PerfilRedSocial.tsx
│   │   ├── Mensajes.tsx, Notificaciones.tsx, Auditoria.tsx, Rastreo.tsx, GeoTracking.tsx
│   │   ├── Calendario.tsx, MiPerfil.tsx, EditarPerfil.tsx, Configuracion.tsx
│   │   ├── Instalar.tsx, NotFound.tsx
│   │   └── ReportesBulkUpload.tsx
│   │
│   └── test/                           # Configuración de pruebas
│       ├── setup.ts                    # Setup de Vitest + Testing Library
│       └── example.test.ts             # Test de ejemplo
│
├── supabase/                           # Backend (BaaS)
│   ├── config.toml                     # Configuración del proyecto Supabase
│   ├── functions/                      # 3 Edge Functions (Deno)
│   │   ├── analyze-report-image/       # Análisis de imágenes con IA (Gemini 2.5 Flash)
│   │   ├── cleanup-user-locations/     # Limpieza de ubicaciones obsoletas
│   │   └── cloudinary-upload/          # Subida firmada SHA-1 a Cloudinary
│   └── migrations/                     # 11 migraciones SQL + backup
│       ├── 20260123210950_*.sql
│       ├── 20260124044930_*.sql
│       ├── ...
│       └── backup_supabase.dump        # Dump completo de la base de datos
│
├── docs/                               # Documentación técnica (39 archivos)
│   ├── DOCUMENTO_ARQUITECTURA.md       # Arquitectura del sistema
│   ├── DOCUMENTO_REQUERIMIENTOS.md     # Requerimientos funcionales
│   ├── MODELO_DATOS.md                 # Modelo de datos completo (~1331 líneas)
│   ├── MANUAL_INSTALACION.md           # Manual de instalación
│   ├── MANUAL_TECNICO.md               # Manual técnico
│   ├── MANUAL_USUARIO.md               # Manual de usuario
│   ├── PLAN_INFORME_PRUEBAS.md         # Plan de pruebas
│   └── ...                             # 33 archivos adicionales
│
├── public/                             # Archivos estáticos
│   ├── favicon.ico
│   ├── robots.txt                      # SEO: permite todos los bots + sitemap
│   ├── sitemap.xml                     # 5 URLs indexadas
│   ├── llms.txt                        # Pistas de indexación para LLMs
│   ├── placeholder.svg                 # Placeholder para imágenes
│   └── icons/                          # 8 tamaños de icono PWA (72x72 a 512x512)
│
├── .env                                # Variables de entorno locales (NO COMMITEAR)
├── .gitignore                          # Reglas de ignorado
├── .lovable/plan.md                    # Plan de Lovable AI
├── bun.lock / bun.lockb                # Lock files de Bun
├── components.json                     # Configuración de shadcn/ui
├── eslint.config.js                    # ESLint flat config
├── index.html                          # HTML principal (SEO, PWA, OG, LD+JSON)
├── package.json                        # Dependencias y scripts
├── package-lock.json                   # Lock file de npm
├── postcss.config.js                   # Configuración de PostCSS
├── tailwind.config.ts                  # Configuración de Tailwind CSS
├── tsconfig.json                       # TypeScript (config raíz)
├── tsconfig.app.json                   # TypeScript (src/)
├── tsconfig.node.json                  # TypeScript (vite.config)
├── vite.config.ts                      # Vite + PWA plugin
└── vitest.config.ts                    # Configuración de Vitest
```

---

## Requisitos Previos

- **Node.js** 18+ (recomendado 20 LTS)
- **npm** 9+ o **bun** 1.x
- Proyecto **Supabase** activo con extensión **PostGIS** habilitada
- Cuenta en **Cloudinary** (para subida de imágenes)
- (Opcional) **Supabase CLI** para desplegar Edge Functions localmente

---

## Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd unialertaUCE
```

### 2. Instalar Dependencias

```bash
npm install
# o con bun:
bun install
```

### 3. Configurar Variables de Entorno

```bash
cp .env.example .env
```

Luego edita `.env` con las credenciales de tu proyecto Supabase (ver [Variables de Entorno](#variables-de-entorno)).

### 4. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Habilita la extensión **PostGIS** en Database → Extensions
3. Ejecuta las migraciones en `supabase/migrations/` en orden cronológico:

```bash
npx supabase db push
```

4. Configura la autenticación (Email/Password como mínimo) en Authentication → Settings
5. Despliega las Edge Functions (ver [Edge Functions](#edge-functions-supabase))

### 5. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:8080](http://localhost:8080).

---

## Variables de Entorno

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `VITE_SUPABASE_URL` | Sí | URL del proyecto Supabase (`https://*.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Sí | Clave anónima (publishable) de Supabase |
| `VITE_SUPABASE_PROJECT_ID` | Sí | ID del proyecto Supabase |
| `LOVABLE_API_KEY` | No* | API key para Lovable AI Gateway (analyze-report-image) |
| `CLOUDINARY_CLOUD_NAME` | No* | Cloud name de Cloudinary (cloudinary-upload) |
| `CLOUDINARY_API_KEY` | No* | API key de Cloudinary |
| `CLOUDINARY_API_SECRET` | No* | API secret de Cloudinary |
| `SUPABASE_SERVICE_ROLE_KEY` | No* | Service role key de Supabase (cleanup-user-locations) |

*\*Requeridas solo si se usan las Edge Functions correspondientes.*

Ejemplo de `.env`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIs...
VITE_SUPABASE_PROJECT_ID=tu-project-id
```

> **⚠️ Seguridad:** El archivo `.env` contiene credenciales reales y está incluido en `.gitignore`. Nunca commitees credenciales.

---

## Ejecución en Desarrollo

```bash
# Iniciar servidor de desarrollo (con HMR)
npm run dev
# → http://localhost:8080

# Compilar para producción
npm run build
# → Salida en dist/

# Vista previa del build de producción
npm run preview

# Compilar en modo development
npm run build:dev

# Ejecutar linter
npm run lint
```

### Configuración del Servidor de Desarrollo

| Parámetro | Valor |
|-----------|-------|
| Puerto | 8080 |
| Host | `::` (IPv6 + IPv4) |
| HMR | Habilitado (SWC) |
| Lovable tagger | Activado automáticamente en development |

---

## Construcción y Producción

El build de producción se genera con `npm run build` usando `vite build` y produce archivos optimizados en `dist/`.

### Estrategia de Caching PWA (Workbox)

| Recurso | Estrategia | Nombre de Cache | Duración |
|---------|-----------|-----------------|----------|
| Supabase REST API | NetworkFirst | `supabase-api-cache` | 24 horas |
| Supabase Auth | NetworkOnly | — | — |
| Supabase Realtime | NetworkOnly | — | — |
| Supabase Storage | CacheFirst | `supabase-storage-cache` | 7 días |
| Google Fonts | CacheFirst | `google-fonts-cache` | 1 año |
| Cloudinary (imágenes) | CacheFirst | `cloudinary-cache` | 30 días |
| Imágenes generales | CacheFirst | `images-cache` | 30 días |
| OpenStreetMap tiles | CacheFirst | `osm-tiles-cache` | 7 días |

### Características del Build

- **Límite de archivo en caché:** 5 MB por archivo
- **Patrones de glob:** `**/*.{js,css,html,ico,png,svg,woff,woff2}`
- **Fallback de navegación:** Deniega rutas que comiencen con `/~oauth`
- **Nombres con hash** para cache busting de recursos estáticos

---

## Edge Functions (Supabase)

El proyecto incluye 3 Edge Functions escritas en **Deno** con **TypeScript**:

### `analyze-report-image`

Analiza imágenes de incidentes usando IA para clasificar categoría, tipo, prioridad y generar descripción automática.

- **Modelo:** Google Gemini 2.5 Flash (vía Lovable AI Gateway)
- **Autenticación:** JWT requerido (Bearer token)
- **Input:** `{ imageUrl | imageBase64, categories?, tipoReportes?, context? }`
- **Output:** `{ titulo, descripcion, categoriaId, tipoReporteId, prioridad, infoAdicional }`
- **Características:**
  - Recupera categorías y tipos desde la base de datos si no se proporcionan
  - Prompt de sistema estructurado con la taxonomía completa del campus
  - Fallback si la respuesta JSON del modelo no es parseable
  - Manejo de errores HTTP 429 (rate limit) y 402 (paywall)

### `cloudinary-upload`

Subida firmada de archivos a Cloudinary con autenticación JWT y firma SHA-1.

- **Autenticación:** JWT requerido
- **Input:** `{ file (base64), folder?, tags? }`
- **Output:** `{ public_id, secure_url, url, format, width, height, bytes, ... }`
- **Límite:** ~10 MB
- **Seguridad:** Firma SHA-1 generada del lado del servidor

### `cleanup-user-locations`

Limpieza de ubicaciones de usuarios inactivos, stale y offline.

- **Acciones:**
  - `cleanup_user`: Elimina ubicación propia (o de otro usuario si es admin)
  - `cleanup_stale`: Limpia ubicaciones con inactividad > N minutos (requiere admin)
  - `cleanup_offline_users`: Elimina ubicaciones de usuarios desconectados (requiere admin)
- **Verificación de roles:** `has_role()` vía RPC para acciones administrativas

### Despliegue de Edge Functions

```bash
# Requiere Supabase CLI
npm install -g supabase

# Ejecutar localmente
supabase functions serve analyze-report-image --env-file .env

# Desplegar a producción
supabase functions deploy analyze-report-image
supabase functions deploy cloudinary-upload
supabase functions deploy cleanup-user-locations
```

---

## Progressive Web App (PWA)

### Manifiesto

| Campo | Valor |
|-------|-------|
| **Nombre** | UniAlerta UCE |
| **Short name** | UniAlerta |
| **Descripción** | Sistema de gestión de reportes y alertas universitarias en tiempo real |
| **Theme color** | `#3b82f6` (azul primary) |
| **Background color** | `#0f172a` (slate oscuro) |
| **Display** | `standalone` |
| **Orientación** | `portrait-primary` |
| **Idioma** | `es` |
| **Categorías** | utilities, productivity, social |
| **Iconos** | 8 tamaños (72×72 a 512×512, maskable + any) |
| **Screenshots** | Mobile (390×844) + Desktop (1920×1080) |

### Service Worker

- **Registro automático** desde `main.tsx` al cargar la página
- **Auto-update** cuando se detecta una nueva versión del SW
- **Estrategias de caching** diferenciadas por tipo de recurso (ver tabla en sección de producción)

### Meta Tags

- **iOS:** `apple-mobile-web-app-capable`, `apple-touch-icon`, `apple-touch-startup-image`
- **Android:** `mobile-web-app-capable`, `msapplication-TileColor`
- **Open Graph / Twitter Cards:** Compartir en redes sociales con imagen y descripción
- **Schema.org (LD+JSON):** Datos estructurados `WebSite` y `Organization` para motores de búsqueda

---

## Base de Datos y PostGIS

### Tablas Principales (~30 tablas)

| Tabla | Campo Geográfico | Tipo | Descripción |
|-------|-------------------|------|-------------|
| `reportes` | `geolocation` | `geography(POINT, 4326)` | Ubicación del incidente reportado |
| `user_locations` | `location` | `geography(POINT, 4326)` | Última posición conocida del usuario |
| `incidents` | `location` | `geography(POINT, 4326)` | Punto geográfico del incidente |
| `eventos` | `lat`, `lng` | `double precision` | Coordenadas del evento del campus |
| `active_trackings` | — | relacional | Seguimiento activo (reporte + usuario + estado) |

### Tipos Personalizados (Enums)

| Tipo | Valores |
|------|---------|
| `user_status` | activo, inactivo, bloqueado |
| `user_role` | super_admin, administrador, operador, usuario |
| `user_permission` | create, read, update, delete, manage, assign, track, audit |
| `incident_status` | pendiente, en_progreso, resuelto, cancelado |
| `incident_severity` | bajo, medio, alto, urgente |
| `notification_type` | system, report_assigned, report_status, friend_request, message, nearby_report, comment, like, event |
| `conversation_role` | admin, member |
| `tipo_interaccion` | like, love, haha, wow, sad, angry |
| `media_provider` | cloudinary, supabase |

### Funciones Geoespaciales

| Función | Propósito |
|---------|-----------|
| `ST_DWithin(geography, geography, float)` | Detección de reportes cercanos en radio configurable |
| `ST_Distance(geography, geography)` | Cálculo de distancia para asignación del operador más cercano |
| `ST_SetSRID(ST_MakePoint(lng, lat), 4326)` | Creación de puntos geográficos WGS84 |
| Índice **GIST** | Indexación espacial sobre columnas `geography` |

### Migraciones

Las migraciones SQL en `supabase/migrations/` (orden cronológico, enero—junio 2026) incluyen:

- Creación de tablas con tipos enums personalizados
- Extensión PostGIS y configuración SRID 4326
- Índices GIST para consultas espaciales eficientes
- Funciones RPC (`has_role()`, `delete_user_location()`, `cleanup_stale_user_locations()`)
- Políticas RLS por tabla
- Triggers de `updated_at` automático
- Soft delete con `deleted_at`

---

## Pruebas

### Stack de Testing

| Herramienta | Propósito |
|-------------|-----------|
| **Vitest 3.x** | Framework de pruebas unitarias |
| **jsdom** | Entorno DOM simulado en Node.js |
| **@testing-library/jest-dom** | Aserciones DOM accesibles |

### Configuración

- **Setup automático:** `src/test/setup.ts`
- **Patrón de archivos:** `src/**/*.{test,spec}.{ts,tsx}`
- **Alias de paths:** `@` → `./src` (idéntico a Vite)
- **Variables globales:** Habilitadas (`globals: true`)

### Ejecutar Pruebas

```bash
# Ejecutar pruebas una vez
npx vitest run

# Modo watch (desarrollo)
npx vitest

# Con interfaz UI
npx vitest --ui
```

> **⚠️ Pendiente:** No existe script `npm test` en `package.json`. Se recomienda agregar:
> ```json
> "scripts": {
>   "test": "vitest run",
>   "test:watch": "vitest"
> }
> ```

---

## Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo en puerto 8080 |
| `npm run build` | Compila para producción en `dist/` |
| `npm run build:dev` | Compila en modo development |
| `npm run preview` | Vista previa del build de producción |
| `npm run lint` | Ejecuta ESLint en todo el proyecto |
| `npx vitest run` | Ejecuta pruebas unitarias (una vez) |
| `npx vitest` | Ejecuta pruebas en modo watch |
| `supabase functions serve <name>` | Ejecuta Edge Function localmente |
| `supabase functions deploy <name>` | Despliega Edge Function a Supabase |
| `supabase db push` | Aplica migraciones locales a Supabase |
| `supabase gen types typescript --linked` | Regenera tipos TypeScript desde esquema |

---

## Flujo de Despliegue

El despliegue actual se realiza en la plataforma **Lovable** ([https://unialerta.lovable.app](https://unialerta.lovable.app)). No hay pipeline CI/CD automatizado configurado.

### Despliegue Manual (Frontend)

```bash
# 1. Compilar
npm run build

# 2. Desplegar contenido de dist/ al hosting
# (Lovable, Vercel, Netlify, Cloudflare Pages, etc.)
```

### Despliegue de Edge Functions

```bash
supabase functions deploy analyze-report-image
supabase functions deploy cloudinary-upload
supabase functions deploy cleanup-user-locations
```

### Despliegue de Migraciones

```bash
supabase db push
```

### Recomendación: Pipeline CI/CD (GitHub Actions)

Se sugiere configurar un pipeline que:

1. Instale dependencias (`npm ci`)
2. Ejecute linter (`npm run lint`)
3. Ejecute pruebas (`npx vitest run`)
4. Compile (`npm run build`)
5. Despliegue a hosting estático
6. Despliegue Edge Functions y migraciones a Supabase

---

## Datos Simulados

> **⚠️ IMPORTANTE:** Todos los datos del sistema son **sintéticos y ficticios**.

- Los usuarios, reportes, ubicaciones y comunicaciones son generados sin referencia a personas o eventos reales
- Los nombres, correos y coordenadas son plausibles pero **no corresponden** a individuos o lugares específicos reales
- Los correos usan dominios ficticios (`@ejemplo.test`, `@prueba.local`)
- Las coordenadas se ubican dentro del perímetro del campus pero no representan incidentes reales
- Las imágenes son de demostración y no contienen datos personales

Esta estrategia permite validar la funcionalidad del sistema sin comprometer la privacidad de ninguna persona. Ver `docs/CAPITULO_DATOS_SINTETICOS_PROTECCION_PRIVACIDAD.md` para más detalles.

---

## Guía de Contribución

### Convenciones de Código

- **Lenguaje:** TypeScript (preferir tipos explícitos, evitar `any`)
- **Estilo:** ESLint con reglas de TypeScript ESLint + React Hooks
- **Componentes:** Patrón de composición shadcn/ui; un componente por archivo
- **Hooks:** Lógica de negocio en `hooks/controlador/`, acceso a datos en `hooks/entidades/`
- **Páginas:** Una página por archivo en `pages/`
- **Estilos:** Tailwind CSS con función `cn()` de `@/lib/utils` para merging condicional
- **Mapas:** Componentes GIS/Leaflet en `components/Map/`
- **Animaciones:** Framer Motion para animaciones complejas; Tailwind para transiciones simples

### Flujo de Trabajo

1. Crea una rama desde `main` con nombre descriptivo: `feat/nombre`, `fix/descripcion`
2. Realiza cambios siguiendo las convenciones del proyecto
3. Ejecuta `npm run lint` antes de commitear
4. Si aplica, agrega pruebas unitarias en `src/test/`
5. Commit con mensaje descriptivo en español
6. Envía Pull Request con descripción clara de los cambios

### Formato de Commits (Recomendado)

```
tipo: descripción breve

Tipos: feat, fix, docs, refactor, test, chore, style
```

Ejemplos:
- `feat: agregar geocodificación inversa en formulario de reportes`
- `fix: corregir error de CORS en Edge Function cloudinary-upload`
- `docs: actualizar documentación del modelo de datos`

---

## Buenas Prácticas

### Desarrollo

1. **TypeScript:** Evita `any`. Prefiere tipos explícitos, genéricos o inferencia segura
2. **Componentes:** Una sola responsabilidad por componente; divide componentes grandes en subcomponentes
3. **Hooks:** Encapsula lógica de negocio en hooks; no mezcles lógica con UI
4. **TanStack Query:** Usa `useQuery` para lecturas, `useMutation` para escrituras; configura `staleTime` adecuadamente
5. **Contextos:** Evalúa si realmente necesitas un nuevo contexto; a veces props drilling o composición son suficientes
6. **Leaflet:** Limpia instancias de mapas en el return de `useEffect` para evitar memory leaks
7. **Formularios:** Usa React Hook Form + Zod para validación consistente y tipada
8. **Rendimiento:** Aplica `React.memo`, `useMemo`, `useCallback` solo con evidencia de problemas

### Seguridad

1. **Nunca** expongas `service_role_key` en el frontend
2. **Siempre** verifica autenticación en Edge Functions con `supabase.auth.getUser()`
3. **RLS:** Toda tabla debe tener políticas RLS habilitadas
4. **Validación:** Valida datos en frontend (Zod) y backend (RLS + constraints DB)
5. **Auditoría:** Registra acciones importantes en `audit_log`

### GIS

1. **SRID:** Siempre usa SRID 4326 (WGS84) para coordenadas geográficas
2. **Índices:** Columnas `geography` deben tener índice GIST
3. **Precisión:** PostGIS usa punto flotante; redondea solo para visualización
4. **Nominatim:** Respeta el límite de 1 solicitud/segundo
5. **Overpass API:** Cachea respuestas para evitar solicitudes repetitivas

---

## Solución de Problemas Comunes

### Error 401 en Edge Functions
**Causa:** Token JWT faltante, expirado o inválido.
**Solución:** Verifica que el usuario esté autenticado. El token se envía automáticamente desde el cliente Supabase. Revisa que `VITE_SUPABASE_PUBLISHABLE_KEY` sea correcta.

### Error 429 en analyze-report-image
**Causa:** Límite de tasa excedido en Lovable AI Gateway.
**Solución:** Espera unos segundos y reintenta. Reduce la frecuencia de solicitudes si es recurrente.

### PostGIS no disponible
**Causa:** La extensión PostGIS no está habilitada.
**Solución:** Ejecuta `CREATE EXTENSION IF NOT EXISTS postgis;` en el editor SQL de Supabase o actívala en Database → Extensions.

### Error de CORS en Edge Functions
**Causa:** Headers CORS faltantes en la respuesta.
**Solución:** Incluye `corsHeaders` en toda función y maneja el método OPTIONS para preflight requests.

### Migraciones fallan al aplicar
**Causa:** Orden incorrecto o conflicto con datos existentes.
**Solución:** Revisa el orden cronológico de `supabase/migrations/`. Si hay datos existentes, puede requerir truncar tablas primero.

### Service Worker no se registra
**Causa:** `vite-plugin-pwa` no genera `sw.js` en development (solo en build).
**Solución:** Ejecuta `npm run build` y verifica que `dist/sw.js` exista. En dev, el SW se deshabilita (`devOptions.enabled: false`).

### Mapas Leaflet no cargan
**Causa:** Tiles de OpenStreetMap bloqueados o URL incorrecta.
**Solución:** Verifica la conexión a internet. Los tiles públicos de OSM no requieren API key. Revisa la consola del navegador por errores CORS.

### Tipos TypeScript desactualizados
**Causa:** El esquema de Supabase cambió y los tipos locales no se regeneraron.
**Solución:** Ejecuta `npx supabase gen types typescript --linked > src/integrations/supabase/types.ts`.

---

## Documentación Adicional

El directorio `docs/` contiene 39 archivos de documentación extendida:

### Arquitectura y Diseño
| Archivo | Descripción |
|---------|-------------|
| `DOCUMENTO_ARQUITECTURA.md` | Arquitectura completa del sistema (974 líneas) |
| `DOCUMENTO_REQUERIMIENTOS.md` | Requerimientos funcionales y no funcionales |
| `CAPITULO_ARQUITECTURA_PLATAFORMAS.md` | Análisis comparativo de plataformas |
| `CAPITULO_ARQUITECTURA_REST.md` | Diseño de API REST |
| `CAPITULO_CONTEXTUALIZACION.md` | Contexto del proyecto |
| `CAPITULO_OBJETIVOS_BENEFICIOS.md` | Objetivos y beneficios del sistema |
| `CAPITULO_PERTINENCIA_POC.md` | Justificación del PoC |
| `JUSTIFICACION_POC.md` | Documento de justificación académica |
| `CAPITULO_DIFERENCIACION_POC_PROTOTIPO_MVP.md` | Diferenciación PoC vs prototipo vs MVP |

### GIS y Geolocalización
| Archivo | Descripción |
|---------|-------------|
| `RELEVANCIA_GIS_GEOLOCALIZACION.md` | Relevancia del GIS en el proyecto |
| `PRINCIPIOS_GEOFENCING.md` | Principios de geofencing |
| `GEOLOCALIZACION_SENSORES_MOVIL.md` | Sensores de geolocalización en dispositivos móviles |
| `GESTION_ANALISIS_DATOS_ESPACIALES.md` | Gestión y análisis de datos espaciales |
| `CAPITULO_GESTION_DATOS_ESPACIALES_INDEXACION.md` | Indexación espacial |
| `VISUALIZACION_CARTOGRAFICA_INTERACTIVA.md` | Visualización cartográfica interactiva |
| `CAPITULO_INTEGRACION_APIS_EXTERNAS.md` | Integración de APIs externas (Nominatim, Overpass) |
| `CAPITULO_DESARROLLO_INTERFACES_COMPONENTES.md` | Desarrollo de interfaces y componentes |

### Modelo de Datos
| Archivo | Descripción |
|---------|-------------|
| `MODELO_DATOS.md` | Modelo de datos completo (~1331 líneas) |

### Pruebas
| Archivo | Descripción |
|---------|-------------|
| `PLAN_INFORME_PRUEBAS.md` | Plan de pruebas del sistema |
| `PRUEBAS_FUNCIONALES_MATRIZ.md` | Matriz de pruebas funcionales |
| `PRUEBAS_UI_MATRIZ.md` | Matriz de pruebas de interfaz de usuario |
| `PRUEBAS_AUTENTICACION_RESULTADOS.md` | Resultados de pruebas de autenticación |
| `PRUEBAS_REPORTES_RESULTADOS.md` | Resultados de pruebas de reportes |
| `PRUEBAS_USUARIOS_RESULTADOS.md` | Resultados de pruebas de usuarios |
| `PRUEBAS_CATEGORIAS_TIPOS_RESULTADOS.md` | Resultados de pruebas de categorías y tipos |
| `PRUEBAS_DASHBOARD_RESULTADOS.md` | Resultados de pruebas del dashboard |
| `PRUEBAS_MENSAJERIA_RESULTADOS.md` | Resultados de pruebas de mensajería |
| `PRUEBAS_REDSOCIAL_RESULTADOS.md` | Resultados de pruebas de red social |
| `PRUEBAS_FLUJO_GIS_FUNCIONAL.md` | Pruebas funcionales del flujo GIS |

### Manuales
| Archivo | Descripción |
|---------|-------------|
| `MANUAL_USUARIO.md` | Manual de usuario |
| `MANUAL_TECNICO.md` | Manual técnico |
| `MANUAL_INSTALACION.md` | Manual de instalación (417 líneas) |

### Privacidad y Ética
| Archivo | Descripción |
|---------|-------------|
| `CAPITULO_DATOS_SINTETICOS_PROTECCION_PRIVACIDAD.md` | Datos sintéticos y protección de privacidad |
| `CAPITULO_CLASIFICACION_ESCENARIOS_ERROR_DESASTRE.md` | Clasificación de escenarios de error y desastre |

### Otros
| Archivo | Descripción |
|---------|-------------|
| `CAPITULO_PROCESO_METODOLOGICO_VALIDACION_MOCKS.md` | Validación con datos mock |
| `CAPITULO_ESTRATEGIA_VALIDACION_DATOS_MOCK.md` | Estrategia de validación con datos mock |
| `CAPITULO_OBJETIVOS_SIMULACION.md` | Objetivos de simulación |
| `CAPITULO_ECOSISTEMA_BAAS.md` | Ecosistema Backend-as-a-Service |
| `GUIA_CAPTURAS_ANEXOS.md` | Guía de capturas de pantalla y anexos |

---

## Limitaciones del PoC

| Aspecto | Estado |
|---------|--------|
| Datos reales de usuarios | ❌ No utiliza — solo datos sintéticos |
| Cumplimiento normativo (LOPD/GDPR) | ❌ Fuera del alcance de la PoC |
| Pruebas de carga/escalabilidad | ❌ No realizadas |
| Modo offline completo | 🔄 Parcial (PWA con caching estratégico) |
| Consentimiento informado | ❌ No implementado |
| Eliminación completa de datos (GDPR) | ❌ Solo soft delete implementado |
| TypeScript strict mode | ❌ `strict: false`, `noImplicitAny: false`, `strictNullChecks: false` |
| Pruebas unitarias automatizadas | 🔄 Configurado (Vitest) pero sin cobertura significativa |
| CI/CD automatizado | ❌ No configurado |
| Contenedor Docker | ❌ No configurado |

---

## Suposiciones y Pendientes

Los siguientes aspectos fueron identificados durante el análisis y requieren atención o confirmación:

| Aspecto | Estado | Acción Recomendada |
|---------|--------|--------------------|
| `.env.example` | ❌ No existe | Crear archivo de ejemplo (sin credenciales reales) para facilitar onboarding de nuevos desarrolladores |
| Script `npm test` | ❌ No definido | Agregar `"test": "vitest run"` y `"test:watch": "vitest"` en `package.json` |
| CI/CD pipeline | ❌ No existe | Configurar GitHub Actions para lint, test y deploy automático |
| Docker / docker-compose | ❌ No existe | Evaluar si es necesario para estandarizar entornos de desarrollo |
| Prettier | ❌ No configurado | Agregar Prettier para formato automático y consistente de código |
| `tsconfig` strict mode | ❌ Deshabilitado | Considerar habilitar `strict: true` de forma progresiva |
| Nombre del paquete | ⚠️ `vite_react_shadcn_ts` | Renombrar a `unialerta-uce` en `package.json` |
| Archivo LICENSE | ❌ No existe | Agregar archivo de licencia formal (MIT, Apache 2.0, etc.) |
| Documentación de API | ❌ No existe | Generar documentación de las consultas Supabase y Edge Functions |
| Estrategia de branching Git | ❌ No documentada | Definir y documentar estrategia (Git Flow, GitHub Flow, etc.) |

---

## Licencia

Proyecto académico — Universidad Central del Ecuador (UCE).

Este proyecto es una **Prueba de Concepto (PoC)** desarrollada con fines educativos y de investigación. No está destinado para uso en producción.

---

<p align="center">
  <strong>UniAlerta UCE</strong> — Prueba de Concepto de Gestión de Incidentes con SIG<br/>
  <em>Universidad Central del Ecuador (UCE)</em><br/>
  <em>Todos los datos son simulados. No utilizar en producción.</em>
</p>
