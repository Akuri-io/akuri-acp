# Plan de Refactorización - Endpoints Akuri ACP

## Fase 1: Eliminación de Duplicaciones (Prioridad Alta)

### 1.1 Eliminar `/paths/search` endpoint
- **Acciones:**
  - Remover el método `searchDocs` del `PathsController`
  - Eliminar la ruta `@Post('search')` del controlador
  - Actualizar documentación Swagger eliminando el endpoint
  - Verificar que no se use en frontend (buscar referencias en archivos HTML/JS)

- **Archivos afectados:**
  - `src/paths/paths.controller.ts`
  - `src/paths/dto/search-docs.dto.ts` (si existe)
  - Documentación Swagger

- **Tiempo estimado:** 1 hora

### 1.2 Unificar búsqueda solo vía MCP
- **Acciones:**
  - Documentar que `akuri_search_docs` es la única forma oficial de búsqueda
  - Actualizar README.md con ejemplos de uso MCP
  - Agregar nota en código sobre eliminación del endpoint duplicado

- **Archivos afectados:**
  - `README.md`
  - Comentarios en `src/mcp/mcp.service.ts`

- **Tiempo estimado:** 30 minutos

## Fase 2: Limpieza de McpController (Prioridad Alta)

### 2.1 Simplificar manejo SSE
- **Acciones:**
  - Eliminar endpoint `GET /mcp/sse` completamente
  - Mantener solo `GET /mcp/sse-connect` con manejo de sesiones limpio
  - Remover código comentado y explicaciones largas sobre problemas
  - Simplificar lógica de manejo de mensajes POST

- **Archivos afectados:**
  - `src/mcp/mcp.controller.ts`

- **Tiempo estimado:** 2 horas

### 2.2 Mejorar manejo de sesiones
- **Acciones:**
  - Implementar limpieza automática de sesiones expiradas (usar timers)
  - Agregar logging apropiado para conexiones/desconexiones
  - Mejorar manejo de errores en conexiones SSE

- **Archivos afectados:**
  - `src/mcp/mcp.controller.ts`
  - Posiblemente `src/common/logger/logger.service.ts`

- **Tiempo estimado:** 2-3 horas

## Fase 3: Convertir Endpoints Admin (Prioridad Media)

### 3.1 Crear APIs REST para admin
- **Acciones:**
  - Crear nuevos endpoints REST:
    - `GET /api/admin/stats` - Estadísticas del sistema (documentos indexados, memoria, etc.)
    - `GET /api/admin/extensions` - Lista de extensiones MCP disponibles
    - `GET /api/admin/config` - Configuración actual del sistema
    - `POST /api/admin/config` - Actualizar configuración
  - Crear DTOs apropiados para responses
  - Implementar lógica de negocio en servicios

- **Archivos afectados:**
  - Nuevo: `src/admin/admin-api.controller.ts`
  - Nuevo: `src/admin/dto/`
  - `src/admin/admin.service.ts` (si no existe, crear)

- **Tiempo estimado:** 4-5 horas

### 3.2 Mantener serving de HTML separado
- **Acciones:**
  - Crear módulo `StaticModule` para servir archivos HTML
  - Mantener endpoints `/admin/*` para compatibilidad hacia atrás
  - Posiblemente redirigir `/admin` a `/admin/index.html`

- **Archivos afectados:**
  - Nuevo: `src/static/static.module.ts`
  - Nuevo: `src/static/static.controller.ts`
  - Modificar: `src/admin/admin.controller.ts` (simplificar)

- **Tiempo estimado:** 2-3 horas

## Fase 4: Estandarización de Responses (Prioridad Media)

### 4.1 Crear Response Interceptor
- **Acciones:**
  - Implementar `ResponseInterceptor` global en `AppModule`
  - Formato estándar: `{success: boolean, data?: any, message?: string, timestamp: string, error?: {code: string, message: string}}`
  - Aplicar a todos los controllers automáticamente

- **Archivos afectados:**
  - Nuevo: `src/common/interceptors/response.interceptor.ts`
  - `src/app.module.ts`

- **Tiempo estimado:** 2 horas

### 4.2 Actualizar DTOs
- **Acciones:**
  - Crear `BaseResponseDto` para consistencia
  - Actualizar todos los controllers para usar el formato estándar
  - Migrar responses existentes al nuevo formato

- **Archivos afectados:**
  - Nuevo: `src/common/dto/base-response.dto.ts`
  - Todos los controllers existentes

- **Tiempo estimado:** 2 horas

## Fase 5: Limpieza General (Prioridad Baja)

### 5.1 Endpoint raíz
- **Acciones:**
  - Cambiar `GET /` para retornar información básica del sistema
  - Incluir versión, estado de servicios, timestamp
  - O redirigir a `/admin` si hay frontend activo

- **Archivos afectados:**
  - `src/app.controller.ts`
  - `src/app.service.ts`

- **Tiempo estimado:** 30 minutos

### 5.2 Código comentado
- **Acciones:**
  - Remover todos los comentarios largos explicando problemas
  - Limpiar imports no utilizados
  - Optimizar métodos y remover código dead

- **Archivos afectados:**
  - Todos los archivos modificados en fases anteriores

- **Tiempo estimado:** 1 hora

## Fase 6: Testing y Documentación (Prioridad Alta)

### 6.1 Actualizar tests
- **Acciones:**
  - Modificar tests que usen endpoints eliminados (`/paths/search`)
  - Agregar tests para nuevos endpoints REST admin
  - Ejecutar tests de integración para verificar compatibilidad

- **Archivos afectados:**
  - `test-admin.js`
  - `test-mcp.js`
  - `src/**/*.spec.ts`

- **Tiempo estimado:** 3 horas

### 6.2 Documentación
- **Acciones:**
  - Actualizar README.md con nueva estructura de endpoints
  - Crear documentación API completa con Swagger
  - Documentar claramente diferencia entre flujo MCP vs REST
  - Agregar ejemplos de uso para cada endpoint

- **Archivos afectados:**
  - `README.md`
  - Documentación Swagger en controllers
  - Posiblemente nueva documentación en `docs/`

- **Tiempo estimado:** 3 horas

## Riesgos y Consideraciones

### Compatibilidad
- **Riesgo:** Cambios pueden romper integraciones existentes
- **Mitigación:** Mantener endpoints legacy con deprecation warnings
- **Testing:** Ejecutar tests exhaustivos antes de deploy

### Frontend
- **Riesgo:** Frontend puede depender de endpoints eliminados
- **Mitigación:** Verificar uso de endpoints en archivos HTML/JS
- **Plan B:** Mantener endpoints como proxies si es necesario

### MCP Tools
- **Riesgo:** Modificar herramientas MCP existentes
- **Mitigación:** NO modificar herramientas MCP, solo infraestructura
- **Verificación:** Tools siguen funcionando igual

### Performance
- **Riesgo:** Nuevos interceptors afectan performance
- **Mitigación:** Medir performance antes/después
- **Optimización:** Usar caching donde apropiado

## Timeline Detallado

| Fase | Tareas | Tiempo | Prioridad |
|------|--------|--------|-----------|
| 1 | Eliminación duplicaciones | 1.5 horas | Alta |
| 2 | Limpieza McpController | 4-5 horas | Alta |
| 3 | Endpoints admin REST | 6-8 horas | Media |
| 4 | Estandarización responses | 4 horas | Media |
| 5 | Limpieza general | 1.5 horas | Baja |
| 6 | Testing y docs | 6 horas | Alta |

**Total estimado: 23-27.5 horas de desarrollo**

## Checklist de Implementación

### Pre-Implementación
- [ ] Backup del código actual
- [ ] Ejecutar tests existentes (deben pasar)
- [ ] Documentar endpoints actuales

### Por Fase
- [ ] Fase 1: Eliminar endpoint duplicado
- [ ] Fase 2: Limpiar McpController
- [ ] Fase 3: Crear APIs admin REST
- [ ] Fase 4: Implementar interceptor de responses
- [ ] Fase 5: Limpieza general
- [ ] Fase 6: Testing completo

### Post-Implementación
- [ ] Ejecutar suite completa de tests
- [ ] Verificar funcionamiento MCP
- [ ] Probar endpoints manualmente
- [ ] Actualizar documentación
- [ ] Deploy y monitoreo

## Métricas de Éxito

- ✅ Todos los tests pasan
- ✅ Endpoints MCP funcionan correctamente
- ✅ No hay duplicación de funcionalidades
- ✅ Responses consistentes en todos los endpoints
- ✅ Código más mantenible y limpio
- ✅ Documentación actualizada y completa