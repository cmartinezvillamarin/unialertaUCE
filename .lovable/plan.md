

## Plan: Diagrama conceptual SIG - Historia de Usuario

Crear un diagrama Mermaid tipo `flowchart` que represente la historia de usuario completa del flujo de trazabilidad GIS, usando la figura de actor (`:::person` o formas descriptivas) para el usuario, y nodos diferenciados para cada etapa del proceso:

1. **Actor**: Usuario reportante (usando sintaxis de persona/actor)
2. **Paso 1 - Reporte**: El usuario crea un reporte desde su dispositivo
3. **Paso 2 - Captura GPS**: El sistema captura coordenadas automáticas o selección manual en mapa
4. **Paso 3 - Recepción**: El sistema recibe, valida y enriquece con datos OSM (edificio, piso, aula)
5. **Paso 4 - Almacenamiento**: PostGIS almacena el punto geográfico (SRID 4326)
6. **Paso 5 - Procesamiento espacial**: Detección de similares, cálculo de proximidad, asignación de operador
7. **Paso 6 - Trazabilidad**: Rastreo del operador en campo, verificación de llegada
8. **Paso 7 - Visualización**: Mapas de distribución, heatmaps, análisis geográfico
9. **Actor secundario**: Supervisor/Operador que recibe y atiende

El diagrama usará subgraphs para agrupar las fases (Captura, Procesamiento, Seguimiento, Análisis) y flechas con etiquetas descriptivas para narrar la historia.

### Archivo
- `/mnt/documents/SIG_Historia_Usuario_Trazabilidad.mmd`

