---
trigger: on_demand
description: "Auditoría contextual de akuri-acp enfocada en su uso como herramienta MCP local para soporte de IA."
status: active
version: 1.0.0
last_updated: "2025-11-26"
author: "Akuri Agent"
use_case: [AUDIT, PLAN]
tags: [audit, mcp, context-aware, local-dev]
---

# [AUDIT] Auditoría Contextual: Akuri ACP como Herramienta MCP Local

## 1. Información del Audit

**Fecha**: 2025-11-26
**Auditor**: Akuri Agent
**Alcance**: `akuri-core` (Librarian, Config), lógica de búsqueda y manejo de archivos.
**Objetivo**: Evaluar la capacidad del sistema para operar como una herramienta MCP local, flexible y jerárquica.

## 2. Resumen Ejecutivo

**Estado de Adecuación**: 🔴 Requiere Mejoras Significativas

El sistema actual funciona correctamente como un indexador básico de Markdown, pero **no cumple** con los requisitos avanzados de una herramienta de contexto jerárquica y multi-formato. La arquitectura actual es plana y rígida en cuanto a tipos de archivos.

**Brechas Principales**:
1. **Búsqueda Plana**: No existe priorización jerárquica (Local > General > Workspace).
2. **Soporte de Archivos Limitado**: Solo soporta `.md` (hardcoded en indexador), sin soporte PDF.
3. **Falta de Filtrado Semántico**: No utiliza los resúmenes de documentos para descarte inteligente.

## 3. Evaluación de Requisitos Específicos

### 3.1. Entorno Local y Adaptabilidad
- **Requisito**: Diseñado para correr en local, código accesible, adaptable.
- **Estado**: 🟢 **Cumple**.
- **Análisis**: La arquitectura NestJS modular y el uso de `.env` facilitan la adaptación. El código es claro y modificable.

### 3.2. Gestión de Documentos (Markdown y PDF)
- **Requisito**: Debe soportar Markdown y PDF (configurable).
- **Estado**: 🔴 **No Cumple**.
- **Hallazgo**:
    - `LibrarianService` tiene hardcoded la extensión `.md` en la línea 141: `if (!filePath.endsWith('.md')) return;`.
    - `ConfigService` lista otras extensiones pero no se usan en el indexado real.
    - No hay lógica de extracción de texto para PDFs.

### 3.3. Estructura de Carpetas (Interna vs Externa)
- **Requisito**: Carpeta base interna + carpetas externas.
- **Estado**: 🟡 **Parcial**.
- **Análisis**: `ConfigService` maneja bien la distinción entre `akuri-acp-documents` (interno) y `AKURI_DOCS_PATH` (externo). Sin embargo, esta distinción no se aprovecha en la lógica de búsqueda.

### 3.4. Búsqueda Jerárquica
- **Requisito**: Orden de prioridad: Local -> General -> Workspace -> Proyecto.
- **Estado**: 🔴 **No Cumple**.
- **Hallazgo**: `LibrarianService` utiliza una única instancia de Orama DB para todos los documentos. La búsqueda es global y basada puramente en scoring de texto (TF-IDF/BM25 implícito en Orama), sin ponderación por ubicación o jerarquía.

### 3.5. Filtrado por Relevancia (Resumen Inicial)
- **Requisito**: Usar sección inicial de resumen para descartar documentos.
- **Estado**: 🔴 **No Cumple**.
- **Hallazgo**: El sistema indexa el contenido completo (`content`). No hay lógica para parsear una sección de "Resumen" específica ni para usarla como primer filtro de triaje antes de una búsqueda profunda.

## 4. Recomendaciones Técnicas

### 4.1. Implementar Soporte Multi-Formato
**Acción**: Refactorizar `LibrarianService` para usar una estrategia de `DocumentLoader`.
- Crear interfaz `DocumentLoader` con implementaciones `MarkdownLoader` y `PdfLoader`.
- Usar librería como `pdf-parse` para extracción de texto.
- Hacer configurables las extensiones permitidas en `ConfigService`.

### 4.2. Implementar Búsqueda Jerárquica (Weighted Search)
**Acción**: Modificar el esquema de Orama y la lógica de búsqueda.
- Agregar campo `source_type` (internal, external, workspace, project) al esquema.
- En la búsqueda, aplicar `boost` (peso) según el origen:
    - Proyecto actual: Boost x2.0
    - Workspace: Boost x1.5
    - Documentación General: Boost x1.0
    - Interna: Boost x0.8 (o según preferencia)

### 4.3. Implementar "Smart Triage"
**Acción**: Mejorar el pre-procesamiento de documentos.
- Al indexar, extraer los primeros N caracteres o el primer párrafo como `summary`.
- Implementar una fase de búsqueda en dos pasos:
    1. **Triage**: Buscar solo en `summary` y `tags` para filtrar candidatos.
    2. **Deep Search**: Buscar en `content` solo en los documentos candidatos (o darles prioridad visual).

## 5. Plan de Implementación Sugerido

1. **Refactor de Librarian**: Extraer lógica de lectura de archivos a `FileProcessor`.
2. **Soporte PDF**: Integrar parser de PDF.
3. **Mejora de Schema**: Actualizar esquema Orama con `source_type` y `summary`.
4. **Lógica de Búsqueda**: Implementar boosting por jerarquía.

## 6. Conclusión

Para que `akuri-acp` cumpla su propósito como asistente de contexto avanzado, es necesario evolucionar de un "buscador de archivos Markdown" a un "motor de contexto jerárquico". La base actual es sólida, pero la lógica de negocio del `LibrarianService` debe ser reescrita para soportar estas capacidades avanzadas.
