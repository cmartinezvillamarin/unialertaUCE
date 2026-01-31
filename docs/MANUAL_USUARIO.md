# Manual de Usuario - UniAlertaUCE

## Índice

1. [Introducción](#1-introducción)
2. [Acceso al Sistema](#2-acceso-al-sistema)
3. [Panel Principal (Dashboard)](#3-panel-principal-dashboard)
4. [Gestión de Reportes](#4-gestión-de-reportes)
5. [Categorías y Tipos de Reportes](#5-categorías-y-tipos-de-reportes)
6. [Gestión de Usuarios](#6-gestión-de-usuarios)
7. [Red Social](#7-red-social)
8. [Sistema de Mensajería](#8-sistema-de-mensajería)
9. [Notificaciones](#9-notificaciones)
10. [Rastreo en Tiempo Real](#10-rastreo-en-tiempo-real)
11. [Mi Perfil](#11-mi-perfil)
12. [Configuración](#12-configuración)
13. [Auditoría](#13-auditoría)

---

## 1. Introducción

### 1.1 ¿Qué es UniAlertaUCE?

UniAlertaUCE es una plataforma web progresiva (PWA) diseñada para la gestión de reportes e incidentes, que incorpora funcionalidades de red social, mensajería en tiempo real y geolocalización.

### 1.2 Características Principales

- 📍 **Geolocalización**: Reportes con ubicación exacta usando mapas interactivos
- 📱 **Aplicación PWA**: Instalable en dispositivos móviles
- 💬 **Mensajería**: Chat en tiempo real individual y grupal
- 🌐 **Red Social**: Publicaciones, comentarios y estados
- 📊 **Dashboard**: Estadísticas y análisis en tiempo real
- 🔔 **Notificaciones**: Alertas de reportes cercanos y actividad

### 1.3 Navegación General

La interfaz principal consta de:

- **Barra lateral (Sidebar)**: Menú de navegación principal
- **Barra superior**: Notificaciones, mensajes y menú de usuario
- **Área de contenido**: Contenido de la página actual

> **Imagen de _**: Vista general de la interfaz de la aplicación

---

## 2. Acceso al Sistema

### 2.1 Página de Inicio

Al acceder a la plataforma, verá la página de bienvenida con las opciones de acceso.

> **Imagen de _**: Página de inicio/bienvenida de UniAlertaUCE

### 2.2 Iniciar Sesión

1. Haga clic en **"Iniciar Sesión"**
2. Ingrese su correo electrónico
3. Ingrese su contraseña
4. Haga clic en **"Iniciar Sesión"**

> **Imagen de _**: Formulario de inicio de sesión

#### Opciones Adicionales:
- **¿Olvidó su contraseña?**: Recupere su acceso
- **¿No tiene cuenta?**: Regístrese

### 2.3 Registro de Usuario

1. Haga clic en **"Registrarse"**
2. Complete los campos requeridos:
   - Nombre completo
   - Correo electrónico
   - Contraseña (mínimo 8 caracteres)
   - Confirmar contraseña
3. Acepte los términos y condiciones
4. Haga clic en **"Crear cuenta"**

> **Imagen de _**: Formulario de registro de nuevo usuario

### 2.4 Recuperar Contraseña

1. En la pantalla de login, haga clic en **"¿Olvidó su contraseña?"**
2. Ingrese su correo electrónico registrado
3. Haga clic en **"Enviar enlace de recuperación"**
4. Revise su bandeja de entrada
5. Siga el enlace para crear una nueva contraseña

> **Imagen de _**: Formulario de recuperación de contraseña

### 2.5 Cambio Obligatorio de Contraseña

Si un administrador le asignó una contraseña temporal, se le solicitará cambiarla en el primer inicio de sesión.

> **Imagen de _**: Pantalla de cambio obligatorio de contraseña

---

## 3. Panel Principal (Dashboard)

### 3.1 Vista General

El Dashboard muestra un resumen de la actividad del sistema con estadísticas clave.

> **Imagen de _**: Vista completa del Dashboard

### 3.2 Tarjetas de Estadísticas

Las tarjetas superiores muestran:

| Estadística | Descripción |
|-------------|-------------|
| Total Reportes | Número total de reportes en el sistema |
| Reportes Pendientes | Reportes sin resolver |
| Reportes Resueltos | Reportes completados |
| Usuarios Activos | Usuarios en el sistema |

> **Imagen de _**: Tarjetas de estadísticas del Dashboard

### 3.3 Gráficos y Análisis

El Dashboard incluye:

- **Gráfico de tendencias**: Evolución de reportes en el tiempo
- **Distribución por categoría**: Reportes por tipo
- **Análisis comparativo**: Comparación entre períodos
- **Mapa de calor**: Zonas con más incidentes

> **Imagen de _**: Gráficos de análisis del Dashboard

### 3.4 Filtros de Tiempo

Puede filtrar las estadísticas por:
- Hoy
- Última semana
- Último mes
- Último año
- Rango personalizado

> **Imagen de _**: Selector de rango de fechas

### 3.5 Análisis Detallado

Las pestañas de análisis permiten ver estadísticas de:
- Reportes
- Categorías
- Tipos de Reporte
- Usuarios
- Roles

> **Imagen de _**: Pestañas de análisis detallado

---

## 4. Gestión de Reportes

### 4.1 Lista de Reportes

La vista de reportes muestra todos los reportes con opciones de filtrado y búsqueda.

> **Imagen de _**: Tabla de lista de reportes

#### Columnas de la Tabla:
- Nombre del reporte
- Categoría
- Tipo
- Estado
- Prioridad
- Fecha de creación
- Usuario reportador
- Acciones

### 4.2 Crear Nuevo Reporte

1. Haga clic en **"Nuevo Reporte"**
2. Complete el formulario:

| Campo | Descripción |
|-------|-------------|
| Nombre | Título descriptivo del reporte |
| Descripción | Detalles del incidente |
| Categoría | Seleccione la categoría |
| Tipo de Reporte | Seleccione el tipo |
| Prioridad | Baja, Media, Alta, Urgente |
| Ubicación | Use el mapa para marcar el lugar |
| Imágenes | Suba evidencia fotográfica |

> **Imagen de _**: Formulario de creación de reporte

### 4.3 Seleccionar Ubicación en el Mapa

1. El mapa mostrará su ubicación actual (si tiene permisos)
2. Haga clic en el mapa para marcar la ubicación del incidente
3. También puede buscar direcciones en el buscador

> **Imagen de _**: Mapa interactivo para seleccionar ubicación (Leaflet/OpenStreetMap)

### 4.4 Subir Imágenes

1. Haga clic en el área de carga o arrastre imágenes
2. Puede subir múltiples imágenes
3. Las imágenes se almacenan en Cloudinary
4. Puede eliminar imágenes antes de enviar

> **Imagen de _**: Componente de carga de imágenes (Cloudinary)

### 4.5 Ver Detalle de Reporte

Al hacer clic en un reporte, se muestra:

- Información completa del reporte
- Mapa con la ubicación
- Galería de imágenes
- Historial de cambios
- Usuario asignado
- Línea de tiempo

> **Imagen de _**: Vista de detalle de un reporte

### 4.6 Cambiar Estado de Reporte

Los estados disponibles son:

| Estado | Descripción |
|--------|-------------|
| Pendiente | Reporte nuevo sin revisar |
| En Revisión | Reporte siendo evaluado |
| En Proceso | Reporte siendo atendido |
| Resuelto | Reporte solucionado |
| Rechazado | Reporte descartado |

> **Imagen de _**: Selector de estado del reporte

### 4.7 Asignar Reporte

1. Abra el detalle del reporte
2. Haga clic en **"Asignar"**
3. Seleccione el usuario responsable
4. Opcionalmente agregue un comentario
5. Confirme la asignación

> **Imagen de _**: Modal de asignación de reporte

### 4.8 Historial de Asignaciones

El historial muestra todas las reasignaciones del reporte con:
- Usuario anterior
- Usuario nuevo
- Quien realizó el cambio
- Fecha y hora
- Comentarios

> **Imagen de _**: Historial de asignaciones del reporte

### 4.9 Mis Reportes

En **"Mis Reportes"** puede ver:
- Reportes creados por usted
- Reportes asignados a usted
- Estado de cada reporte

> **Imagen de _**: Vista de Mis Reportes

### 4.10 Reportes Similares

Al crear un reporte, el sistema detecta reportes similares cercanos para evitar duplicados.

> **Imagen de _**: Alerta de reportes similares encontrados

### 4.11 Confirmar Reporte

Los usuarios pueden confirmar reportes existentes para validar su veracidad.

> **Imagen de _**: Botón de confirmación de reporte

---

## 5. Categorías y Tipos de Reportes

### 5.1 Gestión de Categorías

Las categorías agrupan tipos de reportes similares.

> **Imagen de _**: Lista de categorías

#### Crear Categoría:
1. Haga clic en **"Nueva Categoría"**
2. Ingrese:
   - Nombre
   - Descripción
   - Color identificativo
   - Icono
3. Guarde la categoría

> **Imagen de _**: Formulario de nueva categoría

### 5.2 Gestión de Tipos de Reporte

Los tipos de reporte son subcategorías más específicas.

> **Imagen de _**: Lista de tipos de reporte

#### Crear Tipo de Reporte:
1. Haga clic en **"Nuevo Tipo"**
2. Seleccione la categoría padre
3. Ingrese nombre, descripción, color e icono
4. Guarde el tipo

> **Imagen de _**: Formulario de nuevo tipo de reporte

### 5.3 Ver Detalle de Categoría/Tipo

Muestra:
- Información de la categoría/tipo
- Estadísticas de uso
- Reportes asociados
- Opciones de edición/eliminación

> **Imagen de _**: Vista de detalle de categoría

### 5.4 Carga Masiva

Para cargar múltiples categorías o tipos:

1. Vaya a **"Carga Masiva"**
2. Descargue la plantilla CSV
3. Complete los datos
4. Suba el archivo
5. Revise y confirme

> **Imagen de _**: Pantalla de carga masiva

---

## 6. Gestión de Usuarios

### 6.1 Lista de Usuarios

Vista de todos los usuarios registrados con opciones de gestión.

> **Imagen de _**: Tabla de usuarios

### 6.2 Crear Usuario

Los administradores pueden crear usuarios:

1. Haga clic en **"Nuevo Usuario"**
2. Complete:
   - Nombre
   - Email
   - Contraseña temporal
   - Roles
   - Estado (Activo/Inactivo)
3. El usuario recibirá notificación

> **Imagen de _**: Formulario de creación de usuario

### 6.3 Roles y Permisos

#### Roles Disponibles:

| Rol | Descripción |
|-----|-------------|
| Admin | Acceso completo al sistema |
| Moderador | Gestión de reportes y usuarios |
| Usuario | Crear y ver reportes |
| Visualizador | Solo lectura |

> **Imagen de _**: Configuración de roles de usuario

#### Permisos Específicos:

Los permisos permiten control granular sobre:
- Crear/Editar/Eliminar reportes
- Gestionar usuarios
- Acceder a auditoría
- Ver estadísticas
- Configurar sistema

> **Imagen de _**: Panel de asignación de permisos

### 6.4 Editar Usuario

1. Haga clic en el usuario
2. Modifique los campos necesarios
3. Guarde los cambios

> **Imagen de _**: Formulario de edición de usuario

### 6.5 Cambiar Contraseña de Usuario

Los administradores pueden:
1. Abrir el usuario
2. Clic en **"Cambiar Contraseña"**
3. Generar o escribir nueva contraseña
4. Marcar "Cambio obligatorio en próximo login"

> **Imagen de _**: Modal de cambio de contraseña

### 6.6 Desactivar/Eliminar Usuario

- **Desactivar**: El usuario no puede iniciar sesión
- **Eliminar**: Eliminación lógica (soft delete)

> **Imagen de _**: Opciones de desactivación/eliminación

### 6.7 Carga Masiva de Usuarios

Similar a categorías, permite importar usuarios desde CSV.

> **Imagen de _**: Carga masiva de usuarios

---

## 7. Red Social

### 7.1 Feed de Publicaciones

El feed muestra publicaciones de la comunidad.

> **Imagen de _**: Feed principal de red social

### 7.2 Crear Publicación

1. Escriba su contenido en el cuadro de texto
2. Opcionalmente agregue:
   - Imágenes (subidas a Cloudinary)
   - Hashtags (#etiqueta)
   - Menciones (@usuario)
3. Seleccione visibilidad (Público, Amigos, Solo yo)
4. Publique

> **Imagen de _**: Cuadro de creación de publicación

### 7.3 Interacciones

Puede interactuar con publicaciones:

- 👍 **Me gusta**: Mostrar aprobación
- 💬 **Comentar**: Añadir comentarios
- 🔄 **Compartir**: Repostear contenido
- 📌 **Guardar**: Guardar para después
- 📤 **Enviar**: Compartir en mensajes

> **Imagen de _**: Botones de interacción de publicación

### 7.4 Comentarios

1. Haga clic en el icono de comentarios
2. Escriba su comentario
3. Puede incluir imágenes y menciones
4. Responda a otros comentarios

> **Imagen de _**: Sección de comentarios de una publicación

### 7.5 Estados (Stories)

Los estados son publicaciones temporales (24 horas):

1. Haga clic en **"Crear Estado"**
2. Agregue texto o imagen
3. Seleccione visibilidad
4. Publique

> **Imagen de _**: Barra de estados de usuarios

### 7.6 Ver Estados

1. Haga clic en el avatar con borde colorido
2. Navegue entre estados con flechas o clic
3. Puede reaccionar con emojis
4. Vea quién ha visto su estado

> **Imagen de _**: Visor de estados

### 7.7 Hashtags Trending

Los hashtags más usados aparecen en la sección lateral.

> **Imagen de _**: Panel de hashtags en tendencia

### 7.8 Publicaciones Trending

Las publicaciones más populares se destacan en el panel lateral.

> **Imagen de _**: Panel de publicaciones en tendencia

### 7.9 Búsqueda Avanzada

Busque publicaciones por:
- Texto
- Hashtags
- Usuario
- Fecha
- Tipo de contenido

> **Imagen de _**: Panel de búsqueda avanzada

### 7.10 Perfil de Usuario (Red Social)

El perfil muestra:
- Información del usuario
- Estadísticas (publicaciones, seguidores, siguiendo)
- Publicaciones del usuario
- Botones de seguir/mensaje

> **Imagen de _**: Perfil de usuario en red social

### 7.11 Relaciones de Amistad

- **Seguir**: Siga a otros usuarios
- **Solicitud de amistad**: Envíe solicitudes
- **Aceptar/Rechazar**: Gestione solicitudes recibidas
- **Bloquear**: Bloquee usuarios

> **Imagen de _**: Panel de solicitudes de amistad

### 7.12 Usuarios Sugeridos

El sistema sugiere usuarios basándose en:
- Amigos en común
- Intereses similares
- Actividad reciente

> **Imagen de _**: Panel de usuarios sugeridos

---

## 8. Sistema de Mensajería

### 8.1 Vista de Conversaciones

La lista muestra todas sus conversaciones ordenadas por actividad reciente.

> **Imagen de _**: Lista de conversaciones

### 8.2 Iniciar Conversación

1. Haga clic en **"Nueva Conversación"**
2. Seleccione el usuario destinatario
3. Escriba su mensaje
4. Envíe

> **Imagen de _**: Modal de nueva conversación

### 8.3 Chat Individual

La ventana de chat muestra:
- Mensajes ordenados cronológicamente
- Estado del usuario (en línea/desconectado)
- Indicador de escritura
- Estado de lectura (✓✓)

> **Imagen de _**: Ventana de chat individual

### 8.4 Enviar Mensajes

Puede enviar:
- **Texto**: Mensajes de texto
- **Imágenes**: Subidas a Cloudinary
- **Publicaciones compartidas**: Desde la red social
- **Reacciones**: Emojis en mensajes

> **Imagen de _**: Barra de entrada de mensajes

### 8.5 Crear Grupo

1. Haga clic en **"Nuevo Grupo"**
2. Ingrese nombre del grupo
3. Seleccione participantes
4. Cree el grupo

> **Imagen de _**: Modal de creación de grupo

### 8.6 Gestión de Grupo

Los administradores del grupo pueden:
- Cambiar nombre del grupo
- Agregar/eliminar miembros
- Asignar roles (Admin, Miembro)
- Ver historial de cambios

> **Imagen de _**: Panel de gestión de grupo

### 8.7 Agregar Miembros

1. Abra el panel de información del grupo
2. Haga clic en **"Agregar Miembros"**
3. Seleccione usuarios
4. Confirme

> **Imagen de _**: Modal para agregar miembros al grupo

### 8.8 Indicadores de Estado

| Indicador | Significado |
|-----------|-------------|
| 🟢 | Usuario en línea |
| ⚪ | Usuario desconectado |
| ✓ | Mensaje enviado |
| ✓✓ | Mensaje leído |
| "Escribiendo..." | Usuario escribiendo |

> **Imagen de _**: Indicadores de estado en mensajería

### 8.9 Reacciones a Mensajes

1. Mantenga presionado un mensaje
2. Seleccione un emoji
3. La reacción aparecerá en el mensaje

> **Imagen de _**: Selector de reacciones en mensaje

### 8.10 Silenciar Conversación

Para silenciar notificaciones:
1. Abra la conversación
2. Haga clic en el menú (⋮)
3. Seleccione **"Silenciar"**

> **Imagen de _**: Opción de silenciar conversación

### 8.11 Galería de Imágenes

Vea todas las imágenes compartidas en una conversación:
1. Abra información de la conversación
2. Vaya a la sección **"Multimedia"**

> **Imagen de _**: Galería de imágenes del chat

---

## 9. Notificaciones

### 9.1 Centro de Notificaciones

Acceda haciendo clic en el icono de campana (🔔) en la barra superior.

> **Imagen de _**: Panel desplegable de notificaciones

### 9.2 Tipos de Notificaciones

| Tipo | Descripción |
|------|-------------|
| 📍 Reporte cercano | Nuevo reporte en su zona |
| 💬 Mensaje | Nuevo mensaje recibido |
| 👤 Solicitud | Solicitud de amistad |
| ❤️ Interacción | Me gusta o comentario |
| 📢 Sistema | Notificaciones del sistema |
| 🔔 Mención | Alguien lo mencionó |

> **Imagen de _**: Lista de notificaciones por tipo

### 9.3 Página de Notificaciones

La página completa de notificaciones ofrece:
- Filtros por tipo
- Marcar como leída
- Eliminar notificaciones
- Acciones rápidas

> **Imagen de _**: Página completa de notificaciones

### 9.4 Notificaciones Push

Para habilitar notificaciones push:
1. Cuando se le solicite, haga clic en **"Permitir"**
2. También puede habilitarlas en Configuración

> **Imagen de _**: Prompt de permiso de notificaciones del navegador

### 9.5 Notificaciones de Reportes Cercanos

Cuando hay un reporte nuevo cerca de su ubicación:
1. Recibirá una notificación emergente
2. Puede ver el reporte o descartarlo
3. Configure el radio de alerta en Configuración

> **Imagen de _**: Toast de notificación de reporte cercano

---

## 10. Rastreo en Tiempo Real

### 10.1 Mapa de Rastreo

El módulo de rastreo muestra reportes en un mapa interactivo.

> **Imagen de _**: Mapa de rastreo con reportes (Leaflet/OpenStreetMap)

### 10.2 Filtros de Reportes

Filtre los reportes visibles por:
- Categoría
- Tipo
- Estado
- Prioridad
- Rango de fechas
- Radio de distancia

> **Imagen de _**: Panel de filtros del mapa

### 10.3 Marcadores en el Mapa

Cada reporte se muestra con un marcador que indica:
- Color: Prioridad del reporte
- Icono: Categoría del reporte
- Clic: Muestra información resumida

> **Imagen de _**: Marcadores de reportes en el mapa

### 10.4 Información del Reporte

Al hacer clic en un marcador:
- Popup con resumen
- Botón para ver detalle completo
- Opción de navegar hasta el lugar

> **Imagen de _**: Popup de información de reporte en mapa

### 10.5 Navegación

1. Haga clic en **"Navegar"** en un reporte
2. Se abrirá la ruta desde su ubicación
3. Siga las indicaciones en el mapa

> **Imagen de _**: Vista de navegación hacia un reporte

### 10.6 Estadísticas de Rastreo

Panel lateral con estadísticas:
- Total de reportes visibles
- Distribución por categoría
- Reportes más recientes

> **Imagen de _**: Panel de estadísticas de rastreo

### 10.7 Mi Ubicación

El mapa puede centrase en su ubicación actual:
1. Haga clic en el botón de ubicación
2. Permita el acceso a ubicación si se solicita

> **Imagen de _**: Botón de centrar en mi ubicación

---

## 11. Mi Perfil

### 11.1 Ver Mi Perfil

Acceda desde el menú de usuario → **"Mi Perfil"**

> **Imagen de _**: Vista de mi perfil

### 11.2 Información del Perfil

Se muestra:
- Avatar
- Nombre
- Username
- Email
- Biografía
- Fecha de registro
- Estadísticas

> **Imagen de _**: Sección de información del perfil

### 11.3 Editar Perfil

1. Haga clic en **"Editar Perfil"**
2. Modifique los campos:
   - Avatar (sube imagen a Cloudinary)
   - Nombre
   - Username
   - Biografía
3. Guarde los cambios

> **Imagen de _**: Formulario de edición de perfil

### 11.4 Cambiar Contraseña

1. Vaya a **"Cambiar Contraseña"**
2. Ingrese contraseña actual
3. Ingrese nueva contraseña
4. Confirme nueva contraseña
5. Guarde

> **Imagen de _**: Formulario de cambio de contraseña

### 11.5 Cambiar Avatar

1. En editar perfil, haga clic en el avatar
2. Seleccione o tome una foto
3. La imagen se sube automáticamente a Cloudinary
4. Guarde los cambios

> **Imagen de _**: Selector de avatar con cámara

---

## 12. Configuración

### 12.1 Panel de Configuración

Acceda desde el menú → **"Configuración"**

> **Imagen de _**: Panel principal de configuración

### 12.2 Tema de la Aplicación

Seleccione el tema visual:
- ☀️ Claro
- 🌙 Oscuro
- 💻 Sistema (automático)

> **Imagen de _**: Selector de tema

### 12.3 Notificaciones

Configure las notificaciones:
- Habilitar/deshabilitar notificaciones
- Reportes cercanos (radio de distancia)
- Notificaciones de mensajes
- Notificaciones de red social
- Notificaciones del sistema

> **Imagen de _**: Configuración de notificaciones

### 12.4 Rastreo en Tiempo Real

- Habilitar/deshabilitar rastreo
- Frecuencia de actualización
- Guardar historial de ubicación

> **Imagen de _**: Configuración de rastreo

### 12.5 Compartir Automático

Configure el compartido automático de reportes:
- Compartir como estado
- Compartir en mensajes
- Visibilidad por defecto

> **Imagen de _**: Configuración de compartir automático

### 12.6 Chat y Mensajes

- Persistencia de mensajes
- Auto-eliminación de leídos
- Días de retención

> **Imagen de _**: Configuración de mensajería

---

## 13. Auditoría

### 13.1 Panel de Auditoría

*(Disponible solo para administradores)*

Muestra el registro de actividades del sistema.

> **Imagen de _**: Panel principal de auditoría

### 13.2 Filtros de Auditoría

Filtre por:
- Usuario
- Tipo de acción (Crear, Editar, Eliminar, Login)
- Tabla afectada
- Rango de fechas

> **Imagen de _**: Filtros del panel de auditoría

### 13.3 Detalle de Actividad

Cada registro muestra:
- Usuario que realizó la acción
- Tipo de operación
- Tabla afectada
- Valores anteriores y nuevos
- Fecha y hora
- Dirección IP

> **Imagen de _**: Modal de detalle de actividad de auditoría

### 13.4 Dashboard de Actividad

Gráficos y estadísticas de:
- Actividad por hora (pico de actividad)
- Actividad por tipo de operación
- Usuarios más activos

> **Imagen de _**: Dashboard de estadísticas de auditoría

---

## Anexos

### A. Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `Ctrl + K` | Búsqueda rápida |
| `Esc` | Cerrar modal/panel |
| `Enter` | Confirmar acción |

### B. Instalación como PWA

#### En Móvil (Android):
1. Abra la aplicación en Chrome
2. Toque el menú (⋮)
3. Seleccione **"Instalar aplicación"**

> **Imagen de _**: Opción de instalar PWA en Android

#### En Móvil (iOS):
1. Abra la aplicación en Safari
2. Toque el botón compartir
3. Seleccione **"Añadir a pantalla de inicio"**

> **Imagen de _**: Opción de instalar PWA en iOS

#### En Escritorio:
1. Abra la aplicación en Chrome
2. Haga clic en el icono de instalación en la barra de direcciones
3. Confirme la instalación

> **Imagen de _**: Opción de instalar PWA en escritorio

### C. Requisitos del Sistema

| Requisito | Mínimo |
|-----------|--------|
| Navegador | Chrome 80+, Firefox 75+, Safari 13+ |
| Conexión | Internet estable |
| Dispositivo | Smartphone, tablet o computadora |

### D. Soporte

Para soporte técnico o reportar problemas:
- Utilice la función de reportes de la plataforma
- Contacte al administrador del sistema

---

**Manual de Usuario - UniAlertaUCE**  
**Versión**: 1.0  
**Última actualización**: Enero 2026
