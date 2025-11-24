# Akuri ACP - Documentación de la Aplicación

## Descripción General

Akuri ACP (Akuri Context Protocol) es una aplicación de servidor que proporciona acceso contextual a documentación técnica a través del protocolo MCP (Model Context Protocol). La aplicación está diseñada para indexar y buscar información en múltiples fuentes de documentación, facilitando el acceso a conocimientos técnicos de manera estructurada.

## Arquitectura

La aplicación consta de dos componentes principales:

### Backend (NestJS)
- **Framework**: NestJS con TypeScript
- **Ubicación**: `akuri-acp/`
- **Funcionalidad**:
  - API REST para gestión de configuración
  - Servicio MCP para integración con sistemas externos
  - Indexación automática de documentos
  - Gestión de rutas de documentación

### Frontend (Angular)
- **Framework**: Angular con TypeScript
- **Ubicación**: `akuri-acp-angular/`
- **Funcionalidad**:
  - Interfaz web para configuración
  - Gestión visual de rutas de documentación
  - Comunicación con el backend vía HTTP

## Modos de Operación

### Modo HTTP (Desarrollo/Configuración)
- Puerto: 3001 (configurable)
- Interfaz web disponible en `http://localhost:3001`
- Permite gestión visual de la configuración

### Modo MCP (Producción)
- Comunicación vía stdio (entrada/salida estándar)
- Integración con sistemas que soportan MCP
- Sin servidor HTTP expuesto

## Configuración

### Variables de Entorno (.env)
```env
# Rutas de documentación (separadas por coma)
AKURI_DOCS_PATH=/ruta/a/docs1,/ruta/a/docs2

# Configuración del servidor
PORT=3001
MCP_MODE=false
```

### Rutas de Documentación
- **Documentación Interna**: `akuri-acp/akuri-acp-documents/` (hardcoded)
- **Documentación Externa**: Configurable vía `AKURI_DOCS_PATH`
- **Formatos Soportados**: `.md`, `.txt`, `.markdown`, `.rst`, `.adoc`

## API Endpoints

### Gestión de Configuración
- `GET /config/status` - Estado general de la configuración
- `GET /config/paths` - Lista de rutas configuradas
- `POST /config/paths` - Agregar nueva ruta
- `DELETE /config/paths/:path` - Eliminar ruta
- `POST /config/paths/bulk` - Actualizar todas las rutas
- `POST /config/test-path` - Validar ruta

## Funcionalidades Clave

### Indexación de Documentos
- Búsqueda recursiva en directorios
- Conteo automático de documentos
- Validación de rutas y permisos
- Actualización en tiempo real

### Gestión de Configuración
- Persistencia en archivo `.env`
- Validación de rutas existentes
- Soporte para múltiples directorios
- API REST completa

### Integración MCP
- Protocolo estandarizado para contexto
- Comunicación bidireccional
- Compatibilidad con herramientas MCP

## Estructura del Proyecto

```
akuri-acp/
├── akuri-acp-documents/     # Documentación interna (hardcoded)
├── src/
│   ├── akuri-core/
│   │   └── config/          # Servicio de configuración
│   ├── config.controller.ts # Controlador REST
│   └── main.ts             # Punto de entrada
├── .env                     # Configuración
└── package.json

akuri-acp-angular/
├── src/
│   └── app/
│       └── services/
│           └── config.ts    # Servicio Angular
└── package.json
```

## Inicio de la Aplicación

### Backend
```bash
cd akuri-acp
npm install
npm run start:dev  # Modo desarrollo
npm run build && npm run start:prod  # Modo producción
```

### Frontend
```bash
cd akuri-acp-angular
npm install
ng serve  # Modo desarrollo
ng build  # Construcción para producción
```

## Consideraciones Técnicas

- **Lenguaje**: TypeScript obligatorio
- **Comunicación**: Español para usuarios, inglés para código
- **Arquitectura**: Modular con inyección de dependencias
- **Persistencia**: Archivo `.env` para configuración
- **Validación**: Verificación de rutas y permisos
- **Logging**: Sistema de logs integrado

## Documentación Relacionada

- `.AKURI/akuri-guidelines/` - Guías de desarrollo Akuri
- `DOCS-EXTRA/` - Documentación adicional
- `nestjs-best-practices/` - Mejores prácticas NestJS

---

**Nota**: Esta documentación es parte integral de la aplicación y se incluye automáticamente en el índice de búsqueda.