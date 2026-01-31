# Guía de Capturas para el Capítulo de Anexos

## Propósito

El presente documento establece las indicaciones para la captura de evidencias visuales que demuestren el funcionamiento del software desarrollado. Las capturas deben documentar los flujos principales, las interfaces de usuario y las respuestas del sistema ante las acciones del usuario.

---

## 1. Acceso y Autenticación

### 1.1 Punto de Entrada al Sistema
- Capturar la pantalla inicial que se presenta al acceder a la URL del sistema.
- Capturar la vista de la página de bienvenida o landing, si existe.

### 1.2 Proceso de Autenticación
- Capturar el formulario de inicio de sesión en estado inicial (campos vacíos).
- Capturar el formulario de inicio de sesión con datos ingresados (ocultar credenciales reales).
- Capturar el mensaje de error ante credenciales inválidas.
- Capturar el mensaje de éxito o redirección tras autenticación exitosa.

### 1.3 Registro de Usuarios
- Capturar el formulario de registro de nuevos usuarios.
- Capturar las validaciones del formulario ante datos incompletos o inválidos.
- Capturar la confirmación de registro exitoso.

### 1.4 Recuperación de Acceso
- Capturar el formulario de recuperación de contraseña.
- Capturar el mensaje de confirmación de envío de instrucciones.
- Capturar el formulario de restablecimiento de contraseña (si es accesible).

---

## 2. Interfaz Principal

### 2.1 Vista General Post-Autenticación
- Capturar la pantalla principal que se presenta inmediatamente después del inicio de sesión.
- Capturar los elementos de navegación principal (menú, barra lateral, encabezado).
- Capturar la vista en estado de carga (skeleton/loading), si es visible.

### 2.2 Panel de Control o Dashboard
- Capturar la vista del panel de control con datos cargados.
- Capturar los indicadores estadísticos o métricas principales.
- Capturar los gráficos o visualizaciones de datos (si existen).
- Capturar las diferentes pestañas o secciones del panel (si aplica).

### 2.3 Navegación del Sistema
- Capturar el menú de navegación expandido.
- Capturar el menú de navegación en estado colapsado (si aplica).
- Capturar la navegación en dispositivo móvil (vista responsive).

---

## 3. Gestión de Entidades Principales

### 3.1 Listados de Información
- Capturar la vista de listado de cada entidad principal del sistema.
- Capturar el listado con datos cargados (múltiples registros visibles).
- Capturar el listado en estado vacío (sin registros).
- Capturar los controles de paginación activos.
- Capturar los filtros de búsqueda aplicados.
- Capturar el ordenamiento de columnas (si existe).

### 3.2 Formularios de Creación
- Capturar el formulario de creación de cada entidad en estado inicial.
- Capturar el formulario con datos válidos ingresados.
- Capturar las validaciones de campos requeridos.
- Capturar las validaciones de formato (email, teléfono, etc.).
- Capturar el mensaje de confirmación tras creación exitosa.

### 3.3 Formularios de Edición
- Capturar el formulario de edición con datos precargados.
- Capturar la modificación de campos específicos.
- Capturar el mensaje de confirmación tras actualización exitosa.

### 3.4 Vista de Detalle
- Capturar la vista de detalle de un registro individual.
- Capturar las secciones de información expandidas.
- Capturar los datos relacionados mostrados en el detalle.

### 3.5 Eliminación de Registros
- Capturar el diálogo de confirmación de eliminación.
- Capturar el mensaje de éxito tras eliminación.
- Capturar el manejo de dependencias (si el sistema lo notifica).

---

## 4. Componentes Geográficos

### 4.1 Visualización de Mapas
- Capturar el mapa en su estado inicial (zoom predeterminado).
- Capturar el mapa con marcadores o puntos de interés visibles.
- Capturar el mapa con múltiples elementos superpuestos.
- Capturar los controles de zoom y navegación del mapa.

### 4.2 Interacción con Mapas
- Capturar la selección de ubicación mediante clic en el mapa.
- Capturar el popup o tooltip de información al seleccionar un punto.
- Capturar las capas o filtros del mapa (si existen).
- Capturar la vista de mapa de calor o agrupaciones (si aplica).

### 4.3 Geolocalización
- Capturar el indicador de ubicación actual del usuario.
- Capturar el mensaje de solicitud de permisos de ubicación.
- Capturar el comportamiento ante denegación de permisos.

---

## 5. Sistema de Comunicación

### 5.1 Listado de Conversaciones
- Capturar la lista de conversaciones disponibles.
- Capturar la vista de conversaciones con indicadores de no leídos.
- Capturar la diferenciación entre conversaciones individuales y grupales.

### 5.2 Vista de Mensajes
- Capturar la interfaz de conversación activa.
- Capturar mensajes enviados y recibidos diferenciados visualmente.
- Capturar el indicador de estado de mensaje (enviado, entregado, leído).
- Capturar el indicador de escritura (typing indicator).

### 5.3 Envío de Contenido
- Capturar el campo de entrada de mensaje.
- Capturar el envío de mensaje de texto.
- Capturar el envío de imágenes o archivos adjuntos (si aplica).
- Capturar la previsualización de contenido multimedia.

### 5.4 Gestión de Grupos
- Capturar el formulario de creación de grupo.
- Capturar la vista de miembros del grupo.
- Capturar las opciones de administración del grupo.

---

## 6. Sistema de Notificaciones

### 6.1 Centro de Notificaciones
- Capturar el panel o dropdown de notificaciones.
- Capturar las notificaciones en estado no leído.
- Capturar las notificaciones en estado leído.
- Capturar el indicador de cantidad de notificaciones pendientes.

### 6.2 Tipos de Notificaciones
- Capturar ejemplos de diferentes tipos de notificaciones del sistema.
- Capturar las acciones disponibles en cada notificación.
- Capturar la navegación desde notificación hacia el contenido relacionado.

### 6.3 Alertas del Sistema
- Capturar los mensajes toast o snackbar de éxito.
- Capturar los mensajes toast o snackbar de error.
- Capturar los mensajes toast o snackbar informativos.
- Capturar las alertas de confirmación.

---

## 7. Componente Social

### 7.1 Feed o Línea de Tiempo
- Capturar la vista del feed con publicaciones cargadas.
- Capturar una publicación individual con todos sus elementos.
- Capturar las opciones de interacción con publicaciones (reacciones, comentarios).

### 7.2 Creación de Contenido
- Capturar el formulario o área de creación de publicaciones.
- Capturar la adición de imágenes a una publicación.
- Capturar la mención de usuarios (si existe).
- Capturar el uso de hashtags (si existe).

### 7.3 Interacciones Sociales
- Capturar el proceso de dar "me gusta" o reaccionar.
- Capturar la sección de comentarios expandida.
- Capturar el formulario de nuevo comentario.
- Capturar las opciones de compartir contenido.

### 7.4 Perfiles de Usuario
- Capturar el perfil propio del usuario.
- Capturar el perfil de otro usuario.
- Capturar las estadísticas del perfil (seguidores, publicaciones, etc.).
- Capturar las acciones disponibles (seguir, enviar mensaje).

### 7.5 Estados Temporales
- Capturar la barra o sección de estados.
- Capturar la creación de un nuevo estado.
- Capturar la visualización de un estado activo.
- Capturar el indicador de estados vistos/no vistos.

---

## 8. Búsqueda y Filtrado

### 8.1 Búsqueda Global
- Capturar el campo de búsqueda en estado inicial.
- Capturar los resultados de búsqueda desplegados.
- Capturar la búsqueda sin resultados (estado vacío).

### 8.2 Filtros Avanzados
- Capturar los controles de filtro disponibles.
- Capturar los filtros aplicados y sus indicadores.
- Capturar la limpieza o reseteo de filtros.

### 8.3 Búsqueda Específica por Entidad
- Capturar la búsqueda dentro de cada módulo principal.
- Capturar el autocompletado o sugerencias (si existen).

---

## 9. Configuración y Preferencias

### 9.1 Configuración de Cuenta
- Capturar la pantalla de configuración general.
- Capturar el formulario de edición de perfil.
- Capturar la sección de cambio de contraseña.

### 9.2 Preferencias del Sistema
- Capturar el selector de tema (claro/oscuro).
- Capturar las preferencias de notificaciones.
- Capturar otras opciones de personalización.

### 9.3 Tema Visual
- Capturar la interfaz principal en modo claro.
- Capturar la interfaz principal en modo oscuro.
- Capturar la transición entre temas (si es animada).

---

## 10. Funcionalidades Administrativas

### 10.1 Gestión de Usuarios
- Capturar el listado de usuarios del sistema.
- Capturar el formulario de creación de usuarios.
- Capturar la asignación de roles o permisos.
- Capturar la activación/desactivación de usuarios.

### 10.2 Auditoría y Registros
- Capturar el panel de auditoría o log de actividades.
- Capturar los filtros de auditoría por fecha, usuario o acción.
- Capturar el detalle de un registro de auditoría.

### 10.3 Gestión de Catálogos
- Capturar la administración de categorías o tipos.
- Capturar la creación de nuevos elementos de catálogo.
- Capturar la jerarquía o relaciones entre catálogos.

### 10.4 Panel de Estadísticas
- Capturar las métricas administrativas.
- Capturar los gráficos de tendencias.
- Capturar los reportes o análisis detallados.

---

## 11. Operaciones Masivas

### 11.1 Selección Múltiple
- Capturar la selección de múltiples registros en un listado.
- Capturar la barra de acciones masivas visible.
- Capturar el indicador de cantidad seleccionada.

### 11.2 Acciones en Lote
- Capturar el diálogo de confirmación de acción masiva.
- Capturar el progreso de la operación masiva.
- Capturar el resultado de la operación (éxitos y errores).

### 11.3 Carga Masiva
- Capturar la interfaz de carga masiva de datos (si existe).
- Capturar la previsualización de datos a importar.
- Capturar el reporte de resultados de importación.

---

## 12. Seguimiento y Monitoreo

### 12.1 Rastreo en Tiempo Real
- Capturar el mapa de rastreo con ubicaciones activas.
- Capturar los indicadores de usuarios en movimiento.
- Capturar la actualización de posiciones en tiempo real.

### 12.2 Historial de Ubicaciones
- Capturar el registro de ubicaciones pasadas.
- Capturar la línea de tiempo de movimientos.

---

## 13. Comportamiento Responsive

### 13.1 Vista de Escritorio
- Capturar las pantallas principales en resolución de escritorio (1920x1080 o similar).
- Capturar la disposición de elementos en pantalla completa.

### 13.2 Vista de Tablet
- Capturar las pantallas principales en resolución de tablet (768x1024 o similar).
- Capturar la adaptación de menús y paneles.

### 13.3 Vista Móvil
- Capturar las pantallas principales en resolución móvil (375x812 o similar).
- Capturar el menú móvil expandido.
- Capturar la navegación táctil específica.

---

## 14. Estados del Sistema

### 14.1 Estados de Carga
- Capturar los indicadores de carga (spinners, skeletons).
- Capturar las pantallas de carga inicial.

### 14.2 Estados de Error
- Capturar los mensajes de error de conexión.
- Capturar los mensajes de error de validación.
- Capturar la página de error 404 (no encontrado).
- Capturar la página de error de permisos (acceso denegado).

### 14.3 Estados Vacíos
- Capturar las vistas de listados sin datos.
- Capturar los mensajes informativos en estados vacíos.
- Capturar las acciones sugeridas para poblar datos.

---

## 15. Instalación como Aplicación

### 15.1 Prompt de Instalación
- Capturar el banner o prompt de instalación PWA.
- Capturar el proceso de instalación en el navegador.

### 15.2 Aplicación Instalada
- Capturar el ícono de la aplicación en el dispositivo.
- Capturar la pantalla de inicio (splash screen).
- Capturar la aplicación ejecutándose en modo standalone.

---

## Consideraciones para la Captura

### Calidad de las Capturas
- Resolución mínima recomendada: 1280x720 píxeles.
- Formato preferido: PNG para interfaces, JPG para fotografías.
- Evitar información sensible visible (contraseñas, datos personales reales).

### Datos Visibles
- Utilizar datos de prueba representativos pero ficticios.
- Asegurar que los datos mostrados sean coherentes entre capturas.
- Evitar datos vacíos o placeholder evidentes.

### Secuencia de Captura
- Seguir el flujo natural de uso del sistema.
- Mantener consistencia en el usuario autenticado entre capturas.
- Documentar el orden sugerido para referencia del lector.

### Anotaciones
- Registrar la descripción de cada captura al momento de realizarla.
- Indicar el módulo o funcionalidad correspondiente.
- Señalar cualquier configuración especial requerida para reproducir la vista.

---

## Resumen de Capturas Mínimas Requeridas

| Categoría | Capturas Mínimas |
|-----------|------------------|
| Acceso y Autenticación | 6-8 |
| Interfaz Principal | 4-6 |
| Gestión de Entidades | 8-12 por entidad |
| Componentes Geográficos | 6-8 |
| Sistema de Comunicación | 8-10 |
| Sistema de Notificaciones | 4-6 |
| Componente Social | 10-12 |
| Búsqueda y Filtrado | 4-6 |
| Configuración | 4-6 |
| Funcionalidades Administrativas | 8-10 |
| Comportamiento Responsive | 6-9 |
| Estados del Sistema | 6-8 |

**Total estimado: 80-120 capturas** para documentación completa del sistema.

---

*Esta guía establece los lineamientos para la generación de evidencias visuales. El autor debe adaptar las indicaciones según las funcionalidades específicas implementadas en el software desarrollado.*
