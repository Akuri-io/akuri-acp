# Control de Versiones: Akuri ACP

## [0.0.2] - 2025-11-26
### Added
- **Pipeline de Ingesta**: Nuevo módulo `IngestionModule` para normalización de documentos.
- **Soporte PDF**: Integración de `pdf-parse` para extracción de texto automática.
- **Generación Markdown**: Conversión automática de documentos a `.md` con Frontmatter estandarizado.
- **Búsqueda Jerárquica**: Implementación de boosting en `LibrarianService` (Proyecto > Workspace > General).
- **Configuración Dinámica**: Soporte para `AKURI_ALLOWED_EXTS` en variables de entorno.

### Changed
- **Schema Orama**: Actualizado para incluir `source_type`, `summary` y `tags`.
- **File Watcher**: Migrado a `DocumentIngestorService` para soportar múltiples formatos.

---

## [0.0.1] - 2025-11-20
### Initial Release
- Configuración base de NestJS.
- Integración básica con OramaDB (búsqueda en memoria).
- Indexación de archivos Markdown simples.
- Servicio de configuración (`ConfigService`) para rutas de documentación.
- Soporte básico para protocolo MCP (stdio).
