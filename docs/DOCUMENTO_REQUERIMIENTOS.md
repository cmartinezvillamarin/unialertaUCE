# Documento de Requerimientos del Sistema
## Plataforma de Gestión de Reportes e Incidentes

**Versión:** 1.0  
**Fecha:** Enero 2026  
**Estado:** Aprobado

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Alcance del Sistema](#2-alcance-del-sistema)
3. [Stakeholders](#3-stakeholders)
4. [Requerimientos Funcionales](#4-requerimientos-funcionales)
5. [Requerimientos No Funcionales](#5-requerimientos-no-funcionales)
6. [Arquitectura del Sistema](#6-arquitectura-del-sistema)
7. [Modelo de Datos](#7-modelo-de-datos)
8. [Interfaces del Sistema](#8-interfaces-del-sistema)
9. [Restricciones y Supuestos](#9-restricciones-y-supuestos)
10. [Glosario](#10-glosario)
11. [Anexos](#11-anexos)

---

## 1. Introducción

### 1.1 Propósito del Documento

Este documento describe los requerimientos funcionales y no funcionales de la Plataforma de Gestión de Reportes e Incidentes. Sirve como referencia para el equipo de desarrollo, stakeholders y usuarios finales.

### 1.2 Objetivo del Sistema

Desarrollar una plataforma web integral que permita:
- Gestión completa de reportes e incidentes
- Seguimiento en tiempo real mediante geolocalización
- Comunicación efectiva entre usuarios
- Red social para interacción comunitaria
- Auditoría completa de actividades

### 1.3 Tecnologías Utilizadas

| Tecnología | Propósito |
|------------|-----------|
| **React + Vite** | Framework frontend |
| **TypeScript** | Tipado estático |
| **Tailwind CSS** | Estilos y diseño responsivo |
| **Supabase** | Backend, base de datos y autenticación |
| **Cloudinary** | Almacenamiento de medios |
| **Leaflet + OpenStreetMap** | Mapas y geolocalización |
| **Lovable** | Plataforma de desarrollo |

> *Imagen de diagrama de tecnologías utilizadas*

---

## 2. Alcance del Sistema

### 2.1 Dentro del Alcance

| Módulo | Descripción |
|--------|-------------|
| Autenticación | Registro, login, recuperación de contraseña |
| Dashboard | Visualización de estadísticas y métricas |
| Reportes | CRUD completo de incidentes |
| Categorías | Gestión de clasificaciones |
| Tipos de Reporte | Subclasificaciones por categoría |
| Usuarios | Administración de cuentas y roles |
| Red Social | Publicaciones, comentarios, interacciones |
| Mensajería | Chat en tiempo real individual y grupal |
| Notificaciones | Sistema de alertas en tiempo real |
| Rastreo | Seguimiento GPS en tiempo real |
| Auditoría | Registro de todas las actividades |
| Configuración | Preferencias del usuario y sistema |

### 2.2 Fuera del Alcance

- Aplicación móvil nativa
- Integración con sistemas externos de emergencia
- Procesamiento de pagos
- Inteligencia artificial para clasificación automática

> *Imagen de diagrama de alcance del sistema*

---

## 3. Stakeholders

### 3.1 Usuarios del Sistema

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **Super Administrador** | Control total del sistema | Todos los permisos |
| **Administrador** | Gestión de usuarios y configuración | Administración general |
| **Moderador** | Gestión de reportes y contenido | Moderación de contenido |
| **Supervisor** | Supervisión de reportes asignados | Lectura y asignación |
| **Operador** | Atención de reportes | Gestión de reportes |
| **Usuario Estándar** | Creación y seguimiento de reportes | Funciones básicas |

### 3.2 Matriz de Responsabilidades RACI

| Actividad | Super Admin | Admin | Moderador | Supervisor | Operador | Usuario |
|-----------|-------------|-------|-----------|------------|----------|---------|
| Crear reportes | R | R | R | R | R | R |
| Aprobar reportes | A | R | R | I | I | I |
| Gestionar usuarios | A | R | I | I | I | I |
| Configurar sistema | R | A | I | I | I | I |
| Auditar actividades | R | R | I | I | I | I |

*R = Responsable, A = Aprobador, C = Consultado, I = Informado*

> *Imagen de jerarquía de roles del sistema*

---

## 4. Requerimientos Funcionales

### 4.1 Módulo de Autenticación (RF-AUTH)

#### RF-AUTH-001: Registro de Usuario
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-AUTH-001 |
| **Nombre** | Registro de nuevo usuario |
| **Descripción** | El sistema debe permitir el registro de nuevos usuarios mediante formulario |
| **Prioridad** | Alta |
| **Actores** | Usuario no registrado |

**Datos requeridos:**
- Nombre completo
- Correo electrónico (único)
- Nombre de usuario (único)
- Contraseña (mínimo 8 caracteres)

**Validaciones:**
- Formato de email válido
- Contraseña con mayúsculas, minúsculas y números
- Usuario no duplicado

> *Imagen de formulario de registro*

#### RF-AUTH-002: Inicio de Sesión
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-AUTH-002 |
| **Nombre** | Inicio de sesión |
| **Descripción** | Autenticación de usuarios registrados |
| **Prioridad** | Alta |
| **Actores** | Usuario registrado |

**Funcionalidades:**
- Login con email y contraseña
- Opción "Recordar sesión"
- Bloqueo después de 5 intentos fallidos
- Tiempo de bloqueo: 15 minutos

> *Imagen de pantalla de login*

#### RF-AUTH-003: Recuperación de Contraseña
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-AUTH-003 |
| **Nombre** | Recuperación de contraseña |
| **Descripción** | Proceso de recuperación mediante email |
| **Prioridad** | Alta |
| **Actores** | Usuario registrado |

**Flujo:**
1. Usuario solicita recuperación
2. Sistema envía enlace por email
3. Usuario establece nueva contraseña
4. Sistema confirma el cambio

> *Imagen de flujo de recuperación de contraseña*

#### RF-AUTH-004: Cambio de Contraseña Obligatorio
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-AUTH-004 |
| **Nombre** | Cambio de contraseña obligatorio |
| **Descripción** | Forzar cambio en primer acceso o contraseñas temporales |
| **Prioridad** | Media |
| **Actores** | Usuario con contraseña temporal |

> *Imagen de pantalla de cambio obligatorio*

---

### 4.2 Módulo de Dashboard (RF-DASH)

#### RF-DASH-001: Panel de Estadísticas Generales
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-DASH-001 |
| **Nombre** | Dashboard principal |
| **Descripción** | Visualización de métricas clave del sistema |
| **Prioridad** | Alta |
| **Actores** | Usuarios autenticados |

**Métricas mostradas:**
- Total de reportes
- Reportes por estado
- Reportes por prioridad
- Usuarios activos
- Categorías más utilizadas

> *Imagen de dashboard principal*

#### RF-DASH-002: Gráficos Interactivos
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-DASH-002 |
| **Nombre** | Gráficos estadísticos |
| **Descripción** | Visualización de datos mediante gráficos |
| **Prioridad** | Media |
| **Actores** | Usuarios autenticados |

**Tipos de gráficos:**
- Barras (distribución por categoría)
- Líneas (tendencias temporales)
- Circular (distribución por estado)
- Radar (análisis comparativo)

> *Imagen de gráficos del dashboard*

#### RF-DASH-003: Filtros de Período
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-DASH-003 |
| **Nombre** | Filtros temporales |
| **Descripción** | Filtrar estadísticas por rango de fechas |
| **Prioridad** | Media |
| **Actores** | Usuarios autenticados |

**Opciones:**
- Hoy
- Última semana
- Último mes
- Último año
- Rango personalizado

> *Imagen de filtros de período*

---

### 4.3 Módulo de Reportes (RF-REP)

#### RF-REP-001: Crear Reporte
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-REP-001 |
| **Nombre** | Creación de reporte |
| **Descripción** | Registro de nuevo incidente o reporte |
| **Prioridad** | Alta |
| **Actores** | Usuarios autenticados |

**Datos del reporte:**
| Campo | Tipo | Requerido |
|-------|------|-----------|
| Nombre | Texto | Sí |
| Descripción | Texto largo | No |
| Categoría | Selección | Sí |
| Tipo de reporte | Selección | No |
| Prioridad | Selección | Sí |
| Visibilidad | Selección | Sí |
| Ubicación | Geolocalización | Sí |
| Imágenes | Archivos | No |

> *Imagen de formulario de creación de reporte*

#### RF-REP-002: Geolocalización de Reportes
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-REP-002 |
| **Nombre** | Ubicación en mapa |
| **Descripción** | Captura de ubicación mediante mapa interactivo |
| **Prioridad** | Alta |
| **Actores** | Usuarios autenticados |

**Funcionalidades:**
- Detectar ubicación actual (GPS)
- Seleccionar punto en mapa
- Búsqueda por dirección
- Geocodificación inversa

**Tecnología:** Leaflet + OpenStreetMap

> *Imagen de mapa de selección de ubicación*

#### RF-REP-003: Carga de Evidencias
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-REP-003 |
| **Nombre** | Adjuntar evidencias |
| **Descripción** | Subir imágenes como evidencia del reporte |
| **Prioridad** | Alta |
| **Actores** | Usuarios autenticados |

**Especificaciones:**
- Formatos: JPG, PNG, GIF, WebP
- Tamaño máximo: 10MB por imagen
- Máximo: 5 imágenes por reporte
- Almacenamiento: Cloudinary

> *Imagen de carga de evidencias*

#### RF-REP-004: Detección de Reportes Similares
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-REP-004 |
| **Nombre** | Detección de duplicados |
| **Descripción** | Identificar reportes similares por proximidad |
| **Prioridad** | Media |
| **Actores** | Sistema |

**Criterios:**
- Radio de búsqueda: 500 metros
- Misma categoría
- Últimas 24 horas

> *Imagen de alerta de reportes similares*

#### RF-REP-005: Cambio de Estado
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-REP-005 |
| **Nombre** | Gestión de estados |
| **Descripción** | Transición de estados del reporte |
| **Prioridad** | Alta |
| **Actores** | Operadores, Supervisores, Administradores |

**Estados disponibles:**
| Estado | Descripción | Color |
|--------|-------------|-------|
| Pendiente | Recién creado | Amarillo |
| En Proceso | En atención | Azul |
| En Revisión | Pendiente de validación | Naranja |
| Resuelto | Solucionado | Verde |
| Rechazado | No procede | Rojo |
| Archivado | Cerrado sin acción | Gris |

> *Imagen de flujo de estados*

#### RF-REP-006: Asignación de Reportes
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-REP-006 |
| **Nombre** | Asignación a usuarios |
| **Descripción** | Asignar reportes a operadores o equipos |
| **Prioridad** | Alta |
| **Actores** | Supervisores, Administradores |

> *Imagen de panel de asignación*

#### RF-REP-007: Historial de Cambios
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-REP-007 |
| **Nombre** | Historial del reporte |
| **Descripción** | Registro de todas las modificaciones |
| **Prioridad** | Media |
| **Actores** | Usuarios con acceso al reporte |

> *Imagen de historial de cambios*

#### RF-REP-008: Confirmación de Reportes
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-REP-008 |
| **Nombre** | Confirmar reporte |
| **Descripción** | Otros usuarios confirman la existencia del incidente |
| **Prioridad** | Baja |
| **Actores** | Usuarios autenticados |

> *Imagen de botón de confirmación*

---

### 4.4 Módulo de Categorías (RF-CAT)

#### RF-CAT-001: CRUD de Categorías
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-CAT-001 |
| **Nombre** | Gestión de categorías |
| **Descripción** | Crear, leer, actualizar y eliminar categorías |
| **Prioridad** | Alta |
| **Actores** | Administradores |

**Datos de categoría:**
| Campo | Tipo | Requerido |
|-------|------|-----------|
| Nombre | Texto | Sí |
| Descripción | Texto | No |
| Color | Selector | Sí |
| Icono | Selector | No |
| Estado | Activo/Inactivo | Sí |

> *Imagen de lista de categorías*

#### RF-CAT-002: Carga Masiva
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-CAT-002 |
| **Nombre** | Importación masiva |
| **Descripción** | Cargar múltiples categorías desde archivo |
| **Prioridad** | Baja |
| **Actores** | Administradores |

**Formato:** CSV con columnas definidas

> *Imagen de carga masiva de categorías*

---

### 4.5 Módulo de Tipos de Reporte (RF-TIP)

#### RF-TIP-001: CRUD de Tipos
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-TIP-001 |
| **Nombre** | Gestión de tipos de reporte |
| **Descripción** | Subclasificaciones asociadas a categorías |
| **Prioridad** | Alta |
| **Actores** | Administradores |

**Datos del tipo:**
| Campo | Tipo | Requerido |
|-------|------|-----------|
| Nombre | Texto | Sí |
| Descripción | Texto | No |
| Categoría padre | Selección | Sí |
| Color | Selector | No |
| Icono | Selector | No |
| Estado | Activo/Inactivo | Sí |

> *Imagen de gestión de tipos de reporte*

---

### 4.6 Módulo de Usuarios (RF-USR)

#### RF-USR-001: CRUD de Usuarios
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-USR-001 |
| **Nombre** | Gestión de usuarios |
| **Descripción** | Administración completa de cuentas |
| **Prioridad** | Alta |
| **Actores** | Administradores |

**Datos del usuario:**
| Campo | Tipo | Requerido |
|-------|------|-----------|
| Nombre | Texto | Sí |
| Email | Email | Sí |
| Username | Texto | Sí |
| Avatar | Imagen | No |
| Bio | Texto | No |
| Estado | Selección | Sí |

> *Imagen de lista de usuarios*

#### RF-USR-002: Gestión de Roles
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-USR-002 |
| **Nombre** | Asignación de roles |
| **Descripción** | Asignar uno o más roles a usuarios |
| **Prioridad** | Alta |
| **Actores** | Super Administradores |

**Roles disponibles:**
- super_admin
- admin
- moderator
- supervisor
- operator
- user

> *Imagen de gestión de roles*

#### RF-USR-003: Gestión de Permisos
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-USR-003 |
| **Nombre** | Permisos granulares |
| **Descripción** | Asignar permisos específicos |
| **Prioridad** | Alta |
| **Actores** | Super Administradores |

**Permisos disponibles:**
| Permiso | Descripción |
|---------|-------------|
| crear_reportes | Crear nuevos reportes |
| editar_reportes | Modificar reportes |
| eliminar_reportes | Eliminar reportes |
| ver_todos_reportes | Ver todos los reportes |
| gestionar_usuarios | Administrar usuarios |
| gestionar_categorias | Administrar categorías |
| gestionar_tipos | Administrar tipos |
| ver_dashboard | Acceder al dashboard |
| ver_auditoria | Ver registros de auditoría |
| configurar_sistema | Modificar configuración |

> *Imagen de gestión de permisos*

#### RF-USR-004: Bloqueo de Usuarios
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-USR-004 |
| **Nombre** | Bloquear/Desbloquear usuarios |
| **Descripción** | Restringir acceso a usuarios |
| **Prioridad** | Media |
| **Actores** | Administradores |

> *Imagen de usuarios bloqueados*

---

### 4.7 Módulo de Red Social (RF-SOC)

#### RF-SOC-001: Crear Publicación
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-SOC-001 |
| **Nombre** | Publicar contenido |
| **Descripción** | Crear publicaciones en el feed social |
| **Prioridad** | Alta |
| **Actores** | Usuarios autenticados |

**Datos de publicación:**
| Campo | Tipo | Requerido |
|-------|------|-----------|
| Contenido | Texto | Sí |
| Imágenes | Archivos | No |
| Visibilidad | Selección | Sí |

**Funcionalidades:**
- Menciones (@usuario)
- Hashtags (#tema)
- Adjuntar imágenes (Cloudinary)

> *Imagen de creación de publicación*

#### RF-SOC-002: Feed de Publicaciones
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-SOC-002 |
| **Nombre** | Feed principal |
| **Descripción** | Visualización de publicaciones de seguidos |
| **Prioridad** | Alta |
| **Actores** | Usuarios autenticados |

**Características:**
- Scroll infinito
- Ordenamiento cronológico inverso
- Filtro por seguidos/todos

> *Imagen de feed de publicaciones*

#### RF-SOC-003: Interacciones
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-SOC-003 |
| **Nombre** | Interactuar con publicaciones |
| **Descripción** | Likes, comentarios, reposts, guardar |
| **Prioridad** | Alta |
| **Actores** | Usuarios autenticados |

**Tipos de interacción:**
- 👍 Me gusta
- 💬 Comentar
- 🔄 Repostear
- 📑 Guardar

> *Imagen de interacciones en publicación*

#### RF-SOC-004: Sistema de Seguimiento
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-SOC-004 |
| **Nombre** | Seguir usuarios |
| **Descripción** | Sistema de seguir/dejar de seguir |
| **Prioridad** | Alta |
| **Actores** | Usuarios autenticados |

**Estados de relación:**
- No relacionados
- Solicitud pendiente
- Amigos (mutuo)
- Siguiendo (unilateral)

> *Imagen de solicitudes de amistad*

#### RF-SOC-005: Estados Efímeros
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-SOC-005 |
| **Nombre** | Estados temporales |
| **Descripción** | Publicaciones que expiran en 24 horas |
| **Prioridad** | Media |
| **Actores** | Usuarios autenticados |

**Tipos de estado:**
- Texto
- Imagen
- Compartir publicación

> *Imagen de estados efímeros*

#### RF-SOC-006: Hashtags Tendencia
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-SOC-006 |
| **Nombre** | Trending hashtags |
| **Descripción** | Mostrar hashtags más populares |
| **Prioridad** | Baja |
| **Actores** | Usuarios autenticados |

> *Imagen de hashtags en tendencia*

---

### 4.8 Módulo de Mensajería (RF-MSG)

#### RF-MSG-001: Conversaciones Individuales
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-MSG-001 |
| **Nombre** | Chat uno a uno |
| **Descripción** | Mensajería directa entre dos usuarios |
| **Prioridad** | Alta |
| **Actores** | Usuarios autenticados |

**Funcionalidades:**
- Envío de texto
- Envío de imágenes
- Compartir publicaciones
- Indicador de escritura

> *Imagen de chat individual*

#### RF-MSG-002: Grupos de Chat
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-MSG-002 |
| **Nombre** | Chats grupales |
| **Descripción** | Conversaciones con múltiples participantes |
| **Prioridad** | Alta |
| **Actores** | Usuarios autenticados |

**Características:**
- Crear grupo (nombre + miembros)
- Roles: admin, miembro
- Agregar/remover participantes
- Cambiar nombre del grupo

> *Imagen de chat grupal*

#### RF-MSG-003: Mensajes en Tiempo Real
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-MSG-003 |
| **Nombre** | Sincronización en tiempo real |
| **Descripción** | Actualización instantánea de mensajes |
| **Prioridad** | Alta |
| **Actores** | Sistema |

**Tecnología:** Supabase Realtime

> *Imagen de indicador de mensaje nuevo*

#### RF-MSG-004: Estado de Lectura
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-MSG-004 |
| **Nombre** | Confirmación de lectura |
| **Descripción** | Indicadores de entrega y lectura |
| **Prioridad** | Media |
| **Actores** | Usuarios autenticados |

**Estados:**
- ✓ Enviado
- ✓✓ Entregado
- ✓✓ Leído (azul)

> *Imagen de estados de lectura*

#### RF-MSG-005: Silenciar Conversaciones
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-MSG-005 |
| **Nombre** | Silenciar notificaciones |
| **Descripción** | Desactivar notificaciones de una conversación |
| **Prioridad** | Baja |
| **Actores** | Usuarios autenticados |

> *Imagen de opción silenciar*

---

### 4.9 Módulo de Notificaciones (RF-NOT)

#### RF-NOT-001: Notificaciones en Tiempo Real
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-NOT-001 |
| **Nombre** | Sistema de notificaciones |
| **Descripción** | Alertas instantáneas de actividad |
| **Prioridad** | Alta |
| **Actores** | Usuarios autenticados |

**Tipos de notificación:**
| Tipo | Descripción |
|------|-------------|
| info | Información general |
| report | Actualizaciones de reportes |
| social | Actividad social |
| message | Nuevos mensajes |
| system | Alertas del sistema |
| alert | Alertas importantes |

> *Imagen de panel de notificaciones*

#### RF-NOT-002: Notificaciones por Proximidad
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-NOT-002 |
| **Nombre** | Alertas de reportes cercanos |
| **Descripción** | Notificar cuando hay reportes cerca del usuario |
| **Prioridad** | Media |
| **Actores** | Usuarios con ubicación activa |

**Configuración:**
- Radio de detección: configurable
- Frecuencia: tiempo real

> *Imagen de notificación de reporte cercano*

#### RF-NOT-003: Gestión de Notificaciones
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-NOT-003 |
| **Nombre** | Administrar notificaciones |
| **Descripción** | Marcar como leídas, eliminar, filtrar |
| **Prioridad** | Media |
| **Actores** | Usuarios autenticados |

**Acciones:**
- Marcar como leída
- Marcar todas como leídas
- Eliminar notificación
- Filtrar por tipo

> *Imagen de gestión de notificaciones*

---

### 4.10 Módulo de Rastreo (RF-TRK)

#### RF-TRK-001: Mapa de Reportes
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-TRK-001 |
| **Nombre** | Visualización geográfica |
| **Descripción** | Mostrar reportes en mapa interactivo |
| **Prioridad** | Alta |
| **Actores** | Usuarios autenticados |

**Funcionalidades:**
- Marcadores por reporte
- Colores por estado/prioridad
- Clusters para densidad alta
- Popup con resumen

**Tecnología:** Leaflet + OpenStreetMap

> *Imagen de mapa de reportes*

#### RF-TRK-002: Seguimiento en Tiempo Real
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-TRK-002 |
| **Nombre** | Tracking GPS |
| **Descripción** | Seguimiento de ubicación de usuarios/reportes |
| **Prioridad** | Media |
| **Actores** | Usuarios con permiso |

> *Imagen de seguimiento en tiempo real*

#### RF-TRK-003: Navegación al Reporte
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-TRK-003 |
| **Nombre** | Navegación GPS |
| **Descripción** | Guiar al usuario hacia un reporte |
| **Prioridad** | Baja |
| **Actores** | Operadores |

> *Imagen de navegación al reporte*

#### RF-TRK-004: Filtros en Mapa
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-TRK-004 |
| **Nombre** | Filtros geográficos |
| **Descripción** | Filtrar reportes mostrados en mapa |
| **Prioridad** | Media |
| **Actores** | Usuarios autenticados |

**Filtros disponibles:**
- Por estado
- Por prioridad
- Por categoría
- Por fecha
- Por asignado

> *Imagen de filtros del mapa*

---

### 4.11 Módulo de Auditoría (RF-AUD)

#### RF-AUD-001: Registro de Actividades
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-AUD-001 |
| **Nombre** | Log de auditoría |
| **Descripción** | Registrar todas las acciones del sistema |
| **Prioridad** | Alta |
| **Actores** | Sistema |

**Datos registrados:**
| Campo | Descripción |
|-------|-------------|
| Usuario | Quién realizó la acción |
| Acción | Tipo de operación |
| Tabla afectada | Entidad modificada |
| Valores anteriores | Estado previo |
| Valores nuevos | Estado posterior |
| IP | Dirección IP |
| User Agent | Navegador/Dispositivo |
| Fecha/Hora | Timestamp exacto |

> *Imagen de registro de auditoría*

#### RF-AUD-002: Consulta de Auditoría
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-AUD-002 |
| **Nombre** | Consultar registros |
| **Descripción** | Buscar y filtrar actividades |
| **Prioridad** | Alta |
| **Actores** | Administradores |

**Filtros:**
- Por usuario
- Por acción (CREATE, UPDATE, DELETE)
- Por tabla
- Por rango de fechas

> *Imagen de búsqueda en auditoría*

#### RF-AUD-003: Exportación
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-AUD-003 |
| **Nombre** | Exportar registros |
| **Descripción** | Descargar logs en formato CSV/PDF |
| **Prioridad** | Baja |
| **Actores** | Administradores |

> *Imagen de exportación de auditoría*

---

### 4.12 Módulo de Perfil (RF-PRF)

#### RF-PRF-001: Ver Perfil
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-PRF-001 |
| **Nombre** | Visualizar perfil |
| **Descripción** | Mostrar información del usuario |
| **Prioridad** | Alta |
| **Actores** | Usuarios autenticados |

**Información mostrada:**
- Avatar
- Nombre y username
- Bio
- Estadísticas (reportes, publicaciones, seguidores)
- Actividad reciente

> *Imagen de perfil de usuario*

#### RF-PRF-002: Editar Perfil
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-PRF-002 |
| **Nombre** | Modificar perfil |
| **Descripción** | Actualizar información personal |
| **Prioridad** | Alta |
| **Actores** | Usuario propietario |

**Campos editables:**
- Avatar (Cloudinary)
- Nombre
- Username
- Bio

> *Imagen de edición de perfil*

#### RF-PRF-003: Cambiar Contraseña
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-PRF-003 |
| **Nombre** | Cambiar contraseña |
| **Descripción** | Actualizar contraseña de acceso |
| **Prioridad** | Alta |
| **Actores** | Usuario propietario |

> *Imagen de cambio de contraseña*

---

### 4.13 Módulo de Configuración (RF-CFG)

#### RF-CFG-001: Preferencias de Usuario
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-CFG-001 |
| **Nombre** | Configuración personal |
| **Descripción** | Ajustes personalizados |
| **Prioridad** | Media |
| **Actores** | Usuarios autenticados |

**Opciones:**
- Tema (claro/oscuro/sistema)
- Notificaciones habilitadas
- Auto-compartir reportes
- Días de retención de mensajes

> *Imagen de configuración del usuario*

#### RF-CFG-002: Tema de Interfaz
| Campo | Descripción |
|-------|-------------|
| **ID** | RF-CFG-002 |
| **Nombre** | Modo oscuro/claro |
| **Descripción** | Cambiar apariencia visual |
| **Prioridad** | Media |
| **Actores** | Usuarios autenticados |

> *Imagen de selector de tema*

---

## 5. Requerimientos No Funcionales

### 5.1 Rendimiento (RNF-PERF)

| ID | Requerimiento | Métrica |
|----|---------------|---------|
| RNF-PERF-001 | Tiempo de carga inicial | < 3 segundos |
| RNF-PERF-002 | Respuesta de API | < 500ms promedio |
| RNF-PERF-003 | Actualización en tiempo real | < 1 segundo |
| RNF-PERF-004 | Carga de imágenes | < 2 segundos |

### 5.2 Escalabilidad (RNF-ESC)

| ID | Requerimiento | Descripción |
|----|---------------|-------------|
| RNF-ESC-001 | Usuarios concurrentes | Soportar 1000+ usuarios simultáneos |
| RNF-ESC-002 | Almacenamiento | Escalable según demanda (Cloudinary) |
| RNF-ESC-003 | Base de datos | Auto-escalable (Supabase) |

### 5.3 Seguridad (RNF-SEG)

| ID | Requerimiento | Descripción |
|----|---------------|-------------|
| RNF-SEG-001 | Autenticación | JWT con tokens seguros |
| RNF-SEG-002 | Autorización | Row Level Security (RLS) |
| RNF-SEG-003 | Transmisión | HTTPS obligatorio |
| RNF-SEG-004 | Contraseñas | Hash con bcrypt |
| RNF-SEG-005 | Sesiones | Expiración automática |
| RNF-SEG-006 | Intentos de login | Bloqueo tras 5 intentos |

### 5.4 Usabilidad (RNF-USA)

| ID | Requerimiento | Descripción |
|----|---------------|-------------|
| RNF-USA-001 | Responsive | Adaptable a móvil, tablet y desktop |
| RNF-USA-002 | Accesibilidad | Cumplir WCAG 2.1 nivel AA |
| RNF-USA-003 | Internacionalización | Interfaz en español |
| RNF-USA-004 | PWA | Instalable como aplicación |

### 5.5 Disponibilidad (RNF-DIS)

| ID | Requerimiento | Métrica |
|----|---------------|---------|
| RNF-DIS-001 | Uptime | 99.9% disponibilidad |
| RNF-DIS-002 | Recuperación | RTO < 4 horas |
| RNF-DIS-003 | Backups | Diarios automáticos |

### 5.6 Mantenibilidad (RNF-MAN)

| ID | Requerimiento | Descripción |
|----|---------------|-------------|
| RNF-MAN-001 | Código | TypeScript con tipado estricto |
| RNF-MAN-002 | Componentes | Reutilizables y modulares |
| RNF-MAN-003 | Documentación | Código documentado |
| RNF-MAN-004 | Versionamiento | Control con Git |

---

## 6. Arquitectura del Sistema

### 6.1 Diagrama de Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    React + Vite + TypeScript              │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐ │   │
│  │  │  Pages  │ │Components│ │  Hooks  │ │    Contexts     │ │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘ │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │              Tailwind CSS + shadcn/ui               │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                       Supabase                            │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐  │   │
│  │  │   Auth   │ │ Database │ │ Realtime │ │Edge Functions│  │   │
│  │  │  (JWT)   │ │(PostgreSQL)│ │(WebSocket)│ │ (Deno)     │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────────┘  │   │
│  │  ┌──────────────────────────────────────────────────────┐│   │
│  │  │              Row Level Security (RLS)                 ││   │
│  │  └──────────────────────────────────────────────────────┘│   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICIOS EXTERNOS                            │
│  ┌──────────────────┐  ┌────────────────────────────────────┐   │
│  │    Cloudinary    │  │      OpenStreetMap + Leaflet       │   │
│  │  (Almacenamiento │  │         (Mapas y Geocoding)        │   │
│  │    de Medios)    │  │                                    │   │
│  └──────────────────┘  └────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

> *Imagen de diagrama de arquitectura*

### 6.2 Estructura de Carpetas

```
src/
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes base (shadcn)
│   ├── auth/           # Autenticación
│   ├── dashboard/      # Dashboard
│   ├── report/         # Reportes
│   ├── categories/     # Categorías
│   ├── users/          # Usuarios
│   ├── redsocial/      # Red social
│   ├── messages/       # Mensajería
│   ├── notifications/  # Notificaciones
│   ├── tracking/       # Rastreo
│   ├── audit/          # Auditoría
│   └── Map/            # Componentes de mapa
├── contexts/           # Contextos React
├── hooks/              # Custom hooks
│   ├── controlador/    # Lógica de negocio
│   ├── entidades/      # Acceso a datos
│   └── optimizacion/   # Optimización
├── pages/              # Páginas/Rutas
├── lib/                # Utilidades
└── integrations/       # Integraciones (Supabase)
```

> *Imagen de estructura del proyecto*

### 6.3 Flujo de Datos

```
Usuario → Componente React → Hook → Supabase Client → PostgreSQL
                                         ↓
                              Realtime (WebSocket)
                                         ↓
                              Actualización UI
```

> *Imagen de flujo de datos*

---

## 7. Modelo de Datos

### 7.1 Diagrama Entidad-Relación

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   profiles   │────<│   reportes   │>────│  categories  │
│──────────────│     │──────────────│     │──────────────│
│ id           │     │ id           │     │ id           │
│ user_id      │     │ user_id      │     │ nombre       │
│ name         │     │ nombre       │     │ descripcion  │
│ email        │     │ descripcion  │     │ color        │
│ username     │     │ categoria_id │     │ icono        │
│ avatar       │     │ tipo_id      │     │ activo       │
│ estado       │     │ status       │     └──────────────┘
└──────────────┘     │ priority     │            │
       │             │ geolocation  │            │
       │             └──────────────┘     ┌──────────────┐
       │                                  │tipo_categories│
       │                                  │──────────────│
       │             ┌──────────────┐     │ id           │
       └────────────<│ publicaciones│     │ category_id  │
                     │──────────────│     │ nombre       │
                     │ id           │     │ descripcion  │
                     │ user_id      │     └──────────────┘
                     │ contenido    │
                     │ imagenes     │
                     │ visibilidad  │
                     └──────────────┘
                            │
                     ┌──────────────┐
                     │  comentarios │
                     │──────────────│
                     │ id           │
                     │ publicacion_id│
                     │ user_id      │
                     │ contenido    │
                     └──────────────┘
```

> *Imagen de diagrama ER completo*

### 7.2 Tablas Principales

| Tabla | Descripción | Relaciones |
|-------|-------------|------------|
| profiles | Información de usuarios | user_roles, reportes, publicaciones |
| user_roles | Roles y permisos | profiles |
| categories | Categorías de reportes | tipo_categories, reportes |
| tipo_categories | Tipos de reportes | categories, reportes |
| reportes | Reportes/Incidentes | profiles, categories, tipo_categories |
| publicaciones | Posts de red social | profiles, comentarios, interacciones |
| comentarios | Comentarios en posts | publicaciones, profiles |
| interacciones | Likes, shares, saves | publicaciones, profiles |
| conversaciones | Chats | participantes_conversacion, mensajes |
| mensajes | Mensajes de chat | conversaciones, profiles |
| notifications | Notificaciones | profiles |
| user_audit | Registro de auditoría | profiles |
| settings | Configuración usuario | profiles |

---

## 8. Interfaces del Sistema

### 8.1 Interfaces de Usuario

| Interfaz | Descripción | Acceso |
|----------|-------------|--------|
| Login | Inicio de sesión | Público |
| Registro | Crear cuenta | Público |
| Dashboard | Panel principal | Autenticado |
| Reportes | Gestión de reportes | Autenticado |
| Categorías | Administración | Administrador |
| Tipos | Administración | Administrador |
| Usuarios | Gestión de usuarios | Administrador |
| Red Social | Feed y perfiles | Autenticado |
| Mensajes | Chat | Autenticado |
| Notificaciones | Alertas | Autenticado |
| Rastreo | Mapa | Autenticado |
| Auditoría | Logs | Administrador |
| Perfil | Datos personales | Autenticado |
| Configuración | Preferencias | Autenticado |

> *Imagen de mapa de navegación*

### 8.2 Interfaces Externas

| Sistema | Tipo | Propósito |
|---------|------|-----------|
| Supabase Auth | API REST | Autenticación |
| Supabase DB | PostgreSQL | Persistencia |
| Supabase Realtime | WebSocket | Tiempo real |
| Cloudinary | API REST | Almacenamiento de medios |
| OpenStreetMap | Tiles | Mapas base |
| Nominatim | API REST | Geocodificación |

---

## 9. Restricciones y Supuestos

### 9.1 Restricciones Técnicas

| Restricción | Descripción |
|-------------|-------------|
| Navegadores | Chrome, Firefox, Safari, Edge (últimas 2 versiones) |
| Resolución mínima | 320px (móvil) |
| JavaScript | Requerido habilitado |
| Conexión | Internet requerida |
| Geolocalización | Requiere permiso del usuario |

### 9.2 Restricciones de Negocio

| Restricción | Descripción |
|-------------|-------------|
| Idioma | Español únicamente |
| Zona horaria | Configurable por usuario |
| Archivos | Máximo 10MB por imagen |
| Reportes | Requiere ubicación |

### 9.3 Supuestos

| Supuesto | Descripción |
|----------|-------------|
| Usuarios | Tienen correo electrónico válido |
| Dispositivos | Tienen GPS para geolocalización |
| Conectividad | Conexión a internet estable |
| Navegador | Soporte para ES6+ y CSS3 |

---

## 10. Glosario

| Término | Definición |
|---------|------------|
| **Reporte** | Registro de un incidente o situación |
| **Categoría** | Clasificación principal de reportes |
| **Tipo de Reporte** | Subclasificación dentro de una categoría |
| **Feed** | Lista cronológica de publicaciones |
| **Estado (Status)** | Publicación temporal que expira en 24h |
| **RLS** | Row Level Security - Políticas de seguridad a nivel de fila |
| **JWT** | JSON Web Token - Token de autenticación |
| **Geolocalización** | Captura de coordenadas GPS |
| **Realtime** | Actualización en tiempo real via WebSocket |
| **PWA** | Progressive Web App - Aplicación web instalable |

---

## 11. Anexos

### 11.1 Matriz de Trazabilidad

| Requerimiento | Módulo | Prioridad | Estado |
|---------------|--------|-----------|--------|
| RF-AUTH-001 | Autenticación | Alta | Implementado |
| RF-AUTH-002 | Autenticación | Alta | Implementado |
| RF-AUTH-003 | Autenticación | Alta | Implementado |
| RF-DASH-001 | Dashboard | Alta | Implementado |
| RF-REP-001 | Reportes | Alta | Implementado |
| RF-REP-002 | Reportes | Alta | Implementado |
| RF-CAT-001 | Categorías | Alta | Implementado |
| RF-USR-001 | Usuarios | Alta | Implementado |
| RF-SOC-001 | Red Social | Alta | Implementado |
| RF-MSG-001 | Mensajería | Alta | Implementado |
| RF-NOT-001 | Notificaciones | Alta | Implementado |
| RF-TRK-001 | Rastreo | Alta | Implementado |
| RF-AUD-001 | Auditoría | Alta | Implementado |

### 11.2 Historial de Cambios

| Versión | Fecha | Descripción | Autor |
|---------|-------|-------------|-------|
| 1.0 | Enero 2026 | Versión inicial | Equipo de Desarrollo |

### 11.3 Referencias

- [Documentación de React](https://react.dev/)
- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)
- [Documentación de Leaflet](https://leafletjs.com/reference.html)
- [API de Cloudinary](https://cloudinary.com/documentation)
- [Lovable Documentation](https://docs.lovable.dev/)

---

**Fin del Documento de Requerimientos**

> *Imagen de firma de aprobación*
