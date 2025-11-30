# Análisis de Endpoints y Funcionalidades - Akuri ACP

## Resumen Ejecutivo

La aplicación Akuri ACP es un servidor MCP (Model Context Protocol) construido con NestJS que proporciona funcionalidades de búsqueda inteligente de documentos, validación de workflows y generación de blueprints. Sin embargo, presenta varios endpoints "no limpios" que causan confusión y duplicación de funcionalidades.

## Endpoints Analizados

### 1. Endpoints Básicos
- **GET /**: Retorna un mensaje simple "Hello". **Problema**: Endpoint raíz sin utilidad práctica, solo para testing básico.
- **GET /health**: Health check básico con validación de memoria, filesystem y base de datos.
- **GET /health/detailed**: Health check detallado con métricas adicionales.

### 2. Endpoints de Administración (HTML Static)
- **GET /admin**: Sirve `index.html` del dashboard admin.
- **GET /admin/extensions**: Sirve `extensions.html`.
- **GET /admin/install**: Sirve `install.html`.
- **GET /admin/paths**: Sirve `paths.html`.
- **GET /admin/config**: Sirve `config.html`.

**Problema**: Estos endpoints sirven HTML estático en lugar de proporcionar APIs REST. Mezcla responsabilidades entre backend API y frontend serving.

### 3. Endpoints de Paths Management (API REST)
- **GET /paths**: Lista todos los paths (env y dinámicos).
- **POST /paths**: Crea nuevo path dinámico.
- **PATCH /paths/:id**: Actualiza path existente.
- **DELETE /paths/:id**: Elimina path.
- **POST /paths/validate**: Valida un path.
- **POST /paths/search**: Busca documentos usando LibrarianService.

**Problema**: El endpoint `/paths/search` duplica funcionalidad MCP (`akuri_search_docs`).

### 4. Endpoints MCP (Server-Sent Events)
- **GET /mcp/sse**: Conexión SSE básica.
- **GET /mcp/sse-connect**: Conexión SSE con manejo de sesiones.
- **POST /mcp/messages**: Maneja mensajes MCP con sessionId.

**Problema Grave**: Código confuso y problemático en `McpController`. Manejo de sesiones SSE implementado de forma compleja e ineficiente, con código comentado y lógica duplicada entre `/mcp/sse` y `/mcp/sse-connect`.

## Funcionalidades MCP

### Herramientas Disponibles
1. **akuri_search_docs**: Búsqueda inteligente de documentos usando Orama DB.
2. **akuri_check_workflow**: Validación de workflows según metodología Akuri.
3. **akuri_generate_blueprint**: Generación de prompts basados en templates.

### Problemas Identificados
- **Duplicación**: `/paths/search` replica `akuri_search_docs`.
- **Consistencia**: Algunos endpoints REST no siguen el patrón MCP.
- **Manejo de Errores**: Inconsistente entre endpoints REST y MCP tools.

## Problemas de Diseño "No Limpios"

### 1. Mezcla de Responsabilidades
- Endpoints admin sirven HTML en lugar de APIs.
- Controller maneja tanto lógica de negocio como serving de archivos estáticos.

### 2. Duplicación de Funcionalidades
- Búsqueda disponible tanto vía REST (`/paths/search`) como MCP (`akuri_search_docs`).
- Dos implementaciones SSE diferentes en McpController.

### 3. Código Problemático
```typescript
// En McpController - Código confuso con comentarios largos explicando problemas
const sessionId = req.query.sessionId as string;
if (!sessionId) {
  return res.status(400).send('Session ID required');
}
```

### 4. Inconsistencias en Responses
- Algunos endpoints usan estructura `{success: true, data: ..., message: ...}`.
- Otros endpoints MCP retornan directamente el contenido.
- Health checks tienen formato diferente.

## Recomendaciones

### 1. Limpiar Endpoints Admin
- Convertir a APIs REST que retornen datos JSON.
- Separar serving de HTML al frontend.

### 2. Eliminar Duplicaciones
- Remover `/paths/search` y usar solo MCP tools.
- Unificar implementación SSE en McpController.

### 3. Estandarizar Responses
- Implementar un response interceptor para formato consistente.
- Usar DTOs uniformes para todas las respuestas.

### 4. Refactorizar McpController
- Simplificar manejo de sesiones SSE.
- Remover código comentado y dead code.
- Mejorar manejo de errores.

### 5. Separar Concerns
- Crear un módulo dedicado para serving de archivos estáticos.
- Mantener APIs REST puras para datos.
- Reservar MCP para herramientas de IA.

## Plan de Refactorización

### Fase 1: Eliminación de Duplicaciones (Prioridad Alta)
1. **Eliminar `/paths/search` endpoint**
   - Remover el método `searchDocs` del `PathsController`
   - Actualizar documentación Swagger
   - Verificar que no se use en frontend

2. **Unificar búsqueda solo vía MCP**
   - Documentar que `akuri_search_docs` es la única forma de búsqueda
   - Actualizar README.md con ejemplos de uso MCP

### Fase 2: Limpieza de McpController (Prioridad Alta)
1. **Simplificar manejo SSE**
   - Eliminar endpoint `/mcp/sse` problemático
   - Mantener solo `/mcp/sse-connect` con manejo de sesiones limpio
   - Remover código comentado y explicaciones largas

2. **Mejorar manejo de sesiones**
   - Implementar limpieza automática de sesiones expiradas
   - Agregar logging apropiado para debugging

### Fase 3: Convertir Endpoints Admin (Prioridad Media)
1. **Crear APIs REST para admin**
   - `GET /api/admin/stats` - Estadísticas del sistema
   - `GET /api/admin/extensions` - Lista de extensiones disponibles
   - `GET /api/admin/config` - Configuración actual
   - `POST /api/admin/config` - Actualizar configuración

2. **Mantener serving de HTML separado**
   - Crear módulo `StaticModule` para servir archivos HTML
   - Mantener endpoints `/admin/*` para compatibilidad

### Fase 4: Estandarización de Responses (Prioridad Media)
1. **Crear Response Interceptor**
   - Implementar `ResponseInterceptor` global
   - Formato estándar: `{success: boolean, data?: any, message?: string, timestamp: string}`

2. **Actualizar DTOs**
   - Crear `BaseResponseDto` para consistencia
   - Actualizar todos los controllers para usar el formato estándar

### Fase 5: Limpieza General (Prioridad Baja)
1. **Endpoint raíz**
   - Cambiar `GET /` para retornar información básica del sistema
   - O redirigir a `/admin` si hay frontend

2. **Código comentado**
   - Remover todos los comentarios largos explicando problemas
   - Limpiar imports no utilizados
   - Optimizar métodos

### Fase 6: Testing y Documentación (Prioridad Alta)
1. **Actualizar tests**
   - Modificar tests que usen endpoints eliminados
   - Agregar tests para nuevos endpoints REST admin

2. **Documentación**
   - Actualizar README.md con nueva estructura de endpoints
   - Crear documentación API con Swagger
   - Documentar flujo MCP vs REST

### Riesgos y Consideraciones
- **Compatibilidad**: Verificar que cambios no rompan integraciones existentes
- **Frontend**: Asegurar que frontend siga funcionando con nuevos endpoints
- **MCP Tools**: No modificar herramientas MCP existentes
- **Testing**: Ejecutar suite completa antes de deploy

### Timeline Estimado
- Fase 1: 2-3 horas
- Fase 2: 4-5 horas
- Fase 3: 6-8 horas
- Fase 4: 3-4 horas
- Fase 5: 1-2 horas
- Fase 6: 4-6 horas

**Total estimado: 20-28 horas de desarrollo**

## Conclusión

La aplicación tiene una base sólida con funcionalidades MCP bien implementadas, pero presenta endpoints "no limpios" que causan confusión y duplicación. La limpieza de estos endpoints mejoraría la mantenibilidad y claridad de la arquitectura.