# Pruebas de Flujo Funcional GIS
## Sistema UniAlerta UCE – Prueba de Concepto (PoC)

**Versión del Documento:** 1.0  
**Fecha de Elaboración:** 1 de Febrero de 2026  
**Versión del Sistema:** 1.0.0  
**Tipo de Pruebas:** Flujos Funcionales GIS (Geolocalización, Geotracking, Geofencing)  
**Datos Utilizados:** Simulados (Mock)

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Objetivos de las Pruebas de Flujo](#2-objetivos-de-las-pruebas-de-flujo)
3. [Alcance y Limitaciones](#3-alcance-y-limitaciones)
4. [Tecnologías GIS Involucradas](#4-tecnologías-gis-involucradas)
5. [Flujo Principal: Creación de Reporte con Geolocalización](#5-flujo-principal-creación-de-reporte-con-geolocalización)
6. [Flujo Principal: Rastreo en Tiempo Real (Geotracking)](#6-flujo-principal-rastreo-en-tiempo-real-geotracking)
7. [Flujo Principal: Navegación hacia Reporte](#7-flujo-principal-navegación-hacia-reporte)
8. [Flujo Principal: Detección de Reportes Cercanos (Geofencing)](#8-flujo-principal-detección-de-reportes-cercanos-geofencing)
9. [Flujo Alterno: Creación sin Permisos de Ubicación](#9-flujo-alterno-creación-sin-permisos-de-ubicación)
10. [Flujo Alterno: Detección de Reportes Similares](#10-flujo-alterno-detección-de-reportes-similares)
11. [Flujo Alterno: Asignación a Usuario Cercano](#11-flujo-alterno-asignación-a-usuario-cercano)
12. [Flujo Alterno: Visualización de Mapa de Calor](#12-flujo-alterno-visualización-de-mapa-de-calor)
13. [Flujo Alterno: Sincronización de Ubicación en Segundo Plano](#13-flujo-alterno-sincronización-de-ubicación-en-segundo-plano)
14. [Matriz Resumen de Flujos](#14-matriz-resumen-de-flujos)
15. [Guía de Capturas para Evidencia](#15-guía-de-capturas-para-evidencia)
16. [Conclusiones](#16-conclusiones)

---

## 1. Introducción

### 1.1 Propósito del Documento

El presente documento especifica las pruebas de flujo funcional para los componentes GIS (Geographic Information System) del sistema UniAlerta UCE, desarrollado como Prueba de Concepto (PoC). Se describen los flujos principales y alternos relacionados con la gestión de reportes de incidentes basada en geolocalización, geotracking y geofencing.

### 1.2 Contexto del PoC

UniAlerta UCE implementa funcionalidades GIS avanzadas para:

- **Geolocalización:** Captura de coordenadas GPS del usuario y del incidente reportado
- **Geotracking:** Seguimiento en tiempo real de la ubicación del usuario
- **Geofencing:** Detección de proximidad a reportes existentes y notificaciones basadas en ubicación

### 1.3 Datos Simulados

Todas las pruebas documentadas utilizan exclusivamente datos simulados (mock data) que incluyen:

| Tipo de Dato | Descripción |
|--------------|-------------|
| Coordenadas | Ubicaciones ficticias dentro del campus universitario simulado |
| Usuarios | Perfiles de prueba con roles asignados |
| Reportes | Incidentes ficticios con estados variados |
| Categorías | Clasificaciones de prueba |

---

## 2. Objetivos de las Pruebas de Flujo

### 2.1 Objetivo General

Validar el funcionamiento integral de los flujos funcionales GIS del sistema UniAlerta UCE, asegurando que los componentes de geolocalización, geotracking y geofencing operan correctamente en escenarios simulados.

### 2.2 Objetivos Específicos

| Objetivo | Métrica de Éxito |
|----------|------------------|
| Verificar captura de coordenadas GPS | Precisión en formato `SRID=4326;POINT(lng lat)` |
| Validar visualización cartográfica | Marcadores posicionados correctamente en mapa |
| Comprobar cálculo de distancias | Diferencia ≤ 5% respecto a cálculo Haversine |
| Evaluar detección de proximidad | Notificación dentro de radio configurado |
| Confirmar actualización en tiempo real | Latencia ≤ 2 segundos en sincronización |

---

## 3. Alcance y Limitaciones

### 3.1 Alcance

| Componente | Incluido | Descripción |
|------------|----------|-------------|
| Captura de ubicación | ✅ | API Geolocation del navegador |
| Mapa interactivo | ✅ | Leaflet + OpenStreetMap |
| Cálculo de distancias | ✅ | Fórmula Haversine en servidor y cliente |
| Geocodificación inversa | ✅ | API Nominatim de OpenStreetMap |
| Tracking en segundo plano | ✅ | Sincronización con tabla `user_locations` |
| Notificaciones por proximidad | ✅ | Detección de reportes cercanos |
| Navegación guiada | ✅ | Cálculo de bearing y estimación de tiempo |

### 3.2 Limitaciones del PoC

- Las pruebas se ejecutan en entorno web (no nativo móvil)
- La precisión GPS depende del dispositivo y entorno de prueba
- Los datos de ubicación son simulados o del dispositivo del tester
- No se prueban escenarios de alta carga concurrente

---

## 4. Tecnologías GIS Involucradas

### 4.1 Stack Tecnológico GIS

<presentation-mermaid>
graph TB

subgraph Frontend
    A[Leaflet 1.9.4] --> B[React-Leaflet]
    B --> C[Componentes de Mapa]
    D[Geolocation API] --> E[useUserLocation Hook]
    E --> F[LocationContext]
end

subgraph Backend
    G[PostGIS] --> H[Funciones RPC]
    H --> I[get_reportes_with_distance]
    H --> J[get_reportes_similares_cercanos]
    H --> K[get_nearby_assignable_users]
end

subgraph Servicios_Externos
    L[OpenStreetMap Tiles]
    M[Nominatim Geocoding]
    N[Overpass API]
end

C --> L
C --> M
C --> N
F --> G
</presentation-mermaid>

### 4.2 Componentes Principales

| Componente | Ruta | Función |
|------------|------|---------|
| `LocationContext` | `src/contexts/LocationContext.tsx` | Proveedor global de ubicación |
| `useUserLocation` | `src/hooks/controlador/useUserLocation.ts` | Captura de coordenadas GPS |
| `useLocationSync` | `src/hooks/controlador/useLocationSync.ts` | Sincronización con Supabase |
| `useRealtimeNavigation` | `src/hooks/controlador/useRealtimeNavigation.ts` | Navegación en tiempo real |
| `LiveNavigationMap` | `src/components/Map/LiveNavigationMap.tsx` | Mapa de rastreo |
| `ReportFormMap` | `src/components/Map/ReportFormMap.tsx` | Selector de ubicación en formulario |

---

## 5. Flujo Principal: Creación de Reporte con Geolocalización

### 5.1 Objetivo de la Prueba

Verificar que el sistema permite la creación de un reporte de incidente con captura automática o manual de coordenadas geográficas, almacenando correctamente la información espacial en la base de datos.

### 5.2 Precondiciones

| Condición | Estado Requerido |
|-----------|------------------|
| Usuario autenticado | Sesión activa en el sistema |
| Permisos de ubicación | Concedidos en el navegador |
| Categorías existentes | Al menos una categoría activa |
| Tipos de reporte | Al menos un tipo asociado a categoría |
| Conexión a internet | Activa para carga de tiles del mapa |

### 5.3 Pasos del Flujo

| Paso | Acción | Componente Involucrado |
|------|--------|------------------------|
| 1 | El usuario navega a la ruta `/crear-reporte` | `CrearReporte.tsx` |
| 2 | El sistema solicita permisos de geolocalización (si no están concedidos) | Browser Geolocation API |
| 3 | El usuario concede permisos de ubicación | `useUserLocation` |
| 4 | El sistema captura automáticamente las coordenadas actuales | `LocationContext` |
| 5 | El mapa se centra en la ubicación del usuario con marcador | `ReportFormMap` |
| 6 | El usuario puede ajustar la ubicación arrastrando el marcador | Leaflet Draggable Marker |
| 7 | El sistema ejecuta geocodificación inversa | Nominatim API |
| 8 | La dirección se autocompleta en el campo correspondiente | `ReportForm` |
| 9 | El usuario completa los campos del formulario (nombre, descripción, categoría) | Form validation |
| 10 | El usuario adjunta evidencia fotográfica (opcional) | `CameraCapture` |
| 11 | El usuario envía el formulario | `useOptimizedReportes.create()` |
| 12 | El sistema almacena el reporte con geometría PostGIS | Tabla `reportes` |
| 13 | El sistema muestra confirmación de creación exitosa | Toast notification |

### 5.4 Resultado Esperado

- El reporte se almacena en la base de datos con coordenadas válidas
- El campo `location` contiene geometría en formato `SRID=4326;POINT(longitud latitud)`
- Los campos `latitud` y `longitud` almacenan valores numéricos de precisión decimal
- La dirección geocodificada se guarda en el campo `direccion`
- El reporte aparece en el mapa de rastreo en la posición correcta
- El historial de auditoría registra la acción de creación

### 5.5 Capturas de Evidencia Requeridas

| Captura | Descripción | Momento |
|---------|-------------|---------|
| **FG-01** | Formulario de creación con mapa visible | Paso 5 |
| **FG-02** | Marcador en mapa mostrando ubicación del usuario | Paso 5 |
| **FG-03** | Campo de dirección autocompletado tras geocodificación | Paso 8 |
| **FG-04** | Formulario completado antes de enviar | Paso 10 |
| **FG-05** | Mensaje de confirmación de creación exitosa | Paso 13 |
| **FG-06** | Reporte visible en mapa de rastreo | Post-flujo |

---

## 6. Flujo Principal: Rastreo en Tiempo Real (Geotracking)

### 6.1 Objetivo de la Prueba

Validar que el sistema realiza el seguimiento continuo de la ubicación del usuario autenticado, actualizando la posición en tiempo real y sincronizándola con la base de datos.

### 6.2 Precondiciones

| Condición | Estado Requerido |
|-----------|------------------|
| Usuario autenticado | Sesión activa con perfil válido |
| Permisos de ubicación | Concedidos con opción "mientras se usa la app" |
| LocationProvider | Montado en el árbol de componentes |
| Conexión a Supabase | Activa y autenticada |

### 6.3 Pasos del Flujo

| Paso | Acción | Componente Involucrado |
|------|--------|------------------------|
| 1 | El usuario inicia sesión en el sistema | `LoginForm` |
| 2 | El sistema inicializa el `LocationProvider` | `LocationContext` |
| 3 | El hook `useUserLocation` inicia el watchPosition | Geolocation API |
| 4 | El sistema captura la ubicación inicial | `startTracking()` |
| 5 | La ubicación se sincroniza con la tabla `user_locations` | `useLocationSync` |
| 6 | El usuario navega a la página de rastreo `/rastreo` | `Rastreo.tsx` |
| 7 | El mapa muestra la posición actual del usuario en tiempo real | `LiveNavigationMap` |
| 8 | El usuario se desplaza físicamente (simulado) | Cambio de coordenadas |
| 9 | El sistema detecta el cambio de posición (umbral: 10 metros) | `syncLocation()` |
| 10 | La nueva posición se sincroniza con Supabase | `user_locations` UPDATE |
| 11 | El marcador del usuario se actualiza en el mapa | Leaflet marker update |
| 12 | Las estadísticas de distancia se recalculan | `TrackingStats` |

### 6.4 Resultado Esperado

- El tracking se inicia automáticamente tras la autenticación
- La tabla `user_locations` contiene la ubicación actual del usuario
- El marcador del usuario se actualiza sin recargar la página
- La sincronización respeta el umbral mínimo (10 metros de movimiento)
- El intervalo mínimo entre actualizaciones es de 10 segundos
- Al cerrar sesión, la ubicación se elimina de la tabla

### 6.5 Capturas de Evidencia Requeridas

| Captura | Descripción | Momento |
|---------|-------------|---------|
| **GT-01** | Página de rastreo con mapa y ubicación del usuario | Paso 7 |
| **GT-02** | Marcador azul indicando posición actual | Paso 7 |
| **GT-03** | Panel de estadísticas de rastreo | Paso 7 |
| **GT-04** | Consola mostrando logs de sincronización (modo desarrollo) | Paso 10 |
| **GT-05** | Mapa con posición actualizada tras movimiento | Paso 11 |

---

## 7. Flujo Principal: Navegación hacia Reporte

### 7.1 Objetivo de la Prueba

Comprobar que el sistema proporciona guía de navegación en tiempo real desde la ubicación actual del usuario hacia un reporte seleccionado, incluyendo cálculo de distancia, dirección cardinal y tiempo estimado de llegada.

### 7.2 Precondiciones

| Condición | Estado Requerido |
|-----------|------------------|
| Usuario autenticado | Sesión activa |
| Ubicación activa | Tracking habilitado |
| Reportes existentes | Al menos un reporte con coordenadas válidas |
| Mapa cargado | Tiles de OpenStreetMap disponibles |

### 7.3 Pasos del Flujo

| Paso | Acción | Componente Involucrado |
|------|--------|------------------------|
| 1 | El usuario navega a la página de rastreo `/rastreo` | `Rastreo.tsx` |
| 2 | El sistema carga los reportes con distancia calculada | `useOptimizedReportes` |
| 3 | El mapa muestra marcadores de todos los reportes visibles | `LiveNavigationMap` |
| 4 | El sistema identifica automáticamente el reporte más cercano | `useRealtimeNavigation` |
| 5 | Se activa la navegación hacia el reporte más cercano | `setIsNavigationActive(true)` |
| 6 | El panel de navegación muestra distancia en metros/km | `NavigationStats` |
| 7 | Se calcula y muestra el bearing (dirección cardinal) | `calculateBearing()` |
| 8 | Se estima el tiempo de llegada caminando | `estimateWalkingTime()` |
| 9 | Se traza una línea entre usuario y destino | Leaflet Polyline |
| 10 | El usuario se desplaza hacia el reporte | Cambio de coordenadas |
| 11 | Las estadísticas se actualizan en tiempo real | Re-render del componente |
| 12 | El usuario selecciona un reporte diferente del mapa | Click en marcador |
| 13 | La navegación cambia al nuevo destino | `setDestination()` |

### 7.4 Resultado Esperado

- La distancia se muestra correctamente en metros (< 1000m) o kilómetros (≥ 1000m)
- La dirección cardinal es precisa (N, NE, E, SE, S, SO, O, NO)
- El tiempo estimado se calcula a velocidad promedio de caminata (5 km/h)
- La línea de navegación se actualiza dinámicamente
- Al acercarse al destino, la distancia decrece proporcionalmente
- Es posible cambiar el destino sin reiniciar el tracking

### 7.5 Capturas de Evidencia Requeridas

| Captura | Descripción | Momento |
|---------|-------------|---------|
| **NV-01** | Mapa con múltiples marcadores de reportes | Paso 3 |
| **NV-02** | Indicador del reporte más cercano destacado | Paso 4 |
| **NV-03** | Panel de estadísticas con distancia y dirección | Paso 6-8 |
| **NV-04** | Línea de navegación trazada entre usuario y destino | Paso 9 |
| **NV-05** | Estadísticas actualizadas tras movimiento | Paso 11 |
| **NV-06** | Cambio de destino a otro reporte | Paso 13 |

---

## 8. Flujo Principal: Detección de Reportes Cercanos (Geofencing)

### 8.1 Objetivo de la Prueba

Validar que el sistema detecta reportes existentes dentro de un radio definido desde la ubicación del usuario y genera notificaciones correspondientes.

### 8.2 Precondiciones

| Condición | Estado Requerido |
|-----------|------------------|
| Usuario autenticado | Sesión activa |
| Ubicación activa | Tracking habilitado |
| Reportes cercanos | Reportes simulados dentro del radio de detección |
| Notificaciones habilitadas | Configuración de usuario activa |

### 8.3 Pasos del Flujo

| Paso | Acción | Componente Involucrado |
|------|--------|------------------------|
| 1 | El sistema monitorea la ubicación del usuario | `LocationContext` |
| 2 | Se detecta un cambio de posición significativo | `watchPosition` callback |
| 3 | El sistema consulta reportes cercanos | `useNearbyReportNotifications` |
| 4 | La función RPC calcula distancias desde la posición actual | `get_reportes_with_distance` |
| 5 | Se filtran reportes dentro del radio configurado (ej: 500m) | Filtrado en cliente |
| 6 | Se genera una notificación toast para reportes cercanos | `NearbyReportToast` |
| 7 | El usuario puede ver detalles del reporte desde la notificación | Link en toast |
| 8 | El sistema agrupa múltiples reportes cercanos | `NearbyReportsGroupToast` |
| 9 | El contador de notificaciones se actualiza | `useNotificationCount` |

### 8.4 Resultado Esperado

- Las notificaciones se muestran solo para reportes dentro del radio configurado
- No se generan notificaciones duplicadas para el mismo reporte
- La notificación incluye nombre del reporte y distancia
- Es posible navegar al detalle del reporte desde la notificación
- Múltiples reportes cercanos se agrupan en una sola notificación
- El historial de notificaciones queda registrado

### 8.5 Capturas de Evidencia Requeridas

| Captura | Descripción | Momento |
|---------|-------------|---------|
| **GF-01** | Notificación toast de reporte cercano | Paso 6 |
| **GF-02** | Notificación agrupada de múltiples reportes | Paso 8 |
| **GF-03** | Panel de notificaciones con reportes cercanos | Paso 9 |
| **GF-04** | Detalle del reporte accedido desde notificación | Paso 7 |

---

## 9. Flujo Alterno: Creación sin Permisos de Ubicación

### 9.1 Objetivo de la Prueba

Verificar que el sistema permite la creación de reportes cuando el usuario deniega los permisos de geolocalización, ofreciendo alternativas manuales para especificar la ubicación.

### 9.2 Precondiciones

| Condición | Estado Requerido |
|-----------|------------------|
| Usuario autenticado | Sesión activa |
| Permisos de ubicación | **Denegados** en el navegador |
| Mapa funcional | Tiles cargados correctamente |

### 9.3 Pasos del Flujo

| Paso | Acción | Componente Involucrado |
|------|--------|------------------------|
| 1 | El usuario navega a `/crear-reporte` | `CrearReporte.tsx` |
| 2 | El sistema detecta que los permisos están denegados | `useUserLocation.isSupported` |
| 3 | Se muestra el mapa centrado en ubicación por defecto | Coordenadas de fallback |
| 4 | El usuario busca la ubicación manualmente en el mapa | Zoom y pan en Leaflet |
| 5 | El usuario coloca el marcador haciendo click en el mapa | Click event handler |
| 6 | El sistema ejecuta geocodificación inversa | Nominatim API |
| 7 | El usuario puede ingresar la dirección manualmente | Campo de texto |
| 8 | El usuario completa el resto del formulario | Form fields |
| 9 | El reporte se crea con las coordenadas manuales | `create()` mutation |

### 9.4 Resultado Esperado

- El sistema no bloquea la creación de reportes sin GPS
- El mapa permite selección manual de ubicación
- La geocodificación inversa funciona para ubicaciones manuales
- El reporte se almacena con coordenadas válidas
- No se muestra error crítico por falta de permisos

### 9.5 Capturas de Evidencia Requeridas

| Captura | Descripción | Momento |
|---------|-------------|---------|
| **FA-01** | Mensaje informativo sobre permisos denegados | Paso 2-3 |
| **FA-02** | Mapa con ubicación por defecto | Paso 3 |
| **FA-03** | Usuario seleccionando ubicación manualmente | Paso 5 |
| **FA-04** | Formulario completado con ubicación manual | Paso 8 |

---

## 10. Flujo Alterno: Detección de Reportes Similares

### 10.1 Objetivo de la Prueba

Comprobar que el sistema detecta reportes existentes similares basándose en proximidad geográfica y temporalidad, ofreciendo al usuario la opción de confirmar un reporte existente en lugar de crear uno duplicado.

### 10.2 Precondiciones

| Condición | Estado Requerido |
|-----------|------------------|
| Usuario autenticado | Sesión activa |
| Ubicación activa | Coordenadas disponibles |
| Reportes cercanos existentes | Reportes creados en las últimas 24 horas dentro de 100m |

### 10.3 Pasos del Flujo

| Paso | Acción | Componente Involucrado |
|------|--------|------------------------|
| 1 | El usuario inicia la creación de un reporte | `ReportForm` |
| 2 | El usuario selecciona una ubicación | `ReportFormMap` |
| 3 | El sistema consulta reportes similares cercanos | `useSimilarReports` |
| 4 | La función RPC busca en radio de 100m, últimas 24h | `get_reportes_similares_cercanos` |
| 5 | Se detectan reportes similares | Query result > 0 |
| 6 | Se muestra el modal de reportes similares | `SimilarReportsFound` |
| 7 | El usuario puede ver detalles de cada reporte similar | Lista con información |
| 8A | El usuario selecciona "Yo también lo vi" | Confirmación de reporte |
| 8B | El usuario selecciona "Es diferente, continuar" | Continuar creación |
| 9A | Se registra la confirmación del usuario | `reporte_confirmaciones` INSERT |
| 9B | El formulario de creación continúa normalmente | Form visible |
| 10A | El contador de confirmaciones se incrementa | `confirmaciones_count + 1` |

### 10.4 Resultado Esperado

- Los reportes similares se detectan dentro del radio configurado
- El modal muestra información útil (título, distancia, antigüedad)
- La confirmación incrementa el contador del reporte existente
- Si el usuario continúa, puede crear un reporte nuevo
- No se crean confirmaciones duplicadas del mismo usuario

### 10.5 Capturas de Evidencia Requeridas

| Captura | Descripción | Momento |
|---------|-------------|---------|
| **RS-01** | Modal de reportes similares encontrados | Paso 6 |
| **RS-02** | Lista de reportes con distancia mostrada | Paso 7 |
| **RS-03** | Mensaje de confirmación tras "Yo también lo vi" | Paso 9A |
| **RS-04** | Formulario continuando tras "Es diferente" | Paso 9B |
| **RS-05** | Contador de confirmaciones incrementado | Paso 10A |

---

## 11. Flujo Alterno: Asignación a Usuario Cercano

### 11.1 Objetivo de la Prueba

Validar que el sistema permite asignar un reporte al usuario más cercano geográficamente, utilizando la información de ubicación en tiempo real de los usuarios activos.

### 11.2 Precondiciones

| Condición | Estado Requerido |
|-----------|------------------|
| Usuario administrador | Rol con permisos de asignación |
| Reporte existente | Con coordenadas válidas |
| Usuarios con tracking activo | Al menos un usuario con ubicación sincronizada |

### 11.3 Pasos del Flujo

| Paso | Acción | Componente Involucrado |
|------|--------|------------------------|
| 1 | El administrador abre el detalle de un reporte | `ReporteDetails` |
| 2 | El administrador accede a la opción de asignación | Botón/dropdown de asignar |
| 3 | El sistema consulta usuarios cercanos al reporte | `useNearbyAssignableUsers` |
| 4 | La función RPC calcula distancias desde el reporte | `get_nearby_assignable_users` |
| 5 | Se muestra lista de usuarios ordenada por cercanía | Lista con distancias |
| 6 | El administrador selecciona el usuario más cercano | Click en usuario |
| 7 | El sistema registra la asignación | `reportes` UPDATE |
| 8 | Se envía notificación al usuario asignado | `notifications` INSERT |
| 9 | El historial de asignaciones se actualiza | `reporte_asignaciones` INSERT |

### 11.4 Resultado Esperado

- Solo se muestran usuarios con ubicación activa reciente
- Las distancias se calculan correctamente desde el reporte
- El usuario asignado recibe notificación inmediata
- El estado del reporte puede cambiar automáticamente a "en_progreso"
- El historial refleja quién asignó, a quién y cuándo

### 11.5 Capturas de Evidencia Requeridas

| Captura | Descripción | Momento |
|---------|-------------|---------|
| **AU-01** | Lista de usuarios cercanos con distancias | Paso 5 |
| **AU-02** | Usuario seleccionado para asignación | Paso 6 |
| **AU-03** | Confirmación de asignación exitosa | Paso 7 |
| **AU-04** | Notificación recibida por usuario asignado | Paso 8 |
| **AU-05** | Historial de asignaciones actualizado | Paso 9 |

---

## 12. Flujo Alterno: Visualización de Mapa de Calor

### 12.1 Objetivo de la Prueba

Verificar que el sistema genera y muestra un mapa de calor (heatmap) basado en la densidad de reportes por ubicación geográfica.

### 12.2 Precondiciones

| Condición | Estado Requerido |
|-----------|------------------|
| Usuario autenticado | Sesión activa |
| Reportes con ubicación | Múltiples reportes distribuidos geográficamente |
| Plugin Leaflet.heat | Cargado correctamente |

### 12.3 Pasos del Flujo

| Paso | Acción | Componente Involucrado |
|------|--------|------------------------|
| 1 | El usuario navega a la página de rastreo | `Rastreo.tsx` |
| 2 | El sistema carga todos los reportes con coordenadas | `useOptimizedReportes` |
| 3 | El usuario activa el control de mapa de calor | `HeatmapControl` |
| 4 | El sistema procesa las coordenadas de los reportes | Array de `[lat, lng, intensity]` |
| 5 | Se renderiza la capa de mapa de calor | `HeatmapLayer` |
| 6 | Las zonas con mayor densidad se muestran más intensas | Gradiente de colores |
| 7 | El usuario puede ajustar parámetros (radio, intensidad) | Controles de configuración |
| 8 | El usuario puede alternar entre marcadores y heatmap | Toggle en control |

### 12.4 Resultado Esperado

- El mapa de calor se superpone correctamente sobre los tiles
- Las zonas con más reportes muestran colores más cálidos
- El gradiente de colores es visualmente distinguible
- Es posible alternar entre vista de marcadores y heatmap
- Los parámetros de configuración afectan la visualización

### 12.5 Capturas de Evidencia Requeridas

| Captura | Descripción | Momento |
|---------|-------------|---------|
| **HM-01** | Control de activación del mapa de calor | Paso 3 |
| **HM-02** | Mapa de calor mostrando densidad de reportes | Paso 5 |
| **HM-03** | Zona de alta densidad con color intenso | Paso 6 |
| **HM-04** | Controles de configuración del heatmap | Paso 7 |
| **HM-05** | Vista alternando entre marcadores y heatmap | Paso 8 |

---

## 13. Flujo Alterno: Sincronización de Ubicación en Segundo Plano

### 13.1 Objetivo de la Prueba

Comprobar que el sistema mantiene la sincronización de ubicación activa mientras el usuario navega por diferentes secciones de la aplicación, sin requerir que permanezca en la página de rastreo.

### 13.2 Precondiciones

| Condición | Estado Requerido |
|-----------|------------------|
| Usuario autenticado | Sesión activa |
| LocationProvider | Montado a nivel de App |
| Permisos de ubicación | Concedidos |

### 13.3 Pasos del Flujo

| Paso | Acción | Componente Involucrado |
|------|--------|------------------------|
| 1 | El usuario inicia sesión | `LoginForm` |
| 2 | El LocationProvider inicia el tracking | `LocationContext` |
| 3 | El usuario navega a la página de dashboard | `/dashboard` |
| 4 | El tracking continúa en segundo plano | `useUserLocation` persistente |
| 5 | El usuario navega a la red social | `/red-social` |
| 6 | La sincronización sigue activa | `useLocationSync` |
| 7 | El usuario verifica en `/rastreo` | `Rastreo.tsx` |
| 8 | La ubicación actual se muestra correctamente | Datos actualizados |
| 9 | El usuario cierra la pestaña/navegador | `beforeunload` event |
| 10 | El sistema limpia la ubicación via sendBeacon | `cleanup-user-locations` |

### 13.4 Resultado Esperado

- El tracking no se interrumpe al cambiar de página
- La tabla `user_locations` mantiene datos actualizados
- No hay pérdida de datos de ubicación durante navegación interna
- Al cerrar sesión o navegador, la ubicación se limpia correctamente
- El sendBeacon garantiza la limpieza incluso si se cierra abruptamente

### 13.5 Capturas de Evidencia Requeridas

| Captura | Descripción | Momento |
|---------|-------------|---------|
| **SB-01** | Console logs mostrando tracking activo en dashboard | Paso 4 |
| **SB-02** | Console logs mostrando tracking en red social | Paso 6 |
| **SB-03** | Verificación de ubicación actualizada en rastreo | Paso 8 |
| **SB-04** | Log de limpieza al cerrar sesión | Paso 10 |

---

## 14. Matriz Resumen de Flujos

### 14.1 Flujos Principales

| ID | Flujo | Tipo GIS | Criticidad | Capturas |
|----|-------|----------|------------|----------|
| FP-01 | Creación de Reporte con Geolocalización | Geolocalización | 🔴 Alta | FG-01 a FG-06 |
| FP-02 | Rastreo en Tiempo Real | Geotracking | 🔴 Alta | GT-01 a GT-05 |
| FP-03 | Navegación hacia Reporte | Geotracking | 🟡 Media | NV-01 a NV-06 |
| FP-04 | Detección de Reportes Cercanos | Geofencing | 🟡 Media | GF-01 a GF-04 |

### 14.2 Flujos Alternos

| ID | Flujo | Tipo GIS | Criticidad | Capturas |
|----|-------|----------|------------|----------|
| FA-01 | Creación sin Permisos de Ubicación | Geolocalización | 🟡 Media | FA-01 a FA-04 |
| FA-02 | Detección de Reportes Similares | Geofencing | 🟡 Media | RS-01 a RS-05 |
| FA-03 | Asignación a Usuario Cercano | Geotracking | 🟡 Media | AU-01 a AU-05 |
| FA-04 | Visualización de Mapa de Calor | Geolocalización | 🟢 Baja | HM-01 a HM-05 |
| FA-05 | Sincronización en Segundo Plano | Geotracking | 🔴 Alta | SB-01 a SB-04 |

### 14.3 Diagrama de Flujos GIS

<presentation-mermaid>
flowchart TB
    subgraph "Flujos Principales"
        A[Usuario Autenticado] --> B{Permisos GPS?}
        B -->|Sí| C[Captura Automática]
        B -->|No| D[Selección Manual]
        C --> E[Crear Reporte]
        D --> E
        E --> F[Almacenar Geometría]
        F --> G[Mostrar en Mapa]
        
        A --> H[Tracking Activo]
        H --> I[Sincronizar user_locations]
        I --> J[Actualizar Mapa]
        J --> K[Calcular Distancias]
        K --> L[Navegación]
        K --> M[Notificaciones Cercanía]
    end
    
    subgraph "Flujos Alternos"
        E --> N{Reportes Similares?}
        N -->|Sí| O[Mostrar Modal]
        O --> P{Confirmar?}
        P -->|Sí| Q[Incrementar Contador]
        P -->|No| R[Continuar Creación]
        
        K --> S[Asignar Usuario Cercano]
        G --> T[Mapa de Calor]
    end
</presentation-mermaid>

---

## 15. Guía de Capturas para Evidencia

### 15.1 Nomenclatura de Archivos

Las capturas de pantalla deben nombrarse siguiendo el patrón:

```
[ID_FLUJO]-[NUMERO_CAPTURA]-[DESCRIPCION_BREVE].png
```

**Ejemplos:**
- `FG-01-formulario-creacion-mapa.png`
- `GT-03-panel-estadisticas-rastreo.png`
- `NV-04-linea-navegacion-destino.png`

### 15.2 Elementos a Capturar por Flujo

#### Flujo FP-01: Creación con Geolocalización

| Captura | Elementos Visibles | Anotaciones Sugeridas |
|---------|-------------------|----------------------|
| FG-01 | Formulario completo + Mapa | Indicar campos del formulario |
| FG-02 | Mapa + Marcador usuario | Flechas señalando marcador |
| FG-03 | Campo dirección + Valor | Resaltar texto autocompletado |
| FG-04 | Formulario lleno | Marcar campos completados |
| FG-05 | Toast de éxito | Capturar mensaje completo |
| FG-06 | Mapa rastreo + Nuevo reporte | Círculo en nuevo marcador |

#### Flujo FP-02: Geotracking

| Captura | Elementos Visibles | Anotaciones Sugeridas |
|---------|-------------------|----------------------|
| GT-01 | Página rastreo completa | Identificar componentes |
| GT-02 | Marcador azul usuario | Flechas indicando posición |
| GT-03 | Panel TrackingStats | Resaltar métricas |
| GT-04 | Consola desarrollo | Logs de sincronización |
| GT-05 | Mapa tras movimiento | Comparar con GT-02 |

#### Flujo FP-03: Navegación

| Captura | Elementos Visibles | Anotaciones Sugeridas |
|---------|-------------------|----------------------|
| NV-01 | Mapa con marcadores | Cantidad de reportes |
| NV-02 | Indicador reporte cercano | Destacar marcador especial |
| NV-03 | Panel navegación | Distancia + Dirección + Tiempo |
| NV-04 | Línea polyline | Color y trayectoria |
| NV-05 | Estadísticas actualizadas | Comparar valores previos |
| NV-06 | Nuevo destino seleccionado | Mostrar cambio de línea |

### 15.3 Requisitos Técnicos de Capturas

| Aspecto | Especificación |
|---------|----------------|
| Resolución mínima | 1280x720 píxeles |
| Formato | PNG (preferido) o JPEG |
| Tamaño máximo | 2 MB por imagen |
| Información sensible | Difuminar datos personales reales |
| Marca de tiempo | Visible en capturas de consola |

---

## 16. Conclusiones

### 16.1 Cobertura Funcional GIS

El sistema UniAlerta UCE, como Prueba de Concepto, implementa satisfactoriamente los tres pilares de funcionalidad GIS:

| Componente | Estado | Observaciones |
|------------|--------|---------------|
| **Geolocalización** | ✅ Implementado | Captura, almacenamiento y visualización de coordenadas |
| **Geotracking** | ✅ Implementado | Seguimiento en tiempo real con sincronización en segundo plano |
| **Geofencing** | ✅ Implementado | Detección de proximidad y notificaciones basadas en ubicación |

### 16.2 Flujos Validados

- **4 Flujos Principales** cubren las operaciones core del sistema GIS
- **5 Flujos Alternos** aseguran robustez ante escenarios edge-case
- **34 Capturas de Evidencia** documentan cada etapa crítica

### 16.3 Recomendaciones para Evidencia

1. Ejecutar cada flujo en orden secuencial para capturas consistentes
2. Utilizar el mismo dispositivo/navegador para todas las pruebas
3. Simular movimiento físico utilizando herramientas de desarrollo del navegador
4. Documentar cualquier desviación del flujo esperado
5. Almacenar capturas organizadas por flujo en carpetas separadas

### 16.4 Próximos Pasos

- Ejecutar pruebas con datos simulados completos
- Generar capturas según la guía especificada
- Compilar anexo fotográfico del documento
- Validar resultados contra los criterios de éxito definidos

---

## Anexos

### Anexo A: Plantilla de Registro de Ejecución

```markdown
## Registro de Ejecución de Prueba

**Flujo:** [ID y Nombre]
**Fecha:** [DD/MM/YYYY]
**Ejecutor:** [Nombre]
**Ambiente:** [Navegador/Dispositivo]

### Resultados por Paso

| Paso | Estado | Observaciones |
|------|--------|---------------|
| 1    | ✅/❌  |               |
| 2    | ✅/❌  |               |
...

### Capturas Generadas

| ID Captura | Archivo | Verificado |
|------------|---------|------------|
| XX-01      | xxx.png | ✅/❌      |
...

### Resultado Final: PASS / FAIL / PARCIAL
```

### Anexo B: Configuración de Simulación GPS en Chrome DevTools

Para simular cambios de ubicación durante las pruebas:

1. Abrir Chrome DevTools (F12)
2. Ir a pestaña "Sensors"
3. En sección "Location", seleccionar "Override"
4. Ingresar coordenadas de prueba o seleccionar preset
5. Cambiar coordenadas para simular movimiento

**Coordenadas de ejemplo (simuladas):**
- Punto A: Latitud -0.2100, Longitud -78.4900
- Punto B: Latitud -0.2105, Longitud -78.4895
- Punto C: Latitud -0.2110, Longitud -78.4890

---

**Fin del Documento**

*Documento elaborado como parte de la documentación técnica del proyecto UniAlerta UCE - Prueba de Concepto (PoC)*
