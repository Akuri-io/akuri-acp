---
trigger: always_on
description: "Documento de seguimiento (TRACKER) para monitorear el progreso de la implementación de capacidades contextuales en akuri-acp."
status: active
version: 1.0.0
last_updated: "2025-11-26"
author: "Akuri Agent"
use_case: [BUILD, TRACKING]
tags: [tracker, implementation, progress, mcp]
---

# [TRACKER] Implementación Contextual Akuri ACP

Este documento rastrea el progreso detallado de la implementación basada en `[PLAN].implement-context-aware-mcp.md`.

## Estado General
**Progreso**: 0%
**Fase Actual**: Preparación
**Inicio**: 2025-11-26

---

## Fase 1: Pipeline de Ingesta (Normalización)

### Tarea 1.1: Crear Módulo de Ingesta
- [x] **Generar Módulo**: `nest generate module akuri-core/ingestion`
- [x] **Generar Servicio**: `nest generate service akuri-core/ingestion/document-ingestor`
- [x] **Verificación**: El módulo compila y el servicio es inyectable.

### Tarea 1.2: Implementar Parsers (PDF y MD)
- [x] **Instalar Dependencias**: `npm install pdf-parse`
- [x] **Crear PdfParser**: `src/akuri-core/ingestion/parsers/pdf.parser.ts`
- [x] **Crear MarkdownGenerator**: `src/akuri-core/ingestion/generators/markdown.generator.ts`
- [x] **Test Unitario**: Verificar extracción de texto PDF.

### Tarea 1.3: Integrar FileWatcher
- [x] **Configurar Chokidar**: En `DocumentIngestorService`.
- [x] **Conectar Eventos**: `add` y `change` disparan normalización.
- [x] **Test Integración**: Archivo PDF en carpeta -> Archivo MD generado.

---

## Fase 2: Motor de Búsqueda Jerárquico

### Tarea 2.1: Actualizar Schema Orama
- [x] **Modificar Schema**: Agregar `source_type`, `summary`, `tags` en `LibrarianService`.
- [x] **Actualizar Indexador**: Leer metadata del Frontmatter.

### Tarea 2.2: Implementar Búsqueda con Boosting
- [x] **Implementar Lógica**: Aplicar pesos según `source_type`.
- [x] **Test Búsqueda**: Verificar ordenamiento por relevancia contextual.

---

## Fase 3: Configuración y Limpieza

### Tarea 3.1: Actualizar ConfigService
- [x] **Configurar Extensiones**: Leer `AKURI_ALLOWED_EXTS` de `.env`.
- [x] **Validar Rutas**: Asegurar que el watcher respeta la configuración.

---

## Registro de Cambios y Notas
- **2025-11-26**: Creación del documento TRACKER.
- **2025-11-26**: Completada Fase 1 (Ingesta).
- **2025-11-26**: Completada Fase 2 (Búsqueda).
- **2025-11-26**: Completada Fase 3 (Configuración).
- **Estado Final**: Implementación completada al 100%.
