---
trigger: on_demand
description: "Plan de implementación detallado para las capacidades contextuales en akuri-acp, basado en el diseño arquitectónico aprobado."
status: active
version: 1.0.0
last_updated: "2025-11-26"
author: "Akuri Agent"
use_case: [PLAN]
tags: [plan, implementation, mcp, context-aware]
---

# [PLAN] Implementación de Arquitectura Contextual

## Referencia al Diseño
**Documento DESIGN**: `.akuri/akuri-work/[DESIGN].context-aware-architecture.md`

## Resumen del Plan
Este plan detalla los pasos para implementar la normalización de documentos (PDF -> MD) y la búsqueda jerárquica en `akuri-acp`. Se creará un nuevo módulo de ingesta y se refactorizará el servicio `Librarian`.

## Dependencias Previas

### Packages a Instalar
```bash
npm install pdf-parse
npm install --save-dev @types/pdf-parse
```

## Tareas de Implementación

### Fase 1: Pipeline de Ingesta (Normalización)

#### Tarea 1.1: Crear Módulo de Ingesta
**Descripción**: Crear `IngestionModule` y `DocumentIngestorService`.
**Archivos**:
- `src/akuri-core/ingestion/ingestion.module.ts` (crear)
- `src/akuri-core/ingestion/document-ingestor.service.ts` (crear)

**Comandos**:
```bash
nest generate module akuri-core/ingestion
nest generate service akuri-core/ingestion/document-ingestor
```

**Criterios de Aceptación**:
- [ ] Módulo creado e importado en `AkuriCoreModule`.
- [ ] Servicio inyectable y funcional.

**Estimación**: Baja

---

#### Tarea 1.2: Implementar Parsers (PDF y MD)
**Descripción**: Implementar lógica para leer PDF y generar Markdown estandarizado.
**Archivos**:
- `src/akuri-core/ingestion/parsers/pdf.parser.ts` (crear)
- `src/akuri-core/ingestion/generators/markdown.generator.ts` (crear)

**Criterios de Aceptación**:
- [ ] `PdfParser` extrae texto correctamente de un PDF de prueba.
- [ ] `MarkdownGenerator` crea un archivo `.md` con Frontmatter válido.

**Estimación**: Media

---

#### Tarea 1.3: Integrar FileWatcher
**Descripción**: Configurar `chokidar` para detectar nuevos archivos en las rutas configuradas y disparar la ingesta.
**Archivos**:
- `src/akuri-core/ingestion/document-ingestor.service.ts` (modificar)

**Criterios de Aceptación**:
- [ ] Al agregar un PDF a una carpeta vigilada, se genera automáticamente su versión `.md`.

**Estimación**: Media

---

### Fase 2: Motor de Búsqueda Jerárquico

#### Tarea 2.1: Actualizar Schema Orama
**Descripción**: Modificar el esquema de la base de datos en memoria para incluir `source_type`, `summary` y `tags`.
**Archivos**:
- `src/akuri-core/librarian/librarian.service.ts` (modificar)

**Criterios de Aceptación**:
- [ ] El esquema incluye los nuevos campos.
- [ ] La indexación lee estos campos del Frontmatter del archivo `.md`.

**Estimación**: Baja

---

#### Tarea 2.2: Implementar Búsqueda con Boosting
**Descripción**: Modificar la lógica de búsqueda para aplicar pesos según el origen del documento.
**Archivos**:
- `src/akuri-core/librarian/librarian.service.ts` (modificar)

**Criterios de Aceptación**:
- [ ] Documentos del "Proyecto actual" aparecen primero que los "Generales" para la misma query.

**Estimación**: Media

---

### Fase 3: Configuración y Limpieza

#### Tarea 3.1: Actualizar ConfigService
**Descripción**: Permitir configurar extensiones permitidas y pesos de búsqueda.
**Archivos**:
- `src/akuri-core/config/config.service.ts` (modificar)

**Criterios de Aceptación**:
- [ ] Se pueden definir extensiones en `.env` (ej: `AKURI_ALLOWED_EXTS=.pdf,.docx`).

**Estimación**: Baja

## Orden de Ejecución

```
Tarea 1.1 (Módulo Ingesta)
    ↓
Tarea 1.2 (Parsers)
    ↓
Tarea 1.3 (Watcher)
    ↓
Tarea 3.1 (Configuración - necesaria para probar watcher con extensiones)
    ↓
Tarea 2.1 (Schema Orama)
    ↓
Tarea 2.2 (Búsqueda Boosting)
```

## Plan de Testing

### Tests Unitarios

#### Test Suite 1: PdfParser
**Archivo**: `src/akuri-core/ingestion/parsers/pdf.parser.spec.ts`
**Tests**:
- Debe extraer texto de un PDF válido.
- Debe manejar errores de archivo corrupto.

#### Test Suite 2: LibrarianService (Search)
**Archivo**: `src/akuri-core/librarian/librarian.service.spec.ts`
**Tests**:
- Debe retornar resultados ordenados por score (boosting).
- Debe filtrar correctamente por tags.

### Tests de Integración

#### Test Suite 3: Flujo Completo (PDF -> MD -> Search)
**Archivo**: `test/ingestion-search.e2e-spec.ts`
**Escenarios**:
1. Colocar `test.pdf` en carpeta vigilada.
2. Esperar generación de `test.md`.
3. Ejecutar búsqueda y verificar que `test.md` aparece en resultados.

## Archivos a Crear/Modificar

### Crear
- [ ] `src/akuri-core/ingestion/ingestion.module.ts`
- [ ] `src/akuri-core/ingestion/document-ingestor.service.ts`
- [ ] `src/akuri-core/ingestion/parsers/pdf.parser.ts`
- [ ] `src/akuri-core/ingestion/generators/markdown.generator.ts`

### Modificar
- [ ] `src/akuri-core/librarian/librarian.service.ts`
- [ ] `src/akuri-core/config/config.service.ts`
- [ ] `src/akuri-core/akuri-core.module.ts`

## Estimación Total
**Complejidad General**: Media
**Tiempo Estimado**: 8-12 horas
**Tareas Totales**: 6 tareas principales

## Próximos Pasos
1. Aprobación de este plan.
2. Ejecución de Fase 1.
