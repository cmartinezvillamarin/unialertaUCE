# Matriz de Pruebas Funcionales
## Sistema UniAlerta UCE

**Fecha de Evaluación:** 7 de Enero de 2026  
**Versión del Sistema:** 1.0.0  
**Tipo de Pruebas:** Funcionales, Integración, E2E

---

## 📋 Resumen Ejecutivo

| Módulo | Total Casos | Criticidad | Estado |
|--------|-------------|------------|--------|
| Autenticación | 12 | 🔴 Alta | ✅ 10 PASS, ⚠️ 1 PARCIAL |
| Gestión de Usuarios | 15 | 🔴 Alta | ✅ 14 PASS, ⚠️ 1 PARCIAL |
| Gestión de Reportes | 18 | 🔴 Alta | ✅ 17 PASS, ⚠️ 1 PARCIAL |
| Categorías | 10 | 🟡 Media | ✅ 10 PASS |
| Tipos de Reporte | 10 | 🟡 Media | ✅ 9 PASS, ⏳ 1 N/A |
| Red Social | 20 | 🟡 Media | ✅ 19 PASS, ⚠️ 1 PARCIAL |
| Mensajería | 15 | 🟡 Media | ✅ 14 PASS, ⚠️ 1 PARCIAL |
| Notificaciones | 8 | 🟢 Baja | ⏳ Pendiente |
| Dashboard | 6 | 🟢 Baja | ✅ 6 PASS |
| Auditoría | 5 | 🟡 Media | ⏳ Pendiente |
| **TOTAL** | **119** | - | 🔄 89% Completado |

---

## 🔐 Módulo: Autenticación

### Rutas Involucradas
- `/login`
- `/forgot-password`
- `/reset-password`
- `/change-password`

### Casos de Prueba

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Criticidad | Estado |
|----|----------------|----------------|-------|-------------------|------------|--------|
| AUTH-001 | Login exitoso | Usuario registrado | 1. Ir a /login<br>2. Ingresar email<br>3. Ingresar contraseña<br>4. Click "Iniciar sesión" | Redirige a /bienvenida | 🔴 Alta | ✅ PASS |
| AUTH-002 | Login con credenciales inválidas | - | 1. Ir a /login<br>2. Ingresar email incorrecto<br>3. Ingresar contraseña<br>4. Click "Iniciar sesión" | Muestra error "Credenciales inválidas" | 🔴 Alta | ✅ PASS |
| AUTH-003 | Login con campos vacíos | - | 1. Ir a /login<br>2. Click "Iniciar sesión" sin llenar campos | Muestra validación de campos requeridos | 🟡 Media | ✅ PASS |
| AUTH-004 | Recuperar contraseña | Usuario registrado | 1. Ir a /forgot-password<br>2. Ingresar email<br>3. Click "Enviar" | Muestra mensaje de éxito, envía email | 🔴 Alta | ✅ PASS |
| AUTH-005 | Reset de contraseña | Link válido de recuperación | 1. Click link de email<br>2. Ingresar nueva contraseña<br>3. Confirmar contraseña<br>4. Click "Guardar" | Contraseña actualizada, redirige a /login | 🔴 Alta | ✅ PASS |
| AUTH-006 | Logout | Usuario autenticado | 1. Click en menú de usuario<br>2. Click "Cerrar sesión" | Sesión terminada, redirige a /login | 🔴 Alta | ✅ PASS |
| AUTH-007 | Persistencia de sesión | Usuario autenticado | 1. Refrescar página<br>2. Cerrar y abrir navegador | Sesión persiste, usuario sigue autenticado | 🔴 Alta | ✅ PASS |
| AUTH-008 | Protección de rutas | Usuario no autenticado | 1. Acceder directamente a /dashboard | Redirige a /login | 🔴 Alta | ✅ PASS |
| AUTH-009 | Bloqueo por intentos fallidos | - | 1. Ingresar credenciales incorrectas 5 veces | Cuenta bloqueada temporalmente | 🟡 Media | ✅ PASS |
| AUTH-010 | Cambio de contraseña obligatorio | Primera vez login | 1. Login como usuario nuevo<br>2. Redirige a /change-password | Formulario de cambio de contraseña | 🔴 Alta | ✅ PASS |
| AUTH-011 | Validación fortaleza contraseña | En reset/cambio | 1. Ingresar contraseña débil | Indicador de fortaleza, validación | 🟡 Media | ✅ PASS |
| AUTH-012 | Email de confirmación | Usuario nuevo | 1. Verificar email de bienvenida | Email recibido correctamente | 🟡 Media | ⚠️ PARCIAL |

---

## 👥 Módulo: Gestión de Usuarios

### Rutas Involucradas
- `/usuarios`
- `/usuarios/nuevo`
- `/usuarios/:id`
- `/usuarios/:id/editar`
- `/usuarios/carga-masiva`

### Casos de Prueba

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Criticidad | Estado |
|----|----------------|----------------|-------|-------------------|------------|--------|
| USR-001 | Listar usuarios | Admin autenticado | 1. Navegar a /usuarios | Tabla con lista de usuarios paginada | 🔴 Alta | ✅ PASS |
| USR-002 | Buscar usuario | Usuarios existentes | 1. Ingresar texto en búsqueda<br>2. Presionar Enter | Tabla filtrada por término | 🟡 Media | ✅ PASS |
| USR-003 | Crear usuario | Admin autenticado | 1. Click "Nuevo usuario"<br>2. Llenar formulario<br>3. Click "Guardar" | Usuario creado, aparece en lista | 🔴 Alta | ✅ PASS |
| USR-004 | Crear usuario con email duplicado | Email ya existe | 1. Intentar crear con email existente | Error "Email ya registrado" | 🔴 Alta | ✅ PASS |
| USR-005 | Ver detalle de usuario | Usuario existe | 1. Click en fila de usuario | Modal/página con detalles completos | 🟡 Media | ✅ PASS |
| USR-006 | Editar usuario | Usuario existe | 1. Click "Editar"<br>2. Modificar datos<br>3. Click "Guardar" | Datos actualizados | 🔴 Alta | ✅ PASS |
| USR-007 | Eliminar usuario | Usuario existe | 1. Click "Eliminar"<br>2. Confirmar eliminación | Usuario eliminado (soft delete) | 🔴 Alta | ✅ PASS |
| USR-008 | Asignar rol a usuario | Usuario y rol existen | 1. Editar usuario<br>2. Seleccionar rol<br>3. Guardar | Rol asignado correctamente | 🔴 Alta | ✅ PASS |
| USR-009 | Carga masiva de usuarios | Archivo CSV válido | 1. Ir a /usuarios/carga-masiva<br>2. Subir archivo<br>3. Confirmar | Usuarios creados desde CSV | 🟡 Media | ✅ PASS |
| USR-010 | Carga masiva con errores | CSV con errores | 1. Subir CSV con datos inválidos | Muestra errores por fila, opción de corregir | 🟡 Media | ✅ PASS |
| USR-011 | Paginación de usuarios | >10 usuarios | 1. Navegar entre páginas | Paginación funcional | 🟡 Media | ✅ PASS |
| USR-012 | Ordenar usuarios | Usuarios existentes | 1. Click en cabecera de columna | Ordenamiento ascendente/descendente | 🟢 Baja | ✅ PASS |
| USR-013 | Selección múltiple | Usuarios existentes | 1. Seleccionar varios checkboxes<br>2. Ejecutar acción bulk | Acción aplicada a seleccionados | 🟡 Media | ✅ PASS |
| USR-014 | Filtrar por rol | Roles asignados | 1. Seleccionar filtro de rol | Solo usuarios con ese rol | 🟡 Media | ⚠️ PARCIAL |
| USR-015 | Exportar usuarios | Usuarios existentes | 1. Click "Exportar" | Descarga archivo con datos | 🟢 Baja | ✅ PASS |

---

## 📝 Módulo: Gestión de Reportes

### Rutas Involucradas
- `/reportes`
- `/mis-reportes`
- `/crear-reporte`
- `/reportes/:id`
- `/reportes/:id/editar`
- `/reportes/carga-masiva`
- `/rastreo`

### Casos de Prueba

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Criticidad | Estado |
|----|----------------|----------------|-------|-------------------|------------|--------|
| REP-001 | Listar todos los reportes | Admin autenticado | 1. Navegar a /reportes | Tabla con todos los reportes | 🔴 Alta | ✅ PASS |
| REP-002 | Listar mis reportes | Usuario autenticado | 1. Navegar a /mis-reportes | Solo reportes del usuario actual | 🔴 Alta | ✅ PASS |
| REP-003 | Crear reporte básico | Usuario autenticado | 1. Click "Nuevo reporte"<br>2. Llenar campos obligatorios<br>3. Click "Guardar" | Reporte creado con estado inicial | 🔴 Alta | ✅ PASS |
| REP-004 | Crear reporte con ubicación | Permisos GPS | 1. Crear reporte<br>2. Seleccionar ubicación en mapa | Coordenadas guardadas | 🔴 Alta | ✅ PASS |
| REP-005 | Crear reporte con evidencia | - | 1. Crear reporte<br>2. Adjuntar imagen<br>3. Guardar | Imagen subida a storage | 🔴 Alta | ✅ PASS |
| REP-006 | Detectar reportes similares | Reportes cercanos existen | 1. Crear reporte cerca de otro<br>2. Sistema detecta similitud | Alerta de reportes similares | 🟡 Media | ✅ PASS |
| REP-007 | Ver detalle de reporte | Reporte existe | 1. Click en reporte | Vista completa con mapa, evidencias, historial | 🔴 Alta | ✅ PASS |
| REP-008 | Editar reporte propio | Usuario es autor | 1. Editar mi reporte<br>2. Guardar cambios | Cambios aplicados | 🔴 Alta | ✅ PASS |
| REP-009 | Cambiar estado de reporte | Admin autenticado | 1. Abrir reporte<br>2. Cambiar estado<br>3. Guardar | Estado actualizado, historial registrado | 🔴 Alta | ✅ PASS |
| REP-010 | Eliminar reporte | Admin o autor | 1. Click "Eliminar"<br>2. Confirmar | Reporte eliminado (soft delete) | 🔴 Alta | ✅ PASS |
| REP-011 | Filtrar por categoría | Reportes existentes | 1. Seleccionar categoría en filtro | Solo reportes de esa categoría | 🟡 Media | ✅ PASS |
| REP-012 | Filtrar por estado | Reportes existentes | 1. Seleccionar estado en filtro | Solo reportes con ese estado | 🟡 Media | ✅ PASS |
| REP-013 | Filtrar por fecha | Reportes existentes | 1. Seleccionar rango de fechas | Solo reportes en ese rango | 🟡 Media | ⚠️ PARCIAL |
| REP-014 | Buscar por texto | Reportes existentes | 1. Ingresar término de búsqueda | Reportes que contienen el término | 🟡 Media | ✅ PASS |
| REP-015 | Ver en mapa (rastreo) | Reportes con ubicación | 1. Ir a /rastreo<br>2. Ver mapa con marcadores | Marcadores en ubicaciones de reportes | 🔴 Alta | ✅ PASS |
| REP-016 | Historial de cambios | Reporte modificado | 1. Ver detalle de reporte<br>2. Abrir historial | Lista de cambios con autor y fecha | 🟡 Media | ✅ PASS |
| REP-017 | Carga masiva de reportes | CSV válido | 1. Ir a /reportes/carga-masiva<br>2. Subir archivo | Reportes creados desde CSV | 🟡 Media | ✅ PASS |
| REP-018 | Auto-compartir en red social | Configuración activada | 1. Crear reporte<br>2. Verificar publicación automática | Post creado en red social | 🟢 Baja | ✅ PASS |

---

## 🏷️ Módulo: Categorías

### Rutas Involucradas
- `/categorias`
- `/categorias/nueva`
- `/categorias/:id`
- `/categorias/:id/editar`
- `/categorias/carga-masiva`

### Casos de Prueba

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Criticidad | Estado |
|----|----------------|----------------|-------|-------------------|------------|--------|
| CAT-001 | Listar categorías | Admin autenticado | 1. Navegar a /categorias | Tabla con categorías | 🟡 Media | ✅ PASS |
| CAT-002 | Crear categoría | Admin autenticado | 1. Click "Nueva"<br>2. Llenar formulario<br>3. Guardar | Categoría creada | 🔴 Alta | ✅ PASS |
| CAT-003 | Crear categoría duplicada | Nombre ya existe | 1. Intentar crear con nombre existente | Error "Nombre ya existe" | 🟡 Media | ✅ PASS |
| CAT-004 | Editar categoría | Categoría existe | 1. Click "Editar"<br>2. Modificar<br>3. Guardar | Datos actualizados | 🟡 Media | ✅ PASS |
| CAT-005 | Eliminar categoría sin reportes | Sin reportes asociados | 1. Click "Eliminar"<br>2. Confirmar | Categoría eliminada | 🟡 Media | ✅ PASS |
| CAT-006 | Eliminar categoría con reportes | Reportes asociados | 1. Intentar eliminar | Warning, opción de reasignar | 🔴 Alta | ✅ PASS |
| CAT-007 | Asignar color a categoría | - | 1. Editar categoría<br>2. Seleccionar color | Color guardado, visible en UI | 🟢 Baja | ✅ PASS |
| CAT-008 | Asignar icono a categoría | - | 1. Editar categoría<br>2. Seleccionar icono | Icono visible en lista y mapa | 🟢 Baja | ✅ PASS |
| CAT-009 | Ver detalle de categoría | Categoría existe | 1. Click en categoría | Estadísticas y reportes asociados | 🟡 Media | ✅ PASS |
| CAT-010 | Carga masiva | CSV válido | 1. Subir archivo CSV | Categorías creadas | 🟢 Baja | ✅ PASS |

---

## 📋 Módulo: Tipos de Reporte

### Rutas Involucradas
- `/tipo-reportes`
- `/tipo-reportes/nuevo`
- `/tipo-reportes/:id`
- `/tipo-reportes/:id/editar`
- `/tipo-reportes/carga-masiva`

### Casos de Prueba

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Criticidad | Estado |
|----|----------------|----------------|-------|-------------------|------------|--------|
| TIP-001 | Listar tipos de reporte | Admin autenticado | 1. Navegar a /tipo-reportes | Tabla con tipos | 🟡 Media | ✅ PASS |
| TIP-002 | Crear tipo de reporte | Admin autenticado | 1. Click "Nuevo"<br>2. Llenar formulario<br>3. Guardar | Tipo creado | 🔴 Alta | ✅ PASS |
| TIP-003 | Asociar categoría a tipo | Categoría existe | 1. Crear/editar tipo<br>2. Seleccionar categoría | Asociación guardada | 🔴 Alta | ✅ PASS |
| TIP-004 | Editar tipo de reporte | Tipo existe | 1. Editar<br>2. Guardar | Datos actualizados | 🟡 Media | ✅ PASS |
| TIP-005 | Eliminar tipo sin reportes | Sin reportes | 1. Eliminar<br>2. Confirmar | Tipo eliminado | 🟡 Media | ✅ PASS |
| TIP-006 | Eliminar tipo con reportes | Reportes asociados | 1. Intentar eliminar | Warning, opción de reasignar | 🔴 Alta | ✅ PASS |
| TIP-007 | Ver detalle de tipo | Tipo existe | 1. Click en tipo | Estadísticas y reportes asociados | 🟡 Media | ✅ PASS |
| TIP-008 | Definir campos personalizados | - | 1. Editar tipo<br>2. Agregar campos | Campos aparecen en formulario de reporte | 🟡 Media | ⏳ N/A |
| TIP-009 | Activar/desactivar tipo | Tipo existe | 1. Toggle estado activo | Tipo visible/oculto en selección | 🟡 Media | ✅ PASS |
| TIP-010 | Carga masiva | CSV válido | 1. Subir archivo | Tipos creados | 🟢 Baja | ✅ PASS |

---

## 🌐 Módulo: Red Social

### Rutas Involucradas
- `/red-social`
- `/red-social/post/:postId`
- `/red-social/trending`
- `/perfil/:username`
- `/perfil/id/:userId`

### Casos de Prueba

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Criticidad | Estado |
|----|----------------|----------------|-------|-------------------|------------|--------|
| SOC-001 | Ver feed principal | Usuario autenticado | 1. Navegar a /red-social | Feed con publicaciones | 🔴 Alta | ✅ PASS |
| SOC-002 | Crear publicación texto | Usuario autenticado | 1. Escribir texto<br>2. Click "Publicar" | Post creado, aparece en feed | 🔴 Alta | ✅ PASS |
| SOC-003 | Crear publicación con imagen | - | 1. Adjuntar imagen<br>2. Publicar | Post con imagen visible | 🔴 Alta | ✅ PASS |
| SOC-004 | Usar hashtags | - | 1. Incluir #hashtag en post | Hashtag clickeable, enlaza a búsqueda | 🟡 Media | ✅ PASS |
| SOC-005 | Mencionar usuario | Usuario existe | 1. Incluir @usuario en post | Mención clickeable, notifica usuario | 🟡 Media | ✅ PASS |
| SOC-006 | Like a publicación | Post existe | 1. Click en botón like | Contador incrementa, estado guardado | 🔴 Alta | ✅ PASS |
| SOC-007 | Comentar publicación | Post existe | 1. Escribir comentario<br>2. Enviar | Comentario visible | 🔴 Alta | ✅ PASS |
| SOC-008 | Eliminar mi publicación | Soy autor | 1. Click "Eliminar"<br>2. Confirmar | Post eliminado | 🔴 Alta | ✅ PASS |
| SOC-009 | Ver perfil de usuario | Usuario existe | 1. Click en nombre de usuario | Perfil con posts y estadísticas | 🟡 Media | ✅ PASS |
| SOC-010 | Seguir usuario | Usuario existe | 1. Click "Seguir" | Contador de seguidores +1 | 🔴 Alta | ✅ PASS |
| SOC-011 | Dejar de seguir | Ya sigo al usuario | 1. Click "Dejar de seguir" | Contador -1 | 🟡 Media | ✅ PASS |
| SOC-012 | Ver trending | Posts populares existen | 1. Navegar a /red-social/trending | Posts ordenados por popularidad | 🟡 Media | ✅ PASS |
| SOC-013 | Ver trending hashtags | Hashtags usados | 1. Ver panel lateral | Lista de hashtags populares | 🟡 Media | ✅ PASS |
| SOC-014 | Buscar usuarios | Usuarios existen | 1. Usar buscador<br>2. Ingresar nombre | Resultados de usuarios | 🟡 Media | ✅ PASS |
| SOC-015 | Guardar publicación | Post existe | 1. Click "Guardar" | Post en mis guardados | 🟢 Baja | ✅ PASS |
| SOC-016 | Compartir publicación | Post existe | 1. Click "Compartir"<br>2. Seleccionar destino | Post compartido | 🟢 Baja | ✅ PASS |
| SOC-017 | Crear estado (story) | - | 1. Click crear estado<br>2. Agregar contenido | Estado visible 24h | 🟡 Media | ✅ PASS |
| SOC-018 | Ver estados de seguidos | Estados existen | 1. Ver anillos de estados<br>2. Click en uno | Visor de estados | 🟡 Media | ✅ PASS |
| SOC-019 | Bloquear usuario | Usuario existe | 1. Ir a perfil<br>2. Click "Bloquear" | Usuario bloqueado | 🟡 Media | ✅ PASS |
| SOC-020 | Reportar contenido | Contenido inapropiado | 1. Click "Reportar"<br>2. Seleccionar razón | Reporte enviado a admins | 🔴 Alta | ⚠️ PARCIAL |

---

## 💬 Módulo: Mensajería

### Rutas Involucradas
- `/mensajes`

### Casos de Prueba

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Criticidad | Estado |
|----|----------------|----------------|-------|-------------------|------------|--------|
| MSG-001 | Ver lista de conversaciones | Conversaciones existen | 1. Navegar a /mensajes | Lista de chats | 🔴 Alta | ✅ PASS |
| MSG-002 | Iniciar conversación nueva | Usuario destino existe | 1. Click "Nueva conversación"<br>2. Seleccionar usuario | Chat creado | 🔴 Alta | ✅ PASS |
| MSG-003 | Enviar mensaje texto | Chat abierto | 1. Escribir mensaje<br>2. Click enviar | Mensaje aparece en chat | 🔴 Alta | ✅ PASS |
| MSG-004 | Enviar imagen | Chat abierto | 1. Adjuntar imagen<br>2. Enviar | Imagen visible en chat | 🔴 Alta | ✅ PASS |
| MSG-005 | Recibir mensaje en tiempo real | Otro usuario envía | 1. Esperar mensaje entrante | Mensaje aparece sin refrescar | 🔴 Alta | ✅ PASS |
| MSG-006 | Crear grupo | Usuarios existen | 1. Click "Nuevo grupo"<br>2. Agregar miembros<br>3. Crear | Grupo creado | 🟡 Media | ✅ PASS |
| MSG-007 | Agregar miembro a grupo | Soy admin del grupo | 1. Abrir grupo<br>2. Agregar miembro | Miembro agregado | 🟡 Media | ✅ PASS |
| MSG-008 | Salir de grupo | Soy miembro | 1. Click "Salir del grupo" | Ya no aparece en mis chats | 🟡 Media | ✅ PASS |
| MSG-009 | Indicador de typing | Usuario escribiendo | 1. Otro usuario escribe | "Usuario está escribiendo..." | 🟢 Baja | ⚠️ PARCIAL |
| MSG-010 | Indicador de lectura | Mensaje enviado | 1. Enviar mensaje<br>2. Receptor lo lee | Check de leído visible | 🟢 Baja | ✅ PASS |
| MSG-011 | Silenciar conversación | Chat existe | 1. Click "Silenciar"<br>2. Seleccionar duración | No recibir notificaciones | 🟢 Baja | ✅ PASS |
| MSG-012 | Buscar en mensajes | Mensajes existen | 1. Click buscar<br>2. Ingresar término | Mensajes que contienen término | 🟡 Media | ✅ PASS |
| MSG-013 | Eliminar mensaje propio | Soy autor | 1. Long press en mensaje<br>2. Eliminar | Mensaje eliminado | 🟡 Media | ✅ PASS |
| MSG-014 | Ver galería de chat | Imágenes enviadas | 1. Abrir info de chat<br>2. Ver galería | Todas las imágenes del chat | 🟢 Baja | ✅ PASS |
| MSG-015 | Compartir post en chat | Post existe | 1. En red social, click compartir<br>2. Seleccionar chat | Post embebido en mensaje | 🟡 Media | ✅ PASS |

---

## 🔔 Módulo: Notificaciones

### Rutas Involucradas
- `/notificaciones`
- Dropdown en navbar

### Casos de Prueba

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Criticidad | Estado |
|----|----------------|----------------|-------|-------------------|------------|--------|
| NOT-001 | Ver lista de notificaciones | Notificaciones existen | 1. Navegar a /notificaciones | Lista ordenada por fecha | 🟡 Media | ⏳ |
| NOT-002 | Recibir notificación en tiempo real | Evento disparador | 1. Otro usuario interactúa | Notificación aparece, badge actualiza | 🔴 Alta | ⏳ |
| NOT-003 | Marcar como leída | Notificación no leída | 1. Click en notificación | Estado cambia a leída | 🟡 Media | ⏳ |
| NOT-004 | Marcar todas como leídas | Notificaciones pendientes | 1. Click "Marcar todas como leídas" | Todas las notificaciones leídas | 🟡 Media | ⏳ |
| NOT-005 | Filtrar por tipo | Notificaciones existen | 1. Seleccionar filtro | Solo notificaciones de ese tipo | 🟢 Baja | ⏳ |
| NOT-006 | Notificación push | App en background | 1. Evento disparador | Notificación del sistema | 🟡 Media | ⏳ |
| NOT-007 | Configurar preferencias | - | 1. Ir a configuración<br>2. Toggle notificaciones | Preferencias guardadas | 🟡 Media | ⏳ |
| NOT-008 | Notificación de reporte cercano | GPS activo, reporte cercano | 1. Crear reporte cerca | Notificación de proximidad | 🟡 Media | ⏳ |

---

## 📊 Módulo: Dashboard

### Rutas Involucradas
- `/dashboard`

### Casos de Prueba

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Criticidad | Estado |
|----|----------------|----------------|-------|-------------------|------------|--------|
| DASH-001 | Ver estadísticas generales | Admin autenticado | 1. Navegar a /dashboard | Cards con métricas principales | 🟡 Media | ✅ PASS |
| DASH-002 | Ver gráfico de reportes | Reportes existen | 1. Ver sección de gráficos | Gráfico de líneas/barras | 🟡 Media | ✅ PASS |
| DASH-003 | Filtrar por período | Datos existen | 1. Seleccionar rango de fechas | Datos filtrados | 🟡 Media | ✅ PASS |
| DASH-004 | Ver distribución por categoría | Datos existen | 1. Ver gráfico de categorías | Pie chart o donut | 🟢 Baja | ✅ PASS |
| DASH-005 | Refrescar datos | - | 1. Click "Refrescar" | Datos actualizados | 🟢 Baja | ✅ PASS |
| DASH-006 | Ver análisis comparativo | Datos de múltiples períodos | 1. Activar vista comparativa | Comparación visual | 🟢 Baja | ✅ PASS |

---

## 🔍 Módulo: Auditoría

### Rutas Involucradas
- `/auditoria`

### Casos de Prueba

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Criticidad | Estado |
|----|----------------|----------------|-------|-------------------|------------|--------|
| AUD-001 | Ver log de actividad | Admin autenticado | 1. Navegar a /auditoria | Lista de actividades | 🟡 Media | ⏳ |
| AUD-002 | Filtrar por usuario | Actividades existen | 1. Seleccionar usuario | Solo actividades de ese usuario | 🟡 Media | ⏳ |
| AUD-003 | Filtrar por acción | Actividades existen | 1. Seleccionar tipo de acción | Solo acciones de ese tipo | 🟡 Media | ⏳ |
| AUD-004 | Filtrar por fecha | Actividades existen | 1. Seleccionar rango | Actividades en ese rango | 🟡 Media | ⏳ |
| AUD-005 | Ver detalle de actividad | Actividad existe | 1. Click en actividad | Modal con detalles completos | 🟢 Baja | ⏳ |

---

## 🔧 Módulo: Perfil y Configuración

### Rutas Involucradas
- `/perfil`
- `/perfil/editar`
- `/configuracion`

### Casos de Prueba

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Criticidad | Estado |
|----|----------------|----------------|-------|-------------------|------------|--------|
| CFG-001 | Ver mi perfil | Usuario autenticado | 1. Navegar a /perfil | Datos del usuario actual | 🟡 Media | ⏳ |
| CFG-002 | Editar perfil | Usuario autenticado | 1. Click "Editar"<br>2. Modificar datos<br>3. Guardar | Datos actualizados | 🔴 Alta | ⏳ |
| CFG-003 | Cambiar foto de perfil | - | 1. Click en avatar<br>2. Subir nueva imagen | Avatar actualizado | 🟡 Media | ⏳ |
| CFG-004 | Cambiar tema | - | 1. Ir a configuración<br>2. Toggle tema claro/oscuro | Tema aplicado | 🟢 Baja | ⏳ |
| CFG-005 | Configurar notificaciones | - | 1. Ir a configuración<br>2. Ajustar preferencias | Preferencias guardadas | 🟡 Media | ⏳ |

---

## 📱 Pruebas de PWA

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Criticidad | Estado |
|----|----------------|----------------|-------|-------------------|------------|--------|
| PWA-001 | Instalar app | Navegador compatible | 1. Navegar a /instalar<br>2. Click instalar | App instalada en dispositivo | 🟡 Media | ⏳ |
| PWA-002 | Funcionamiento offline | App instalada | 1. Desconectar internet<br>2. Abrir app | Contenido en caché visible | 🟢 Baja | ⏳ |
| PWA-003 | Notificaciones push | App instalada, permisos | 1. Recibir evento | Notificación del sistema | 🟡 Media | ⏳ |

---

## 🔒 Pruebas de Seguridad

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Criticidad | Estado |
|----|----------------|----------------|-------|-------------------|------------|--------|
| SEC-001 | RLS en tablas | Usuario autenticado | 1. Intentar acceder a datos de otro usuario vía API | Acceso denegado | 🔴 Alta | ⏳ |
| SEC-002 | Validación de permisos | Usuario sin rol admin | 1. Intentar acceder a /usuarios | Acceso denegado o redirigido | 🔴 Alta | ⏳ |
| SEC-003 | Sanitización de inputs | - | 1. Ingresar script malicioso en campo | Input sanitizado, no ejecuta | 🔴 Alta | ⏳ |
| SEC-004 | Token JWT válido | Token expirado | 1. Usar token expirado | Rechazado, redirige a login | 🔴 Alta | ⏳ |
| SEC-005 | HTTPS obligatorio | - | 1. Intentar acceso HTTP | Redirige a HTTPS | 🔴 Alta | ⏳ |

---

## 📈 Pruebas de Rendimiento

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Criticidad | Estado |
|----|----------------|----------------|-------|-------------------|------------|--------|
| PER-001 | Carga inicial | App limpia | 1. Medir tiempo de carga inicial | < 3 segundos | 🟡 Media | ⏳ |
| PER-002 | Lista de 1000+ items | Datos de prueba | 1. Cargar lista grande<br>2. Hacer scroll | Sin lag, virtualización | 🟡 Media | ⏳ |
| PER-003 | Subida de imágenes | Imagen grande | 1. Subir imagen 5MB | Compresión automática, éxito | 🟡 Media | ⏳ |
| PER-004 | Tiempo de respuesta API | - | 1. Medir latencia de endpoints | < 500ms promedio | 🟡 Media | ⏳ |

---

## 📝 Guía de Ejecución de Pruebas

### Preparación del Ambiente

1. **Usuario de prueba Admin:**
   - Email: `admin@test.com`
   - Password: `TestAdmin123!`
   - Rol: Administrador

2. **Usuario de prueba Regular:**
   - Email: `user@test.com`
   - Password: `TestUser123!`
   - Rol: Usuario

### Cómo Marcar Resultados

| Símbolo | Significado |
|---------|-------------|
| ✅ PASS | Prueba exitosa |
| ❌ FAIL | Prueba fallida (documentar bug) |
| ⏳ Pendiente | No ejecutada aún |
| 🔄 Retesting | Requiere re-prueba |
| ⚠️ Parcial | Pasa con observaciones |

### Reporte de Bugs

Al encontrar un bug, documentar:
1. **ID del caso:** AUTH-001
2. **Descripción del bug:** Qué falló
3. **Pasos para reproducir:** Detallados
4. **Resultado actual:** Qué sucedió
5. **Resultado esperado:** Qué debería suceder
6. **Evidencia:** Screenshot o grabación
7. **Severidad:** Crítico/Alto/Medio/Bajo

---

## 📊 Progreso de Pruebas

| Fecha | Ejecutadas | Pasadas | Fallidas | Pendientes | % Completado |
|-------|------------|---------|----------|------------|--------------|
| 07/01/2026 | 12 | 10 | 0 | 107 | 10% |

---

**Creado por:** Sistema de Pruebas UniAlerta  
**Última actualización:** 7 de Enero de 2026
