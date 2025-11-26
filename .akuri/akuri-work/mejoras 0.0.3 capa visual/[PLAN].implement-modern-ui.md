---
trigger: on_demand
description: "Plan de implementación por fases de la interfaz visual moderna de configuración para akuri-acp, basado en el diseño con Tailwind CSS 4."
status: active
version: 1.0.0
last_updated: "2025-11-26"
author: "Akuri Agent"
use_case: [PLAN]
tags: [plan, implementation, ui, tailwind, v0.0.3]
---

# [PLAN] Implementación de Interfaz Visual Moderna - v0.0.3

## Referencia al Diseño
**Documento DESIGN**: `.akuri/akuri-work/mejoras 0.0.3 capa visual/[DESIGN].modern-ui-configuration.md`

## Resumen del Plan
Este plan detalla la implementación por fases de la nueva interfaz de configuración, consolidando el backend en `ConfigController` y creando una UI moderna con Tailwind CSS 4.

## Dependencias Previas

### Ninguna instalación necesaria
- Tailwind CSS 4 se cargará vía CDN
- Vanilla JavaScript (sin dependencias)

## Tareas de Implementación

---

### Fase 1: Consolidación del Backend

#### Tarea 1.1: Agregar Endpoints Faltantes en ConfigController
**Descripción**: Implementar endpoints necesarios para la nueva UI.
**Archivos**:
- `src/config.controller.ts` (modificar)

**Endpoints a Agregar**:
```typescript
// GET /config/extensions - Obtener extensiones permitidas
// POST /config/extensions - Actualizar extensiones
// GET /config/metrics - Obtener métricas de búsqueda
// POST /config/boost-weights - Configurar pesos de boosting
// POST /config/reindex - Disparar reindexación
```

**Criterios de Aceptación**:
- [ ] Endpoint `/config/extensions` (GET y POST) implementado
- [ ] Endpoint `/config/metrics` implementado
- [ ] Endpoint `/config/boost-weights` implementado
- [ ] Endpoint `/config/reindex` implementado
- [ ] Todos los endpoints tienen validación y logging

**Estimación**: Media

---

#### Tarea 1.2: Deprecar AdminController
**Descripción**: Marcar `AdminController` como deprecated y actualizar referencias.
**Archivos**:
- `src/admin.controller.ts` (modificar - agregar @deprecated)
- `src/app.module.ts` (modificar - comentar importación)

**Criterios de Aceptación**:
- [ ] AdminController marcado como @deprecated
- [ ] Documentación actualizada indicando usar ConfigController

**Estimación**: Baja

---

### Fase 2: Estructura HTML Base con Tailwind

#### Tarea 2.1: Crear Nueva Estructura HTML
**Descripción**: Reemplazar `public/index.html` con estructura moderna usando Tailwind CSS 4.
**Archivos**:
- `public/index.html` (reemplazar)

**Estructura a Implementar**:
```html
<!DOCTYPE html>
<html lang="es" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Akuri ACP - Configuration</title>
  <script src="https://cdn.tailwindcss.com?plugins=forms"></script>
</head>
<body class="bg-gray-900 text-gray-100">
  <!-- Header -->
  <!-- Tab Navigation -->
  <!-- Content Area -->
  <!-- Scripts -->
</body>
</html>
```

**Criterios de Aceptación**:
- [ ] HTML válido y semántico
- [ ] Tailwind CSS 4 cargado vía CDN
- [ ] Modo oscuro por defecto
- [ ] Estructura de tabs implementada

**Estimación**: Media

---

#### Tarea 2.2: Implementar Sistema de Tabs
**Descripción**: Crear navegación por tabs con vanilla JavaScript.
**Archivos**:
- `public/index.html` (modificar - agregar script)

**Funcionalidad**:
- Tabs: Rutas | Extensiones | Métricas | Logs
- Cambio de contenido sin recargar página
- Estado activo visual

**Criterios de Aceptación**:
- [ ] Navegación entre tabs funcional
- [ ] Solo un tab visible a la vez
- [ ] Indicador visual de tab activo

**Estimación**: Baja

---

### Fase 3: Tab de Gestión de Rutas

#### Tarea 3.1: Implementar Tabla de Rutas
**Descripción**: Crear tabla dinámica que muestre rutas configuradas.
**Archivos**:
- `public/index.html` (modificar)

**Componentes**:
- Tabla con columnas: Ruta | Estado | Documentos | Acciones
- Iconos de estado (✅ ⚠️ ❌)
- Botones de acción (Editar, Eliminar)

**Criterios de Aceptación**:
- [ ] Tabla se carga desde `/config/paths`
- [ ] Estados visuales correctos
- [ ] Botones de acción funcionales

**Estimación**: Media

---

#### Tarea 3.2: Implementar Formulario de Agregar Ruta
**Descripción**: Crear formulario con validación en tiempo real.
**Archivos**:
- `public/index.html` (modificar)

**Funcionalidad**:
- Input de texto
- Botón "Validar" (llama a `/config/test-path`)
- Feedback visual (✅ válida / ❌ inválida)
- Botón "Agregar" habilitado solo si válida

**Criterios de Aceptación**:
- [ ] Validación en tiempo real funcional
- [ ] Feedback visual claro
- [ ] Agregar ruta solo si es válida

**Estimación**: Media

---

#### Tarea 3.3: Implementar Guardado y Reindexación
**Descripción**: Botones para guardar configuración y reindexar.
**Archivos**:
- `public/index.html` (modificar)

**Funcionalidad**:
- Botón "Guardar Configuración" (POST a `/config/paths/bulk`)
- Botón "Reindexar Todo" (POST a `/config/reindex`)
- Spinner durante operaciones
- Notificaciones de éxito/error

**Criterios de Aceptación**:
- [ ] Guardado funcional
- [ ] Reindexación funcional
- [ ] Feedback visual durante operaciones

**Estimación**: Media

---

### Fase 4: Tab de Configuración de Extensiones

#### Tarea 4.1: Implementar Lista de Extensiones
**Descripción**: Chips editables para extensiones permitidas.
**Archivos**:
- `public/index.html` (modificar)

**Funcionalidad**:
- Cargar extensiones desde `/config/extensions`
- Chips con botón "×" para eliminar
- Botón "+" para agregar nueva extensión
- Guardar cambios en `/config/extensions`

**Criterios de Aceptación**:
- [ ] Extensiones se cargan correctamente
- [ ] Agregar/eliminar extensiones funcional
- [ ] Guardado persistente

**Estimación**: Media

---

#### Tarea 4.2: Implementar Sliders de Pesos de Búsqueda
**Descripción**: Controles para ajustar boosting.
**Archivos**:
- `public/index.html` (modificar)

**Funcionalidad**:
- 4 sliders (Proyecto, Workspace, General, Interno)
- Rangos configurables
- Valores en tiempo real
- Guardar en `/config/boost-weights`

**Criterios de Aceptación**:
- [ ] Sliders funcionales
- [ ] Valores se actualizan en tiempo real
- [ ] Guardado persistente

**Estimación**: Media

---

### Fase 5: Tab de Métricas y Estado

#### Tarea 5.1: Implementar Cards de Resumen
**Descripción**: Dashboard con métricas principales.
**Archivos**:
- `public/index.html` (modificar)

**Componentes**:
- Card: Total Documentos
- Card: Búsquedas Realizadas
- Card: Tiempo Promedio
- Card: Última Indexación

**Datos desde**: `/config/metrics`

**Criterios de Aceptación**:
- [ ] Cards se cargan desde API
- [ ] Diseño visual atractivo
- [ ] Auto-refresh cada 30 segundos

**Estimación**: Baja

---

#### Tarea 5.2: Implementar Tabla de Estado de Ingesta
**Descripción**: Mostrar archivos PDF y su estado de conversión.
**Archivos**:
- `public/index.html` (modificar)

**Funcionalidad**:
- Tabla: Archivo | Estado | Fecha
- Estados: Pendiente | Procesando | Completado | Error

**Datos desde**: `/config/ingestion-status` (nuevo endpoint)

**Criterios de Aceptación**:
- [ ] Tabla muestra archivos PDF
- [ ] Estados visuales claros
- [ ] Actualización periódica

**Estimación**: Media

---

### Fase 6: Mejoras de UX

#### Tarea 6.1: Implementar Sistema de Notificaciones
**Descripción**: Toast notifications para feedback.
**Archivos**:
- `public/index.html` (modificar)

**Funcionalidad**:
- Notificaciones de éxito (verde)
- Notificaciones de error (rojo)
- Auto-dismiss después de 5 segundos

**Criterios de Aceptación**:
- [ ] Notificaciones se muestran correctamente
- [ ] Diseño consistente con Tailwind
- [ ] Auto-dismiss funcional

**Estimación**: Baja

---

#### Tarea 6.2: Implementar Spinners y Estados de Carga
**Descripción**: Feedback visual durante operaciones asíncronas.
**Archivos**:
- `public/index.html` (modificar)

**Funcionalidad**:
- Spinners en botones durante requests
- Deshabilitar botones durante operaciones
- Skeleton loaders para tablas

**Criterios de Aceptación**:
- [ ] Spinners visibles durante operaciones
- [ ] Botones deshabilitados correctamente
- [ ] UX fluida

**Estimación**: Baja

---

## Orden de Ejecución

```
Fase 1: Backend
  ├─ Tarea 1.1: Nuevos Endpoints
  └─ Tarea 1.2: Deprecar AdminController

Fase 2: Estructura Base
  ├─ Tarea 2.1: HTML + Tailwind
  └─ Tarea 2.2: Sistema de Tabs

Fase 3: Tab Rutas
  ├─ Tarea 3.1: Tabla de Rutas
  ├─ Tarea 3.2: Formulario Agregar
  └─ Tarea 3.3: Guardar/Reindexar

Fase 4: Tab Extensiones
  ├─ Tarea 4.1: Lista Extensiones
  └─ Tarea 4.2: Sliders Boosting

Fase 5: Tab Métricas
  ├─ Tarea 5.1: Cards Resumen
  └─ Tarea 5.2: Tabla Ingesta

Fase 6: UX
  ├─ Tarea 6.1: Notificaciones
  └─ Tarea 6.2: Spinners
```

## Archivos a Crear/Modificar

### Modificar
- [ ] `src/config.controller.ts` - Agregar endpoints
- [ ] `src/admin.controller.ts` - Marcar deprecated
- [ ] `public/index.html` - Reemplazar completamente

### Crear (Nuevos Endpoints)
- [ ] Métodos en `ConfigController` para extensiones, métricas, boosting

## Estimación Total
**Complejidad General**: Media-Alta
**Tiempo Estimado**: 12-16 horas
**Tareas Totales**: 12 tareas principales

## Próximos Pasos
1. **Aprobación del plan** por el usuario
2. Ejecutar Fase 1 (Backend)
3. Ejecutar Fase 2 (Estructura)
4. Continuar con fases restantes
