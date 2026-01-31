# Capítulo: Desarrollo del Proyecto

## Proceso Metodológico para la Validación con Mocks

### Contextualización del Problema Metodológico

El desarrollo de UniAlerta UCE como Prueba de Concepto enfrenta una restricción metodológica inherente: la necesidad de verificar el cumplimiento de requerimientos funcionales sin disponer de operación institucional que genere datos auténticos. Esta situación plantea interrogantes sobre cómo demostrar que el sistema satisface los objetivos planteados cuando no existe un universo de usuarios reales, incidentes genuinos ni flujos operativos establecidos contra los cuales contrastar el comportamiento del software.

La respuesta a esta restricción requiere un proceso metodológico estructurado que establezca las condiciones, procedimientos y criterios bajo los cuales la validación con datos mock adquiere rigor suficiente para sustentar conclusiones sobre la factibilidad funcional del sistema.

```mermaid
graph TB
    subgraph "Restricción del Contexto"
        R1[Sin usuarios reales operando]
        R2[Sin incidentes genuinos]
        R3[Sin flujos operativos establecidos]
    end
    
    subgraph "Problema Metodológico"
        P1[¿Cómo validar requerimientos<br/>sin datos operativos?]
    end
    
    subgraph "Necesidad"
        N1[Proceso metodológico<br/>estructurado y riguroso]
    end
    
    R1 --> P1
    R2 --> P1
    R3 --> P1
    P1 --> N1
```

### Definición del Proceso de Validación

El proceso metodológico de validación con mocks en UniAlerta UCE se estructura en fases secuenciales que garantizan trazabilidad entre requerimientos, datos de prueba y resultados observados:

```mermaid
flowchart TB
    subgraph "Fase 1: Análisis"
        A1[Identificación de<br/>requerimientos funcionales]
        A2[Descomposición en<br/>casos verificables]
        A3[Definición de<br/>criterios de aceptación]
    end
    
    subgraph "Fase 2: Preparación"
        B1[Diseño del conjunto<br/>de datos mock]
        B2[Generación e inserción<br/>en base de datos]
        B3[Verificación de<br/>integridad referencial]
    end
    
    subgraph "Fase 3: Ejecución"
        C1[Ejercicio de<br/>funcionalidades]
        C2[Observación de<br/>comportamiento]
        C3[Registro de<br/>resultados]
    end
    
    subgraph "Fase 4: Evaluación"
        D1[Contraste con<br/>criterios de aceptación]
        D2[Clasificación de<br/>hallazgos]
        D3[Documentación de<br/>evidencia]
    end
    
    A1 --> A2 --> A3
    A3 --> B1 --> B2 --> B3
    B3 --> C1 --> C2 --> C3
    C3 --> D1 --> D2 --> D3
```

### Fase 1: Análisis de Requerimientos

#### Identificación de Funcionalidades Verificables

El proceso inicia con la revisión sistemática del documento de requerimientos, extrayendo cada funcionalidad que requiere verificación. En UniAlerta UCE, los requerimientos se organizan por módulos funcionales:

| Módulo | Requerimientos Identificados | Criticidad |
|--------|------------------------------|------------|
| Autenticación | 12 funcionalidades | Alta |
| Gestión de Usuarios | 15 funcionalidades | Alta |
| Gestión de Reportes | 18 funcionalidades | Alta |
| Categorías | 10 funcionalidades | Media |
| Tipos de Reporte | 10 funcionalidades | Media |
| Red Social | 20 funcionalidades | Media |
| Mensajería | 15 funcionalidades | Media |
| Dashboard | 6 funcionalidades | Baja |
| Notificaciones | 8 funcionalidades | Baja |
| Auditoría | 5 funcionalidades | Media |

#### Descomposición en Casos de Prueba

Cada requerimiento funcional se descompone en casos de prueba atómicos que especifican:

- **Precondiciones**: Estado del sistema y datos requeridos antes de la ejecución
- **Pasos de ejecución**: Secuencia de acciones a realizar
- **Resultado esperado**: Comportamiento observable que indica cumplimiento
- **Criterio de aceptación**: Condición binaria que determina éxito o fallo

```mermaid
graph LR
    subgraph "Requerimiento"
        RF[RF-REP-001:<br/>Crear Reporte]
    end
    
    subgraph "Casos de Prueba Derivados"
        CP1[REP-003:<br/>Crear reporte básico]
        CP2[REP-004:<br/>Crear con ubicación]
        CP3[REP-005:<br/>Crear con evidencia]
        CP4[REP-006:<br/>Detectar similares]
    end
    
    RF --> CP1
    RF --> CP2
    RF --> CP3
    RF --> CP4
```

#### Matriz de Trazabilidad

Se establece una matriz que vincula cada caso de prueba con su requerimiento origen y los datos mock necesarios:

| Caso de Prueba | Requerimiento Origen | Datos Mock Requeridos |
|----------------|---------------------|----------------------|
| AUTH-001: Login exitoso | RF-AUTH-002 | Usuario con credenciales válidas |
| REP-004: Crear con ubicación | RF-REP-002 | Categorías activas, permisos GPS |
| MSG-005: Mensaje en tiempo real | RF-MSG-003 | Dos usuarios, conversación existente |
| SOC-006: Like a publicación | RF-SOC-005 | Publicación de otro usuario |

### Fase 2: Preparación del Entorno de Validación

#### Diseño del Conjunto de Datos Mock

El diseño de datos mock sigue criterios de representatividad que aseguran cobertura de los escenarios contemplados en los requerimientos:

**Cobertura de estados**: Cada entidad con máquina de estados incluye registros en todos los estados posibles.

```mermaid
graph TB
    subgraph "Distribución de Estados - Reportes Mock"
        E1[Pendiente<br/>40 registros - 20%]
        E2[En Proceso<br/>50 registros - 25%]
        E3[En Revisión<br/>30 registros - 15%]
        E4[Resuelto<br/>60 registros - 30%]
        E5[Rechazado<br/>10 registros - 5%]
        E6[Archivado<br/>10 registros - 5%]
    end
```

**Cobertura de roles**: Usuarios mock representan cada rol del sistema con los permisos correspondientes.

| Rol | Cantidad Mock | Permisos Verificables |
|-----|---------------|----------------------|
| Super Admin | 3 | Todas las operaciones |
| Administrador | 5 | Gestión de usuarios y configuración |
| Moderador | 8 | Moderación de contenido |
| Supervisor | 10 | Supervisión y asignación |
| Operador | 15 | Gestión de reportes asignados |
| Usuario Estándar | 20+ | Operaciones básicas |

**Cobertura geográfica**: Reportes distribuidos en el perímetro del campus universitario para validar funcionalidades espaciales.

**Cobertura temporal**: Registros con timestamps distribuidos en los últimos 90 días para validar filtros y tendencias.

#### Generación e Inserción de Datos

Los datos mock se insertan directamente en la base de datos PostgreSQL de Supabase, respetando todas las restricciones del esquema:

| Aspecto | Verificación |
|---------|--------------|
| Primary keys | UUIDs generados correctamente |
| Foreign keys | Referencias a registros existentes |
| Constraints | Valores dentro de rangos permitidos |
| Enums | Solo valores definidos en el tipo |
| Timestamps | Fechas coherentes cronológicamente |
| Campos únicos | Sin duplicados en email, username |

```mermaid
flowchart LR
    subgraph "Proceso de Inserción"
        G1[Generación de<br/>datos sintéticos]
        G2[Validación de<br/>integridad]
        G3[Inserción en<br/>PostgreSQL]
        G4[Verificación<br/>post-inserción]
    end
    
    G1 --> G2 --> G3 --> G4
    
    G2 -->|Fallo| G1
    G4 -->|Error| G2
```

#### Verificación de Integridad Referencial

Antes de iniciar la ejecución de pruebas, se verifica que el conjunto de datos mock cumple con las relaciones definidas en el modelo:

| Relación | Verificación | Estado |
|----------|--------------|--------|
| reportes.user_id → profiles.id | Todos los creadores existen | ✓ |
| reportes.categoria_id → categories.id | Categorías válidas | ✓ |
| mensajes.conversacion_id → conversaciones.id | Conversaciones existentes | ✓ |
| user_roles.user_id → profiles.id | Roles asignados a usuarios válidos | ✓ |
| reporte_historial.reporte_id → reportes.id | Historial de reportes existentes | ✓ |

### Fase 3: Ejecución de la Validación

#### Protocolo de Ejecución

La ejecución de cada caso de prueba sigue un protocolo estandarizado:

```mermaid
sequenceDiagram
    participant E as Ejecutor
    participant S as Sistema
    participant BD as Base de Datos
    participant R as Registro
    
    E->>E: Verificar precondiciones
    E->>S: Ejecutar pasos del caso
    S->>BD: Operación de datos
    BD-->>S: Resultado
    S-->>E: Comportamiento observable
    E->>E: Comparar con resultado esperado
    E->>R: Documentar resultado
```

#### Criterios de Clasificación de Resultados

Cada caso de prueba se clasifica según el grado de cumplimiento del resultado esperado:

| Clasificación | Símbolo | Criterio |
|---------------|---------|----------|
| PASS | ✅ | Comportamiento coincide exactamente con lo esperado |
| PARCIAL | ⚠️ | Funcionalidad opera pero con limitaciones menores |
| FAIL | ❌ | Comportamiento diverge significativamente de lo esperado |
| N/A | ⏳ | Caso no aplicable o funcionalidad no implementada |

#### Registro de Observaciones

Durante la ejecución se documenta:

| Elemento | Descripción |
|----------|-------------|
| Fecha y hora | Momento de ejecución del caso |
| Ambiente | Configuración del entorno de prueba |
| Datos utilizados | Registros mock específicos empleados |
| Pasos ejecutados | Secuencia efectivamente realizada |
| Resultado observado | Comportamiento del sistema |
| Evidencia | Capturas de pantalla, logs relevantes |
| Clasificación | PASS, PARCIAL, FAIL o N/A |
| Observaciones | Notas adicionales del ejecutor |

### Fase 4: Evaluación y Documentación

#### Contraste con Criterios de Aceptación

Los resultados observados se contrastan con los criterios de aceptación definidos en la fase de análisis:

```mermaid
graph TB
    subgraph "Evaluación"
        O[Resultado<br/>Observado]
        E[Resultado<br/>Esperado]
        C{¿Coinciden?}
        
        O --> C
        E --> C
        
        C -->|Sí| P[PASS]
        C -->|Parcial| A[PARCIAL]
        C -->|No| F[FAIL]
    end
    
    subgraph "Acciones Derivadas"
        P --> D1[Documentar éxito]
        A --> D2[Documentar limitación]
        F --> D3[Registrar defecto]
    end
```

#### Clasificación de Hallazgos

Los casos que no alcanzan PASS se clasifican según severidad:

| Severidad | Descripción | Tiempo de Resolución |
|-----------|-------------|---------------------|
| Crítico | Sistema inutilizable, pérdida de datos | Inmediato |
| Mayor | Funcionalidad principal afectada | < 24 horas |
| Menor | Funcionalidad secundaria afectada | < 72 horas |
| Trivial | Cosmético, sin impacto funcional | Próxima versión |

#### Métricas de Validación

El proceso genera métricas cuantitativas que resumen el estado de la validación:

| Métrica | Fórmula | Objetivo |
|---------|---------|----------|
| Cobertura de ejecución | Casos ejecutados / Total casos | ≥ 90% |
| Tasa de éxito | Casos PASS / Casos ejecutados | ≥ 85% |
| Defectos críticos | Conteo de FAIL críticos | = 0 |
| Defectos mayores | Conteo de FAIL mayores | ≤ 5 |

```mermaid
pie title Distribución de Resultados - UniAlerta UCE
    "PASS" : 124
    "PARCIAL" : 5
    "FAIL" : 0
    "N/A" : 2
```

### Aplicación del Proceso por Módulo

#### Validación del Módulo de Autenticación

El módulo de autenticación requiere datos mock específicos:

| Dato Mock | Propósito | Cantidad |
|-----------|-----------|----------|
| Usuario con credenciales válidas | LOGIN-001: Login exitoso | 1+ |
| Usuario bloqueado | LOGIN-009: Bloqueo por intentos | 1 |
| Usuario con cambio obligatorio | LOGIN-010: Primera contraseña | 1 |
| Intentos de login registrados | Verificar contador de intentos | 5+ |

**Casos ejecutados**: 12  
**Resultado**: 10 PASS, 1 PARCIAL, 1 N/A  
**Tasa de éxito**: 87.5%

#### Validación del Módulo de Reportes

El módulo de reportes requiere el conjunto más diverso de datos mock:

| Dato Mock | Propósito | Características |
|-----------|-----------|-----------------|
| Reportes en todos los estados | Filtros por estado | 6 estados cubiertos |
| Reportes con ubicación | Visualización en mapa | Coordenadas en campus |
| Reportes cercanos entre sí | Detección de similares | Grupos < 100m |
| Reportes con historial | Verificar trazabilidad | 3+ cambios por reporte |
| Reportes con evidencias | Carga de imágenes | URLs de Cloudinary |

**Casos ejecutados**: 18  
**Resultado**: 17 PASS, 1 PARCIAL  
**Tasa de éxito**: 97.2%

#### Validación del Módulo de Mensajería

El módulo de mensajería valida comunicación en tiempo real:

| Dato Mock | Propósito | Características |
|-----------|-----------|-----------------|
| Conversaciones individuales | Chat 1 a 1 | 2 participantes |
| Conversaciones grupales | Chat grupal | 3+ participantes |
| Mensajes con imágenes | Multimedia | URLs de Cloudinary |
| Mensajes con posts compartidos | Integración red social | JSON de referencia |

**Casos ejecutados**: 15  
**Resultado**: 14 PASS, 1 PARCIAL  
**Tasa de éxito**: 96.7%

### Limitaciones Metodológicas Reconocidas

El proceso de validación con mocks presenta limitaciones inherentes que deben explicitarse:

| Limitación | Implicación | Mitigación Parcial |
|------------|-------------|-------------------|
| Datos prediseñados | No captura variabilidad de uso real | Diversidad deliberada en datos mock |
| Ausencia de carga | No valida rendimiento bajo estrés | Pruebas con volúmenes incrementales |
| Sin usuarios reales | No valida usabilidad efectiva | Revisión de UI/UX por pares |
| Patrones conocidos | Sesgo hacia casos anticipados | Inclusión de casos límite |

```mermaid
graph TB
    subgraph "Lo que Valida el Proceso"
        V1[Funcionalidad<br/>implementada]
        V2[Integración<br/>entre componentes]
        V3[Comportamiento<br/>con datos válidos]
        V4[Flujos de trabajo<br/>definidos]
    end
    
    subgraph "Lo que NO Valida"
        N1[Comportamiento<br/>con uso real]
        N2[Rendimiento<br/>a escala]
        N3[Casos límite<br/>no anticipados]
        N4[Adopción por<br/>usuarios finales]
    end
    
    style V1 fill:#dcfce7
    style V2 fill:#dcfce7
    style V3 fill:#dcfce7
    style V4 fill:#dcfce7
    style N1 fill:#fee2e2
    style N2 fill:#fee2e2
    style N3 fill:#fee2e2
    style N4 fill:#fee2e2
```

### Trazabilidad del Proceso

El proceso metodológico genera documentación que permite trazabilidad completa:

```mermaid
flowchart LR
    subgraph "Artefactos Generados"
        A1[Documento de<br/>Requerimientos]
        A2[Matriz de<br/>Casos de Prueba]
        A3[Registro de<br/>Datos Mock]
        A4[Bitácora de<br/>Ejecución]
        A5[Informe de<br/>Resultados]
    end
    
    A1 --> A2 --> A3 --> A4 --> A5
    
    subgraph "Trazabilidad"
        T1[Cada resultado<br/>vinculado a caso]
        T2[Cada caso vinculado<br/>a requerimiento]
        T3[Cada requerimiento<br/>vinculado a objetivo]
    end
    
    A5 --> T1 --> T2 --> T3
```

### Síntesis del Proceso Metodológico

El proceso metodológico para la validación con mocks en UniAlerta UCE:

1. **Estructura la validación en fases**: Análisis, preparación, ejecución y evaluación conforman un flujo ordenado y reproducible.

2. **Establece trazabilidad**: Cada caso de prueba se vincula con requerimientos específicos y los datos mock necesarios para su ejercicio.

3. **Define criterios explícitos**: La clasificación de resultados (PASS, PARCIAL, FAIL, N/A) y la severidad de hallazgos siguen criterios predefinidos.

4. **Genera métricas cuantitativas**: Cobertura de ejecución, tasa de éxito y conteo de defectos permiten evaluación objetiva del estado del sistema.

5. **Reconoce limitaciones**: El proceso explicita lo que puede y no puede validarse con datos mock, estableciendo el alcance de las conclusiones derivables.

6. **Produce documentación auditable**: Los artefactos generados permiten verificación independiente del proceso y sus resultados.

Este proceso metodológico permite que UniAlerta UCE demuestre factibilidad funcional dentro de las restricciones propias de una Prueba de Concepto, estableciendo evidencia sistemática del cumplimiento de requerimientos mediante un enfoque estructurado y documentado.
