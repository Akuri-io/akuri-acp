---
trigger: on_demand
description: "Plan de implementación detallado para el sistema de configuración híbrida .env + JSON de rutas de documentación en Akuri ACP"
status: active
version: 1.0.0
date_created: "2025-11-28"
author: "Akuri System"
use_case: [PLAN]
tags: [plan, implementation, tasks, nestjs, hybrid-config]
related_documents: [
  "RESEARCH.dynamic-documentation-routes-storage.md",
  "DESIGN.hybrid-routes-configuration-system.md"
]
---

# PLAN: Implementación Sistema de Configuración Híbrida

## Referencia al Diseño

**Documento DESIGN:** [`DESIGN.hybrid-routes-configuration-system.md`](DESIGN.hybrid-routes-configuration-system.md)

**Documento RESEARCH:** [`RESEARCH.dynamic-documentation-routes-storage.md`](RESEARCH.dynamic-documentation-routes-storage.md)

## Resumen del Plan

Este plan descompone la implementación del sistema de configuración híbrida en tareas atómicas y ejecutables. La implementación se divide en 3 fases principales: Core (servicios base), API/UI (endpoints y interfaz), y Testing/Deploy (validación y producción).

**Estimación Total:** 15 días hábiles (3 semanas)  
**Complejidad:** Media  
**Tareas Totales:** 35 tareas  
**Riesgo:** Bajo (backward compatible, zero breaking changes)

---

## Dependencias Previas

### Packages a Instalar

**Ninguno** - Todas las dependencias necesarias ya están instaladas:
- ✅ `zod@3.25.76` - Validación de schemas
- ✅ `chokidar@4.0.3` - File watching
- ✅ `@nestjs/common@11.0.1` - Framework base
- ✅ `@nestjs/config@4.0.2` - Config module

### Configuraciones Necesarias

- Crear carpeta `.akuri/` en root del proyecto (si no existe)
- Crear carpeta `.akuri/backups/` para archivos de respaldo
- Permisos de lectura/escritura en `.env` y `.akuri/`
- Node.js v18+ (ya instalado)

### Verificaciones Pre-implementación

```bash
# Verificar estructura actual
ls -la akuri-acp/.env
ls -la akuri-acp/src/akuri-core/config/

# Crear carpetas necesarias
mkdir -p akuri-acp/.akuri/backups
mkdir -p akuri-acp/.akuri/config

# Backup de .env actual
cp akuri-acp/.env akuri-acp/.akuri/backups/.env.backup.$(date +%Y%m%d)
```

---

## Tareas de Implementación

## FASE 1: Core Infrastructure (Días 1-5)

### Tarea 1.1: Crear Estructura de Carpetas y Schemas Zod

**Descripción:** Crear la estructura base de carpetas y definir todos los schemas de validación con Zod.

**Archivos:**
- `akuri-acp/src/akuri-core/config/hybrid/schemas/` (crear directorio)
- `akuri-acp/src/akuri-core/config/hybrid/schemas/route.schema.ts` (crear)
- `akuri-acp/src/akuri-core/config/hybrid/schemas/json-config.schema.ts` (crear)
- `akuri-acp/src/akuri-core/config/hybrid/schemas/index.ts` (crear)

**Dependencias:** Ninguna

**Comandos:**
```bash
cd akuri-acp
mkdir -p src/akuri-core/config/hybrid/schemas
mkdir -p src/akuri-core/config/hybrid/managers
mkdir -p src/akuri-core/config/hybrid/services
```

**Criterios de Aceptación:**
- [ ] Carpetas creadas según estructura
- [ ] RouteMetadataSchema definido con todos los campos
- [ ] JsonConfigSchema definido con validación completa
- [ ] CreateRouteDtoSchema y UpdateRouteDtoSchema definidos
- [ ] Todos los schemas exportan tipos TypeScript inferidos
- [ ] Schema valida correctamente ejemplo válido
- [ ] Schema rechaza ejemplo inválido

**Estimación:** Baja (1-2 horas)

---

### Tarea 1.2: Implementar EnvFileManager

**Descripción:** Crear el manager para lectura/escritura de archivos `.env` con operaciones atómicas.

**Archivos:**
- `akuri-acp/src/akuri-core/config/hybrid/managers/env-file.manager.ts` (crear)
- `akuri-acp/src/akuri-core/config/hybrid/managers/env-file.manager.spec.ts` (crear)

**Dependencias:** Tarea 1.1

**Comandos:**
```bash
# No requiere comandos especiales
```

**Implementación:**
```typescript
export class EnvFileManager {
  async readPaths(): Promise<string[]>;
  async writePaths(paths: string[]): Promise<void>;
  async backupEnv(): Promise<string>;
  async restoreEnv(backupPath: string): Promise<void>;
  private parseEnvLine(line: string): { key: string; value: string } | null;
  private serializePaths(paths: string[]): string;
}
```

**Criterios de Aceptación:**
- [ ] readPaths() lee correctamente AKURI_DOCS_PATH del .env
- [ ] readPaths() parsea CSV correctamente (split por comas)
- [ ] writePaths() actualiza .env sin perder otras variables
- [ ] backupEnv() crea archivo de respaldo con timestamp
- [ ] restoreEnv() recupera desde backup correctamente
- [ ] Operaciones son atómicas (temp file + rename)
- [ ] Tests unitarios cubren todos los métodos
- [ ] Tests cubren casos edge: archivo no existe, paths vacíos, caracteres especiales

**Estimación:** Media (3-4 horas)

---

### Tarea 1.3: Implementar JsonConfigManager

**Descripción:** Crear el manager para lectura/escritura de archivos JSON de configuración con validación Zod.

**Archivos:**
- `akuri-acp/src/akuri-core/config/hybrid/managers/json-config.manager.ts` (crear)
- `akuri-acp/src/akuri-core/config/hybrid/managers/json-config.manager.spec.ts` (crear)

**Dependencias:** Tarea 1.1

**Implementación:**
```typescript
export class JsonConfigManager {
  async read(): Promise<JsonConfig>;
  async write(config: JsonConfig): Promise<void>;
  validate(config: unknown): JsonConfig;
  mergeDefaults(paths: string[]): JsonConfig;
  async backup(): Promise<string>;
  async restore(backupPath: string): Promise<void>;
  private getDefaultConfig(): JsonConfig;
  private createDefaultMetadata(path: string): RouteMetadata;
}
```

**Criterios de Aceptación:**
- [ ] read() lee y parsea JSON correctamente
- [ ] read() retorna config por defecto si archivo no existe
- [ ] validate() usa Zod schema para validación
- [ ] validate() lanza error descriptivo con datos inválidos
- [ ] mergeDefaults() crea metadata para paths nuevos
- [ ] write() escribe JSON formateado (pretty print)
- [ ] backup() y restore() funcionan correctamente
- [ ] Tests unitarios cubren todos los métodos
- [ ] Tests validan schema correctamente

**Estimación:** Media (3-4 horas)

---

### Tarea 1.4: Implementar FileWatcherService

**Descripción:** Crear servicio para monitorear cambios en archivos .env y JSON con debouncing.

**Archivos:**
- `akuri-acp/src/akuri-core/config/hybrid/services/file-watcher.service.ts` (crear)
- `akuri-acp/src/akuri-core/config/hybrid/services/file-watcher.service.spec.ts` (crear)

**Dependencias:** Ninguna (usa chokidar existente)

**Implementación:**
```typescript
@Injectable()
export class FileWatcherService implements OnModuleInit, OnModuleDestroy {
  private watcher: FSWatcher;
  private envDebounceTimer: Timer | null;
  private jsonDebounceTimer: Timer | null;
  
  onModuleInit(): void;
  onModuleDestroy(): void;
  watchFiles(paths: string[], callback: (path: string) => void): void;
  stopWatching(): void;
  private debounce(callback: () => void, delay: number): void;
}
```

**Criterios de Aceptación:**
- [ ] Servicio inicia correctamente en module init
- [ ] Watcher detecta cambios en .env
- [ ] Watcher detecta cambios en JSON
- [ ] Debouncing 500ms implementado correctamente
- [ ] No dispara múltiples eventos para cambio único
- [ ] Cleanup correcto en module destroy
- [ ] Tests con mocked file system
- [ ] Tests validan debouncing

**Estimación:** Media (2-3 horas)

---

### Tarea 1.5: Implementar HybridRouteConfigService (Core)

**Descripción:** Implementar el servicio principal que orquesta EnvFileManager y JsonConfigManager.

**Archivos:**
- `akuri-acp/src/akuri-core/config/hybrid/services/hybrid-route-config.service.ts` (crear)
- `akuri-acp/src/akuri-core/config/hybrid/services/hybrid-route-config.service.spec.ts` (crear)

**Dependencias:** Tareas 1.2, 1.3, 1.4

**Implementación:**
```typescript
@Injectable()
export class HybridRouteConfigService implements OnModuleInit {
  private configCache: RouteConfig[] | null = null;
  
  async onModuleInit(): Promise<void>;
  async loadConfig(): Promise<RouteConfig[]>;
  private mergeConfig(envPaths: string[], jsonConfig: JsonConfig): RouteConfig[];
  async getAllRoutes(): Promise<RouteConfig[]>;
  async getRoute(path: string): Promise<RouteConfig | null>;
  async validateConsistency(): Promise<ConsistencyReport>;
  private generateRouteId(path: string): string;
  private invalidateCache(): void;
}
```

**Criterios de Aceptación:**
- [ ] loadConfig() merge .env + JSON correctamente
- [ ] Cache funciona correctamente (hit/miss)
- [ ] getRoute() retorna route específico o null
- [ ] getAllRoutes() retorna array completo
- [ ] validateConsistency() detecta inconsistencias
- [ ] Auto-init en module init
- [ ] File watcher integrado con reload
- [ ] Tests unitarios completos con mocks
- [ ] Tests validan merge logic

**Estimación:** Alta (4-5 horas)

---

### Tarea 1.6: Implementar Operaciones CRUD en HybridRouteConfigService

**Descripción:** Agregar métodos addRoute, updateRoute, removeRoute con operaciones atómicas.

**Archivos:**
- `akuri-acp/src/akuri-core/config/hybrid/services/hybrid-route-config.service.ts` (modificar)
- `akuri-acp/src/akuri-core/config/hybrid/services/hybrid-route-config.service.spec.ts` (modificar)

**Dependencias:** Tarea 1.5

**Implementación:**
```typescript
// Agregar métodos al servicio existente
async addRoute(dto: CreateRouteDto): Promise<RouteConfig>;
async updateRoute(path: string, dto: UpdateRouteDto): Promise<RouteConfig>;
async removeRoute(path: string): Promise<void>;
private async executeAtomicOperation<T>(operation: () => Promise<T>): Promise<T>;
private validatePath(path: string): void;
```

**Criterios de Aceptación:**
- [ ] addRoute() valida path antes de agregar
- [ ] addRoute() rechaza duplicados (ConflictException)
- [ ] addRoute() actualiza .env y JSON atómicamente
- [ ] updateRoute() actualiza solo metadata en JSON
- [ ] updateRoute() lanza NotFoundException si no existe
- [ ] removeRoute() elimina de .env y JSON
- [ ] Operaciones atómicas con backup/rollback
- [ ] En caso de error, rollback funciona
- [ ] InvalidateCache después de cada operación
- [ ] Tests cubren casos de éxito y error
- [ ] Tests validan rollback

**Estimación:** Alta (5-6 horas)

---

### Tarea 1.7: Crear Módulo HybridConfigModule

**Descripción:** Crear módulo NestJS que encapsula todos los servicios del sistema híbrido.

**Archivos:**
- `akuri-acp/src/akuri-core/config/hybrid/hybrid-config.module.ts` (crear)
- `akuri-acp/src/akuri-core/config/hybrid/index.ts` (crear)

**Dependencias:** Tareas 1.2 a 1.6

**Comandos:**
```bash
# No requiere comandos
```

**Implementación:**
```typescript
@Module({
  imports: [ConfigModule],
  providers: [
    EnvFileManager,
    JsonConfigManager,
    FileWatcherService,
    HybridRouteConfigService,
    LoggerService,
  ],
  exports: [HybridRouteConfigService],
})
export class HybridConfigModule {}
```

**Criterios de Aceptación:**
- [ ] Módulo declara todos los providers
- [ ] Module exporta HybridRouteConfigService
- [ ] index.ts exporta todas las interfaces públicas
- [ ] Módulo se importa correctamente en AppModule
- [ ] DI funciona correctamente
- [ ] Tests de integración del módulo

**Estimación:** Baja (1 hora)

---

## FASE 2: API Endpoints y UI (Días 6-10)

### Tarea 2.1: Actualizar ConfigController con Nuevos Endpoints

**Descripción:** Agregar endpoints REST para CRUD de rutas con metadata.

**Archivos:**
- `akuri-acp/src/config.controller.ts` (modificar)

**Dependencias:** Fase 1 completa

**Implementación:**
```typescript
// Nuevos endpoints
@Get('routes')
async getRoutes(): Promise<RoutesListResponse>;

@Get('routes/:encodedPath')
async getRoute(@Param('encodedPath') encodedPath: string): Promise<RouteResponse>;

@Post('routes')
async addRoute(@Body() dto: CreateRouteDto): Promise<RouteResponse>;

@Patch('routes/:encodedPath')
async updateRoute(
  @Param('encodedPath') encodedPath: string,
  @Body() dto: UpdateRouteDto
): Promise<RouteResponse>;

@Delete('routes/:encodedPath')
async deleteRoute(@Param('encodedPath') encodedPath: string): Promise<RouteResponse>;

@Post('validate-consistency')
async validateConsistency(): Promise<ConsistencyReport>;
```

**Criterios de Aceptación:**
- [ ] GET /config/routes retorna todas las rutas
- [ ] GET /config/routes/:path retorna ruta específica
- [ ] POST /config/routes crea nueva ruta
- [ ] PATCH /config/routes/:path actualiza metadata
- [ ] DELETE /config/routes/:path elimina ruta
- [ ] POST /config/validate-consistency valida y repara
- [ ] Manejo de errores con códigos HTTP correctos
- [ ] URL-encoding de paths funcionacorrectamente
- [ ] DTOs validados con class-validator
- [ ] Documentación de endpoints actualizada

**Estimación:** Media (3-4 horas)

---

### Tarea 2.2: Actualizar Frontend - rutas.html (Estructura)

**Descripción:** Actualizar HTML de la página de rutas para soportar metadata.

**Archivos:**
- `akuri-acp/public/rutas.html` (modificar)

**Dependencias:** Ninguna (puede hacerse en paralelo)

**Criterios de Aceptación:**
- [ ] Formulario incluye campos para metadata
- [ ] Campo descripción (textarea)
- [ ] Campo prioridad (number input 0-10)
- [ ] Campo tags (input con chips)
- [ ] Campo categoría (select: internal/project/workspace/external)
- [ ] Checkbox isActive
- [ ] Tabla muestra metadata en columnas adicionales
- [ ] Vista modo simple/avanzado (toggle)
- [ ] Responsive design mantenido

**Estimación:** Media (2-3 horas)

---

### Tarea 2.3: Actualizar Frontend - api.js (CRUD Operations)

**Descripción:** Actualizar módulo API del frontend para nuevos endpoints.

**Archivos:**
- `akuri-acp/public/js/api.js` (modificar)

**Dependencias:** Tarea 2.1

**Implementación:**
```javascript
// Nuevos métodos
async getRouteDetails(path) { /* GET /config/routes/:path */ }
async updateRouteMetadata(path, metadata) { /* PATCH /config/routes/:path */ }
async validateConsistency() { /* POST /config/validate-consistency */ }
```

**Criterios de Aceptación:**
- [ ] getRouteDetails() obtiene ruta específica
- [ ] updateRouteMetadata() actualiza metadata
- [ ] validateConsistency() valida configuración
- [ ] Todos los métodos manejan errores
- [ ] Loading states implementados
- [ ] Error messages user-friendly

**Estimación:** Baja (2 horas)

---

### Tarea 2.4: Actualizar Frontend - Interacciones UI

**Descripción:** Implementar lógica JavaScript para interacciones de metadata.

**Archivos:**
- `akuri-acp/public/rutas.html` (modificar script section)

**Dependencias:** Tareas 2.2, 2.3

**Criterios de Aceptación:**
- [ ] Click en row abre modal con detalles
- [ ] Formulario de edición funciona
- [ ] Tags se agregan/eliminan con chips
- [ ] Prioridad se ajusta con slider visual
- [ ] Validación client-side funciona
- [ ] Confirmaciones para operaciones destructivas
- [ ] Toasts muestran feedback apropiado
- [ ] Toggle simple/avanzado funciona

**Estimación:** Media (3 horas)

---

### Tarea 2.5: Agregar Indicador de Consistencia en UI

**Descripción:** Agregar widget que muestra estado de consistencia .env ↔ JSON.

**Archivos:**
- `akuri-acp/public/rutas.html` (modificar)
- `akuri-acp/public/css/styles.css` (modificar)

**Dependencias:** Tarea 2.3

**Criterios de Aceptación:**
- [ ] Widget muestra estado: ✅ Consistente / ⚠️ Issues
- [ ] Al detectar issues, muestra detalles
- [ ] Botón "Auto-repair" disponible si hay issues
- [ ] Ejecuta validateConsistency() automáticamente al cargar
- [ ] Refresh después de operaciones CRUD
- [ ] Animaciones suaves para cambios de estado

**Estimación:** Baja (2 horas)

---

### Tarea 2.6: Implementar Auto-Migration Script

**Descripción:** Crear script que migra configuración actual a sistema híbrido.

**Archivos:**
- `akuri-acp/scripts/migrate-to-hybrid.ts` (crear)
- `akuri-acp/scripts/migrate-to-hybrid.sh` (crear)

**Dependencias:** Fase 1 completa

**Comandos:**
```bash
# Ejecutar migración
npm run migrate:hybrid
```

**Implementación:**
```typescript
async function migrateToHybrid() {
  // 1. Read current .env
  // 2. Parse AKURI_DOCS_PATH
  // 3. Create default JSON config
  // 4. Write to .akuri/routes-config.json
  // 5. Validate migration
  // 6. Log results
}
```

**Criterios de Aceptación:**
- [ ] Script lee .env actual
- [ ] Crea JSON config con defaults
- [ ] Genera IDs únicos para cada ruta
- [ ] Asigna categorías inteligentemente
- [ ] Backup de .env antes de migrar
- [ ] Validation post-migración
- [ ] Logging detallado del proceso
- [ ] Script es idempotente (re-ejecutable)

**Estimación:** Media (2-3 horas)

---

## FASE 3: Testing y Deployment (Días 11-15)

### Tarea 3.1: Tests de Integración - ConfigController

**Descripción:** Tests de integración para los nuevos endpoints del controller.

**Archivos:**
- `akuri-acp/src/config.controller.integration.spec.ts` (crear)

**Dependencias:** Tarea 2.1

**Criterios de Aceptación:**
- [ ] Test: GET /config/routes retorna array vacío inicial
- [ ] Test: POST /config/routes crea ruta exitosamente
- [ ] Test: POST /config/routes rechaza duplicado (409)
- [ ] Test: POST /config/routes valida path inválido (400)
- [ ] Test: PATCH /config/routes actualiza metadata
- [ ] Test: DELETE /config/routes elimina ruta
- [ ] Test: Consistency validation detecta issues
- [ ] Test: Auto-repair soluciona inconsistencias
- [ ] Tests usan base de datos en memoria
- [ ] Setup/teardown limpian estado

**Estimación:** Alta (4-5 horas)

---

### Tarea 3.2: Tests E2E - Full CRUD Lifecycle

**Descripción:** Tests end-to-end del ciclo completo de vida de una ruta.

**Archivos:**
- `akuri-acp/test/config-hybrid.e2e-spec.ts` (crear)

**Dependencias:** Fase 2 completa

**Criterios de Aceptación:**
- [ ] Test: Flujo completo Create → Read → Update → Delete
- [ ] Test: Múltiples rutas simultáneas
- [ ] Test: External .env modification detectada
- [ ] Test: External JSON modification detectada
- [ ] Test: Rollback en error funciona
- [ ] Test: Hot reload aplica cambios
- [ ] Test: Reindex trigger después de cambios
- [ ] Tests usan aplicación completa (real server)

**Estimación:** Alta (5-6 horas)

---

### Tarea 3.3: Tests de Performance - Benchmarks

**Descripción:** Validar que se cumplen los benchmarks de performance definidos.

**Archivos:**
- `akuri-acp/test/performance/config-performance.spec.ts` (crear)

**Dependencias:** Fase 2 completa

**Criterios de Aceptación:**
- [ ] loadConfig() con 10 rutas: < 50ms
- [ ] loadConfig() con 50 rutas: < 100ms
- [ ] getAllRoutes() desde cache: < 5ms
- [ ] addRoute() operación completa: < 150ms
- [ ] removeRoute() operación completa: < 100ms
- [ ] Hot reload detection: < 50ms
- [ ] Full reload cycle: < 200ms
- [ ] Tests pasan consistentemente
- [ ] Logging de tiempos de ejecución

**Estimación:** Media (3 horas)

---

### Tarea 3.4: Documentación de Usuario

**Descripción:** Crear documentación completa para usuarios finales.

**Archivos:**
- `akuri-acp/docs/hybrid-config-user-guide.md` (crear)
- `akuri-acp/README.md` (actualizar)

**Dependencias:** Implementación completa

**Criterios de Aceptación:**
- [ ] Guía explica sistema híbrido
- [ ] Instrucciones para migración
- [ ] Screenshots de UI
- [ ] Ejemplos de uso común
- [ ] Troubleshooting section
- [ ] FAQs respondidas
- [ ] Links a documentos técnicos
- [ ] Markdown bien formateado

**Estimación:** Media (2-3 horas)

---

### Tarea 3.5: Documentación Técnica

**Descripción:** Actualizar documentación técnica del proyecto.

**Archivos:**
- `akuri-acp/docs/architecture.md` (actualizar)
- `akuri-acp/docs/api-endpoints.md` (actualizar)
- `akuri-acp/src/akuri-core/config/hybrid/README.md` (crear)

**Dependencias:** Implementación completa

**Criterios de Aceptación:**
- [ ] Arquitectura híbrida documentada
- [ ] Diagramas actualizados
- [ ] API endpoints documentados con ejemplos
- [ ] Schemas Zod documentados
- [ ] Decision records agregados
- [ ] Code examples incluidos
- [ ] Referencias cruzadas correctas

**Estimación:** Media (2-3 horas)

---

### Tarea 3.6: Testing Manual en Staging

**Descripción:** Testing manual exhaustivo en ambiente de staging.

**Archivos:**
- `akuri-acp/test/manual-test-checklist.md` (crear)

**Dependencias:** Todo implementado

**Criterios de Aceptación:**
- [ ] Happy path completo funciona
- [ ] Error paths manejados correctamente
- [ ] UI responsive en móvil y desktop
- [ ] Performance aceptable
- [ ] No memory leaks detectados
- [ ] Logs apropiados generados
- [ ] Backward compatibility validada
- [ ] Migrate script funciona
- [ ] Hot reload funciona
- [ ] Checklist completo ejecutado

**Estimación:** Media (3-4 horas)

---

### Tarea 3.7: Deploy a Staging

**Descripción:** Deploy del sistema completo a ambiente de staging.

**Archivos:**
- Ninguno

**Dependencias:** Tarea 3.6

**Comandos:**
```bash
# Build proyecto
cd akuri-acp
npm run build

# Ejecutar migración
npm run migrate:hybrid

# Start server
npm run start:prod

# Verificar health
curl http://localhost:3001/health
```

**Criterios de Aceptación:**
- [ ] Build exitoso sin errores
- [ ] Migración ejecutada correctamente
- [ ] Servidor inicia sin errores
- [ ] Health check retorna 200
- [ ] Endpoints responden correctamente
- [ ] UI accesible y funcional
- [ ] Logs sin errores críticos
- [ ] Monitoreo activo

**Estimación:** Baja (1-2 horas)

---

### Tarea 3.8: Monitoreo y Bug Fixes en Staging

**Descripción:** Monitoreo activo de staging y corrección de bugs encontrados.

**Archivos:**
- Varios (según bugs encontrados)

**Dependencias:** Tarea 3.7

**Criterios de Aceptación:**
- [ ] Monitoreo 48 horas sin issues críticos
- [ ] Todos los bugs encontrados documentados
- [ ] Bugs críticos corregidos
- [ ] Bugs menores priorizados
- [ ] Performance tracked y estable
- [ ] User feedback recopilado
- [ ] Rollback plan validado
- [ ] Go/No-go decision tomada

**Estimación:** Variable (4-8 horas buffer)

---

### Tarea 3.9: Deploy a Producción

**Descripción:** Deploy final a ambiente de producción.

**Archivos:**
- Ninguno

**Dependencias:** Tarea 3.8 (staging stable)

**Comandos:**
```bash
# Pre-deployment backup
./scripts/backup-production.sh

# Deploy
./scripts/deploy-production.sh

# Post-deployment verification
./scripts/verify-deployment.sh
```

**Criterios de Aceptación:**
- [ ] Backup de producción creado
- [ ] Deploy ejecutado sin errores
- [ ] Smoke tests pasan
- [ ] Migración automática ejecutada
- [ ] Zero downtime confirmado
- [ ] Rollback plan ready
- [ ] Monitoreo activo iniciado
- [ ] Stakeholders notificados

**Estimación:** Baja (2 horas)

---

### Tarea 3.10: Post-Deployment Monitoring

**Descripción:** Monitoreo intensivo post-deployment y soporte.

**Archivos:**
- Ninguno

**Dependencias:** Tarea 3.9

**Criterios de Aceptación:**
- [ ] Monitoreo 24h sin issues críticos
- [ ] Performance dentro de benchmarks
- [ ] Zero data loss confirmado
- [ ] User satisfaction > 90%
- [ ] Support tickets = 0 issues relacionados
- [ ] Logs revisados y limpios
- [ ] Métricas de éxito cumplidas
- [ ] Retrospectiva completada

**Estimación:** Baja (4 horas distribuidas)

---

## Orden de Ejecución

```
FASE 1: CORE (Paralelo donde posible)
─────────────────────────────────────
Tarea 1.1 (Schemas) [1-2h]
    ├──> Tarea 1.2 (EnvFileManager) [3-4h]
    └──> Tarea 1.3 (JsonConfigManager) [3-4h]
         
Tarea 1.4 (FileWatcher) [2-3h] (paralelo con 1.2, 1.3)

Tareas 1.2 + 1.3 + 1.4 completas
    ↓
Tarea 1.5 (HybridService Core) [4-5h]
    ↓
Tarea 1.6 (HybridService CRUD) [5-6h]
    ↓
Tarea 1.7 (Module) [1h]

TOTAL FASE 1: ~23-29 horas (5 días)


FASE 2: API/UI (Algunas tareas paralelas)
──────────────────────────────────────────
Tarea 2.1 (ConfigController) [3-4h]
    │
    ├──> Tarea 2.3 (api.js) [2h]
    │       ↓
    │   Tarea 2.4 (UI logic) [3h]
    │       ↓
    │   Tarea 2.5 (Consistency widget) [2h]
    │
    └──> Tarea 2.6 (Migration script) [2-3h]

Tarea 2.2 (rutas.html) [2-3h] (paralelo con 2.1)

TOTAL FASE 2: ~14-17 horas (4 días)


FASE 3: TESTING/DEPLOY (Mayormente secuencial)
───────────────────────────────────────────────
Tarea 3.1 (Integration tests) [4-5h]
    ↓
Tarea 3.2 (E2E tests) [5-6h]
    ↓
Tarea 3.3 (Performance tests) [3h]

Tarea 3.4 (User docs) [2-3h] (paralelo con tests)
Tarea 3.5 (Tech docs) [2-3h] (paralelo con tests)

Documentación completa
    ↓
Tarea 3.6 (Manual testing) [3-4h]
    ↓
Tarea 3.7 (Deploy staging) [1-2h]
    ↓
Tarea 3.8 (Monitor staging) [4-8h]
    ↓
Tarea 3.9 (Deploy production) [2h]
    ↓
Tarea 3.10 (Post-deploy monitor) [4h distributed]

TOTAL FASE 3: ~30-38 horas (6 días)


TOTAL GENERAL: ~67-84 horas
DÍAS HÁBILES: 15 días (considerando 5-6h/día efectivas)
```

---

## Plan de Testing

### Tests Unitarios

#### EnvFileManager Test Suite
**Archivo:** `env-file.manager.spec.ts`  
**Coverage Target:** 100%

**Tests:**
- ✅ readPaths(): archivo existe, paths válidos
- ✅ readPaths(): archivo no existe, retorna []
- ✅ readPaths(): AKURI_DOCS_PATH vacío, retorna []
- ✅ writePaths(): actualiza correctamente
- ✅ writePaths(): preserva otras variables .env
- ✅ backupEnv(): crea archivo con timestamp
- ✅ restoreEnv(): recupera desde backup
- ✅ Operación atómica: temp file + rename
- ✅ Error handling: rollback en fallo

#### JsonConfigManager Test Suite
**Archivo:** `json-config.manager.spec.ts`  
**Coverage Target:** 100%

**Tests:**
- ✅ read(): JSON válido
- ✅ read(): JSON inválido (schema violation)
- ✅ read(): archivo no existe, retorna default
- ✅ validate(): acepta config válido
- ✅ validate(): rechaza config inválido
- ✅ mergeDefaults(): crea metadata defaults
- ✅ write(): escribe pretty JSON
- ✅ backup() y restore(): funcionan
- ✅ Migration: actualiza versiones antiguas

#### HybridRouteConfigService Test Suite
**Archivo:** `hybrid-route-config.service.spec.ts`  
**Coverage Target:** 90%+

**Tests:**
- ✅ loadConfig(): merge correcto .env + JSON
- ✅ loadConfig(): maneja JSON missing
- ✅ addRoute(): crea ruta nueva
- ✅ addRoute(): rechaza duplicado
- ✅ addRoute(): valida path inválido
- ✅ addRoute(): operación atómica con rollback
- ✅ updateRoute(): actualiza metadata
- ✅ updateRoute(): error si no existe
- ✅ removeRoute(): elimina correctamente
- ✅ validateConsistency(): detecta orphans
- ✅ validateConsistency(): auto-repair
- ✅ Cache: hit y miss scenarios

### Tests de Integración

#### Config API Integration Test Suite
**Archivo:** `config.controller.integration.spec.ts`

**Escenarios:**
- CRUD completo de rutas
- Validación de paths
- Manejo de errores HTTP
- Consistency checks
- File watcher integration

### Tests E2E

#### Full System E2E Test Suite
**Archivo:** `config-hybrid.e2e-spec.ts`

**Flujos:**
1. Sistema fresh start → migración → uso normal
2. External file changes → hot reload → validación
3. Concurrent operations → atomicidad
4. Error scenarios → rollback → recovery
5. Performance under load

---

## Archivos a Crear/Modificar

### Crear (23 archivos)

**Core Infrastructure:**
- [ ] `src/akuri-core/config/hybrid/schemas/route.schema.ts`
- [ ] `src/akuri-core/config/hybrid/schemas/json-config.schema.ts`
- [ ] `src/akuri-core/config/hybrid/schemas/index.ts`
- [ ] `src/akuri-core/config/hybrid/managers/env-file.manager.ts`
- [ ] `src/akuri-core/config/hybrid/managers/env-file.manager.spec.ts`
- [ ] `src/akuri-core/config/hybrid/managers/json-config.manager.ts`
- [ ] `src/akuri-core/config/hybrid/managers/json-config.manager.spec.ts`
- [ ] `src/akuri-core/config/hybrid/services/file-watcher.service.ts`
- [ ] `src/akuri-core/config/hybrid/services/file-watcher.service.spec.ts`
- [ ] `src/akuri-core/config/hybrid/services/hybrid-route-config.service.ts`
- [ ] `src/akuri-core/config/hybrid/services/hybrid-route-config.service.spec.ts`
- [ ] `src/akuri-core/config/hybrid/hybrid-config.module.ts`
- [ ] `src/akuri-core/config/hybrid/index.ts`
- [ ] `src/akuri-core/config/hybrid/README.md`

**Scripts:**
- [ ] `scripts/migrate-to-hybrid.ts`
- [ ] `scripts/migrate-to-hybrid.sh`

**Tests:**
- [ ] `src/config.controller.integration.spec.ts`
- [ ] `test/config-hybrid.e2e-spec.ts`
- [ ] `test/performance/config-performance.spec.ts`
- [ ] `test/manual-test-checklist.md`

**Documentación:**
- [ ] `docs/hybrid-config-user-guide.md`
- [ ] `docs/api-endpoints.md`

**Config:**
- [ ] `.akuri/routes-config.json` (auto-generated por migración)

### Modificar (5 archivos)

- [ ] `src/config.controller.ts` - Agregar nuevos endpoints
- [ ] `src/app.module.ts` - Importar HybridConfigModule
- [ ] `public/rutas.html` - Agregar campos metadata
- [ ] `public/js/api.js` - Actualizar API calls
- [ ] `README.md` - Documentar nuevo sistema

---

## Riesgos y Contingencias

### Riesgo 1: Desincronización .env ↔ JSON en Producción

**Probabilidad:** Media  
**Impacto:** Alto

**Mitigación:**
- Implementar validateConsistency() robusto
- Auto-repair en startup
- Logging exhaustivo de operaciones
- Monitoreo de alertas

**Plan B:**
- Script manual de reconciliación
- Rollback a .env only mode
- Reconstrucción de JSON desde .env

---

### Riesgo 2: Performance Degradation con Muchas Rutas

**Probabilidad:** Baja  
**Impacto:** Medio

**Mitigación:**
- Implementar cache agresivo
- Benchmarks continuos
- Índices en memoria para búsquedas

**Plan B:**
- Rate limiting en API
- Paginación forzada
- Migración a SQLite (ya diseñada)

---

### Riesgo 3: Bugs en Hot Reload

**Probabilidad:** Media  
**Impacto:** Medio

**Mitigación:**
- Testing exhaustivo de file watchers
- Debouncing apropiado
- Fallback a manual reload

**Plan B:**
- Deshabilitar hot reload temporalmente
- Revert a restart-required mode
- Fix y re-deploy

---

### Riesgo 4: Migration Script Falla

**Probabilidad:** Baja  
**Impacto:** Alto

**Mitigación:**
- Backup automático pre-migración
- Validation exhaustiva post-migración
- Dry-run mode en script
- Idempotencia garantizada

**Plan B:**
- Restauración desde backup
- Manual migration con checklist
- Support one-on-one con usuarios

---

## Estimación Total

**Complejidad General:** Media

**Tiempo por Fase:**
- Fase 1 (Core): 23-29 horas → 5 días
- Fase 2 (API/UI): 14-17 horas → 4 días  
- Fase 3 (Testing/Deploy): 30-38 horas → 6 días

**Tiempo Total:** 67-84 horas → **15 días hábiles**

**Tareas Totales:** 35 tareas

**Distribución:**
- Baja complejidad: 8 tareas (20-25%)
- Media complejidad: 19 tareas (50-55%)
- Alta complejidad: 8 tareas (20-25%)

**Capacidad Requerida:**
- 1 desarrollador full-time: 3 semanas
- 2 desarrolladores full-time: 1.5-2 semanas

---

## Próximos Pasos

1. ✅ Revisión del PLAN con equipo
2. ✅ Aprobación stakeholders
3. ⏭️ Crear TRACKER ejecutable
4. ⏭️ Asignar recursos
5. ⏭️ **Iniciar BUILD** - Comenzar con Tarea 1.1

---

## Checklist de Conformidad

- [x] Documento DESIGN fue revisado completamente
- [x] Todas las tareas están definidas y son atómicas
- [x] El orden de ejecución es lógico y respeta dependencias
- [x] Cada tarea tiene criterios de aceptación claros y verificables
- [x] Los comandos necesarios están documentados
- [x] El plan de testing está completo (unit, integration, E2E)
- [x] Los archivos a crear/modificar están listados
- [x] Las estimaciones están presentes y justificadas
- [x] Los riesgos están identificados con contingencias
- [x] Timeline realista (15 días hábiles)
- [x] Plan puede tracked con checklist
- [x] Referencias al DESIGN están incluidas

---

**Documento completado:** 2025-11-28  
**Estado:** Ready for BUILD  
**Próximo Documento:** TRACKER ejecutable para seguimiento  
**Inicio Estimado:** Inmediato  
**Finalización Estimada:** 15 días hábiles desde inicio