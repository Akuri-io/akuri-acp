---
trigger: on_demand
description: "Auditoría de la capa visual de configuración en akuri-acp, evaluando la interfaz HTML existente y los endpoints de backend."
status: active
version: 1.0.0
last_updated: "2025-11-26"
author: "Akuri Agent"
use_case: [AUDIT]
tags: [audit, ui, configuration, v0.0.3]
---

# [AUDIT] Capa Visual de Configuración - v0.0.3

## 1. Información del Audit

**Fecha**: 2025-11-26
**Auditor**: Akuri Agent
**Alcance**: Interfaz de configuración (`public/index.html`) y endpoints de backend (`admin.controller.ts`, `config.controller.ts`).
**Objetivo**: Evaluar la viabilidad y calidad de la capa visual para gestión de configuración del sistema.

## 2. Resumen Ejecutivo

**Estado de Implementación**: 🟡 Parcialmente Funcional

Existe una interfaz HTML básica (`public/index.html`) y dos controladores de backend (`AdminController` y `ConfigController`) que proporcionan funcionalidad de configuración. Sin embargo, hay **inconsistencias en las rutas** y **falta de integración completa**.

**Hallazgos Principales**:
1. **Desalineación de Rutas**: El frontend apunta a `/api/admin/*` pero existe también `/config/*`.
2. **UI Básica**: La interfaz es funcional pero muy simple (HTML + CSS inline).
3. **Falta de Validación Visual**: No hay feedback visual robusto para errores de validación.
4. **No Integrado con Nuevas Funcionalidades**: La UI no refleja las capacidades de la v0.0.2 (ingesta PDF, boosting).

## 3. Análisis Detallado

### 3.1. Frontend (`public/index.html`)

**Funcionalidad Actual**:
- Carga de rutas de documentación desde `/api/admin/config`.
- Agregar/eliminar rutas dinámicamente.
- Guardar configuración (POST a `/api/admin/config`).
- Reindexar documentos (POST a `/api/admin/reindex`).

**Fortalezas**:
- ✅ Interfaz simple y directa.
- ✅ Sin dependencias externas (vanilla JS).
- ✅ Feedback básico de éxito/error.

**Debilidades**:
- ❌ **Estética Pobre**: CSS inline, sin diseño moderno.
- ❌ **Sin Validación en Tiempo Real**: No valida rutas antes de guardar.
- ❌ **No Muestra Estado Detallado**: No indica cuántos documentos hay por ruta, si la ruta es válida, etc.
- ❌ **No Configura Nuevas Funcionalidades**: No permite configurar `AKURI_ALLOWED_EXTS`, pesos de boosting, etc.

### 3.2. Backend - `AdminController`

**Ruta Base**: `/api/admin`

**Endpoints**:
- `GET /api/admin/config`: Retorna rutas actuales.
- `POST /api/admin/config`: Actualiza rutas (llama a `LibrarianService.updatePaths`).
- `POST /api/admin/reindex`: Dispara reindexación.

**Fortalezas**:
- ✅ Implementación simple y directa.
- ✅ Manejo básico de errores.

**Debilidades**:
- ❌ **Acoplamiento Directo**: Usa `LibrarianService` directamente en lugar de `AkuriConfigService`.
- ❌ **Sin Validación**: No valida rutas antes de actualizar.
- ❌ **Respuestas Inconsistentes**: Retorna objetos planos en lugar de DTOs estandarizados.

### 3.3. Backend - `ConfigController`

**Ruta Base**: `/config`

**Endpoints**:
- `GET /config/status`: Estado completo de configuración.
- `GET /config/paths`: Lista de rutas.
- `POST /config/paths`: Agregar ruta (con validación).
- `DELETE /config/paths/:path`: Eliminar ruta.
- `POST /config/test-path`: Validar ruta.
- `POST /config/paths/bulk`: Actualización masiva.

**Fortalezas**:
- ✅ **API Completa**: Cubre todos los casos de uso.
- ✅ **Validación Robusta**: Usa `AkuriConfigService.testPath`.
- ✅ **Logging Detallado**: Registra todas las operaciones.
- ✅ **Manejo de Errores HTTP**: Usa excepciones estándar de NestJS.

**Debilidades**:
- ❌ **No Usado por el Frontend**: El HTML apunta a `/api/admin`, no a `/config`.
- ❌ **Falta Endpoint de Reindexación**: No tiene equivalente a `/api/admin/reindex`.

## 4. Inconsistencias Identificadas

| Aspecto | AdminController | ConfigController | Recomendación |
|---------|----------------|------------------|---------------|
| **Ruta Base** | `/api/admin` | `/config` | Unificar en `/api/config` |
| **Validación** | ❌ No | ✅ Sí | Usar solo ConfigController |
| **Servicio Usado** | LibrarianService | AkuriConfigService | Usar AkuriConfigService |
| **Reindexación** | ✅ Sí | ❌ No | Agregar a ConfigController |

## 5. Recomendaciones para v0.0.3

### 5.1. Consolidar Backend
**Acción**: Deprecar `AdminController` y migrar funcionalidad a `ConfigController`.
- Mover endpoint de reindexación a `/config/reindex`.
- Actualizar `public/index.html` para usar rutas `/config/*`.

### 5.2. Mejorar Interfaz Visual
**Acción**: Rediseñar `index.html` con:
- **Framework CSS Moderno**: Usar TailwindCSS o similar (vía CDN).
- **Validación en Tiempo Real**: Llamar a `/config/test-path` antes de guardar.
- **Estado Detallado**: Mostrar tabla con:
  - Ruta
  - Estado (✅ Válida / ❌ Inválida)
  - Documentos encontrados
  - Última indexación
- **Configuración Avanzada**:
  - Campo para `AKURI_ALLOWED_EXTS`.
  - Selector de pesos de boosting (Proyecto, Workspace, General).

### 5.3. Agregar Nuevas Funcionalidades
**Acción**: Exponer configuración de la v0.0.2 en la UI:
- **Extensiones Permitidas**: Input para `AKURI_ALLOWED_EXTS`.
- **Visualización de Ingesta**: Mostrar archivos PDF detectados y su estado de conversión.
- **Métricas de Búsqueda**: Dashboard con estadísticas de búsqueda (queries, tiempos, hits).

## 6. Plan de Implementación Sugerido

1. **Refactor Backend**: Consolidar en `ConfigController`.
2. **Rediseño UI**: Crear interfaz moderna con validación.
3. **Integración**: Conectar UI con nuevas capacidades (ingesta, boosting).
4. **Testing**: Verificar flujo completo de configuración.

## 7. Conclusión

La capa visual actual es un **prototipo funcional** pero requiere mejoras significativas para ser una herramienta de administración robusta. La v0.0.3 debe enfocarse en consolidar el backend, modernizar la UI y exponer las nuevas capacidades del sistema.

**Prioridad**: Media-Alta (necesaria para facilitar la adopción del sistema).
