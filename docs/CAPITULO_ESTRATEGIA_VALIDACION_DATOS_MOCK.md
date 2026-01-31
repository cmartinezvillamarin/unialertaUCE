# Capítulo: Desarrollo del Proyecto

## Sección: Estrategia de Validación con Datos Mock

### 1. Necesidad de Datos Controlados en el Contexto del Sistema

El desarrollo de UniAlerta UCE enfrenta una restricción inherente a su naturaleza de Prueba de Concepto: la ausencia de operación institucional real que genere datos auténticos de incidentes, usuarios y flujos de atención. Esta situación plantea un desafío metodológico: ¿cómo validar que el sistema satisface los requerimientos funcionales cuando no existen datos operativos reales contra los cuales contrastar su comportamiento?

La estrategia de validación con datos mock constituye la respuesta metodológica a esta restricción, estableciendo un conjunto de datos sintéticos pero representativos que permiten ejercitar las funcionalidades del sistema bajo condiciones controladas y reproducibles.

```mermaid
graph TB
    subgraph "Problema"
        P1[Sistema no desplegado<br/>en producción]
        P2[Sin usuarios reales<br/>operando el sistema]
        P3[Sin incidentes reales<br/>que gestionar]
    end
    
    subgraph "Consecuencia"
        C1[Imposibilidad de validar<br/>con datos operativos]
    end
    
    subgraph "Solución"
        S1[Datos Mock<br/>sintéticos pero<br/>representativos]
    end
    
    P1 --> C1
    P2 --> C1
    P3 --> C1
    C1 --> S1
    
    style C1 fill:#fef3c7
    style S1 fill:#dcfce7
```

*Figura 1: Contexto que fundamenta la estrategia de datos mock*

### 2. Definición Operativa de Datos Mock en UniAlerta UCE

En el contexto de este sistema, los datos mock constituyen registros sintéticos insertados en la base de datos PostgreSQL que simulan el estado operativo que tendría el sistema tras un período de uso real. Estos datos no son generados en tiempo de ejecución ni almacenados en memoria; persisten en la base de datos de desarrollo con la misma estructura y restricciones que aplicarían a datos reales.

**Características distintivas de los datos mock en este proyecto:**

| Característica | Implementación |
|----------------|----------------|
| **Persistencia** | Almacenados en PostgreSQL, no en memoria |
| **Integridad referencial** | Respetan todas las foreign keys y constraints del esquema |
| **Políticas de seguridad** | Sujetos a las mismas políticas RLS que datos reales |
| **Representatividad** | Cubren variabilidad de casos: estados, categorías, ubicaciones |
| **Reproducibilidad** | Conjunto estable que permite pruebas repetibles |

Esta definición distingue los datos mock de UniAlerta UCE de otras aproximaciones como stubs (respuestas simuladas sin persistencia) o fixtures temporales (datos efímeros para pruebas unitarias).

### 3. Propósitos de la Validación con Datos Mock

La estrategia de datos mock en UniAlerta UCE persigue objetivos específicos alineados con las funcionalidades del sistema:

#### 3.1 Validación de Flujos de Gestión de Incidentes

El módulo de reportes implementa un ciclo de vida con múltiples estados, asignaciones y transiciones. Los datos mock permiten validar:

- Visualización de reportes en diferentes estados (pendiente, en proceso, resuelto, rechazado)
- Transiciones de estado con registro de historial
- Asignación de operadores y trazabilidad de responsabilidades
- Detección de reportes similares por proximidad geográfica

```mermaid
graph LR
    subgraph "Datos Mock de Reportes"
        R1[10 reportes<br/>Pendiente]
        R2[15 reportes<br/>En Proceso]
        R3[20 reportes<br/>Resuelto]
        R4[5 reportes<br/>Rechazado]
    end
    
    subgraph "Validaciones Habilitadas"
        V1[Filtrado por estado]
        V2[Conteos en Dashboard]
        V3[Transiciones válidas]
        V4[Historial de cambios]
    end
    
    R1 --> V1
    R2 --> V1
    R3 --> V2
    R4 --> V3
    R1 --> V4
    
    style R1 fill:#fef3c7
    style R2 fill:#dbeafe
    style R3 fill:#dcfce7
    style R4 fill:#fee2e2
```

*Figura 2: Distribución de estados en datos mock de reportes*

#### 3.2 Validación de Funcionalidades Geoespaciales

El sistema integra geolocalización mediante PostGIS, mapas Leaflet y servicios OpenStreetMap. Los datos mock incluyen coordenadas geográficas distribuidas en el área del campus universitario para validar:

- Renderizado de marcadores en mapas interactivos
- Consultas de proximidad (reportes cercanos a una ubicación)
- Agrupación en mapas de calor por densidad de incidentes
- Enriquecimiento semántico de ubicaciones (edificio, área)

| Aspecto Geoespacial | Datos Mock Requeridos |
|---------------------|----------------------|
| Visualización en mapa | Reportes con coordenadas válidas dentro del campus |
| Detección de similares | Grupos de reportes próximos (< 100 metros) |
| Mapa de calor | Concentraciones de 5+ reportes en áreas específicas |
| Rastreo de operadores | Ubicaciones de usuarios asignados a reportes activos |

#### 3.3 Validación del Sistema de Roles y Permisos

UniAlerta UCE implementa seis roles diferenciados con permisos granulares. Los datos mock incluyen usuarios con cada rol para validar:

- Visibilidad diferenciada según permisos del usuario
- Restricciones de acceso a funcionalidades por rol
- Jerarquía de roles en asignaciones y supervisión
- Auditoría de acciones por tipo de usuario

```mermaid
graph TB
    subgraph "Usuarios Mock por Rol"
        U1[3 usuarios<br/>Super Admin]
        U2[5 usuarios<br/>Administrador]
        U3[8 usuarios<br/>Moderador]
        U4[10 usuarios<br/>Supervisor]
        U5[15 usuarios<br/>Operador]
        U6[20 usuarios<br/>Usuario Estándar]
    end
    
    subgraph "Validaciones de Permisos"
        V1[Menús visibles<br/>según rol]
        V2[Acciones permitidas<br/>por entidad]
        V3[Datos accesibles<br/>por contexto]
    end
    
    U1 --> V1
    U2 --> V1
    U3 --> V2
    U4 --> V2
    U5 --> V3
    U6 --> V3
```

*Figura 3: Distribución de roles en usuarios mock*

#### 3.4 Validación del Dashboard Analítico

El módulo de dashboard presenta métricas agregadas y visualizaciones estadísticas. Los datos mock deben generar distribuciones que permitan validar:

- Gráficos de barras por categoría de reporte
- Gráficos circulares por estado y prioridad
- Tendencias temporales (últimos 7 días, 30 días)
- Comparativas entre períodos

| Visualización | Requisito de Datos Mock |
|---------------|------------------------|
| Distribución por categoría | Al menos 5 categorías con reportes asociados |
| Tendencia temporal | Reportes distribuidos en los últimos 30 días |
| Distribución por prioridad | Reportes en alta, media y baja prioridad |
| Métricas de resolución | Reportes con estados finales y fechas de cierre |

#### 3.5 Validación de Comunicación en Tiempo Real

El sistema integra mensajería instantánea y notificaciones. Los datos mock incluyen conversaciones y mensajes para validar:

- Carga de historial de conversaciones
- Indicadores de mensajes no leídos
- Estructura de conversaciones grupales
- Referencias a reportes compartidos en mensajes

### 4. Composición del Conjunto de Datos Mock

El conjunto de datos mock de UniAlerta UCE está estructurado para cubrir las entidades principales del sistema con volúmenes suficientes para ejercitar cada funcionalidad:

| Entidad | Cantidad | Variabilidad Cubierta |
|---------|----------|----------------------|
| **Usuarios** | 50+ | 6 roles, estados activo/inactivo/bloqueado |
| **Reportes** | 200+ | 6 estados, 4 prioridades, 15+ categorías |
| **Categorías** | 15+ | Con y sin tipos de reporte asociados |
| **Tipos de Reporte** | 30+ | Distribuidos entre categorías |
| **Publicaciones** | 100+ | Con imágenes, hashtags, menciones |
| **Comentarios** | 300+ | Respuestas anidadas, menciones |
| **Conversaciones** | 30+ | Individuales y grupales |
| **Mensajes** | 500+ | Texto, imágenes, reportes compartidos |
| **Notificaciones** | 200+ | Leídas y no leídas, diferentes tipos |
| **Registros de Auditoría** | 1000+ | Todas las entidades, múltiples acciones |

```mermaid
graph TB
    subgraph "Entidades Core"
        E1[(Usuarios<br/>50+)]
        E2[(Reportes<br/>200+)]
        E3[(Categorías<br/>15+)]
    end
    
    subgraph "Entidades de Comunicación"
        E4[(Conversaciones<br/>30+)]
        E5[(Mensajes<br/>500+)]
        E6[(Notificaciones<br/>200+)]
    end
    
    subgraph "Entidades Sociales"
        E7[(Publicaciones<br/>100+)]
        E8[(Comentarios<br/>300+)]
        E9[(Interacciones<br/>500+)]
    end
    
    subgraph "Entidades de Auditoría"
        E10[(Historial Reportes<br/>400+)]
        E11[(Logs de Actividad<br/>1000+)]
    end
    
    E1 --> E2
    E3 --> E2
    E1 --> E4
    E4 --> E5
    E1 --> E7
    E7 --> E8
    E2 --> E10
```

*Figura 4: Estructura relacional de datos mock*

### 5. Criterios de Representatividad

Los datos mock de UniAlerta UCE no constituyen registros arbitrarios; siguen criterios de representatividad que aseguran su utilidad para validación:

#### 5.1 Cobertura de Estados y Transiciones

Cada entidad que implementa máquina de estados incluye registros en cada estado posible:

```mermaid
graph LR
    subgraph "Estados de Reportes"
        S1[Pendiente<br/>20%]
        S2[En Proceso<br/>25%]
        S3[En Revisión<br/>15%]
        S4[Resuelto<br/>30%]
        S5[Rechazado<br/>5%]
        S6[Archivado<br/>5%]
    end
    
    S1 --> S2
    S2 --> S3
    S3 --> S4
    S3 --> S5
    S4 --> S6
```

*Figura 5: Distribución proporcional de estados en reportes mock*

#### 5.2 Distribución Geográfica Coherente

Las coordenadas geográficas de los reportes mock corresponden a ubicaciones dentro del perímetro del campus universitario, con concentraciones en edificios principales y áreas de alta circulación:

| Zona del Campus | Porcentaje de Reportes Mock |
|-----------------|----------------------------|
| Edificios académicos | 40% |
| Áreas de servicio | 25% |
| Espacios de circulación | 20% |
| Áreas verdes | 10% |
| Perímetro | 5% |

#### 5.3 Distribución Temporal Realista

Los timestamps de creación y modificación de registros están distribuidos en un período que simula operación sostenida:

- Reportes distribuidos en los últimos 90 días
- Mayor concentración en días laborables
- Variación horaria entre 7:00 y 20:00
- Picos de actividad en horarios de clase

#### 5.4 Relaciones Consistentes

Las referencias entre entidades respetan la lógica del negocio:

- Reportes asignados solo a usuarios con rol operador o superior
- Historial de cambios con secuencia temporal coherente
- Mensajes en conversaciones con orden cronológico
- Notificaciones referenciando entidades existentes

### 6. Proceso de Validación con Datos Mock

La estrategia de validación con datos mock en UniAlerta UCE sigue un proceso estructurado:

```mermaid
flowchart TB
    subgraph "Fase 1: Preparación"
        A1[Identificar funcionalidades<br/>a validar]
        A2[Definir datos mock<br/>requeridos]
        A3[Insertar datos en<br/>base de desarrollo]
    end
    
    subgraph "Fase 2: Ejecución"
        B1[Ejecutar funcionalidad<br/>con datos mock]
        B2[Verificar comportamiento<br/>esperado]
        B3[Documentar resultados<br/>observados]
    end
    
    subgraph "Fase 3: Análisis"
        C1[Comparar resultados<br/>con expectativas]
        C2[Identificar desviaciones<br/>o defectos]
        C3[Registrar hallazgos<br/>en informe]
    end
    
    A1 --> A2
    A2 --> A3
    A3 --> B1
    B1 --> B2
    B2 --> B3
    B3 --> C1
    C1 --> C2
    C2 --> C3
```

*Figura 6: Proceso de validación con datos mock*

#### 6.1 Validación de Consultas y Filtros

Los datos mock permiten verificar que las consultas del sistema retornan los registros esperados:

| Consulta Validada | Expectativa con Datos Mock |
|-------------------|---------------------------|
| Reportes por estado "Pendiente" | Retorna exactamente los 40 reportes pendientes |
| Reportes en radio de 100m | Retorna grupos conocidos de reportes cercanos |
| Usuarios con rol "Operador" | Retorna los 15 operadores mock definidos |
| Mensajes no leídos | Retorna mensajes marcados como no leídos |

#### 6.2 Validación de Agregaciones

Las métricas del dashboard se contrastan con conteos conocidos:

| Métrica | Valor Esperado | Fuente de Verificación |
|---------|----------------|----------------------|
| Total de reportes | 200 | COUNT(*) en tabla reportes |
| Reportes por categoría | Distribución conocida | GROUP BY categoria_id |
| Tendencia 7 días | Valores pre-calculados | Registros con timestamps controlados |

#### 6.3 Validación de Permisos

Las restricciones de acceso se verifican con usuarios de cada rol:

| Acción | Usuario Admin | Usuario Operador | Usuario Estándar |
|--------|--------------|------------------|------------------|
| Ver todos los reportes | ✓ Permitido | ✓ Permitido | ✗ Solo propios |
| Cambiar estado | ✓ Permitido | ✓ Permitido | ✗ Denegado |
| Eliminar usuario | ✓ Permitido | ✗ Denegado | ✗ Denegado |
| Acceder a auditoría | ✓ Permitido | ✗ Denegado | ✗ Denegado |

### 7. Limitaciones de la Validación con Datos Mock

La estrategia de datos mock presenta limitaciones inherentes que deben reconocerse:

| Limitación | Implicación para el Proyecto |
|------------|------------------------------|
| **Ausencia de variabilidad operativa** | Los datos mock no capturan la diversidad de situaciones que generaría uso real |
| **Patrones predefinidos** | La distribución de datos responde a diseño, no a comportamiento emergente |
| **Sin validación de carga** | Los volúmenes mock no representan escala de producción institucional |
| **Sesgo de confirmación** | Los datos se diseñan para ejercitar funcionalidades conocidas, no para descubrir casos límite |

```mermaid
graph TB
    subgraph "Lo que Valida"
        V1[Funcionalidad<br/>implementada]
        V2[Integración<br/>entre módulos]
        V3[Comportamiento<br/>con datos válidos]
    end
    
    subgraph "Lo que NO Valida"
        N1[Comportamiento<br/>con datos reales]
        N2[Escalabilidad<br/>a volúmenes de producción]
        N3[Casos límite<br/>no anticipados]
        N4[Adopción<br/>por usuarios reales]
    end
    
    style V1 fill:#dcfce7
    style V2 fill:#dcfce7
    style V3 fill:#dcfce7
    style N1 fill:#fee2e2
    style N2 fill:#fee2e2
    style N3 fill:#fee2e2
    style N4 fill:#fee2e2
```

*Figura 7: Alcance y limitaciones de la validación con datos mock*

### 8. Transición hacia Datos Reales

La estrategia de datos mock constituye una fase transitoria del ciclo de desarrollo. La evolución hacia validación con datos reales requeriría:

| Fase de Evolución | Características |
|-------------------|-----------------|
| **Piloto controlado** | Grupo reducido de usuarios reales generando datos en ambiente de prueba |
| **Coexistencia** | Datos mock y datos reales conviviendo con identificación clara |
| **Migración** | Depuración de datos mock y operación exclusiva con datos reales |
| **Producción** | Sistema operando con datos generados por uso institucional |

### 9. Síntesis de la Estrategia

La estrategia de validación con datos mock en UniAlerta UCE:

1. **Responde a una restricción contextual**: la ausencia de operación real que genere datos auténticos durante el desarrollo de la Prueba de Concepto.

2. **Establece un conjunto de datos representativos**: 50+ usuarios, 200+ reportes, 500+ mensajes y demás entidades con distribución controlada de estados, ubicaciones y relaciones.

3. **Habilita la verificación de funcionalidades**: consultas, filtros, agregaciones, permisos y flujos operativos pueden ejercitarse con resultados predecibles.

4. **Reconoce limitaciones inherentes**: no sustituye validación con usuarios reales ni garantiza comportamiento ante variabilidad operativa.

5. **Constituye una fase transitoria**: la evolución hacia MVP requeriría incorporación progresiva de datos reales generados por uso institucional.

Esta estrategia permite que UniAlerta UCE demuestre factibilidad funcional dentro de las restricciones propias de una Prueba de Concepto, estableciendo la base para validaciones más rigurosas en fases posteriores del ciclo de desarrollo.
