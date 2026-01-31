# Modelo de Datos - UniAlerta UCE

## Información del Documento

| Campo | Valor |
|-------|-------|
| **Proyecto** | UniAlerta UCE |
| **Versión** | 1.0 |
| **Fecha** | Enero 2026 |
| **Base de Datos** | PostgreSQL (Supabase) |
| **Extensiones** | PostGIS (geoespacial) |

---

## 1. Introducción

### 1.1 Propósito

Este documento describe el modelo de datos de la plataforma **UniAlerta UCE**, detallando las tablas, relaciones, tipos de datos personalizados y políticas de seguridad a nivel de fila (RLS) implementadas en Supabase.

### 1.2 Tecnologías de Almacenamiento

| Tecnología | Uso |
|------------|-----|
| **PostgreSQL** | Base de datos relacional principal (Supabase) |
| **PostGIS** | Extensión para datos geoespaciales |
| **Cloudinary** | Almacenamiento de imágenes y videos (CDN) |
| **Supabase Auth** | Gestión de usuarios autenticados |
| **Supabase Realtime** | Suscripciones en tiempo real |

---

## 2. Diagrama Entidad-Relación General

*Imagen de: diagrama_er_completo*

### 2.1 Módulos de Datos

El modelo de datos se organiza en los siguientes módulos:

```
┌─────────────────────────────────────────────────────────────┐
│                    MODELO DE DATOS                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  USUARIOS   │  │  REPORTES   │  │    RED SOCIAL       │ │
│  │  & PERFILES │  │  & ALERTAS  │  │    & PUBLICACIONES  │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  MENSAJERÍA │  │ NOTIFICAC.  │  │    AUDITORÍA        │ │
│  │  & CHAT     │  │ & ALERTAS   │  │    & SEGURIDAD      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │  CATEGORÍAS │  │  INCIDENTES │                          │
│  │  & TIPOS    │  │  (LEGACY)   │                          │
│  └─────────────┘  └─────────────┘                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Tipos de Datos Personalizados (ENUMS)

### 3.1 Estados y Roles de Usuario

```sql
-- Estado del usuario en el sistema
CREATE TYPE user_status AS ENUM (
  'activo',      -- Usuario activo
  'inactivo',    -- Usuario inactivo
  'suspendido',  -- Usuario suspendido temporalmente
  'bloqueado'    -- Usuario bloqueado permanentemente
);

-- Roles del sistema
CREATE TYPE user_role AS ENUM (
  'super_admin',       -- Administrador supremo
  'administrador',     -- Administrador del sistema
  'moderador',         -- Moderador de contenido
  'operador_analista', -- Operador y analista
  'seguridad_uce',     -- Personal de seguridad UCE
  'mantenimiento',     -- Personal de mantenimiento
  'usuario'            -- Usuario estándar
);

-- Permisos granulares
CREATE TYPE user_permission AS ENUM (
  'ver_dashboard',
  'ver_usuario', 'crear_usuario', 'editar_usuario', 'eliminar_usuario',
  'ver_reporte', 'crear_reporte', 'editar_reporte', 'eliminar_reporte',
  'ver_categoria', 'crear_categoria', 'editar_categoria', 'eliminar_categoria',
  'ver_tipo_reporte', 'crear_tipo_reporte', 'editar_tipo_reporte', 'eliminar_tipo_reporte',
  'ver_auditoria',
  'moderar_contenido',
  'asignar_reportes'
);
```

*Imagen de: enums_usuarios_roles*

### 3.2 Estados de Reportes

```sql
-- Estado del reporte
CREATE TYPE report_status AS ENUM (
  'pendiente',    -- Reporte recién creado
  'en_revision',  -- En proceso de revisión
  'en_proceso',   -- Siendo atendido
  'resuelto',     -- Reporte resuelto
  'rechazado',    -- Reporte rechazado
  'archivado'     -- Reporte archivado
);

-- Prioridad del reporte
CREATE TYPE report_priority AS ENUM (
  'baja',
  'media',
  'alta',
  'critica'
);

-- Visibilidad del reporte
CREATE TYPE report_visibility AS ENUM (
  'publico',      -- Visible para todos
  'privado',      -- Solo visible para el creador y admins
  'anonimo'       -- Creador anónimo
);
```

*Imagen de: enums_reportes*

### 3.3 Estados de Incidentes (Legacy)

```sql
-- Estado del incidente
CREATE TYPE incident_status AS ENUM (
  'reportado',
  'en_investigacion',
  'en_proceso',
  'resuelto',
  'cerrado'
);

-- Severidad del incidente
CREATE TYPE incident_severity AS ENUM (
  'baja',
  'media',
  'alta',
  'critica'
);

-- Proveedor de media
CREATE TYPE media_provider AS ENUM (
  'cloudinary',
  'supabase_storage'
);
```

### 3.4 Red Social y Relaciones

```sql
-- Tipo de relación entre usuarios
CREATE TYPE tipo_relacion AS ENUM (
  'seguidor',   -- Relación de seguimiento
  'amigo',      -- Relación de amistad (bidireccional)
  'bloqueado'   -- Usuario bloqueado
);

-- Estado de la relación
CREATE TYPE estado_relacion AS ENUM (
  'pendiente',  -- Solicitud pendiente
  'aceptado',   -- Relación aceptada
  'rechazado'   -- Solicitud rechazada
);

-- Tipo de interacción
CREATE TYPE tipo_interaccion AS ENUM (
  'me_gusta',   -- Like
  'compartir',  -- Compartir
  'guardar'     -- Guardar publicación
);
```

*Imagen de: enums_red_social*

### 3.5 Mensajería

```sql
-- Rol en conversación
CREATE TYPE conversation_role AS ENUM (
  'admin',    -- Administrador del grupo
  'miembro'   -- Miembro regular
);
```

### 3.6 Notificaciones

```sql
-- Tipo de notificación
CREATE TYPE notification_type AS ENUM (
  'informacion',
  'alerta',
  'reporte',
  'mensaje',
  'social',
  'sistema'
);
```

### 3.7 Auditoría

```sql
-- Tipo de operación
CREATE TYPE operation_type AS ENUM (
  'INSERT',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'PASSWORD_CHANGE',
  'ROLE_CHANGE'
);
```

---

## 4. Módulo de Usuarios y Perfiles

### 4.1 Diagrama del Módulo

*Imagen de: diagrama_modulo_usuarios*

### 4.2 Tabla: `profiles`

Almacena la información de perfil de los usuarios del sistema.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único del perfil |
| `user_id` | uuid | Sí | - | FK a auth.users (Supabase Auth) |
| `email` | text | Sí | - | Email del usuario |
| `name` | text | Sí | - | Nombre completo |
| `username` | text | Sí | - | Nombre de usuario único |
| `avatar` | text | Sí | - | URL de avatar (Cloudinary) |
| `bio` | text | Sí | - | Biografía del usuario |
| `estado` | user_status | Sí | `'activo'` | Estado del usuario |
| `confirmed` | boolean | Sí | `false` | Email confirmado |
| `must_change_password` | boolean | Sí | `false` | Debe cambiar contraseña |
| `temp_password_used` | boolean | Sí | `false` | Usó contraseña temporal |
| `created_at` | timestamptz | No | `now()` | Fecha de creación |
| `updated_at` | timestamptz | No | `now()` | Última actualización |
| `deleted_at` | timestamptz | Sí | - | Fecha de eliminación (soft delete) |

**Índices:**
- `PRIMARY KEY (id)`
- `UNIQUE (username)`
- `UNIQUE (user_id)`

**Políticas RLS:**
- Solo el sistema puede crear perfiles (trigger on auth.users)
- Usuarios pueden ver perfiles si tienen permiso `ver_usuario` o es su propio perfil
- Usuarios pueden editar su propio perfil o con permiso `editar_usuario`

*Imagen de: tabla_profiles*

### 4.3 Tabla: `user_roles`

Asigna roles y permisos a los usuarios.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `user_id` | uuid | No | - | FK a profiles.id |
| `roles` | user_role[] | No | `'{usuario}'` | Array de roles |
| `permisos` | user_permission[] | No | `'{}'` | Array de permisos adicionales |
| `assigned_by` | uuid | Sí | - | Usuario que asignó |
| `assigned_at` | timestamptz | No | `now()` | Fecha de asignación |
| `created_at` | timestamptz | No | `now()` | Fecha de creación |
| `updated_at` | timestamptz | No | `now()` | Última actualización |

**Relaciones:**
- `user_id` → `profiles.id` (ONE-TO-ONE)
- `assigned_by` → `profiles.id`

*Imagen de: tabla_user_roles*

### 4.4 Tabla: `user_blocks`

Registro de usuarios bloqueados del sistema.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `profile_id` | uuid | Sí | - | FK a profiles.id |
| `email` | text | No | - | Email bloqueado |
| `reason` | text | Sí | - | Razón del bloqueo |
| `blocked_by` | uuid | Sí | - | Usuario que bloqueó |
| `blocked_by_email` | text | Sí | - | Email de quien bloqueó |
| `is_permanent` | boolean | Sí | `false` | Bloqueo permanente |
| `blocked_at` | timestamptz | No | `now()` | Fecha de bloqueo |
| `metadata` | jsonb | Sí | - | Metadatos adicionales |

*Imagen de: tabla_user_blocks*

### 4.5 Tabla: `login_attempts`

Control de intentos de inicio de sesión fallidos (anti-brute force).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `email` | text | No | - | Email intentando acceder |
| `ip_address` | inet | Sí | - | Dirección IP |
| `attempt_count` | integer | No | `0` | Número de intentos |
| `last_attempt_at` | timestamptz | No | `now()` | Último intento |
| `locked_until` | timestamptz | Sí | - | Bloqueado hasta |
| `created_at` | timestamptz | No | `now()` | Fecha de creación |
| `updated_at` | timestamptz | No | `now()` | Última actualización |

*Imagen de: tabla_login_attempts*

### 4.6 Vista: `profiles_public`

Vista pública con datos no sensibles de perfiles.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | ID del perfil |
| `name` | text | Nombre |
| `username` | text | Username |
| `avatar` | text | URL avatar |
| `bio` | text | Biografía |
| `estado` | user_status | Estado |
| `confirmed` | boolean | Confirmado |
| `created_at` | timestamptz | Creación |
| `updated_at` | timestamptz | Actualización |
| `deleted_at` | timestamptz | Eliminación |

---

## 5. Módulo de Reportes

### 5.1 Diagrama del Módulo

*Imagen de: diagrama_modulo_reportes*

### 5.2 Tabla: `reportes`

Tabla principal de reportes del sistema.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `nombre` | text | No | - | Título del reporte |
| `descripcion` | text | Sí | - | Descripción detallada |
| `user_id` | uuid | No | - | FK a profiles.id (creador) |
| `categoria_id` | uuid | Sí | - | FK a categories.id |
| `tipo_reporte_id` | uuid | Sí | - | FK a tipo_categories.id |
| `assigned_to` | uuid | Sí | - | FK a profiles.id (asignado) |
| `status` | report_status | No | `'pendiente'` | Estado del reporte |
| `priority` | report_priority | No | `'media'` | Prioridad |
| `visibility` | report_visibility | No | `'publico'` | Visibilidad |
| `location` | jsonb | Sí | - | Datos de ubicación JSON |
| `geolocation` | geography(Point,4326) | No | - | Punto geográfico (PostGIS) |
| `imagenes` | text[] | Sí | - | URLs de imágenes (Cloudinary) |
| `activo` | boolean | No | `true` | Reporte activo |
| `created_at` | timestamptz | No | `now()` | Fecha de creación |
| `updated_at` | timestamptz | No | `now()` | Última actualización |
| `deleted_at` | timestamptz | Sí | - | Soft delete |

**Relaciones:**
- `user_id` → `profiles.id`
- `categoria_id` → `categories.id`
- `tipo_reporte_id` → `tipo_categories.id`
- `assigned_to` → `profiles.id`

**Índices:**
- `PRIMARY KEY (id)`
- `INDEX ON geolocation USING GIST` (espacial)
- `INDEX ON status`
- `INDEX ON priority`
- `INDEX ON created_at`

**Políticas RLS:**
- Usuarios con `ver_reporte` pueden ver reportes
- Usuarios con `crear_reporte` pueden crear
- Usuarios pueden ver sus propios reportes
- Usuarios asignados pueden ver reportes asignados

*Imagen de: tabla_reportes*

### 5.3 Tabla: `reporte_historial`

Historial de cambios y asignaciones de reportes.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `reporte_id` | uuid | No | - | FK a reportes.id |
| `assigned_from` | uuid | Sí | - | Usuario anterior |
| `assigned_to` | uuid | Sí | - | Usuario nuevo |
| `assigned_by` | uuid | Sí | - | Quien hizo el cambio |
| `comentario` | text | Sí | - | Comentario del cambio |
| `fecha_asignacion` | timestamptz | No | `now()` | Fecha del cambio |
| `created_at` | timestamptz | No | `now()` | Creación |
| `updated_at` | timestamptz | No | `now()` | Actualización |

**Relaciones:**
- `reporte_id` → `reportes.id`
- `assigned_from` → `profiles.id`
- `assigned_to` → `profiles.id`
- `assigned_by` → `profiles.id`

*Imagen de: tabla_reporte_historial*

### 5.4 Tabla: `reporte_confirmaciones`

Confirmaciones de reportes por parte de otros usuarios.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `reporte_id` | uuid | No | - | FK a reportes.id |
| `user_id` | uuid | No | - | FK a profiles.id |
| `created_at` | timestamptz | No | `now()` | Fecha de confirmación |

**Restricciones:**
- UNIQUE (reporte_id, user_id) - Un usuario solo puede confirmar una vez

*Imagen de: tabla_reporte_confirmaciones*

---

## 6. Módulo de Categorías y Tipos

### 6.1 Diagrama del Módulo

*Imagen de: diagrama_modulo_categorias*

### 6.2 Tabla: `categories`

Categorías principales de reportes.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `nombre` | text | No | - | Nombre de la categoría |
| `descripcion` | text | Sí | - | Descripción |
| `color` | text | Sí | - | Color hexadecimal |
| `icono` | text | Sí | - | Nombre del icono (Lucide) |
| `user_id` | uuid | No | - | FK a profiles.id (creador) |
| `activo` | boolean | No | `true` | Categoría activa |
| `created_at` | timestamptz | No | `now()` | Fecha de creación |
| `updated_at` | timestamptz | No | `now()` | Última actualización |
| `deleted_at` | timestamptz | Sí | - | Soft delete |

**Políticas RLS:**
- Usuarios con `ver_categoria` pueden ver categorías
- Usuarios con `crear_categoria` pueden crear
- Usuarios con `editar_categoria` pueden editar
- Usuarios con `eliminar_categoria` pueden eliminar

*Imagen de: tabla_categories*

### 6.3 Tabla: `tipo_categories`

Tipos de reporte (subcategorías).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `nombre` | text | No | - | Nombre del tipo |
| `descripcion` | text | Sí | - | Descripción |
| `color` | text | Sí | - | Color hexadecimal |
| `icono` | text | Sí | - | Nombre del icono |
| `category_id` | uuid | Sí | - | FK a categories.id (padre) |
| `user_id` | uuid | No | - | FK a profiles.id (creador) |
| `activo` | boolean | No | `true` | Tipo activo |
| `created_at` | timestamptz | No | `now()` | Fecha de creación |
| `updated_at` | timestamptz | No | `now()` | Última actualización |
| `deleted_at` | timestamptz | Sí | - | Soft delete |

**Relaciones:**
- `category_id` → `categories.id`
- `user_id` → `profiles.id`

*Imagen de: tabla_tipo_categories*

---

## 7. Módulo de Red Social

### 7.1 Diagrama del Módulo

*Imagen de: diagrama_modulo_red_social*

### 7.2 Tabla: `publicaciones`

Publicaciones de la red social.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `user_id` | uuid | Sí | - | FK a profiles.id (autor) |
| `contenido` | text | Sí | - | Contenido de texto |
| `imagenes` | text[] | Sí | - | URLs de imágenes (Cloudinary) |
| `visibilidad` | text | No | `'publico'` | 'publico', 'amigos', 'privado' |
| `repost_of` | uuid | Sí | - | FK a publicaciones.id (repost) |
| `repost_comentario` | text | Sí | - | Comentario del repost |
| `estado_id` | uuid | Sí | - | FK a estados.id (si es de estado) |
| `activo` | boolean | No | `true` | Publicación activa |
| `created_at` | timestamptz | No | `now()` | Fecha de creación |
| `updated_at` | timestamptz | No | `now()` | Última actualización |
| `deleted_at` | timestamptz | Sí | - | Soft delete |

**Relaciones:**
- `user_id` → `profiles.id`
- `repost_of` → `publicaciones.id` (self-reference)
- `estado_id` → `estados.id`

**Políticas RLS:**
- Publicaciones públicas visibles para todos los autenticados
- Publicaciones de amigos solo para amigos aceptados
- Usuario puede ver/editar sus propias publicaciones

*Imagen de: tabla_publicaciones*

### 7.3 Tabla: `comentarios`

Comentarios en publicaciones.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `publicacion_id` | uuid | No | - | FK a publicaciones.id |
| `user_id` | uuid | Sí | - | FK a profiles.id |
| `contenido` | text | No | - | Contenido del comentario |
| `imagenes` | text[] | Sí | - | URLs de imágenes |
| `comentario_padre_id` | uuid | Sí | - | FK a comentarios.id (respuesta) |
| `activo` | boolean | No | `true` | Comentario activo |
| `created_at` | timestamptz | No | `now()` | Fecha de creación |
| `updated_at` | timestamptz | No | `now()` | Última actualización |
| `deleted_at` | timestamptz | Sí | - | Soft delete |

**Relaciones:**
- `publicacion_id` → `publicaciones.id`
- `user_id` → `profiles.id`
- `comentario_padre_id` → `comentarios.id` (self-reference para respuestas anidadas)

*Imagen de: tabla_comentarios*

### 7.4 Tabla: `interacciones`

Interacciones con publicaciones y comentarios (likes, shares, saves).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `user_id` | uuid | Sí | - | FK a profiles.id |
| `publicacion_id` | uuid | Sí | - | FK a publicaciones.id |
| `comentario_id` | uuid | Sí | - | FK a comentarios.id |
| `tipo_interaccion` | tipo_interaccion | No | `'me_gusta'` | Tipo de interacción |
| `created_at` | timestamptz | No | `now()` | Fecha de interacción |

**Restricciones:**
- CHECK: publicacion_id OR comentario_id debe tener valor
- UNIQUE: (user_id, publicacion_id, tipo_interaccion)

*Imagen de: tabla_interacciones*

### 7.5 Tabla: `relaciones`

Relaciones entre usuarios (seguir, amistad, bloqueo).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `user_id` | uuid | Sí | - | Usuario objetivo (seguido) |
| `seguidor_id` | uuid | Sí | - | Usuario que sigue |
| `tipo` | tipo_relacion | No | `'seguidor'` | Tipo de relación |
| `estado` | estado_relacion | No | `'aceptado'` | Estado de la relación |
| `created_at` | timestamptz | No | `now()` | Fecha de creación |
| `updated_at` | timestamptz | No | `now()` | Última actualización |

**Relaciones:**
- `user_id` → `profiles.id`
- `seguidor_id` → `profiles.id`

*Imagen de: tabla_relaciones*

### 7.6 Tabla: `hashtags`

Hashtags utilizados en publicaciones.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `nombre` | text | No | - | Nombre del hashtag (sin #) |
| `uso_count` | integer | Sí | `0` | Contador de usos |
| `created_at` | timestamptz | Sí | `now()` | Fecha de creación |
| `updated_at` | timestamptz | Sí | `now()` | Última actualización |

**Índices:**
- UNIQUE (nombre)

*Imagen de: tabla_hashtags*

### 7.7 Tabla: `publicacion_hashtags`

Relación muchos-a-muchos entre publicaciones y hashtags.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `publicacion_id` | uuid | No | - | FK a publicaciones.id |
| `hashtag_id` | uuid | No | - | FK a hashtags.id |
| `created_at` | timestamptz | Sí | `now()` | Fecha de asociación |

*Imagen de: tabla_publicacion_hashtags*

### 7.8 Tabla: `publicacion_menciones`

Menciones de usuarios en publicaciones.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `publicacion_id` | uuid | No | - | FK a publicaciones.id |
| `mentioned_user_id` | uuid | No | - | FK a profiles.id (mencionado) |
| `created_at` | timestamptz | Sí | `now()` | Fecha de mención |

*Imagen de: tabla_publicacion_menciones*

### 7.9 Tabla: `comentario_menciones`

Menciones de usuarios en comentarios.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `comentario_id` | uuid | No | - | FK a comentarios.id |
| `mentioned_user_id` | uuid | No | - | FK a profiles.id (mencionado) |
| `created_at` | timestamptz | Sí | `now()` | Fecha de mención |

### 7.10 Tabla: `publicacion_guardadas`

Publicaciones guardadas por usuarios.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `publicacion_id` | uuid | Sí | - | FK a publicaciones.id |
| `user_id` | uuid | Sí | - | FK a profiles.id |
| `created_at` | timestamptz | No | `now()` | Fecha de guardado |

### 7.11 Tabla: `publicacion_compartidos`

Registro de publicaciones compartidas.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `publicacion_id` | uuid | No | - | FK a publicaciones.id |
| `user_id` | uuid | Sí | - | FK a profiles.id (quien comparte) |
| `destinatario_id` | uuid | Sí | - | FK a profiles.id (destinatario) |
| `tipo_compartido` | text | No | - | 'mensaje', 'repost', 'externo' |
| `created_at` | timestamptz | No | `now()` | Fecha de compartido |

### 7.12 Tabla: `publicacion_vistas`

Registro de vistas de publicaciones.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `publicacion_id` | uuid | No | - | FK a publicaciones.id |
| `user_id` | uuid | Sí | - | FK a profiles.id |
| `created_at` | timestamptz | No | `now()` | Fecha de vista |

### 7.13 Tabla: `user_hashtag_follows`

Hashtags seguidos por usuarios.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `user_id` | uuid | No | - | FK a profiles.id |
| `hashtag_id` | uuid | No | - | FK a hashtags.id |
| `created_at` | timestamptz | No | `now()` | Fecha de seguimiento |

---

## 8. Módulo de Estados (Stories)

### 8.1 Diagrama del Módulo

*Imagen de: diagrama_modulo_estados*

### 8.2 Tabla: `estados`

Estados/Stories temporales (24 horas).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `user_id` | uuid | No | - | FK a profiles.id |
| `tipo` | text | No | `'imagen'` | 'imagen', 'texto', 'video' |
| `contenido` | text | Sí | - | Contenido de texto |
| `imagenes` | text[] | Sí | `'{}'` | URLs de imágenes |
| `visibilidad` | text | No | `'todos'` | 'todos', 'contactos' |
| `vistas` | jsonb | Sí | `'[]'` | Array de user_ids que vieron |
| `publicacion_id` | uuid | Sí | - | FK a publicaciones.id (compartido) |
| `compartido_en_social` | boolean | Sí | `false` | Compartido en red social |
| `compartido_en_mensajes` | boolean | Sí | `false` | Compartido en mensajes |
| `activo` | boolean | Sí | `true` | Estado activo |
| `expires_at` | timestamptz | No | `now() + 24h` | Fecha de expiración |
| `created_at` | timestamptz | No | `now()` | Fecha de creación |

*Imagen de: tabla_estados*

### 8.3 Tabla: `estado_vistas`

Registro de quién vio cada estado.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `estado_id` | uuid | No | - | FK a estados.id |
| `user_id` | uuid | No | - | FK a profiles.id |
| `created_at` | timestamptz | No | `now()` | Fecha de vista |

### 8.4 Tabla: `estado_reacciones`

Reacciones a estados.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `estado_id` | uuid | No | - | FK a estados.id |
| `user_id` | uuid | No | - | FK a profiles.id |
| `emoji` | text | No | - | Emoji de reacción |
| `created_at` | timestamptz | No | `now()` | Fecha de reacción |

---

## 9. Módulo de Mensajería

### 9.1 Diagrama del Módulo

*Imagen de: diagrama_modulo_mensajeria*

### 9.2 Tabla: `conversaciones`

Conversaciones de chat (1:1 y grupos).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `nombre` | text | Sí | - | Nombre del grupo (null si es 1:1) |
| `es_grupo` | boolean | No | `false` | Es conversación grupal |
| `created_by` | uuid | Sí | `auth.uid()` | FK a profiles.id (creador) |
| `created_at` | timestamptz | No | `now()` | Fecha de creación |
| `updated_at` | timestamptz | No | `now()` | Última actualización |

*Imagen de: tabla_conversaciones*

### 9.3 Tabla: `participantes_conversacion`

Participantes de cada conversación.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `conversacion_id` | uuid | No | - | FK a conversaciones.id |
| `user_id` | uuid | Sí | - | FK a profiles.id |
| `role` | conversation_role | No | `'miembro'` | Rol en la conversación |
| `muted` | boolean | Sí | `false` | Conversación silenciada |
| `ultimo_leido_at` | timestamptz | Sí | - | Último mensaje leído |
| `hidden_at` | timestamptz | Sí | - | Fecha de abandono |
| `hidden_from_all` | boolean | Sí | `false` | Oculto para todos |
| `hidden_from_todos` | boolean | Sí | `false` | Oculto en lista |
| `created_at` | timestamptz | No | `now()` | Fecha de unión |

**Restricciones:**
- UNIQUE (conversacion_id, user_id)

*Imagen de: tabla_participantes_conversacion*

### 9.4 Tabla: `mensajes`

Mensajes de chat.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `conversacion_id` | uuid | No | - | FK a conversaciones.id |
| `user_id` | uuid | Sí | - | FK a profiles.id (autor) |
| `contenido` | text | No | - | Contenido del mensaje |
| `imagenes` | text[] | Sí | - | URLs de imágenes |
| `shared_post` | jsonb | Sí | - | Publicación compartida (snapshot) |
| `hidden_by_users` | jsonb | Sí | `'[]'` | Array de user_ids que ocultaron |
| `created_at` | timestamptz | No | `now()` | Fecha de envío |
| `updated_at` | timestamptz | No | `now()` | Última edición |
| `deleted_at` | timestamptz | Sí | - | Soft delete |

*Imagen de: tabla_mensajes*

### 9.5 Tabla: `mensaje_reacciones`

Reacciones a mensajes.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `mensaje_id` | uuid | No | - | FK a mensajes.id |
| `user_id` | uuid | Sí | - | FK a profiles.id |
| `emoji` | text | No | - | Emoji de reacción |
| `created_at` | timestamptz | No | `now()` | Fecha de reacción |

### 9.6 Tabla: `message_receipts`

Recibos de entrega y lectura de mensajes.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `message_id` | uuid | No | - | FK a mensajes.id |
| `user_id` | uuid | No | - | FK a profiles.id |
| `delivered_at` | timestamptz | Sí | `now()` | Fecha de entrega |
| `read_at` | timestamptz | Sí | - | Fecha de lectura |
| `created_at` | timestamptz | No | `now()` | Fecha de creación |

### 9.7 Tabla: `group_history`

Historial de cambios en grupos.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `conversacion_id` | uuid | No | - | FK a conversaciones.id |
| `action_type` | text | No | - | 'member_added', 'member_removed', 'name_changed', etc. |
| `performed_by` | uuid | Sí | - | FK a profiles.id |
| `affected_user_id` | uuid | Sí | - | FK a profiles.id (afectado) |
| `old_value` | text | Sí | - | Valor anterior |
| `new_value` | text | Sí | - | Valor nuevo |
| `created_at` | timestamptz | No | `now()` | Fecha del cambio |

### 9.8 Tabla: `usuarios_silenciados`

Usuarios silenciados en mensajería.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `user_id` | uuid | No | - | FK a profiles.id (quien silencia) |
| `silenciado_user_id` | uuid | No | - | FK a profiles.id (silenciado) |
| `created_at` | timestamptz | No | `now()` | Fecha de silenciado |

---

## 10. Módulo de Notificaciones

### 10.1 Diagrama del Módulo

*Imagen de: diagrama_modulo_notificaciones*

### 10.2 Tabla: `notifications`

Notificaciones del sistema.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `user_id` | uuid | No | - | FK a profiles.id (destinatario) |
| `type` | notification_type | No | `'informacion'` | Tipo de notificación |
| `title` | text | No | - | Título |
| `message` | text | No | - | Mensaje |
| `data` | jsonb | Sí | - | Datos adicionales (links, IDs) |
| `read` | boolean | Sí | `false` | Leída |
| `created_at` | timestamptz | No | `now()` | Fecha de creación |
| `updated_at` | timestamptz | No | `now()` | Última actualización |

**Índices:**
- INDEX ON (user_id, read)
- INDEX ON created_at

*Imagen de: tabla_notifications*

---

## 11. Módulo de Auditoría

### 11.1 Diagrama del Módulo

*Imagen de: diagrama_modulo_auditoria*

### 11.2 Tabla: `user_audit`

Log de auditoría de todas las operaciones.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `user_id` | uuid | Sí | - | FK a profiles.id (afectado) |
| `performed_by` | uuid | Sí | - | FK a profiles.id (ejecutor) |
| `action` | operation_type | No | - | Tipo de operación |
| `tabla_afectada` | text | Sí | - | Tabla afectada |
| `registro_id` | text | Sí | - | ID del registro afectado |
| `campos_modificados` | text[] | Sí | - | Campos que cambiaron |
| `valores_anteriores` | jsonb | Sí | - | Valores antes del cambio |
| `valores_nuevos` | jsonb | Sí | - | Valores después del cambio |
| `details` | text | Sí | - | Detalles adicionales |
| `metadata` | jsonb | Sí | - | Metadatos extra |
| `ip_address` | inet | Sí | - | Dirección IP |
| `user_agent` | text | Sí | - | User agent del navegador |
| `created_at` | timestamptz | No | `now()` | Fecha de la operación |

**Índices:**
- INDEX ON user_id
- INDEX ON performed_by
- INDEX ON action
- INDEX ON tabla_afectada
- INDEX ON created_at

*Imagen de: tabla_user_audit*

---

## 12. Módulo de Incidentes (Legacy)

### 12.1 Diagrama del Módulo

*Imagen de: diagrama_modulo_incidentes*

### 12.2 Tabla: `incidents`

Incidentes del sistema (legacy/alternativo).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `title` | text | No | - | Título del incidente |
| `description` | text | Sí | - | Descripción |
| `category` | text | No | - | Categoría |
| `reporter_id` | uuid | No | - | FK a profiles.id |
| `status` | incident_status | No | `'reportado'` | Estado |
| `severity` | incident_severity | No | `'media'` | Severidad |
| `location` | geography(Point,4326) | No | - | Ubicación (PostGIS) |
| `lat` | double precision | Sí | - | Latitud |
| `lng` | double precision | Sí | - | Longitud |
| `address` | text | Sí | - | Dirección textual |
| `campus` | text | Sí | - | Campus universitario |
| `created_at` | timestamptz | No | `now()` | Fecha de creación |
| `updated_at` | timestamptz | No | `now()` | Última actualización |

### 12.3 Tabla: `incident_history`

Historial de cambios de incidentes.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `incident_id` | uuid | No | - | FK a incidents.id |
| `changed_by` | uuid | No | - | FK a profiles.id |
| `from_status` | incident_status | Sí | - | Estado anterior |
| `to_status` | incident_status | No | - | Estado nuevo |
| `note` | text | Sí | - | Nota del cambio |
| `created_at` | timestamptz | No | `now()` | Fecha del cambio |

### 12.4 Tabla: `attachments`

Archivos adjuntos de incidentes.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `incident_id` | uuid | No | - | FK a incidents.id |
| `uploaded_by` | uuid | No | - | FK a profiles.id |
| `secure_url` | text | No | - | URL segura (Cloudinary) |
| `public_id` | text | Sí | - | ID público en Cloudinary |
| `mime_type` | text | No | - | Tipo MIME |
| `provider` | media_provider | No | `'cloudinary'` | Proveedor |
| `size_bytes` | integer | Sí | - | Tamaño en bytes |
| `width` | integer | Sí | - | Ancho (imágenes/video) |
| `height` | integer | Sí | - | Alto (imágenes/video) |
| `duration` | numeric | Sí | - | Duración (audio/video) |
| `created_at` | timestamptz | No | `now()` | Fecha de subida |

---

## 13. Módulo de Configuración

### 13.1 Tabla: `settings`

Configuración de usuario.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Identificador único |
| `user_id` | uuid | No | - | FK a profiles.id (UNIQUE) |
| `theme` | text | Sí | `'system'` | Tema: 'light', 'dark', 'system' |
| `enabled` | boolean | Sí | `true` | Notificaciones habilitadas |
| `retention_days` | integer | Sí | `30` | Días retención notificaciones |
| `auto_delete_read` | boolean | Sí | `false` | Auto-eliminar leídas |
| `chat_persistence_enabled` | boolean | Sí | `true` | Persistencia de chat |
| `chat_auto_clear` | boolean | Sí | `false` | Auto-limpiar chat |
| `chat_retention_days` | integer | Sí | `90` | Días retención chat |
| `auto_share_reports_enabled` | boolean | Sí | `false` | Compartir reportes automáticamente |
| `auto_share_visibility` | text | Sí | `'publico'` | Visibilidad auto-compartido |
| `auto_share_as_status` | boolean | Sí | `false` | Compartir como estado |
| `auto_share_in_messages` | boolean | Sí | `false` | Compartir en mensajes |
| `real_time_tracking_enabled` | boolean | Sí | `true` | Rastreo en tiempo real |
| `created_at` | timestamptz | No | `now()` | Fecha de creación |
| `updated_at` | timestamptz | No | `now()` | Última actualización |

*Imagen de: tabla_settings*

---

## 14. Tablas del Sistema (PostGIS)

### 14.1 Tabla: `spatial_ref_sys`

Sistema de referencia espacial (PostGIS interno).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `srid` | integer | ID del sistema de referencia |
| `auth_name` | varchar | Autoridad (EPSG) |
| `auth_srid` | integer | SRID de la autoridad |
| `srtext` | varchar | Definición WKT |
| `proj4text` | varchar | Definición Proj4 |

### 14.2 Vistas: `geometry_columns` / `geography_columns`

Vistas del sistema para columnas geométricas/geográficas.

---

## 15. Funciones de Base de Datos

### 15.1 Funciones de Autenticación

```sql
-- Obtener profile_id desde auth.uid()
CREATE FUNCTION get_profile_id_from_auth() 
RETURNS uuid AS $$
  SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Verificar si está autenticado
CREATE FUNCTION is_authenticated() 
RETURNS boolean AS $$
  SELECT auth.uid() IS NOT NULL;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### 15.2 Funciones de Roles y Permisos

```sql
-- Verificar si usuario tiene rol
CREATE FUNCTION has_role(user_id uuid, role user_role) 
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = $1 AND $2 = ANY(roles)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Verificar si usuario tiene permiso
CREATE FUNCTION has_permission(profile_id uuid, permission user_permission) 
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = $1 AND $2 = ANY(permisos)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### 15.3 Funciones de Conversaciones

```sql
-- Verificar si es participante de conversación
CREATE FUNCTION is_conversation_participant(conv_id uuid, profile_id uuid) 
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM participantes_conversacion 
    WHERE conversacion_id = $1 AND user_id = $2 AND hidden_at IS NULL
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Verificar si es admin de conversación
CREATE FUNCTION is_conversation_admin(conv_id uuid, profile_id uuid) 
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM participantes_conversacion 
    WHERE conversacion_id = $1 AND user_id = $2 AND role = 'admin' AND hidden_at IS NULL
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

*Imagen de: funciones_base_datos*

---

## 16. Triggers

### 16.1 Triggers de Actualización de Timestamps

```sql
-- Función para actualizar updated_at
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicado a todas las tablas con updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 16.2 Triggers de Perfil

```sql
-- Crear perfil automáticamente al registrar usuario
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  
  INSERT INTO public.user_roles (user_id, roles, permisos)
  VALUES (
    (SELECT id FROM profiles WHERE user_id = NEW.id),
    ARRAY['usuario']::user_role[],
    ARRAY[]::user_permission[]
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 16.3 Triggers de Hashtags

```sql
-- Actualizar contador de uso de hashtags
CREATE FUNCTION update_hashtag_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE hashtags SET uso_count = uso_count + 1 WHERE id = NEW.hashtag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE hashtags SET uso_count = uso_count - 1 WHERE id = OLD.hashtag_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hashtag_usage
  AFTER INSERT OR DELETE ON publicacion_hashtags
  FOR EACH ROW EXECUTE FUNCTION update_hashtag_count();
```

*Imagen de: triggers_base_datos*

---

## 17. Políticas RLS (Row Level Security)

### 17.1 Resumen de Políticas por Tabla

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `profiles` | ✅ Permiso o propio | ❌ Solo sistema | ✅ Propio o permiso | ❌ |
| `user_roles` | ✅ Autenticado | ✅ Admin | ✅ Admin | ✅ Admin |
| `reportes` | ✅ Permiso/propio/asignado | ✅ Permiso | ✅ Permiso/propio | ✅ Permiso |
| `categories` | ✅ Permiso o propio | ✅ Permiso | ✅ Permiso | ✅ Permiso |
| `publicaciones` | ✅ Visibilidad | ✅ Propio | ✅ Propio | ✅ Propio |
| `comentarios` | ✅ Publicación visible | ✅ Autenticado | ✅ Propio | ✅ Propio |
| `mensajes` | ✅ Participante | ✅ Participante | ✅ Propio | ✅ Propio |
| `notifications` | ✅ Propio | ✅ Propio | ✅ Propio | ✅ Propio |
| `user_audit` | ✅ Permiso | ❌ Solo sistema | ❌ | ❌ |

*Imagen de: resumen_politicas_rls*

### 17.2 Ejemplo de Política Compleja

```sql
-- Política para ver publicaciones de amigos
CREATE POLICY "Usuarios pueden ver publicaciones de amigos"
ON publicaciones FOR SELECT
USING (
  (visibilidad = 'amigos' AND (
    get_profile_id_from_auth() = user_id OR
    EXISTS (
      SELECT 1 FROM relaciones
      WHERE relaciones.user_id = publicaciones.user_id
        AND relaciones.seguidor_id = get_profile_id_from_auth()
        AND relaciones.estado = 'aceptado'
    )
  ))
);
```

---

## 18. Integración con Cloudinary

### 18.1 Almacenamiento de Media

Cloudinary se utiliza para almacenar:
- Avatares de usuario (`profiles.avatar`)
- Imágenes de reportes (`reportes.imagenes`)
- Imágenes de publicaciones (`publicaciones.imagenes`)
- Imágenes de comentarios (`comentarios.imagenes`)
- Imágenes de estados (`estados.imagenes`)
- Imágenes de mensajes (`mensajes.imagenes`)
- Attachments de incidentes (`attachments.secure_url`)

### 18.2 Estructura de URLs

```
https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
```

**Ejemplo:**
```
https://res.cloudinary.com/dwhl67ka5/image/upload/v1234567890/unialerta/reportes/abc123.jpg
```

### 18.3 Organización de Carpetas

```
unialerta/
├── avatars/          # Avatares de usuario
├── reportes/         # Imágenes de reportes
├── publicaciones/    # Imágenes de publicaciones
├── estados/          # Imágenes de estados
├── mensajes/         # Imágenes de chat
└── incidentes/       # Attachments de incidentes
```

*Imagen de: integracion_cloudinary*

---

## 19. Índices y Optimización

### 19.1 Índices Espaciales (PostGIS)

```sql
-- Índice espacial para reportes
CREATE INDEX idx_reportes_geolocation 
ON reportes USING GIST (geolocation);

-- Índice espacial para incidentes
CREATE INDEX idx_incidents_location 
ON incidents USING GIST (location);
```

### 19.2 Índices de Búsqueda

```sql
-- Índice para búsqueda de usuarios
CREATE INDEX idx_profiles_username ON profiles (username);
CREATE INDEX idx_profiles_email ON profiles (email);

-- Índice para búsqueda de hashtags
CREATE INDEX idx_hashtags_nombre ON hashtags (nombre);

-- Índice para búsqueda de publicaciones
CREATE INDEX idx_publicaciones_created_at ON publicaciones (created_at DESC);
```

### 19.3 Índices Compuestos

```sql
-- Índice para notificaciones no leídas
CREATE INDEX idx_notifications_user_unread 
ON notifications (user_id, read) WHERE read = false;

-- Índice para mensajes por conversación
CREATE INDEX idx_mensajes_conversacion_fecha 
ON mensajes (conversacion_id, created_at DESC);
```

*Imagen de: indices_optimizacion*

---

## 20. Diagrama de Relaciones Completo

*Imagen de: diagrama_relaciones_completo*

---

## 21. Anexos

### 21.1 Script de Creación Completo

El script completo de creación de la base de datos está disponible en las migraciones de Supabase:
- `supabase/migrations/`

### 21.2 Diccionario de Datos

*Imagen de: diccionario_datos*

---

## Historial de Versiones

| Versión | Fecha | Descripción | Autor |
|---------|-------|-------------|-------|
| 1.0 | Enero 2026 | Versión inicial | Equipo de Desarrollo |

---

*Documento generado para UniAlerta UCE - Sistema de Gestión de Reportes y Alertas Universitarias*
