# Capítulo: Desarrollo del Proyecto

## Datos Sintéticos y Protección de la Privacidad

### Contextualización de la Problemática

UniAlerta UCE gestiona información inherentemente sensible: datos personales de usuarios (nombre, correo electrónico, ubicación), contenido de reportes que pueden involucrar situaciones de seguridad o conflicto, coordenadas geográficas que revelan patrones de presencia, y comunicaciones privadas entre miembros de la comunidad universitaria. Esta naturaleza de los datos impone obligaciones de protección que trascienden consideraciones técnicas y se enmarcan en principios de privacidad, confidencialidad y uso ético de la información.

El desarrollo del sistema como Prueba de Concepto enfrenta una tensión inherente: por un lado, requiere datos suficientemente realistas para validar funcionalidades y demostrar factibilidad; por otro, no debe exponer información real de personas que no han consentido su uso en un entorno de desarrollo. Esta tensión fundamenta la estrategia de datos sintéticos implementada en UniAlerta UCE.

```mermaid
graph TB
    subgraph "Tensión Fundamental"
        T1[Necesidad de<br/>datos realistas]
        T2[Protección de<br/>privacidad]
    end
    
    subgraph "Riesgos sin Mitigación"
        R1[Exposición de<br/>datos personales]
        R2[Violación de<br/>confidencialidad]
        R3[Trazabilidad de<br/>individuos reales]
    end
    
    subgraph "Solución Implementada"
        S1[Datos Sintéticos<br/>Representativos]
    end
    
    T1 --> R1
    T2 --> R2
    R1 --> S1
    R2 --> S1
    R3 --> S1
    
    style T1 fill:#dbeafe
    style T2 fill:#dcfce7
    style R1 fill:#fee2e2
    style R2 fill:#fee2e2
    style R3 fill:#fee2e2
    style S1 fill:#f0fdf4
```

### Tipología de Datos Sensibles en el Sistema

El modelo de datos de UniAlerta UCE contempla categorías de información con diferentes niveles de sensibilidad:

#### Datos de Identidad Personal

La tabla `profiles` almacena información que permite identificar individuos:

| Campo | Nivel de Sensibilidad | Justificación |
|-------|----------------------|---------------|
| `email` | Alto | Identificador único vinculado a identidad real |
| `name` | Alto | Nombre completo de la persona |
| `username` | Medio | Puede contener información identificable |
| `avatar` | Medio | Fotografía del usuario |
| `bio` | Bajo | Texto libre de presentación |
| `user_id` | Crítico | Vínculo con sistema de autenticación |

#### Datos de Ubicación Geográfica

Los reportes y el sistema de rastreo generan información geoespacial:

| Fuente | Tipo de Dato | Implicación de Privacidad |
|--------|--------------|---------------------------|
| Reportes (`geolocation`) | Coordenadas del incidente | Puede revelar presencia del reportante |
| Rastreo activo (`active_trackings`) | Posición en tiempo real | Seguimiento continuo del operador |
| Ubicaciones de usuarios (`user_locations`) | Última posición conocida | Patrón de movimiento individual |

```mermaid
graph LR
    subgraph "Datos de Ubicación"
        L1[Coordenadas<br/>de Reportes]
        L2[Rastreo<br/>en Tiempo Real]
        L3[Última<br/>Ubicación Conocida]
    end
    
    subgraph "Riesgos Asociados"
        R1[Inferencia de<br/>rutinas diarias]
        R2[Identificación de<br/>patrones de presencia]
        R3[Correlación con<br/>eventos sensibles]
    end
    
    L1 --> R3
    L2 --> R1
    L3 --> R2
```

#### Contenido de Comunicaciones

El sistema de mensajería almacena comunicaciones privadas:

| Tabla | Contenido | Consideración de Privacidad |
|-------|-----------|----------------------------|
| `mensajes` | Texto de conversaciones | Comunicación privada entre usuarios |
| `mensajes.imagenes` | Archivos multimedia | Contenido visual potencialmente sensible |
| `mensajes.shared_post` | Referencias a publicaciones | Contexto de intereses y relaciones |

#### Contenido de Reportes

Los reportes pueden contener información delicada:

| Campo | Riesgo Potencial |
|-------|------------------|
| `descripcion` | Narrativa de situaciones que involucran terceros |
| `imagenes` | Evidencia visual de incidentes |
| `location` | Datos estructurados de edificio, piso, aula |

### Estrategia de Datos Sintéticos

#### Principios de Generación

Los datos sintéticos de UniAlerta UCE se generan siguiendo principios que equilibran representatividad con protección de privacidad:

**No derivación de datos reales**: Los datos sintéticos no se generan a partir de transformaciones de datos reales (anonimización, pseudonimización), sino que se crean ex nihilo sin referencia a individuos existentes.

**Plausibilidad sin correspondencia**: Los nombres, correos y ubicaciones generados son plausibles dentro del contexto universitario pero no corresponden a personas, cuentas o lugares específicos reales.

**Diversidad controlada**: La variabilidad de los datos sintéticos cubre el espectro de casos que el sistema debe manejar, sin replicar patrones que pudieran inferirse de operación real.

```mermaid
flowchart TB
    subgraph "Generación de Datos Sintéticos"
        A[Definición de<br/>Esquema de Datos]
        B[Identificación de<br/>Campos Sensibles]
        C[Generación<br/>Aleatoria Controlada]
        D[Validación de<br/>Plausibilidad]
        E[Inserción en<br/>Base de Desarrollo]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    
    subgraph "Controles Aplicados"
        F[Sin referencia<br/>a datos reales]
        G[Verificación de<br/>no coincidencia]
        H[Consistencia<br/>relacional]
    end
    
    C --> F
    D --> G
    E --> H
```

#### Datos Sintéticos por Entidad

La siguiente tabla detalla el enfoque de generación para cada categoría de datos sensibles:

| Entidad | Campo Sensible | Estrategia de Síntesis |
|---------|----------------|------------------------|
| Usuarios | `email` | Dominios ficticios (@ejemplo.test, @prueba.local) |
| Usuarios | `name` | Combinaciones aleatorias de nombres comunes |
| Usuarios | `username` | Prefijos genéricos + sufijos numéricos |
| Reportes | `descripcion` | Textos genéricos de incidentes tipo |
| Reportes | `geolocation` | Coordenadas dentro del perímetro del campus |
| Reportes | `imagenes` | URLs a imágenes genéricas de prueba |
| Mensajes | `contenido` | Textos placeholder sin información real |
| Ubicaciones | coordenadas | Puntos aleatorios en áreas públicas del campus |

#### Separación de Datos por Contexto

El sistema mantiene separación entre datos de diferentes contextos operativos:

| Contexto | Datos Utilizados | Propósito |
|----------|------------------|-----------|
| Desarrollo local | Datos sintéticos mínimos | Pruebas de funcionalidad |
| Ambiente de prueba | Conjunto completo de datos mock | Validación de integración |
| Demostración | Datos sintéticos curados | Presentación de funcionalidades |

```mermaid
graph TB
    subgraph "Ambientes y Datos"
        A1[Desarrollo]
        A2[Prueba]
        A3[Demostración]
    end
    
    subgraph "Tipos de Datos"
        D1[Sintéticos<br/>Mínimos]
        D2[Mock<br/>Completos]
        D3[Sintéticos<br/>Curados]
    end
    
    subgraph "Nunca Presente"
        N1[Datos Reales<br/>de Usuarios]
    end
    
    A1 --> D1
    A2 --> D2
    A3 --> D3
    
    N1 -.->|Excluido| A1
    N1 -.->|Excluido| A2
    N1 -.->|Excluido| A3
    
    style N1 fill:#fee2e2
```

### Mecanismos de Protección de Privacidad Implementados

#### Arquitectura de Seguridad en Capas

UniAlerta UCE implementa protección de privacidad mediante múltiples capas de seguridad:

```mermaid
graph TB
    subgraph "Capa 1: Autenticación"
        L1[JWT con expiración]
        L2[Refresh tokens]
        L3[Bloqueo por intentos fallidos]
    end
    
    subgraph "Capa 2: Autorización"
        L4[Row Level Security - RLS]
        L5[Verificación de roles]
        L6[Permisos granulares]
    end
    
    subgraph "Capa 3: Aislamiento de Datos"
        L7[Usuarios ven solo datos propios]
        L8[Operadores ven asignados]
        L9[Admins con acceso auditado]
    end
    
    subgraph "Capa 4: Auditoría"
        L10[Registro de accesos]
        L11[Historial de cambios]
        L12[Trazabilidad de acciones]
    end
    
    L1 --> L4
    L2 --> L5
    L3 --> L6
    L4 --> L7
    L5 --> L8
    L6 --> L9
    L7 --> L10
    L8 --> L11
    L9 --> L12
```

#### Row Level Security (RLS)

Las políticas RLS de PostgreSQL implementan el principio de mínimo privilegio a nivel de base de datos:

| Tabla | Política de Lectura | Política de Escritura |
|-------|--------------------|-----------------------|
| `profiles` | Usuario propio o con permiso `ver_usuario` | Solo perfil propio o con permiso `editar_usuario` |
| `reportes` | Propios, asignados, o con permiso `ver_reporte` | Propios o con permiso `editar_reporte` |
| `mensajes` | Solo participantes de la conversación | Solo emisor del mensaje |
| `publicaciones` | Según visibilidad configurada | Solo autor de la publicación |
| `notificaciones` | Solo destinatario | Solo sistema |

**Ejemplo conceptual de política RLS aplicada:**

```mermaid
sequenceDiagram
    participant U as Usuario Autenticado
    participant A as Aplicación
    participant RLS as Política RLS
    participant DB as Base de Datos
    
    U->>A: Solicita ver reportes
    A->>DB: SELECT * FROM reportes
    DB->>RLS: Evalúa política para user_id
    RLS->>RLS: ¿Es propietario OR asignado<br/>OR tiene permiso ver_reporte?
    RLS-->>DB: Filtra registros autorizados
    DB-->>A: Solo registros permitidos
    A-->>U: Datos filtrados por permisos
```

#### Minimización de Datos en Vistas

El sistema expone vistas que limitan los datos accesibles:

| Vista | Datos Excluidos | Propósito |
|-------|-----------------|-----------|
| `profiles_public` | `email`, `user_id`, `must_change_password` | Perfil visible para otros usuarios |
| `public_reportes_anonymized` | Datos del creador en reportes anónimos | Reportes con visibilidad anónima |

#### Controles de Acceso a Ubicación

La información de ubicación requiere protecciones específicas:

| Funcionalidad | Control Aplicado |
|---------------|------------------|
| Geolocalización de reportes | Consentimiento explícito del usuario |
| Rastreo en tiempo real | Solo para operadores en seguimiento activo |
| Historial de ubicaciones | Retención limitada, purga automática |
| Reportes cercanos | Cálculo en backend, no exposición de coordenadas de terceros |

```mermaid
flowchart TB
    subgraph "Controles de Ubicación"
        C1[Consentimiento<br/>del navegador]
        C2[Autorización<br/>por rol]
        C3[Retención<br/>limitada]
        C4[Cálculo<br/>server-side]
    end
    
    subgraph "Protecciones Resultantes"
        P1[Usuario decide<br/>si compartir]
        P2[Acceso según<br/>necesidad]
        P3[Datos no<br/>acumulados]
        P4[Coordenadas no<br/>expuestas a cliente]
    end
    
    C1 --> P1
    C2 --> P2
    C3 --> P3
    C4 --> P4
```

### Protección en el Ciclo de Vida de los Datos

#### Creación de Datos

Al momento de registro o creación de contenido:

| Acción | Protección Aplicada |
|--------|---------------------|
| Registro de usuario | Contraseña hasheada (Supabase Auth) |
| Creación de reporte | Opción de visibilidad privada/anónima |
| Envío de mensaje | Cifrado en tránsito (HTTPS) |
| Carga de imagen | Almacenamiento en CDN con URLs firmadas |

#### Almacenamiento de Datos

Durante la persistencia:

| Aspecto | Implementación |
|---------|----------------|
| Base de datos | PostgreSQL gestionado por Supabase (cifrado en reposo) |
| Archivos multimedia | Cloudinary con acceso controlado |
| Sesiones | Tokens JWT con expiración |
| Logs | Retención limitada en Supabase Analytics |

#### Eliminación de Datos

El sistema implementa soft delete para entidades principales:

| Tabla | Campo de Eliminación | Comportamiento |
|-------|---------------------|----------------|
| `profiles` | `deleted_at` | Perfil marcado, no eliminado físicamente |
| `reportes` | `deleted_at` | Reporte oculto pero recuperable |
| `publicaciones` | `deleted_at` | Publicación removida de feeds |
| `mensajes` | `deleted_at` | Mensaje oculto en conversación |

```mermaid
stateDiagram-v2
    [*] --> Activo: Creación
    Activo --> Eliminado: Soft Delete
    Eliminado --> Activo: Restauración (admin)
    Eliminado --> Purgado: Limpieza programada
    Purgado --> [*]
    
    note right of Eliminado
        deleted_at != null
        Datos aún en BD
        Recuperable por admin
    end note
    
    note right of Purgado
        Eliminación física
        Datos irrecuperables
        Según política de retención
    end note
```

### Consideraciones para Transición a Producción

#### Datos Sintéticos vs. Datos de Producción

La estrategia de datos sintéticos es específica de la fase de Prueba de Concepto. Una eventual transición a producción requeriría:

| Aspecto | Estado Actual (PoC) | Requerimiento Producción |
|---------|---------------------|--------------------------|
| Origen de datos | Sintéticos generados | Reales de usuarios |
| Consentimiento | No aplicable | Obligatorio y documentado |
| Política de privacidad | No publicada | Requerida legalmente |
| Derecho al olvido | No implementado | Funcionalidad obligatoria |
| Portabilidad de datos | No implementada | Según normativa aplicable |

#### Controles Adicionales Requeridos

Para operación con datos reales, el sistema requeriría:

| Control | Descripción | Estado Actual |
|---------|-------------|---------------|
| Consentimiento informado | Aceptación explícita de términos | No implementado |
| Panel de privacidad | Usuario gestiona sus datos | Parcial (editar perfil) |
| Exportación de datos | Descarga de información propia | No implementado |
| Eliminación completa | Borrado físico a solicitud | No implementado |
| Notificación de brechas | Comunicación ante incidentes | No aplicable |

### Limitaciones del Enfoque Actual

La estrategia de datos sintéticos presenta limitaciones reconocidas:

| Limitación | Implicación |
|------------|-------------|
| No valida comportamiento con datos reales | Patrones de uso podrían diferir |
| No ejercita flujos de consentimiento | Funcionalidad no implementada |
| No prueba volúmenes de producción | Escalabilidad no verificada |
| No aborda cumplimiento normativo | Requiere análisis legal específico |

```mermaid
graph TB
    subgraph "Alcance Actual"
        A1[Protección técnica<br/>implementada]
        A2[Datos sintéticos<br/>sin riesgo real]
        A3[Políticas RLS<br/>funcionales]
    end
    
    subgraph "Fuera del Alcance PoC"
        B1[Cumplimiento<br/>normativo formal]
        B2[Gestión de<br/>consentimiento]
        B3[Derechos ARCO<br/>completos]
        B4[Auditoría externa<br/>de seguridad]
    end
    
    style A1 fill:#dcfce7
    style A2 fill:#dcfce7
    style A3 fill:#dcfce7
    style B1 fill:#fef3c7
    style B2 fill:#fef3c7
    style B3 fill:#fef3c7
    style B4 fill:#fef3c7
```

### Síntesis del Enfoque

La estrategia de datos sintéticos y protección de privacidad en UniAlerta UCE:

1. **Reconoce la sensibilidad de los datos**: El sistema gestiona información personal, ubicaciones y comunicaciones que requieren protección.

2. **Implementa datos sintéticos**: Durante el desarrollo se utilizan datos generados sin referencia a individuos reales, eliminando riesgos de exposición.

3. **Establece capas de protección técnica**: Autenticación, autorización RLS, minimización en vistas y auditoría conforman una arquitectura de seguridad funcional.

4. **Aplica principio de mínimo privilegio**: Usuarios acceden solo a datos propios o según permisos asignados, verificados a nivel de base de datos.

5. **Reconoce limitaciones del alcance PoC**: El cumplimiento normativo formal y la gestión completa de derechos de privacidad quedan fuera del alcance actual.

6. **Sienta bases para evolución**: Las estructuras implementadas (soft delete, campos de auditoría, políticas RLS) facilitan la incorporación de controles adicionales en fases posteriores.

Esta estrategia permite que UniAlerta UCE demuestre factibilidad funcional sin comprometer privacidad de individuos reales, estableciendo fundamentos técnicos que podrían evolucionar hacia un sistema con cumplimiento normativo completo en una eventual fase de producción.
