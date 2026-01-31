# Manual de Instalación - UniAlertaUCE

## Índice

1. [Requisitos Previos](#1-requisitos-previos)
2. [Configuración de Supabase](#2-configuración-de-supabase)
3. [Configuración de Cloudinary](#3-configuración-de-cloudinary)
4. [Instalación del Proyecto en Lovable](#4-instalación-del-proyecto-en-lovable)
5. [Configuración de Variables de Entorno](#5-configuración-de-variables-de-entorno)
6. [Configuración de Mapas (Leaflet + OpenStreetMap)](#6-configuración-de-mapas-leaflet--openstreetmap)
7. [Ejecución y Despliegue](#7-ejecución-y-despliegue)
8. [Solución de Problemas Comunes](#8-solución-de-problemas-comunes)

---

## 1. Requisitos Previos

### 1.1 Cuentas Necesarias

Antes de comenzar, asegúrese de contar con las siguientes cuentas:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Lovable | https://lovable.dev | Plataforma de desarrollo |
| Supabase | https://supabase.com | Base de datos y autenticación |
| Cloudinary | https://cloudinary.com | Almacenamiento de imágenes |
| GitHub (opcional) | https://github.com | Control de versiones |

> **Imagen de _**: Logos de las plataformas requeridas (Lovable, Supabase, Cloudinary)

### 1.2 Conocimientos Recomendados

- Conocimientos básicos de React y TypeScript
- Familiaridad con bases de datos SQL
- Comprensión de APIs REST

---

## 2. Configuración de Supabase

### 2.1 Crear Cuenta y Proyecto

1. Visite https://supabase.com y cree una cuenta
2. Haga clic en **"New Project"**
3. Complete los siguientes campos:
   - **Name**: `UniAlertaUCE` (o el nombre deseado)
   - **Database Password**: Genere una contraseña segura (guárdela)
   - **Region**: Seleccione la más cercana a su ubicación

> **Imagen de _**: Formulario de creación de nuevo proyecto en Supabase

### 2.2 Obtener Credenciales

1. Navegue a **Settings > API** en el panel de Supabase
2. Copie las siguientes credenciales:
   - **Project URL**: `https://[PROJECT_ID].supabase.co`
   - **anon public key**: Clave pública para el cliente
   - **service_role key**: Clave privada (solo para backend)

> **Imagen de _**: Sección de API Keys en Supabase Settings

### 2.3 Configurar Autenticación

1. Vaya a **Authentication > Providers**
2. Habilite los proveedores deseados:
   - ✅ Email (habilitado por defecto)
   - ⬜ Google (opcional)
   - ⬜ GitHub (opcional)

3. Configure las opciones de email:
   - **Enable email confirmations**: Según preferencia
   - **Secure email change**: Recomendado activar

> **Imagen de _**: Configuración de proveedores de autenticación en Supabase

### 2.4 Configurar Base de Datos

#### 2.4.1 Ejecutar Migraciones

Las migraciones se encuentran en la carpeta `supabase/migrations/`. Para aplicarlas:

1. En Supabase, vaya a **SQL Editor**
2. Ejecute cada archivo de migración en orden cronológico
3. Verifique que las tablas se hayan creado correctamente en **Table Editor**

> **Imagen de _**: SQL Editor de Supabase con una migración ejecutándose

#### 2.4.2 Tablas Principales

El sistema utiliza las siguientes tablas principales:

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Perfiles de usuarios |
| `user_roles` | Roles y permisos de usuarios |
| `reportes` | Reportes/incidentes |
| `categories` | Categorías de reportes |
| `tipo_categories` | Tipos de reportes |
| `publicaciones` | Publicaciones de red social |
| `mensajes` | Sistema de mensajería |
| `notifications` | Notificaciones del sistema |
| `settings` | Configuraciones de usuario |

> **Imagen de _**: Vista del Table Editor mostrando las tablas principales

### 2.5 Configurar Políticas RLS (Row Level Security)

1. Vaya a **Authentication > Policies**
2. Verifique que cada tabla tenga sus políticas RLS configuradas
3. Las políticas permiten:
   - Usuarios solo ven/editan sus propios datos
   - Administradores tienen acceso completo
   - Datos públicos accesibles para todos

> **Imagen de _**: Lista de políticas RLS en Supabase

### 2.6 Habilitar Extensiones

En **Database > Extensions**, habilite:

- ✅ `postgis` - Para geolocalización
- ✅ `uuid-ossp` - Para generación de UUIDs

> **Imagen de _**: Panel de extensiones de Supabase con postgis habilitado

---

## 3. Configuración de Cloudinary

### 3.1 Crear Cuenta

1. Visite https://cloudinary.com y cree una cuenta gratuita
2. Verifique su email

> **Imagen de _**: Página de registro de Cloudinary

### 3.2 Obtener Credenciales

1. En el **Dashboard** de Cloudinary, localice:
   - **Cloud Name**: Nombre único de su cuenta
   - **API Key**: Clave pública
   - **API Secret**: Clave privada

> **Imagen de _**: Dashboard de Cloudinary mostrando las credenciales

### 3.3 Configurar Upload Preset

Para permitir uploads sin autenticación del lado del cliente:

1. Vaya a **Settings > Upload**
2. Scroll hasta **Upload presets**
3. Cree un nuevo preset:
   - **Preset name**: `unialerta_uploads` (o su preferencia)
   - **Signing Mode**: `Unsigned`
   - **Folder**: `unialerta/` (opcional)

> **Imagen de _**: Configuración de Upload Preset en Cloudinary

### 3.4 Configurar Transformaciones (Opcional)

Para optimizar imágenes automáticamente:

1. Vaya a **Settings > Transformations**
2. Cree transformaciones predefinidas para:
   - Avatares: `c_fill,w_200,h_200,q_auto,f_auto`
   - Reportes: `c_limit,w_1200,q_auto,f_auto`
   - Thumbnails: `c_fill,w_100,h_100,q_auto,f_auto`

> **Imagen de _**: Configuración de transformaciones en Cloudinary

---

## 4. Instalación del Proyecto en Lovable

### 4.1 Crear Proyecto

1. Inicie sesión en https://lovable.dev
2. Cree un nuevo proyecto o importe desde GitHub

> **Imagen de _**: Dashboard de Lovable con opción de crear nuevo proyecto

### 4.2 Conectar Supabase

1. En Lovable, vaya a **Project Settings**
2. Seleccione **Supabase** en la sección de integraciones
3. Ingrese las credenciales:
   - **Project URL**
   - **Anon Key**

> **Imagen de _**: Modal de conexión de Supabase en Lovable

### 4.3 Estructura del Proyecto

El proyecto sigue la siguiente estructura:

```
src/
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes de interfaz (shadcn/ui)
│   ├── Map/            # Componentes de mapas (Leaflet)
│   ├── messages/       # Sistema de mensajería
│   ├── redsocial/      # Red social
│   ├── report/         # Gestión de reportes
│   └── ...
├── contexts/           # Contextos de React
├── hooks/              # Hooks personalizados
│   ├── controlador/    # Lógica de negocio
│   ├── entidades/      # Hooks de entidades
│   └── ...
├── pages/              # Páginas de la aplicación
├── integrations/       # Integraciones (Supabase)
└── lib/                # Utilidades
```

> **Imagen de _**: Estructura de carpetas del proyecto en el editor de código

---

## 5. Configuración de Variables de Entorno

### 5.1 Variables Requeridas

Cree o modifique el archivo `.env` en la raíz del proyecto:

```env
# Supabase
VITE_SUPABASE_URL=https://[PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=[YOUR_CLOUD_NAME]
VITE_CLOUDINARY_UPLOAD_PRESET=[YOUR_UPLOAD_PRESET]
```

> **Imagen de _**: Archivo .env con las variables configuradas

### 5.2 Configurar Secrets en Lovable

Para variables sensibles que no deben estar en el código:

1. Vaya a **Project Settings > Secrets**
2. Agregue los secrets necesarios:
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

> **Imagen de _**: Panel de Secrets en Lovable

---

## 6. Configuración de Mapas (Leaflet + OpenStreetMap)

### 6.1 Dependencias Instaladas

El proyecto ya incluye las siguientes dependencias:

```json
{
  "leaflet": "^1.9.4",
  "@types/leaflet": "^1.9.21"
}
```

### 6.2 Componentes de Mapa

Los componentes de mapa se encuentran en `src/components/Map/`:

| Componente | Descripción |
|------------|-------------|
| `LiveTrackingMap` | Mapa de rastreo en tiempo real |
| `LiveNavigationMap` | Mapa de navegación |
| `ReportFormMap` | Mapa para crear reportes |
| `ReportLocationMap` | Mapa de ubicación de reportes |
| `SingleReportMap` | Mapa individual de reporte |

> **Imagen de _**: Vista del mapa de rastreo en la aplicación

### 6.3 Configuración de Tiles

El proyecto utiliza OpenStreetMap como proveedor de tiles:

```typescript
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
```

### 6.4 Permisos de Geolocalización

La aplicación solicitará permisos de ubicación al usuario. Esto es manejado por el `LocationContext`.

> **Imagen de _**: Prompt del navegador solicitando permisos de ubicación

---

## 7. Ejecución y Despliegue

### 7.1 Desarrollo Local

Para ejecutar el proyecto localmente (si se descarga desde GitHub):

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

El proyecto estará disponible en `http://localhost:5173`

### 7.2 Desarrollo en Lovable

En Lovable, el proyecto se ejecuta automáticamente. Solo necesita:

1. Hacer cambios en el código
2. Ver la vista previa en tiempo real

> **Imagen de _**: Interfaz de Lovable mostrando el editor y la vista previa

### 7.3 Despliegue a Producción

#### Opción 1: Lovable (Recomendado)

1. Haga clic en **"Publish"** en Lovable
2. Seleccione **"Update"** para publicar cambios
3. Su aplicación estará disponible en `[proyecto].lovable.app`

> **Imagen de _**: Botón de Publish en Lovable

#### Opción 2: Dominio Personalizado

1. Vaya a **Project Settings > Domains**
2. Agregue su dominio personalizado
3. Configure los registros DNS según las instrucciones

> **Imagen de _**: Configuración de dominio personalizado en Lovable

---

## 8. Solución de Problemas Comunes

### 8.1 Error de Conexión a Supabase

**Síntoma**: La aplicación no carga datos o muestra errores de red.

**Solución**:
1. Verifique que las credenciales en `.env` sean correctas
2. Confirme que el proyecto Supabase esté activo
3. Revise las políticas RLS

> **Imagen de _**: Consola del navegador mostrando error de conexión

### 8.2 Imágenes no se Cargan (Cloudinary)

**Síntoma**: Las imágenes no se suben o no se muestran.

**Solución**:
1. Verifique el `cloud_name` y `upload_preset`
2. Confirme que el preset sea `unsigned`
3. Revise los límites de la cuenta gratuita

### 8.3 Mapa no se Renderiza

**Síntoma**: El mapa aparece en gris o con tiles rotos.

**Solución**:
1. Verifique la conexión a internet
2. Confirme que los estilos de Leaflet estén cargados
3. Revise la consola por errores de CORS

> **Imagen de _**: Mapa renderizado correctamente vs mapa con error

### 8.4 Errores de Autenticación

**Síntoma**: No se puede iniciar sesión o registrar usuarios.

**Solución**:
1. Verifique la configuración de Auth en Supabase
2. Confirme que el email esté verificado (si aplica)
3. Revise las políticas RLS de la tabla `profiles`

---

## Anexos

### A. Tecnologías Utilizadas

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 18.3.1 | Framework frontend |
| TypeScript | - | Tipado estático |
| Vite | - | Build tool |
| Tailwind CSS | - | Estilos |
| Supabase | 2.86.2 | Backend/BaaS |
| Leaflet | 1.9.4 | Mapas interactivos |
| Cloudinary | - | Gestión de imágenes |
| shadcn/ui | - | Componentes UI |
| TanStack Query | 5.83.0 | Gestión de estado servidor |
| React Hook Form | 7.61.1 | Formularios |
| Zod | 3.25.76 | Validación |

### B. Recursos Adicionales

- [Documentación de Lovable](https://docs.lovable.dev)
- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Cloudinary](https://cloudinary.com/documentation)
- [Documentación de Leaflet](https://leafletjs.com/reference.html)
- [Documentación de OpenStreetMap](https://wiki.openstreetmap.org)

### C. Contacto y Soporte

Para soporte técnico o consultas sobre la instalación, contacte al equipo de desarrollo.

---

**Documento creado para**: UniAlertaUCE  
**Versión del documento**: 1.0  
**Última actualización**: Enero 2026
