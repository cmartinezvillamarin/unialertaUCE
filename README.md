# 🚨 UniAlerta UCE

**Plataforma de Gestión de Incidentes con Sistemas de Información Geográfica (SIG)**

> Prueba de Concepto (PoC) — Todos los datos son simulados. Este proyecto es una demostración técnica de viabilidad y **no** una implementación en producción.

---

## 📋 Descripción del Proyecto

UniAlerta UCE es una prueba de concepto que demuestra la viabilidad de integrar **Sistemas de Información Geográfica (SIG)** en la gestión de incidentes dentro de un campus universitario. La plataforma permite reportar, geolocalizar, rastrear y analizar incidentes de forma integral, combinando capacidades GIS con herramientas sociales y de comunicación.

### Propósito

- **Demostrar factibilidad técnica** de un sistema SIG aplicado a la gestión de incidentes universitarios.
- **Validar la arquitectura** cliente-servidor con componentes geoespaciales (PostGIS, Leaflet, OpenStreetMap).
- **Explorar la trazabilidad geográfica** desde el reporte de un incidente hasta su resolución en campo.
- **Evaluar la integración** de módulos complementarios: red social, mensajería, calendario y notificaciones.

---

## 🗺️ Sistema de Información Geográfica (SIG)

El núcleo del proyecto es su infraestructura GIS, estructurada en seis etapas:

| Etapa | Descripción | Tecnología |
|-------|-------------|------------|
| **Captura de datos** | GPS automático del dispositivo o selección manual en mapa interactivo | Geolocation API, Leaflet |
| **Enriquecimiento contextual** | Geocodificación inversa y obtención de infraestructura (edificio, piso, aula) | Nominatim, Overpass API |
| **Almacenamiento geoespacial** | Persistencia de coordenadas como `geography POINT` con indexación GIST | PostGIS (SRID 4326 - WGS84) |
| **Procesamiento espacial** | Detección de reportes similares por proximidad y asignación de operadores | `ST_DWithin`, `ST_Distance` |
| **Seguimiento en tiempo real** | Rastreo de operadores en campo con verificación de llegada | Supabase Realtime |
| **Visualización analítica** | Mapas de calor, distribución geográfica y filtrado espacial | Leaflet.heat, capas OSM |

### Funciones GIS implementadas

- **Geolocalización de reportes**: Captura automática o manual de coordenadas al crear un reporte.
- **Geocodificación inversa**: Conversión de coordenadas a dirección legible mediante Nominatim.
- **Detección de reportes cercanos**: Identificación de incidentes similares en un radio configurable usando `ST_DWithin`.
- **Asignación por proximidad**: Selección del operador más cercano al incidente mediante `ST_Distance`.
- **Geotracking**: Seguimiento en tiempo real de operadores asignados a reportes activos.
- **Mapas de calor (heatmaps)**: Visualización de zonas con mayor concentración de incidentes.
- **Áreas OSM**: Superposición de datos de infraestructura del campus desde OpenStreetMap.
- **Notificaciones por proximidad**: Alertas automáticas cuando se detectan reportes cercanos a la ubicación del usuario.

---

## ⚙️ Arquitectura y Stack Tecnológico

### Frontend

| Tecnología | Uso |
|------------|-----|
| **React 18** | Framework de interfaz de usuario |
| **TypeScript 5** | Tipado estático |
| **Vite 5** | Bundler y servidor de desarrollo |
| **Tailwind CSS 3** | Sistema de diseño y estilos |
| **shadcn/ui** | Componentes de interfaz accesibles |
| **Leaflet** | Renderizado de mapas interactivos |
| **Recharts** | Gráficos y visualizaciones del dashboard |
| **Framer Motion** | Animaciones de interfaz |

### Backend (BaaS)

| Tecnología | Uso |
|------------|-----|
| **Supabase** | Autenticación, base de datos, realtime, edge functions |
| **PostgreSQL + PostGIS** | Base de datos relacional con extensión geoespacial |
| **Supabase Realtime** | Suscripciones en tiempo real (mensajería, tracking) |
| **Supabase Edge Functions** | Lógica serverless (análisis de imágenes, limpieza de ubicaciones) |
| **Cloudinary** | Almacenamiento y optimización de imágenes |

### Servicios externos

| Servicio | Uso |
|----------|-----|
| **OpenStreetMap** | Tiles de mapas base |
| **Nominatim** | Geocodificación inversa |
| **Overpass API** | Consulta de infraestructura del campus |

---

## 📦 Módulos Funcionales

### 1. Gestión de Reportes
- Creación con geolocalización automática/manual
- Captura inteligente con análisis de imagen (IA)
- Asignación a operadores por proximidad
- Ciclo de vida: pendiente → en progreso → resuelto
- Historial de cambios y timeline de asignación
- Detección de reportes similares

### 2. Geotracking y Rastreo
- Seguimiento en tiempo real de operadores en campo
- Verificación de llegada al punto del incidente
- Mapa de navegación con ruta al destino
- Estadísticas de rastreo activo

### 3. Dashboard Analítico
- Estadísticas generales (reportes, usuarios, categorías)
- Análisis comparativo por entidad
- Gráficos de tendencias y distribución
- Filtros por período y categoría

### 4. Red Social
- Publicaciones con hashtags y menciones
- Encuestas y votaciones comunitarias
- Comentarios con respuestas anidadas
- Sistema de seguimiento y solicitudes de amistad
- Estados temporales (tipo stories)
- Trending posts y hashtags
- Búsqueda avanzada

### 5. Mensajería
- Conversaciones individuales y grupales
- Compartir reportes y publicaciones en chat
- Indicador de escritura y presencia en línea
- Recibos de lectura y entrega
- Galería de imágenes en conversación

### 6. Calendario de Eventos
- Creación manual de eventos del campus
- Vinculación de reportes a eventos
- Vista mensual y semanal
- Notificaciones de eventos próximos

### 7. Notificaciones
- Sistema de notificaciones en tiempo real
- Alertas por proximidad geográfica
- Notificaciones de la red social
- Gestión y filtrado por tipo

### 8. Auditoría
- Registro de acciones del sistema
- Historial de cambios por entidad
- Panel de actividad con filtros avanzados

### 9. Gestión de Usuarios y Roles
- CRUD de usuarios con permisos granulares
- Sistema de roles (admin, operador, usuario)
- Row Level Security (RLS) en PostgreSQL
- Carga masiva (bulk upload)

---

## 🔐 Seguridad

| Capa | Implementación |
|------|----------------|
| **Autenticación** | JWT con expiración, refresh tokens, bloqueo por intentos fallidos |
| **Autorización** | Row Level Security (RLS) a nivel de base de datos |
| **Roles** | Tabla separada `user_roles` con función `has_role()` SECURITY DEFINER |
| **Aislamiento** | Usuarios ven solo datos propios o según permisos asignados |
| **Auditoría** | Registro de accesos, cambios y acciones |
| **Datos sensibles** | Soft delete, minimización en vistas públicas |

---

## 🧪 Datos Simulados (Mock Data)

> **⚠️ IMPORTANTE**: Todos los datos del sistema son **sintéticos y ficticios**.

- Los usuarios, reportes, ubicaciones y comunicaciones son generados sin referencia a personas o eventos reales.
- Los nombres, correos y coordenadas son plausibles pero **no corresponden** a individuos o lugares específicos reales.
- Los correos usan dominios ficticios (`@ejemplo.test`, `@prueba.local`).
- Las coordenadas se ubican dentro del perímetro del campus pero no representan incidentes reales.

Esta estrategia permite validar la funcionalidad del sistema sin comprometer la privacidad de ninguna persona.

---

## 🚀 Instalación y Ejecución

### Requisitos previos

- Node.js 18+ ([instalar con nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Proyecto Supabase configurado con extensión PostGIS

### Pasos

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>

# 2. Navegar al directorio
cd unialerta-uce

# 3. Instalar dependencias
npm install

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con las credenciales de Supabase

# 5. Iniciar servidor de desarrollo
npm run dev
```

### Variables de entorno requeridas

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima
```

---

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes de interfaz
│   ├── Map/             # Componentes de mapas (Leaflet)
│   ├── audit/           # Panel de auditoría
│   ├── calendario/      # Calendario de eventos
│   ├── dashboard/       # Dashboard analítico
│   ├── estados/         # Estados temporales
│   ├── messages/        # Sistema de mensajería
│   ├── notifications/   # Notificaciones
│   ├── redsocial/       # Red social
│   ├── report/          # Formularios de reportes
│   ├── tracking/        # Geotracking
│   ├── ui/              # Componentes base (shadcn)
│   └── users/           # Gestión de usuarios
├── contexts/            # Providers (Auth, Location, Theme, etc.)
├── hooks/
│   ├── controlador/     # Lógica de negocio y controladores
│   ├── entidades/       # Hooks de acceso a datos
│   ├── estados/         # Hooks de estados temporales
│   ├── messages/        # Hooks de mensajería
│   ├── optimizacion/    # Hooks de rendimiento
│   └── users/           # CRUD de usuarios
├── integrations/        # Configuración de Supabase
├── lib/                 # Utilidades (distancia, estados, etc.)
├── pages/               # Páginas/rutas de la aplicación
└── index.css            # Tokens de diseño y variables CSS
supabase/
├── functions/           # Edge Functions (análisis IA, limpieza)
└── migrations/          # Migraciones de base de datos
docs/                    # Documentación técnica y de pruebas
```

---

## 📊 Modelo de Datos Geoespacial

Las tablas principales con componente geográfico:

| Tabla | Campo geográfico | Tipo | Descripción |
|-------|-------------------|------|-------------|
| `reportes` | `geolocation` | `geography(POINT, 4326)` | Ubicación del incidente |
| `user_locations` | `location` | `geography(POINT, 4326)` | Última posición del usuario |
| `active_trackings` | — | Referencia a reporte + usuario | Seguimiento activo en campo |
| `eventos` | `lat`, `lng` | `double precision` | Ubicación del evento |
| `incidents` | `location` | `geography(POINT, 4326)` | Punto geográfico del incidente |

---

## 📄 Documentación Adicional

El directorio `docs/` contiene documentación extendida:

- **Arquitectura**: `DOCUMENTO_ARQUITECTURA.md`, `CAPITULO_ARQUITECTURA_PLATAFORMAS.md`
- **Modelo de datos**: `MODELO_DATOS.md`
- **GIS y geolocalización**: `RELEVANCIA_GIS_GEOLOCALIZACION.md`, `PRINCIPIOS_GEOFENCING.md`, `GEOLOCALIZACION_SENSORES_MOVIL.md`
- **Pruebas**: `PLAN_INFORME_PRUEBAS.md`, `PRUEBAS_FUNCIONALES_MATRIZ.md`, `PRUEBAS_UI_MATRIZ.md`
- **Manuales**: `MANUAL_USUARIO.md`, `MANUAL_TECNICO.md`, `MANUAL_INSTALACION.md`
- **Privacidad**: `CAPITULO_DATOS_SINTETICOS_PROTECCION_PRIVACIDAD.md`

---

## ⚠️ Limitaciones del PoC

| Aspecto | Estado |
|---------|--------|
| Datos reales de usuarios | ❌ No utiliza — solo datos sintéticos |
| Cumplimiento normativo (LOPD/GDPR) | ❌ Fuera del alcance |
| Pruebas de carga/escalabilidad | ❌ No realizadas |
| Modo offline completo | 🔄 PWA básica implementada |
| Consentimiento informado | ❌ No implementado |
| Eliminación completa de datos | ❌ Solo soft delete |

---

## 📝 Licencia

Proyecto académico — Universidad Central del Ecuador (UCE).

---

<p align="center">
  <strong>UniAlerta UCE</strong> — Prueba de Concepto de Gestión de Incidentes con SIG
  <br/>
  <em>Todos los datos son simulados. No utilizar en producción.</em>
</p>
