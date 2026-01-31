# Manual Técnico - UniAlerta UCE

## Información del Documento

| Campo | Valor |
|-------|-------|
| **Proyecto** | UniAlerta UCE |
| **Versión** | 1.0.0 |
| **Fecha** | Enero 2026 |
| **Tipo** | Manual Técnico |
| **Clasificación** | Interno - Desarrollo |

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Requisitos del Sistema](#2-requisitos-del-sistema)
3. [Arquitectura Técnica](#3-arquitectura-técnica)
4. [Stack Tecnológico](#4-stack-tecnológico)
5. [Estructura del Proyecto](#5-estructura-del-proyecto)
6. [Configuración del Entorno](#6-configuración-del-entorno)
7. [Instalación y Despliegue](#7-instalación-y-despliegue)
8. [Configuración de Servicios Externos](#8-configuración-de-servicios-externos)
9. [Base de Datos](#9-base-de-datos)
10. [Sistema de Autenticación](#10-sistema-de-autenticación)
11. [API y Endpoints](#11-api-y-endpoints)
12. [Componentes Principales](#12-componentes-principales)
13. [Hooks Personalizados](#13-hooks-personalizados)
14. [Sistema de Mapas](#14-sistema-de-mapas)
15. [Gestión de Archivos](#15-gestión-de-archivos)
16. [Progressive Web App (PWA)](#16-progressive-web-app-pwa)
17. [Sistema de Notificaciones](#17-sistema-de-notificaciones)
18. [Tiempo Real](#18-tiempo-real)
19. [Seguridad](#19-seguridad)
20. [Testing y Debugging](#20-testing-y-debugging)
21. [Optimización y Performance](#21-optimización-y-performance)
22. [Mantenimiento](#22-mantenimiento)
23. [Troubleshooting](#23-troubleshooting)
24. [Glosario Técnico](#24-glosario-técnico)

---

## 1. Introducción

### 1.1 Propósito del Manual

Este manual técnico proporciona información detallada sobre la arquitectura, configuración, implementación y mantenimiento de la plataforma UniAlerta UCE. Está dirigido a desarrolladores, administradores de sistemas y personal técnico responsable del desarrollo y mantenimiento de la aplicación.

### 1.2 Alcance

El documento cubre:
- Configuración del entorno de desarrollo
- Arquitectura del sistema
- Integración con servicios externos
- Procedimientos de despliegue
- Guías de mantenimiento y troubleshooting

### 1.3 Audiencia

- Desarrolladores Frontend/Backend
- DevOps Engineers
- Administradores de Base de Datos
- Arquitectos de Software
- QA Engineers

*Imagen de: portada_manual_tecnico*

---

## 2. Requisitos del Sistema

### 2.1 Requisitos de Hardware (Desarrollo)

| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| **Procesador** | Dual Core 2.0 GHz | Quad Core 3.0 GHz+ |
| **RAM** | 8 GB | 16 GB |
| **Almacenamiento** | 20 GB SSD | 50 GB SSD |
| **Red** | 10 Mbps | 100 Mbps |

### 2.2 Requisitos de Software

```
┌─────────────────────────────────────────────────────────────────┐
│                    REQUISITOS DE SOFTWARE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SISTEMA OPERATIVO                                               │
│  ├── Windows 10/11 Pro                                          │
│  ├── macOS 12+ (Monterey o superior)                            │
│  └── Linux (Ubuntu 20.04+, Debian 11+)                          │
│                                                                  │
│  RUNTIME Y HERRAMIENTAS                                          │
│  ├── Node.js 18.x LTS o superior                                │
│  ├── npm 9.x o Bun 1.x                                          │
│  ├── Git 2.40+                                                  │
│  └── VS Code (recomendado)                                      │
│                                                                  │
│  NAVEGADORES SOPORTADOS                                          │
│  ├── Chrome 90+                                                 │
│  ├── Firefox 88+                                                │
│  ├── Safari 14+                                                 │
│  └── Edge 90+                                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Extensiones de VS Code Recomendadas

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "dsznajder.es7-react-js-snippets",
    "supabase.supabase-vscode"
  ]
}
```

*Imagen de: configuracion_vscode*

---

## 3. Arquitectura Técnica

### 3.1 Diagrama de Arquitectura General

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Navegador/PWA)                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                          React 18 + TypeScript                       │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────────┐  │ │
│  │  │   Router    │ │   Contexts  │ │  Components │ │    Hooks      │  │ │
│  │  │ React Router│ │  Auth/Theme │ │   shadcn/ui │ │  TanStack     │  │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └───────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ HTTPS
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                              SUPABASE CLOUD                               │
│  ┌─────────────────┐ ┌─────────────────┐ ┌────────────────────────────┐  │
│  │   PostgreSQL    │ │  Auth Service   │ │     Edge Functions         │  │
│  │  + PostGIS      │ │  + RLS Policies │ │     (Deno Runtime)         │  │
│  └─────────────────┘ └─────────────────┘ └────────────────────────────┘  │
│  ┌─────────────────┐ ┌─────────────────┐                                 │
│  │    Realtime     │ │     Storage     │                                 │
│  │   WebSockets    │ │   File Buckets  │                                 │
│  └─────────────────┘ └─────────────────┘                                 │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────────┐
│    CLOUDINARY       │ │    OPENSTREETMAP    │ │    SERVICIOS EXTERNOS   │
│  ┌───────────────┐  │ │  ┌───────────────┐  │ │  ┌─────────────────┐    │
│  │  Image CDN    │  │ │  │  Tile Server  │  │ │  │  Push Services  │    │
│  │  Transforms   │  │ │  │  Nominatim    │  │ │  │  Email          │    │
│  │  Optimization │  │ │  │  Geocoding    │  │ │  └─────────────────┘    │
│  └───────────────┘  │ │  └───────────────┘  │ │                          │
└─────────────────────┘ └─────────────────────┘ └─────────────────────────┘
```

### 3.2 Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FLUJO DE DATOS                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  USUARIO                                                                 │
│     │                                                                    │
│     ▼                                                                    │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐   │
│  │  Componente  │───▶│    Hook      │───▶│  TanStack Query Cache    │   │
│  │   React      │    │  useEntity   │    │  (staleTime: 5min)       │   │
│  └──────────────┘    └──────────────┘    └──────────────────────────┘   │
│                             │                        │                   │
│                             ▼                        ▼                   │
│                      ┌──────────────┐         ┌──────────────┐          │
│                      │   Supabase   │◀───────▶│   Realtime   │          │
│                      │    Client    │         │  Subscriptions│          │
│                      └──────────────┘         └──────────────┘          │
│                             │                                            │
│                             ▼                                            │
│                      ┌──────────────┐                                    │
│                      │  PostgreSQL  │                                    │
│                      │  + PostGIS   │                                    │
│                      └──────────────┘                                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

*Imagen de: diagrama_arquitectura_completo*

### 3.3 Patrones de Diseño Implementados

| Patrón | Implementación | Archivo/Módulo |
|--------|----------------|----------------|
| **Container/Presentational** | Separación de lógica y UI | Hooks + Components |
| **Factory Pattern** | Hooks optimizados | `useOptimizedEntity.ts` |
| **Observer Pattern** | Realtime subscriptions | `RealtimeRelations.ts` |
| **Singleton** | Supabase Client | `supabase/client.ts` |
| **Context Pattern** | Estado global | `AuthContext.tsx` |
| **Compound Components** | UI Components | `shadcn/ui` |

---

## 4. Stack Tecnológico

### 4.1 Frontend

```
┌─────────────────────────────────────────────────────────────────┐
│                       STACK FRONTEND                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CORE                                                            │
│  ├── React 18.3.1          → UI Library                         │
│  ├── TypeScript 5.x        → Type Safety                        │
│  ├── Vite 5.x              → Build Tool                         │
│  └── React Router 6.30     → Routing                            │
│                                                                  │
│  ESTADO Y DATA FETCHING                                          │
│  ├── TanStack Query 5.83   → Server State                       │
│  ├── React Context         → Client State                       │
│  └── Supabase Realtime     → Live Updates                       │
│                                                                  │
│  UI/UX                                                           │
│  ├── Tailwind CSS 3.x      → Styling                            │
│  ├── shadcn/ui             → Component Library                  │
│  ├── Radix UI              → Primitives                         │
│  ├── Lucide React          → Icons                              │
│  └── Recharts              → Charts                             │
│                                                                  │
│  FORMULARIOS                                                     │
│  ├── React Hook Form 7.61  → Form Management                    │
│  └── Zod 3.25              → Schema Validation                  │
│                                                                  │
│  MAPAS                                                           │
│  ├── Leaflet 1.9.4         → Map Library                        │
│  └── OpenStreetMap         → Tile Provider                      │
│                                                                  │
│  PWA                                                             │
│  └── vite-plugin-pwa 1.2   → Service Worker                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Backend (Supabase)

```
┌─────────────────────────────────────────────────────────────────┐
│                       STACK BACKEND                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DATABASE                                                        │
│  ├── PostgreSQL 15         → Database Engine                    │
│  ├── PostGIS               → Geospatial Extension               │
│  └── pgcrypto              → Encryption                         │
│                                                                  │
│  SUPABASE SERVICES                                               │
│  ├── Auth                  → Authentication                     │
│  ├── Realtime              → WebSocket Subscriptions            │
│  ├── Storage               → File Storage                       │
│  ├── Edge Functions        → Serverless Functions               │
│  └── Row Level Security    → Access Control                     │
│                                                                  │
│  EXTERNAL SERVICES                                               │
│  ├── Cloudinary            → Image/Video CDN                    │
│  └── OpenStreetMap         → Map Tiles                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Versiones de Dependencias Principales

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.1",
    "@supabase/supabase-js": "^2.86.2",
    "@tanstack/react-query": "^5.83.0",
    "react-hook-form": "^7.61.1",
    "@hookform/resolvers": "^3.10.0",
    "zod": "^3.25.76",
    "leaflet": "^1.9.4",
    "@types/leaflet": "^1.9.21",
    "lucide-react": "^0.462.0",
    "recharts": "^2.15.4",
    "date-fns": "^3.6.0",
    "sonner": "^1.7.4",
    "tailwind-merge": "^2.6.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1"
  }
}
```

*Imagen de: diagrama_stack_tecnologico*

---

## 5. Estructura del Proyecto

### 5.1 Árbol de Directorios

```
UniAlertaUCE/
├── docs/                          # Documentación del proyecto
│   ├── DOCUMENTO_ARQUITECTURA.md
│   ├── DOCUMENTO_REQUERIMIENTOS.md
│   ├── MANUAL_TECNICO.md
│   ├── MANUAL_USUARIO.md
│   └── MODELO_DATOS.md
│
├── public/                        # Assets estáticos
│   ├── icons/                     # Iconos PWA
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   ├── icon-128x128.png
│   │   ├── icon-144x144.png
│   │   ├── icon-152x152.png
│   │   ├── icon-192x192.png
│   │   ├── icon-384x384.png
│   │   └── icon-512x512.png
│   ├── favicon.ico
│   └── robots.txt
│
├── src/
│   ├── components/               # Componentes React
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── Map/                  # Componentes de mapas
│   │   ├── audit/                # Auditoría
│   │   ├── auth/                 # Autenticación
│   │   ├── categories/           # Categorías
│   │   ├── dashboard/            # Dashboard
│   │   ├── details/              # Vistas de detalle
│   │   ├── estados/              # Estados/Stories
│   │   ├── form/                 # Formularios auth
│   │   ├── messages/             # Mensajería
│   │   ├── notifications/        # Notificaciones
│   │   ├── profile/              # Perfil de usuario
│   │   ├── redsocial/            # Red social
│   │   ├── report/               # Reportes
│   │   ├── report-types/         # Tipos de reporte
│   │   ├── settings/             # Configuración
│   │   ├── table/                # Tablas de datos
│   │   ├── tracking/             # Rastreo
│   │   └── users/                # Gestión usuarios
│   │
│   ├── contexts/                 # React Contexts
│   │   ├── AuthContext.tsx
│   │   ├── LocationContext.tsx
│   │   ├── MessagingContext.tsx
│   │   ├── NotificationsContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── UserPresenceContext.tsx
│   │
│   ├── hooks/                    # Custom Hooks
│   │   ├── controlador/          # Business logic hooks
│   │   ├── entidades/            # Entity data hooks
│   │   ├── estados/              # Status hooks
│   │   ├── messages/             # Messaging hooks
│   │   ├── optimizacion/         # Performance hooks
│   │   └── users/                # User CRUD hooks
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts         # Cliente Supabase
│   │       └── types.ts          # Tipos autogenerados
│   │
│   ├── lib/                      # Utilidades
│   │   ├── distance.ts
│   │   ├── reportStatus.ts
│   │   └── utils.ts
│   │
│   ├── pages/                    # Páginas/Rutas
│   │   ├── Index.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── Reportes.tsx
│   │   ├── RedSocial.tsx
│   │   ├── Mensajes.tsx
│   │   └── ...
│   │
│   ├── App.tsx                   # Componente raíz
│   ├── App.css                   # Estilos globales
│   ├── index.css                 # Tailwind + Design System
│   ├── main.tsx                  # Entry point
│   └── vite-env.d.ts
│
├── supabase/
│   ├── config.toml               # Configuración Supabase
│   └── migrations/               # Migraciones SQL
│
├── .env                          # Variables de entorno
├── index.html                    # HTML template
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── eslint.config.js
```

### 5.2 Convenciones de Nomenclatura

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| **Componentes** | PascalCase | `UserProfile.tsx` |
| **Hooks** | camelCase con "use" | `useOptimizedProfile.ts` |
| **Utilidades** | camelCase | `distance.ts` |
| **Contexts** | PascalCase + "Context" | `AuthContext.tsx` |
| **Tipos** | PascalCase | `UserProfile` |
| **Interfaces** | PascalCase con "I" (opcional) | `IReportData` |
| **Enums** | PascalCase | `ReportStatus` |
| **Constantes** | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| **Archivos CSS** | kebab-case | `index.css` |

*Imagen de: estructura_directorios*

---

## 6. Configuración del Entorno

### 6.1 Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```bash
# ===========================================
# SUPABASE CONFIGURATION
# ===========================================
VITE_SUPABASE_URL=https://tgrfsuewkayqrobdfesa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ===========================================
# CLOUDINARY CONFIGURATION
# ===========================================
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset

# Nota: API Key y Secret NO se usan en frontend
# CLOUDINARY_API_KEY=xxxxx (solo backend/edge functions)
# CLOUDINARY_API_SECRET=xxxxx (solo backend/edge functions)

# ===========================================
# APP CONFIGURATION
# ===========================================
VITE_APP_NAME=UniAlerta UCE
VITE_APP_VERSION=1.0.0
```

### 6.2 Configuración de TypeScript

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 6.3 Configuración de Vite

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt"],
      manifest: {
        name: "UniAlerta UCE",
        short_name: "UniAlerta",
        theme_color: "#3b82f6",
        background_color: "#0f172a",
        display: "standalone",
        // ... más configuración
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        runtimeCaching: [
          // Configuración de caché
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
```

### 6.4 Configuración de Tailwind

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... más colores semánticos
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

*Imagen de: configuracion_entorno_desarrollo*

---

## 7. Instalación y Despliegue

### 7.1 Instalación Local

```bash
# 1. Clonar repositorio (si aplica)
git clone https://github.com/your-org/unialerta-uce.git
cd unialerta-uce

# 2. Instalar dependencias
npm install
# o con Bun
bun install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con las credenciales correctas

# 4. Iniciar servidor de desarrollo
npm run dev
# o
bun run dev

# 5. Abrir en navegador
# http://localhost:8080
```

### 7.2 Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo |
| `npm run build` | Genera build de producción |
| `npm run preview` | Vista previa del build |
| `npm run lint` | Ejecuta ESLint |
| `npm run type-check` | Verifica tipos TypeScript |

### 7.3 Despliegue en Lovable

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE DESPLIEGUE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. DESARROLLO LOCAL                                             │
│     │                                                            │
│     ▼                                                            │
│  2. COMMIT & PUSH (opcional con GitHub)                          │
│     │                                                            │
│     ▼                                                            │
│  3. LOVABLE BUILD                                                │
│     ├── Type checking                                            │
│     ├── Linting                                                  │
│     ├── Bundle optimization                                      │
│     └── PWA generation                                           │
│     │                                                            │
│     ▼                                                            │
│  4. DEPLOY TO CDN                                                │
│     ├── Assets optimization                                      │
│     ├── Gzip compression                                         │
│     └── Edge caching                                             │
│     │                                                            │
│     ▼                                                            │
│  5. PRODUCCIÓN                                                   │
│     └── https://your-app.lovable.app                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.4 Publicación desde Lovable

1. Acceder al panel de Lovable
2. Clic en botón **"Publish"**
3. Seleccionar configuración de dominio
4. Confirmar despliegue
5. Verificar URL de producción

*Imagen de: proceso_despliegue_lovable*

---

## 8. Configuración de Servicios Externos

### 8.1 Supabase

#### Conexión del Cliente

```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://tgrfsuewkayqrobdfesa.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);
```

#### Configuración del Proyecto

```toml
# supabase/config.toml
project_id = "tgrfsuewkayqrobdfesa"

[api]
enabled = true
port = 54321
schemas = ["public", "storage", "graphql_public"]

[db]
port = 54322
major_version = 15

[auth]
site_url = "https://your-app.lovable.app"
additional_redirect_urls = ["http://localhost:8080"]
jwt_expiry = 3600
```

*Imagen de: panel_supabase_configuracion*

### 8.2 Cloudinary

#### Configuración de Upload

```typescript
// src/hooks/controlador/useCloudinaryUpload.ts
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

const uploadToCloudinary = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'unialerta');
  
  const response = await fetch(CLOUDINARY_URL, {
    method: 'POST',
    body: formData
  });
  
  return response.json();
};
```

#### Transformaciones de Imagen

```typescript
// Ejemplos de transformaciones
const getOptimizedUrl = (publicId: string, options: TransformOptions) => {
  const transforms = [
    `w_${options.width || 800}`,
    `h_${options.height || 600}`,
    'c_fill',
    'q_auto',
    'f_auto'
  ].join(',');
  
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms}/${publicId}`;
};
```

*Imagen de: panel_cloudinary_configuracion*

### 8.3 OpenStreetMap / Leaflet

#### Configuración de Mapas

```typescript
// src/components/Map/ReportFormMap.tsx
import L from 'leaflet';

const MAP_CONFIG = {
  center: [-0.2105, -78.4915], // Quito, Ecuador
  zoom: 15,
  maxZoom: 19,
  minZoom: 3
};

const TILE_LAYER = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
};
```

#### Iconos Personalizados

```typescript
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; 
                       width: 30px; 
                       height: 30px; 
                       border-radius: 50%;
                       border: 3px solid white;
                       box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};
```

*Imagen de: configuracion_mapa_leaflet*

---

## 9. Base de Datos

### 9.1 Conexión a PostgreSQL

```typescript
// Queries con Supabase Client
const { data, error } = await supabase
  .from('reportes')
  .select(`
    *,
    categoria:categories(*),
    tipo:tipo_categories(*),
    usuario:profiles(id, name, avatar)
  `)
  .eq('activo', true)
  .order('created_at', { ascending: false });
```

### 9.2 Extensiones Habilitadas

| Extensión | Propósito |
|-----------|-----------|
| `postgis` | Datos geoespaciales |
| `uuid-ossp` | Generación de UUIDs |
| `pgcrypto` | Funciones criptográficas |

### 9.3 Funciones de Base de Datos

```sql
-- Función para verificar roles (Security Definer)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Función para calcular distancia entre puntos
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 double precision,
  lng1 double precision,
  lat2 double precision,
  lng2 double precision
)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ST_Distance(
    ST_SetSRID(ST_MakePoint(lng1, lat1), 4326)::geography,
    ST_SetSRID(ST_MakePoint(lng2, lat2), 4326)::geography
  )
$$;
```

### 9.4 Row Level Security (RLS)

```sql
-- Ejemplo: Política para reportes
ALTER TABLE public.reportes ENABLE ROW LEVEL SECURITY;

-- Lectura: usuarios autenticados pueden ver reportes activos
CREATE POLICY "Reportes visibles para usuarios autenticados"
ON public.reportes FOR SELECT
TO authenticated
USING (
  activo = true 
  AND deleted_at IS NULL
  AND (
    visibility = 'public' 
    OR user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Inserción: usuarios pueden crear sus propios reportes
CREATE POLICY "Usuarios pueden crear reportes"
ON public.reportes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Actualización: solo el creador o admin
CREATE POLICY "Usuarios pueden actualizar sus reportes"
ON public.reportes FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.has_role(auth.uid(), 'admin')
);
```

*Imagen de: diagrama_rls_policies*

---

## 10. Sistema de Autenticación

### 10.1 Flujo de Autenticación

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE AUTENTICACIÓN                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │  Login   │───▶│ Supabase │───▶│  JWT     │───▶│  Profile │  │
│  │  Form    │    │   Auth   │    │  Token   │    │  Fetch   │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│       │                                                │         │
│       │                                                ▼         │
│       │         ┌──────────────────────────────────────────┐    │
│       │         │              AuthContext                  │    │
│       │         │  ┌─────────────────────────────────────┐ │    │
│       │         │  │ user, profile, roles, permissions   │ │    │
│       │         │  │ isAuthenticated, isLoading          │ │    │
│       │         │  │ signIn, signUp, signOut             │ │    │
│       │         │  └─────────────────────────────────────┘ │    │
│       │         └──────────────────────────────────────────┘    │
│       │                                                          │
│       ▼                                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   ProtectedRoute                          │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │  Verifica: isAuthenticated && hasRequiredRole      │ │   │
│  │  │  Redirige: /login si no autenticado                │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 AuthContext Implementation

```typescript
// src/contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  roles: UserRole[];
  permissions: Permission[];
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  
  useEffect(() => {
    // Listener para cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
          await fetchRoles(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setRoles([]);
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
  
  // ... implementación
};
```

### 10.3 Sistema de Roles

```
┌─────────────────────────────────────────────────────────────────┐
│                      JERARQUÍA DE ROLES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SUPER_ADMIN                                                     │
│  └── Acceso total al sistema                                    │
│      ├── Gestión de todos los usuarios                          │
│      ├── Configuración del sistema                              │
│      └── Auditoría completa                                     │
│                                                                  │
│  ADMIN                                                           │
│  └── Administración general                                     │
│      ├── Gestión de usuarios (excepto super_admin)              │
│      ├── Gestión de categorías y tipos                          │
│      └── Reportes y estadísticas                                │
│                                                                  │
│  MODERATOR                                                       │
│  └── Moderación de contenido                                    │
│      ├── Revisión de reportes                                   │
│      ├── Gestión de publicaciones                               │
│      └── Moderación de comentarios                              │
│                                                                  │
│  USER                                                            │
│  └── Usuario estándar                                           │
│      ├── Crear reportes                                         │
│      ├── Participar en red social                               │
│      └── Mensajería                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 10.4 Permisos Granulares

| Permiso | Descripción | Roles |
|---------|-------------|-------|
| `users.read` | Ver lista de usuarios | Admin, Moderator |
| `users.write` | Crear/editar usuarios | Admin |
| `users.delete` | Eliminar usuarios | Super Admin |
| `reports.read` | Ver todos los reportes | Todos |
| `reports.write` | Editar cualquier reporte | Admin, Moderator |
| `reports.delete` | Eliminar reportes | Admin |
| `categories.manage` | Gestionar categorías | Admin |
| `audit.read` | Ver registros de auditoría | Admin |
| `settings.manage` | Configuración del sistema | Super Admin |

*Imagen de: diagrama_roles_permisos*

---

## 11. API y Endpoints

### 11.1 Estructura de Queries

```typescript
// Ejemplo: Query con relaciones
const fetchReporteWithRelations = async (id: string) => {
  const { data, error } = await supabase
    .from('reportes')
    .select(`
      *,
      categoria:categories (
        id, nombre, color, icono
      ),
      tipo:tipo_categories (
        id, nombre, color, icono
      ),
      usuario:profiles!user_id (
        id, name, username, avatar
      ),
      asignado:profiles!assigned_to (
        id, name, username, avatar
      ),
      historial:reporte_historial (
        *,
        assigned_by:profiles!assigned_by (name),
        assigned_to:profiles!assigned_to (name),
        assigned_from:profiles!assigned_from (name)
      ),
      confirmaciones:reporte_confirmaciones (
        id, user_id, created_at
      )
    `)
    .eq('id', id)
    .single();
    
  return { data, error };
};
```

### 11.2 Mutaciones

```typescript
// Crear reporte
const createReporte = async (data: ReporteInsert) => {
  const { data: reporte, error } = await supabase
    .from('reportes')
    .insert({
      ...data,
      user_id: userId,
      status: 'pending',
      activo: true
    })
    .select()
    .single();
    
  return { reporte, error };
};

// Actualizar con optimistic update
const updateReporte = async (id: string, updates: ReporteUpdate) => {
  const { data, error } = await supabase
    .from('reportes')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
    
  return { data, error };
};
```

### 11.3 Realtime Subscriptions

```typescript
// Suscripción a cambios en tiempo real
const subscribeToReportes = () => {
  const channel = supabase
    .channel('reportes-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reportes',
        filter: 'activo=eq.true'
      },
      (payload) => {
        handleReporteChange(payload);
      }
    )
    .subscribe();
    
  return () => {
    supabase.removeChannel(channel);
  };
};
```

### 11.4 Edge Functions

```typescript
// supabase/functions/send-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { userId, title, message, type } = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message,
      type
    });
    
  if (error) {
    return new Response(JSON.stringify({ error }), { status: 400 });
  }
  
  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
```

*Imagen de: diagrama_api_endpoints*

---

## 12. Componentes Principales

### 12.1 Arquitectura de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                   JERARQUÍA DE COMPONENTES                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  App.tsx                                                         │
│  ├── QueryClientProvider                                        │
│  ├── ThemeProvider                                              │
│  ├── AuthProvider                                               │
│  ├── LocationProvider                                           │
│  ├── NotificationsProvider                                      │
│  └── BrowserRouter                                              │
│      └── Routes                                                 │
│          ├── Public Routes                                      │
│          │   ├── Index                                          │
│          │   ├── Login                                          │
│          │   └── Register                                       │
│          │                                                       │
│          └── Protected Routes (ProtectedRoute wrapper)          │
│              ├── AppLayout                                      │
│              │   ├── AppSidebar                                 │
│              │   └── Main Content                               │
│              │       ├── Dashboard                              │
│              │       ├── Reportes                               │
│              │       ├── RedSocial                              │
│              │       ├── Mensajes                               │
│              │       └── ...                                    │
│              └── Standalone Pages                               │
│                  └── Configuracion                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 12.2 Componentes UI Base (shadcn/ui)

| Componente | Uso | Archivo |
|------------|-----|---------|
| `Button` | Acciones principales | `ui/button.tsx` |
| `Card` | Contenedores de información | `ui/card.tsx` |
| `Dialog` | Modales | `ui/dialog.tsx` |
| `Form` | Formularios con validación | `ui/form.tsx` |
| `Input` | Campos de texto | `ui/input.tsx` |
| `Select` | Selectores | `ui/select.tsx` |
| `Table` | Tablas de datos | `ui/table.tsx` |
| `Tabs` | Navegación por pestañas | `ui/tabs.tsx` |
| `Toast` | Notificaciones | `ui/toast.tsx` |
| `Tooltip` | Ayudas contextuales | `ui/tooltip.tsx` |

### 12.3 Componentes de Negocio

```typescript
// Ejemplo: ReportForm con validación
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const reporteSchema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres'),
  descripcion: z.string().optional(),
  categoria_id: z.string().uuid('Selecciona una categoría'),
  tipo_reporte_id: z.string().uuid('Selecciona un tipo'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional()
  })
});

type ReporteFormData = z.infer<typeof reporteSchema>;

export const ReportForm: React.FC = () => {
  const form = useForm<ReporteFormData>({
    resolver: zodResolver(reporteSchema),
    defaultValues: {
      priority: 'medium'
    }
  });
  
  // ... implementación del formulario
};
```

*Imagen de: jerarquia_componentes*

---

## 13. Hooks Personalizados

### 13.1 Estructura de Hooks

```
src/hooks/
├── controlador/              # Lógica de negocio
│   ├── useAuditLog.ts
│   ├── useCloudinaryUpload.ts
│   ├── useDashboardStats.ts
│   ├── useNearbyReportNotifications.ts
│   ├── useSignIn.ts
│   ├── useSignOut.ts
│   └── ...
│
├── entidades/                # Acceso a datos
│   ├── useOptimizedEntity.ts       # Factory hook
│   ├── useOptimizedEntityList.ts   # Factory para listas
│   ├── useOptimizedProfile.ts
│   ├── useOptimizedReportes.ts
│   ├── useOptimizedCategories.ts
│   ├── usePublicaciones.ts
│   ├── useUserRelations.ts
│   └── ...
│
├── estados/                  # Estados/Stories
│   ├── useEstados.ts
│   ├── useStatusViewer.ts
│   └── ...
│
├── messages/                 # Mensajería
│   ├── useConversations.ts
│   ├── useMessages.ts
│   ├── useGroupManagement.ts
│   └── ...
│
└── optimizacion/             # Performance
    ├── useAnimations.ts
    ├── useDesignSystem.ts
    ├── useLoadingState.ts
    └── useResponsive.ts
```

### 13.2 Factory Hook Pattern

```typescript
// src/hooks/entidades/useOptimizedEntity.ts
export function createOptimizedEntityHook<T>(config: OptimizedEntityConfig<T>) {
  return function useOptimizedEntity() {
    const queryClient = useQueryClient();
    
    const query = useQuery({
      queryKey: [config.entityName, getCachedUserId()],
      queryFn: config.fetchFn,
      staleTime: config.staleTime || 5 * 60 * 1000,
      gcTime: config.gcTime || 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2
    });
    
    const updateMutation = useMutation({
      mutationFn: config.updateFn,
      onMutate: async (newData) => {
        // Optimistic update
        await queryClient.cancelQueries({ 
          queryKey: [config.entityName] 
        });
        const previousData = queryClient.getQueryData([config.entityName]);
        queryClient.setQueryData([config.entityName], newData);
        return { previousData };
      },
      onError: (err, newData, context) => {
        // Rollback on error
        queryClient.setQueryData(
          [config.entityName], 
          context?.previousData
        );
      },
      onSettled: () => {
        queryClient.invalidateQueries({ 
          queryKey: [config.entityName] 
        });
      }
    });
    
    return {
      data: query.data,
      isLoading: query.isLoading,
      error: query.error,
      update: updateMutation.mutate,
      isUpdating: updateMutation.isPending
    };
  };
}
```

### 13.3 Hooks de Ubicación

```typescript
// src/hooks/controlador/useUserLocation.ts
export function useUserLocation() {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!navigator.geolocation) {
      setError({ code: 0, message: 'Geolocalización no soportada' });
      setIsLoading(false);
      return;
    }
    
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation(position);
        setIsLoading(false);
      },
      (error) => {
        setError(error);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
    
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);
  
  return { location, error, isLoading };
}
```

*Imagen de: diagrama_hooks_arquitectura*

---

## 14. Sistema de Mapas

### 14.1 Componentes de Mapas

```
src/components/Map/
├── index.ts                    # Barrel export
├── LiveNavigationMap.tsx       # Navegación en tiempo real
├── LiveTrackingMap.tsx         # Rastreo en vivo
├── NavigationMap.tsx           # Navegación básica
├── ReportFormMap.tsx           # Selector de ubicación
├── ReportLocationMap.tsx       # Visualización de ubicación
└── SingleReportMap.tsx         # Mapa de reporte individual
```

### 14.2 Configuración de Leaflet

```typescript
// Importaciones necesarias
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para iconos de Leaflet en Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});
```

### 14.3 Mapa de Formulario de Reporte

```typescript
// src/components/Map/ReportFormMap.tsx
interface ReportFormMapProps {
  initialLocation?: { lat: number; lng: number };
  onLocationSelect: (location: LocationData) => void;
}

export const ReportFormMap: React.FC<ReportFormMapProps> = ({
  initialLocation,
  onLocationSelect
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  
  useEffect(() => {
    // Inicializar mapa
    const map = L.map('report-map').setView(
      [initialLocation?.lat || -0.2105, initialLocation?.lng || -78.4915],
      15
    );
    
    // Agregar capa de tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    
    // Evento de clic para seleccionar ubicación
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      
      // Reverse geocoding
      const address = await reverseGeocode(lat, lng);
      
      onLocationSelect({ lat, lng, address });
      updateMarker(lat, lng);
    });
    
    mapRef.current = map;
    
    return () => {
      map.remove();
    };
  }, []);
  
  // ... resto de la implementación
};
```

### 14.4 Geocodificación

```typescript
// Reverse geocoding con Nominatim
const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?` +
      `format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'UniAlertaUCE/1.0'
        }
      }
    );
    
    const data = await response.json();
    return data.display_name || 'Dirección no disponible';
  } catch (error) {
    console.error('Error en geocodificación:', error);
    return 'Dirección no disponible';
  }
};
```

*Imagen de: componentes_mapa_leaflet*

---

## 15. Gestión de Archivos

### 15.1 Upload a Cloudinary

```typescript
// src/hooks/controlador/useCloudinaryUpload.ts
interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export function useCloudinaryUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const upload = async (
    file: File,
    options?: UploadOptions
  ): Promise<CloudinaryUploadResult> => {
    setIsUploading(true);
    setProgress(0);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', options?.folder || 'unialerta');
    
    if (options?.transformation) {
      formData.append('transformation', options.transformation);
    }
    
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
        {
          method: 'POST',
          body: formData
        }
      );
      
      if (!response.ok) {
        throw new Error('Error al subir archivo');
      }
      
      const result = await response.json();
      setProgress(100);
      return result;
    } finally {
      setIsUploading(false);
    }
  };
  
  const uploadMultiple = async (
    files: File[],
    options?: UploadOptions
  ): Promise<CloudinaryUploadResult[]> => {
    const results = await Promise.all(
      files.map((file) => upload(file, options))
    );
    return results;
  };
  
  return { upload, uploadMultiple, isUploading, progress };
}
```

### 15.2 Validación de Archivos

```typescript
const FILE_CONSTRAINTS = {
  image: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  },
  video: {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    allowedExtensions: ['.mp4', '.webm', '.mov']
  },
  document: {
    maxSize: 25 * 1024 * 1024, // 25MB
    allowedTypes: ['application/pdf'],
    allowedExtensions: ['.pdf']
  }
};

const validateFile = (file: File, type: keyof typeof FILE_CONSTRAINTS) => {
  const constraints = FILE_CONSTRAINTS[type];
  
  if (file.size > constraints.maxSize) {
    throw new Error(`Archivo demasiado grande. Máximo: ${constraints.maxSize / 1024 / 1024}MB`);
  }
  
  if (!constraints.allowedTypes.includes(file.type)) {
    throw new Error(`Tipo de archivo no permitido: ${file.type}`);
  }
  
  return true;
};
```

### 15.3 Transformaciones de Imagen

```typescript
// Transformaciones comunes
const TRANSFORMATIONS = {
  thumbnail: 'w_150,h_150,c_fill,q_auto,f_auto',
  avatar: 'w_100,h_100,c_fill,r_max,q_auto,f_auto',
  cover: 'w_1200,h_400,c_fill,q_auto,f_auto',
  gallery: 'w_800,h_600,c_fit,q_auto,f_auto',
  optimized: 'q_auto,f_auto'
};

const getTransformedUrl = (
  publicId: string,
  transformation: keyof typeof TRANSFORMATIONS
): string => {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${TRANSFORMATIONS[transformation]}/${publicId}`;
};
```

*Imagen de: flujo_upload_cloudinary*

---

## 16. Progressive Web App (PWA)

### 16.1 Configuración del Manifest

```typescript
// vite.config.ts - VitePWA configuration
VitePWA({
  registerType: "autoUpdate",
  includeAssets: ["favicon.ico", "robots.txt"],
  manifest: {
    name: "UniAlerta UCE",
    short_name: "UniAlerta",
    description: "Sistema de gestión de reportes y alertas universitarias",
    theme_color: "#3b82f6",
    background_color: "#0f172a",
    display: "standalone",
    orientation: "portrait-primary",
    start_url: "/",
    scope: "/",
    lang: "es",
    categories: ["utilities", "productivity", "social"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable any"
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable any"
      }
    ]
  }
})
```

### 16.2 Service Worker

```typescript
// src/main.tsx - Registro de Service Worker
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      
      console.log('[App] Service Worker registrado:', registration.scope);
      
      // Escuchar actualizaciones
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nueva versión disponible
              showUpdateNotification();
            }
          });
        }
      });
    } catch (error) {
      console.error('[App] Error registrando Service Worker:', error);
    }
  }
}
```

### 16.3 Estrategias de Caché

```typescript
// Workbox runtime caching
workbox: {
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
  runtimeCaching: [
    {
      // Supabase API - Network First
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "supabase-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 // 24 horas
        }
      }
    },
    {
      // Google Fonts - Cache First
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts-cache",
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365 // 1 año
        }
      }
    },
    {
      // Imágenes - Cache First
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "images-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30 // 30 días
        }
      }
    }
  ]
}
```

### 16.4 Instalación de PWA

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE INSTALACIÓN PWA                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Usuario visita la aplicación                                 │
│     │                                                            │
│     ▼                                                            │
│  2. Service Worker se registra                                   │
│     │                                                            │
│     ▼                                                            │
│  3. Manifest se carga                                            │
│     │                                                            │
│     ▼                                                            │
│  4. Navegador detecta criterios de instalación                   │
│     ├── HTTPS activo                                             │
│     ├── Manifest válido                                          │
│     ├── Service Worker registrado                                │
│     └── Engagement mínimo (visitas)                              │
│     │                                                            │
│     ▼                                                            │
│  5. Prompt de instalación aparece                                │
│     │                                                            │
│     ▼                                                            │
│  6. Usuario acepta                                               │
│     │                                                            │
│     ▼                                                            │
│  7. App se instala en dispositivo                                │
│     └── Acceso directo creado                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

*Imagen de: instalacion_pwa_dispositivos*

---

## 17. Sistema de Notificaciones

### 17.1 Arquitectura de Notificaciones

```
┌─────────────────────────────────────────────────────────────────┐
│                SISTEMA DE NOTIFICACIONES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │    In-App       │    │   Push (PWA)    │                     │
│  │  Notifications  │    │  Notifications  │                     │
│  └────────┬────────┘    └────────┬────────┘                     │
│           │                      │                               │
│           ▼                      ▼                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              NotificationsContext                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  notifications[], unreadCount, markAsRead(),         │  │ │
│  │  │  markAllAsRead(), deleteNotification()               │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│           ┌──────────────────┼──────────────────┐               │
│           ▼                  ▼                  ▼               │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │  Realtime       │ │   Toast         │ │  Badge          │   │
│  │  Subscription   │ │   Sonner        │ │  Counter        │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 17.2 Tipos de Notificación

```typescript
type NotificationType = 
  | 'report_created'      // Nuevo reporte
  | 'report_updated'      // Reporte actualizado
  | 'report_assigned'     // Reporte asignado
  | 'report_nearby'       // Reporte cercano
  | 'message_received'    // Mensaje recibido
  | 'friend_request'      // Solicitud de amistad
  | 'friend_accepted'     // Amistad aceptada
  | 'post_like'           // Like en publicación
  | 'post_comment'        // Comentario en publicación
  | 'mention'             // Mención en publicación
  | 'system';             // Sistema

interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  created_at: string;
}
```

### 17.3 NotificationsContext

```typescript
// src/contexts/NotificationsContext.tsx
export const NotificationsProvider: React.FC = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  
  // Suscripción en tiempo real
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          showToast(newNotification);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  // ... resto de implementación
};
```

### 17.4 Notificaciones Push

```typescript
// src/hooks/controlador/usePushNotifications.ts
export function usePushNotifications() {
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.warn('Notificaciones no soportadas');
      return false;
    }
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };
  
  const subscribe = async () => {
    const registration = await navigator.serviceWorker.ready;
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    
    // Guardar suscripción en backend
    await saveSubscription(subscription);
    
    return subscription;
  };
  
  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options
      });
    }
  };
  
  return { requestPermission, subscribe, sendNotification };
}
```

*Imagen de: sistema_notificaciones_flujo*

---

## 18. Tiempo Real

### 18.1 Supabase Realtime

```typescript
// Suscripción a cambios en tabla
const subscribeToTable = (
  table: string,
  filter?: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
) => {
  const channel = supabase
    .channel(`${table}-changes`)
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table,
        filter
      },
      callback
    )
    .subscribe();
    
  return () => {
    supabase.removeChannel(channel);
  };
};
```

### 18.2 Presencia de Usuarios

```typescript
// src/contexts/UserPresenceContext.tsx
export const UserPresenceProvider: React.FC = ({ children }) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase.channel('presence-room', {
      config: {
        presence: {
          key: user.id
        }
      }
    });
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const userIds = Object.keys(state);
        setOnlineUsers(userIds);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers((prev) => [...prev, key]);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers((prev) => prev.filter((id) => id !== key));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString()
          });
        }
      });
      
    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  return (
    <UserPresenceContext.Provider value={{ onlineUsers }}>
      {children}
    </UserPresenceContext.Provider>
  );
};
```

### 18.3 Mensajería en Tiempo Real

```typescript
// src/hooks/messages/useMessages.ts
export function useMessages(conversationId: string) {
  const queryClient = useQueryClient();
  
  // Suscripción a nuevos mensajes
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes',
          filter: `conversacion_id=eq.${conversationId}`
        },
        (payload) => {
          queryClient.setQueryData(
            ['messages', conversationId],
            (old: Message[] = []) => [...old, payload.new as Message]
          );
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);
  
  // ... resto del hook
}
```

*Imagen de: diagrama_realtime_subscriptions*

---

## 19. Seguridad

### 19.1 Modelo de Seguridad

```
┌─────────────────────────────────────────────────────────────────┐
│                      CAPAS DE SEGURIDAD                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CAPA 1: CLIENTE                                                 │
│  ├── Validación de formularios (Zod)                            │
│  ├── Sanitización de inputs                                     │
│  └── Protección de rutas (ProtectedRoute)                       │
│                                                                  │
│  CAPA 2: TRANSPORTE                                              │
│  ├── HTTPS obligatorio                                          │
│  ├── CORS configurado                                           │
│  └── Headers de seguridad                                       │
│                                                                  │
│  CAPA 3: AUTENTICACIÓN                                           │
│  ├── JWT Tokens (Supabase Auth)                                 │
│  ├── Refresh token rotation                                     │
│  └── Session management                                         │
│                                                                  │
│  CAPA 4: AUTORIZACIÓN                                            │
│  ├── Row Level Security (RLS)                                   │
│  ├── Roles y permisos                                           │
│  └── Security definer functions                                 │
│                                                                  │
│  CAPA 5: DATOS                                                   │
│  ├── Encriptación en reposo                                     │
│  ├── Backups automáticos                                        │
│  └── Soft delete                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 19.2 Validación de Datos

```typescript
// Schemas de validación con Zod
const userSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .max(255, 'Email muy largo'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener mayúscula')
    .regex(/[a-z]/, 'Debe contener minúscula')
    .regex(/[0-9]/, 'Debe contener número')
    .regex(/[^A-Za-z0-9]/, 'Debe contener carácter especial'),
  name: z.string()
    .min(2, 'Nombre muy corto')
    .max(100, 'Nombre muy largo')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo letras y espacios'),
});

const reporteSchema = z.object({
  nombre: z.string()
    .min(3, 'Título muy corto')
    .max(200, 'Título muy largo'),
  descripcion: z.string()
    .max(5000, 'Descripción muy larga')
    .optional(),
  categoria_id: z.string().uuid('Categoría inválida'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
});
```

### 19.3 Protección contra Ataques Comunes

| Ataque | Mitigación |
|--------|------------|
| **SQL Injection** | Supabase query builder (parametrizado) |
| **XSS** | React escapa automáticamente, CSP headers |
| **CSRF** | Supabase tokens, SameSite cookies |
| **Privilege Escalation** | RLS + Security definer functions |
| **Brute Force** | Rate limiting, login attempts tracking |
| **Data Exposure** | RLS policies, field-level access |

### 19.4 Auditoría

```sql
-- Tabla de auditoría
CREATE TABLE public.user_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  performed_by uuid REFERENCES profiles(id),
  action operation_type NOT NULL,
  tabla_afectada text,
  registro_id text,
  valores_anteriores jsonb,
  valores_nuevos jsonb,
  campos_modificados text[],
  ip_address inet,
  user_agent text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Trigger para auditoría automática
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_audit (
    user_id,
    performed_by,
    action,
    tabla_afectada,
    registro_id,
    valores_anteriores,
    valores_nuevos
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    auth.uid(),
    TG_OP::operation_type,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id)::text,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

*Imagen de: modelo_seguridad_capas*

---

## 20. Testing y Debugging

### 20.1 Herramientas de Debugging

```
┌─────────────────────────────────────────────────────────────────┐
│                    HERRAMIENTAS DE DEBUG                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  BROWSER                                                         │
│  ├── React DevTools                                             │
│  ├── TanStack Query DevTools                                    │
│  └── Network Tab (Supabase requests)                            │
│                                                                  │
│  SUPABASE                                                        │
│  ├── Dashboard Logs                                             │
│  ├── SQL Editor                                                 │
│  └── Auth Logs                                                  │
│                                                                  │
│  DESARROLLO                                                      │
│  ├── Vite HMR                                                   │
│  ├── TypeScript errors                                          │
│  └── ESLint warnings                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 20.2 Logging

```typescript
// Utilidad de logging
const logger = {
  info: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[INFO] ${message}`, data);
    }
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data);
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
    // En producción, enviar a servicio de monitoreo
  },
  debug: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.debug(`[DEBUG] ${message}`, data);
    }
  }
};
```

### 20.3 TanStack Query DevTools

```typescript
// src/App.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* App content */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

### 20.4 Pruebas Manuales

| Módulo | Pruebas Críticas |
|--------|------------------|
| **Autenticación** | Login, registro, logout, sesión persistente |
| **Reportes** | CRUD, geolocalización, imágenes |
| **Red Social** | Publicaciones, comentarios, likes, follows |
| **Mensajería** | Envío, recepción, tiempo real |
| **Notificaciones** | In-app, push, tiempo real |
| **Mapas** | Renderizado, selección, geocoding |

*Imagen de: herramientas_debugging*

---

## 21. Optimización y Performance

### 21.1 Estrategias de Optimización

```
┌─────────────────────────────────────────────────────────────────┐
│                 ESTRATEGIAS DE OPTIMIZACIÓN                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  REACT                                                           │
│  ├── React.memo para componentes puros                          │
│  ├── useMemo/useCallback para valores costosos                  │
│  ├── Code splitting con lazy()                                  │
│  └── Virtualization para listas largas                          │
│                                                                  │
│  QUERIES                                                         │
│  ├── staleTime: 5 minutos                                       │
│  ├── gcTime: 30 minutos                                         │
│  ├── Optimistic updates                                         │
│  └── Prefetching                                                │
│                                                                  │
│  ASSETS                                                          │
│  ├── Lazy loading de imágenes                                   │
│  ├── Cloudinary transformations                                 │
│  └── Service Worker caching                                     │
│                                                                  │
│  BUNDLE                                                          │
│  ├── Tree shaking                                               │
│  ├── Code splitting                                             │
│  └── Minification                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 21.2 Code Splitting

```typescript
// Lazy loading de páginas
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Reportes = lazy(() => import('./pages/Reportes'));
const RedSocial = lazy(() => import('./pages/RedSocial'));
const Mensajes = lazy(() => import('./pages/Mensajes'));

// Uso con Suspense
<Suspense fallback={<LoadingScreen />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/reportes" element={<Reportes />} />
    <Route path="/red-social" element={<RedSocial />} />
    <Route path="/mensajes" element={<Mensajes />} />
  </Routes>
</Suspense>
```

### 21.3 Query Configuration

```typescript
// src/App.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 minutos
      gcTime: 30 * 60 * 1000,       // 30 minutos
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### 21.4 Métricas de Performance

| Métrica | Objetivo | Herramienta |
|---------|----------|-------------|
| **LCP** | < 2.5s | Lighthouse |
| **FID** | < 100ms | Lighthouse |
| **CLS** | < 0.1 | Lighthouse |
| **TTI** | < 3.5s | Lighthouse |
| **Bundle Size** | < 500KB gzip | Vite analyzer |

*Imagen de: metricas_performance_lighthouse*

---

## 22. Mantenimiento

### 22.1 Tareas Periódicas

| Frecuencia | Tarea | Responsable |
|------------|-------|-------------|
| **Diario** | Revisión de logs de errores | DevOps |
| **Semanal** | Backup verification | DBA |
| **Semanal** | Actualización de dependencias menores | Dev |
| **Mensual** | Security patches | DevOps |
| **Mensual** | Performance review | Team |
| **Trimestral** | Dependency major updates | Dev Lead |

### 22.2 Actualización de Dependencias

```bash
# Verificar dependencias desactualizadas
npm outdated

# Actualizar dependencias menores (patch/minor)
npm update

# Actualizar dependencia específica
npm install package@latest

# Auditar vulnerabilidades
npm audit

# Corregir vulnerabilidades automáticamente
npm audit fix
```

### 22.3 Monitoreo

```
┌─────────────────────────────────────────────────────────────────┐
│                       MONITOREO                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SUPABASE DASHBOARD                                              │
│  ├── Database size                                              │
│  ├── API requests                                               │
│  ├── Realtime connections                                       │
│  └── Auth events                                                │
│                                                                  │
│  LOGS                                                            │
│  ├── PostgreSQL logs                                            │
│  ├── Auth logs                                                  │
│  ├── Edge function logs                                         │
│  └── Realtime logs                                              │
│                                                                  │
│  ALERTAS                                                         │
│  ├── Error rate > threshold                                     │
│  ├── Response time > threshold                                  │
│  ├── Database size warnings                                     │
│  └── Connection limit warnings                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 22.4 Backup y Recuperación

```sql
-- Backup automático de Supabase (diario)
-- Configurado en el dashboard de Supabase

-- Verificación de integridad de datos
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Verificar tamaño de tablas
SELECT 
  relname as table,
  pg_size_pretty(pg_total_relation_size(relid)) as size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

*Imagen de: panel_monitoreo_supabase*

---

## 23. Troubleshooting

### 23.1 Problemas Comunes

#### Error: "Failed to fetch" en Supabase

```typescript
// Verificar conexión
const { data, error } = await supabase.from('profiles').select('*').limit(1);
if (error) {
  console.error('Error de conexión:', error);
  // Verificar:
  // 1. SUPABASE_URL correcto
  // 2. SUPABASE_ANON_KEY válido
  // 3. RLS policies configuradas
}
```

#### Error: Imágenes no cargan desde Cloudinary

```typescript
// Verificar configuración
console.log('Cloud Name:', CLOUDINARY_CLOUD_NAME);
console.log('Upload Preset:', CLOUDINARY_UPLOAD_PRESET);

// Verificar que el preset sea "unsigned"
// Dashboard Cloudinary > Settings > Upload > Upload presets
```

#### Error: Mapa no renderiza

```typescript
// Verificar que Leaflet CSS está importado
import 'leaflet/dist/leaflet.css';

// Verificar que el contenedor tiene altura definida
<div id="map" style={{ height: '400px', width: '100%' }} />

// Verificar fix de iconos
import markerIcon from 'leaflet/dist/images/marker-icon.png';
```

#### Error: Autenticación falla silenciosamente

```typescript
// Verificar listener de auth
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
  console.log('Session:', session);
});

// Verificar configuración de redirects en Supabase Dashboard
// Authentication > URL Configuration
```

### 23.2 Debugging de RLS

```sql
-- Verificar políticas activas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;

-- Probar como usuario específico
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-uuid-here';

SELECT * FROM reportes LIMIT 5;

-- Restaurar rol
RESET ROLE;
```

### 23.3 Performance Issues

```typescript
// Identificar queries lentas
const startTime = performance.now();
const { data } = await supabase.from('table').select('*');
const endTime = performance.now();
console.log(`Query took ${endTime - startTime}ms`);

// Verificar índices necesarios
// EXPLAIN ANALYZE SELECT ... en SQL Editor
```

### 23.4 Contacto de Soporte

| Recurso | Contacto |
|---------|----------|
| **Documentación Supabase** | docs.supabase.com |
| **Documentación Cloudinary** | cloudinary.com/documentation |
| **Documentación Leaflet** | leafletjs.com/reference |
| **Soporte Lovable** | docs.lovable.dev |

*Imagen de: flujo_troubleshooting*

---

## 24. Glosario Técnico

| Término | Definición |
|---------|------------|
| **API** | Application Programming Interface |
| **CDN** | Content Delivery Network |
| **CORS** | Cross-Origin Resource Sharing |
| **CRUD** | Create, Read, Update, Delete |
| **CSP** | Content Security Policy |
| **Edge Function** | Función serverless ejecutada en el edge |
| **HMR** | Hot Module Replacement |
| **JWT** | JSON Web Token |
| **ORM** | Object-Relational Mapping |
| **PostGIS** | Extensión geoespacial de PostgreSQL |
| **PWA** | Progressive Web App |
| **RLS** | Row Level Security |
| **SDK** | Software Development Kit |
| **SSR** | Server-Side Rendering |
| **WebSocket** | Protocolo de comunicación bidireccional |

---

## Anexos

### A. Comandos Útiles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run build            # Build de producción
npm run preview          # Preview del build
npm run lint             # Ejecutar ESLint

# Base de datos
npx supabase db diff     # Ver diferencias de schema
npx supabase db push     # Aplicar migraciones
npx supabase gen types   # Generar tipos TypeScript
```

### B. URLs Importantes

| Servicio | URL |
|----------|-----|
| **Supabase Dashboard** | https://supabase.com/dashboard/project/tgrfsuewkayqrobdfesa |
| **Cloudinary Dashboard** | https://cloudinary.com/console |
| **Lovable Dashboard** | https://lovable.dev/projects |
| **OpenStreetMap** | https://www.openstreetmap.org |

### C. Recursos de Documentación

- [React Documentation](https://react.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [TanStack Query](https://tanstack.com/query)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [Cloudinary Documentation](https://cloudinary.com/documentation)

---

## Historial de Cambios

| Versión | Fecha | Descripción |
|---------|-------|-------------|
| 1.0.0 | Enero 2026 | Versión inicial del manual |

---

*Documento generado para UniAlerta UCE*
*Última actualización: Enero 2026*
