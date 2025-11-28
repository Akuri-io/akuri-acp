---
trigger: on_demand
description: "Diseño arquitectónico detallado del sistema de configuración híbrida .env + JSON para gestión dinámica de rutas de documentación en Akuri ACP"
status: active
version: 1.0.0
date_created: "2025-11-28"
author: "Akuri System"
use_case: [DESIGN]
tags: [design, architecture, configuration, hybrid-storage, nestjs, routes-management]
related_documents: [
  "RESEARCH.dynamic-documentation-routes-storage.md"
]
---

# DESIGN: Sistema de Configuración Híbrida de Rutas de Documentación

## Resumen Ejecutivo

Este documento especifica el diseño arquitectónico de un sistema de configuración híbrida para la gestión dinámica de rutas de documentación en Akuri ACP. La solución combina la simplicidad de archivos `.env` (para backward compatibility) con la flexibilidad de archivos JSON estructurados (para metadata avanzada), permitiendo modificaciones en caliente sin reinicio del servidor.

**Documento de Investigación Previo:** [`RESEARCH.dynamic-documentation-routes-storage.md`](RESEARCH.dynamic-documentation-routes-storage.md)

**Stack Tecnológico:**
- Backend: NestJS v11 + TypeScript
- Validación: Zod (existente en proyecto)
- File Watching: Chokidar v4.0.3 (existente en proyecto)
- Storage: File system (fs/promises)

---

## 1. Requisitos

### 1.1. Requisitos Funcionales

**RF1: Lectura de Configuración Híbrida**
- El sistema DEBE leer rutas desde `.env` (AKURI_DOCS_PATH) como fuente de verdad
- El sistema DEBE enriquecer rutas con metadata desde JSON si existe
- El sistema DEBE funcionar correctamente si el archivo JSON no existe

**RF2: Modificación de Rutas**
- Los usuarios DEBEN poder agregar rutas nuevas a través de la API
- Los usuarios DEBEN poder eliminar rutas existentes
- Cada modificación DEBE actualizar tanto `.env` como JSON
- Las operaciones DEBEN ser atómicas para evitar inconsistencias

**RF3: Gestión de Metadata**
- Los usuarios DEBEN poder agregar descripción, tags, prioridad a cada ruta
- La metadata DEBE persistirse exclusivamente en JSON
- La metadata DEBE ser opcional (valores por defecto si no existe)

**RF4: Hot Reload**
- El sistema DEBE detectar cambios en `.env` automáticamente
- El sistema DEBE detectar cambios en JSON automáticamente
- Los cambios DEBEN aplicarse sin reinicio del servidor
- El sistema DEBE re-indexar automáticamente al detectar cambios

**RF5: Validación**
- Toda ruta nueva DEBE validarse antes de agregarse
- Las rutas DEBEN existir en el sistema de archivos
- Las rutas DEBEN ser directorios (no archivos)
- Las rutas DEBEN contener al menos un documento

**RF6: Backward Compatibility**
- El sistema actual DEBE seguir funcionando sin cambios
- Los usuarios existentes NO DEBEN requerir migración manual
- El código legacy del [`AkuriConfigService`](akuri-acp/src/akuri-core/config/config.service.ts) DEBE seguir operativo

**RF7: Auto-Repair**
- El sistema DEBE auto-reparar inconsistencias al iniciar
- JSON entries sin ruta en `.env` DEBEN eliminarse automáticamente
- Rutas en `.env` sin JSON entry DEBEN recibir metadata por defecto

### 1.2. Requisitos No Funcionales

**RNF1: Performance**
- Carga de configuración: < 50ms
- Operaciones CRUD: < 100ms
- Hot reload detection: < 500ms
- Sin impacto en búsquedas existentes

**RNF2: Confiabilidad**
- Disponibilidad: 99.9% (tolerancia a errores en archivos)
- Operaciones atómicas con rollback en caso de fallo
- Logging exhaustivo de todas las operaciones

**RNF3: Mantenibilidad**
- Código autodocumentado con TypeScript types
- Unit test coverage > 80%
- Separación clara de responsabilidades
- Documentación inline completa

**RNF4: Seguridad**
- Validación estricta de paths (prevenir path traversal)
- Sanitización de inputs de usuario
- No permitir rutas fuera de directorios autorizados
- Logging de operaciones sensibles

**RNF5: Escalabilidad**
- Soporte para hasta 100 rutas sin degradación
- Path claro para migración a SQLite si necesario
- Diseño modular para agregar features futuras

**RNF6: Usabilidad**
- API REST intuitiva y consistente
- Mensajes de error descriptivos
- Documentación de endpoints

---

## 2. Arquitectura General

### 2.1. Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                               │
│  ┌──────────────────┐         ┌──────────────────┐            │
│  │ ConfigController │ ◄────── │ AdminController  │ (UI)       │
│  └────────┬─────────┘         └──────────────────┘            │
└───────────┼─────────────────────────────────────────────────────┘
            │
            │ uses
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │        HybridRouteConfigService (NEW)                   │   │
│  │  - loadConfig()                                         │   │
│  │  - addRoute()                                           │   │
│  │  - updateRoute()                                        │   │
│  │  - removeRoute()                                        │   │
│  │  - validateConsistency()                                │   │
│  └──────────┬──────────────────────────────┬───────────────┘   │
│             │                               │                   │
│             │ delegates                     │ delegates         │
│             ▼                               ▼                   │
│  ┌──────────────────────┐       ┌──────────────────────┐      │
│  │ EnvFileManager       │       │ JsonConfigManager    │      │
│  │ - read()             │       │ - read()             │      │
│  │ - write()            │       │ - write()            │      │
│  │ - parse()            │       │ - validate()         │      │
│  │ - serialize()        │       │ - merge()            │      │
│  └──────────────────────┘       └──────────────────────┘      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │         FileWatcherService                               │ │
│  │  - watchEnvFile()                                        │ │
│  │  - watchJsonFile()                                       │ │
│  │  - emit('config-changed')                                │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
            │
            │ triggers
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Integration Layer                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         LibrarianService (existing)                      │  │
│  │  - reindex() ◄─── Called on config change              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
            │
            │ persists to
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Storage Layer                              │
│  ┌──────────────┐            ┌──────────────────────────┐      │
│  │   .env       │            │  .akuri/routes-config    │      │
│  │  (paths)     │            │  .json (metadata)        │      │
│  └──────────────┘            └──────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2. Componentes Principales

#### Componente 1: HybridRouteConfigService

**Responsabilidad:**
- Orquestador principal del sistema híbrido
- Coordina lectura/escritura entre `.env` y JSON
- Garantiza consistencia de datos
- Expone API de alto nivel para controllers

**Dependencias:**
- EnvFileManager (gestión de archivos .env)
- JsonConfigManager (gestión de archivos JSON)
- FileWatcherService (detección de cambios)
- LoggerService (logging)
- AkuriConfigService (legacy, para migración gradual)

**Expone:**
```typescript
interface IHybridRouteConfigService {
  loadConfig(): Promise<RouteConfig[]>;
  addRoute(config: CreateRouteDto): Promise<RouteConfig>;
  updateRoute(path: string, updates: UpdateRouteDto): Promise<RouteConfig>;
  removeRoute(path: string): Promise<void>;
  validateConsistency(): Promise<ConsistencyReport>;
  getRoute(path: string): Promise<RouteConfig | null>;
  getAllRoutes(): Promise<RouteConfig[]>;
}
```

#### Componente 2: EnvFileManager

**Responsabilidad:**
- Lectura y escritura exclusiva de archivos `.env`
- Parsing de formato KEY=value
- Serialización de arrays a CSV strings
- Operaciones atómicas con backup

**Dependencias:**
- fs/promises (Node.js)
- LoggerService

**Expone:**
```typescript
interface IEnvFileManager {
  readPaths(): Promise<string[]>;
  writePaths(paths: string[]): Promise<void>;
  backupEnv(): Promise<string>;
  restoreEnv(backupPath: string): Promise<void>;
}
```

#### Componente 3: JsonConfigManager

**Responsabilidad:**
- Lectura y escritura de archivo JSON de configuración
- Validación con schemas Zod
- Merge de configuraciones
- Migraciones de versión

**Dependencias:**
- fs/promises
- Zod (validación)
- LoggerService

**Expone:**
```typescript
interface IJsonConfigManager {
  read(): Promise<JsonConfig>;
  write(config: JsonConfig): Promise<void>;
  validate(config: unknown): JsonConfig;
  mergeDefaults(paths: string[]): JsonConfig;
  migrate(oldConfig: JsonConfig): JsonConfig;
}
```

#### Componente 4: FileWatcherService

**Responsabilidad:**
- Monitorear cambios en `.env` y JSON
- Emitir eventos al detectar modificaciones
- Debouncing para evitar múltiples triggers
- Manejo de errores en file system

**Dependencias:**
- Chokidar (file watching)
- EventEmitter (NestJS)
- LoggerService

**Expone:**
```typescript
interface IFileWatcherService {
  watchEnvFile(callback: () => void): void;
  watchJsonFile(callback: () => void): void;
  stopWatching(): void;
  on(event: 'config-changed', handler: () => void): void;
}
```

---

## 3. Modelos de Datos

### 3.1. Core Entities

#### Entity: RouteConfig

```typescript
/**
 * Complete route configuration with metadata
 * Merged from .env path + JSON metadata
 */
export interface RouteConfig {
  /** File system path (from .env) */
  path: string;
  
  /** Unique identifier (generated from path) */
  id: string;
  
  /** Human-readable description */
  description?: string;
  
  /** Whether route is active for indexing */
  isActive: boolean;
  
  /** Search priority (higher = more relevant) */
  priority: number;
  
  /** Tags for categorization */
  tags: string[];
  
  /** Route category */
  category: RouteCategory;
  
  /** Statistics */
  documentCount?: number;
  lastIndexed?: Date;
  
  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

export enum RouteCategory {
  INTERNAL = 'internal',
  PROJECT = 'project',
  WORKSPACE = 'workspace',
  EXTERNAL = 'external',
}
```

#### Entity: JsonConfig

```typescript
/**
 * Complete JSON configuration file structure
 */
export interface JsonConfig {
  /** Schema version for migrations */
  version: string;
  
  /** Last modification timestamp */
  lastUpdated: Date;
  
  /** Global settings */
  settings: {
    autoReindex: boolean;
    watchMode: boolean;
    debounceMs: number;
  };
  
  /** Route metadata indexed by path */
  routes: Record<string, RouteMetadata>;
}

export interface RouteMetadata {
  id: string;
  description?: string;
  priority: number;
  isActive: boolean;
  tags: string[];
  category: RouteCategory;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2. DTOs (Data Transfer Objects)

#### DTO: CreateRouteDto

```typescript
export class CreateRouteDto {
  @IsString()
  @IsNotEmpty()
  path: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  priority?: number = 5;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[] = [];

  @IsEnum(RouteCategory)
  @IsOptional()
  category?: RouteCategory = RouteCategory.EXTERNAL;
}
```

#### DTO: UpdateRouteDto

```typescript
export class UpdateRouteDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  priority?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsEnum(RouteCategory)
  @IsOptional()
  category?: RouteCategory;
}
```

### 3.3. Response Types

```typescript
export interface RouteResponse {
  success: boolean;
  route?: RouteConfig;
  message: string;
}

export interface RoutesListResponse {
  success: boolean;
  routes: RouteConfig[];
  total: number;
}

export interface ConsistencyReport {
  isConsistent: boolean;
  issues: ConsistencyIssue[];
  autoFixed: string[];
}

export interface ConsistencyIssue {
  type: 'missing_env' | 'missing_json' | 'invalid_path';
  path: string;
  message: string;
  severity: 'error' | 'warning';
}
```

---

## 4. Interfaces y Contratos

### 4.1. API Endpoints

#### GET /config/routes

**Descripción:** Obtener todas las rutas configuradas con su metadata

**Request:** Ninguno

**Response:**
```json
{
  "success": true,
  "routes": [
    {
      "path": "/mnt/docs/AKURI",
      "id": "akuri-core-docs",
      "description": "Documentación core de Akuri",
      "isActive": true,
      "priority": 1,
      "tags": ["core", "methodology"],
      "category": "internal",
      "documentCount": 42,
      "lastIndexed": "2025-11-28T03:00:00Z",
      "createdAt": "2025-11-01T00:00:00Z",
      "updatedAt": "2025-11-28T03:00:00Z"
    }
  ],
  "total": 1
}
```

**Códigos de Estado:**
- 200: Success
- 500: Internal server error

---

#### POST /config/routes

**Descripción:** Agregar nueva ruta de documentación

**Request Body:**
```json
{
  "path": "/mnt/docs/new-project",
  "description": "Nueva documentación de proyecto",
  "priority": 3,
  "tags": ["project", "external"],
  "category": "project"
}
```

**Response:**
```json
{
  "success": true,
  "route": { /* RouteConfig object */ },
  "message": "Route added successfully with 15 documents"
}
```

**Códigos de Estado:**
- 201: Created
- 400: Invalid input
- 409: Route already exists
- 500: Internal server error

---

#### PATCH /config/routes/:encodedPath

**Descripción:** Actualizar metadata de ruta existente

**Request Params:**
- `encodedPath`: URL-encoded path string

**Request Body:**
```json
{
  "description": "Updated description",
  "priority": 2,
  "tags": ["updated", "tag"]
}
```

**Response:**
```json
{
  "success": true,
  "route": { /* Updated RouteConfig */ },
  "message": "Route updated successfully"
}
```

**Códigos de Estado:**
- 200: Success
- 400: Invalid input
- 404: Route not found
- 500: Internal server error

---

#### DELETE /config/routes/:encodedPath

**Descripción:** Eliminar ruta de configuración

**Request Params:**
- `encodedPath`: URL-encoded path string

**Response:**
```json
{
  "success": true,
  "message": "Route removed successfully"
}
```

**Códigos de Estado:**
- 200: Success
- 404: Route not found
- 500: Internal server error

---

#### POST /config/validate-consistency

**Descripción:** Validar y auto-reparar inconsistencias entre .env y JSON

**Request:** Ninguno

**Response:**
```json
{
  "isConsistent": false,
  "issues": [
    {
      "type": "missing_env",
      "path": "/old/path",
      "message": "JSON entry exists but path not in .env",
      "severity": "warning"
    }
  ],
  "autoFixed": [
    "Removed JSON entry for /old/path"
  ]
}
```

**Códigos de Estado:**
- 200: Success
- 500: Internal server error

---

### 4.2. Service Interfaces

#### Interface: IHybridRouteConfigService

```typescript
export interface IHybridRouteConfigService {
  /**
   * Load complete configuration (merge .env + JSON)
   * @returns Array of RouteConfig
   */
  loadConfig(): Promise<RouteConfig[]>;

  /**
   * Add new route
   * @param dto - Route creation data
   * @returns Created RouteConfig
   * @throws BadRequestException if validation fails
   * @throws ConflictException if route already exists
   */
  addRoute(dto: CreateRouteDto): Promise<RouteConfig>;

  /**
   * Update route metadata
   * @param path - Route path to update
   * @param dto - Update data
   * @returns Updated RouteConfig
   * @throws NotFoundException if route doesn't exist
   */
  updateRoute(path: string, dto: UpdateRouteDto): Promise<RouteConfig>;

  /**
   * Remove route from configuration
   * @param path - Route path to remove
   * @throws NotFoundException if route doesn't exist
   */
  removeRoute(path: string): Promise<void>;

  /**
   * Validate consistency between .env and JSON
   * @returns Consistency report with auto-fixes applied
   */
  validateConsistency(): Promise<ConsistencyReport>;

  /**
   * Get single route by path
   * @param path - Route path
   * @returns RouteConfig or null
   */
  getRoute(path: string): Promise<RouteConfig | null>;

  /**
   * Get all routes
   * @returns Array of all RouteConfig
   */
  getAllRoutes(): Promise<RouteConfig[]>;
}
```

---

## 5. Flujo de Datos

### 5.1. Flujo de Inicio del Sistema

```
1. Application Bootstrap
   └─> HybridRouteConfigService.onModuleInit()
       ├─> EnvFileManager.readPaths()
       │   └─> Parse AKURI_DOCS_PATH from .env
       │       └─> Returns: ['/path1', '/path2']
       │
       ├─> JsonConfigManager.read()
       │   ├─> Read .akuri/routes-config.json
       │   ├─> If not exists: return empty config
       │   └─> Validate with Zod schema
       │       └─> Returns: JsonConfig object
       │
       ├─> Merge paths with metadata
       │   └─> For each path in .env:
       │       ├─> Find matching metadata in JSON
       │       ├─> Apply defaults if not found
       │       └─> Create RouteConfig object
       │
       ├─> validateConsistency()
       │   ├─> Check JSON entries without .env path
       │   │   └─> Auto-remove (log warning)
       │   ├─> Check .env paths without JSON
       │   │   └─> Create default metadata
       │   └─> Return ConsistencyReport
       │
       └─> FileWatcherService.start()
           ├─> Watch .env for changes
           └─> Watch .akuri/routes-config.json for changes
```

### 5.2. Flujo de Agregar Ruta

```
User Action: POST /config/routes
   │
   ├─> ConfigController.addRoute(dto)
   │   └─> HybridRouteConfigService.addRoute(dto)
   │       │
   │       ├─> 1. Validate path
   │       │   ├─> Check path exists
   │       │   ├─> Check is directory
   │       │   ├─> Check contains documents
   │       │   └─> If invalid: throw BadRequestException
   │       │
   │       ├─> 2. Check for duplicates
   │       │   ├─> loadConfig()
   │       │   └─> If exists: throw ConflictException
   │       │
   │       ├─> 3. Create backup (atomic operation)
   │       │   ├─> EnvFileManager.backupEnv()
   │       │   └─> JsonConfigManager.backup()
   │       │
   │       ├─> 4. Update .env (try)
   │       │   ├─> currentPaths = EnvFileManager.readPaths()
   │       │   ├─> currentPaths.push(dto.path)
   │       │   └─> EnvFileManager.writePaths(currentPaths)
   │       │
   │       ├─> 5. Update JSON (try)
   │       │   ├─> config = JsonConfigManager.read()
   │       │   ├─> config.routes[dto.path] = metadata
   │       │   ├─> config.lastUpdated = new Date()
   │       │   └─> JsonConfigManager.write(config)
   │       │
   │       ├─> 6. Trigger reindex (catch)
   │       │   └─> EventEmitter.emit('routes-changed')
   │       │       └─> LibrarianService.reindex()
   │       │
   │       └─> 7. Return RouteConfig (on error: rollback)
   │
   └─> Response: { success: true, route: { ... } }
```

### 5.3. Flujo de Hot Reload

```
External Change: .env file modified
   │
   ├─> FileWatcherService detects change
   │   └─> Debounce 500ms (avoid multiple triggers)
   │       └─> Emit 'env-changed' event
   │
   └─> HybridRouteConfigService listener
       │
       ├─> 1. Reload configuration
       │   ├─> envPaths = EnvFileManager.readPaths()
       │   ├─> jsonConfig = JsonConfigManager.read()
       │   └─> mergedConfig = merge(envPaths, jsonConfig)
       │
       ├─> 2. Validate consistency
       │   └─> validateConsistency()
       │       └─> Auto-fix if needed
       │
       ├─> 3. Update in-memory cache
       │   └─> this.cachedConfig = mergedConfig
       │
       ├─> 4. Emit application event
       │   └─> EventEmitter.emit('config-reloaded')
       │
       └─> 5. Trigger reindex
           └─> LibrarianService.reindex()
               └─> Log: "Configuration reloaded, reindexing..."
```

### 5.4. Flujo de Eliminación de Ruta

```
User Action: DELETE /config/routes/:path
   │
   ├─> ConfigController.removeRoute(path)
   │   └─> HybridRouteConfigService.removeRoute(path)
   │       │
   │       ├─> 1. Verify route exists
   │       │   ├─> getRoute(path)
   │       │   └─> If not found: throw NotFoundException
   │       │
   │       ├─> 2. Create backups
   │       │   ├─> EnvFileManager.backupEnv()
   │       │   └─> JsonConfigManager.backup()
   │       │
   │       ├─> 3. Remove from .env (try)
   │       │   ├─> currentPaths = EnvFileManager.readPaths()
   │       │   ├─> filteredPaths = currentPaths.filter(p => p !== path)
   │       │   └─> EnvFileManager.writePaths(filteredPaths)
   │       │
   │       ├─> 4. Remove from JSON (try)
   │       │   ├─> config = JsonConfigManager.read()
   │       │   ├─> delete config.routes[path]
   │       │   ├─> config.lastUpdated = new Date()
   │       │   └─> JsonConfigManager.write(config)
   │       │
   │       ├─> 5. Trigger reindex (catch)
   │       │   └─> EventEmitter.emit('routes-changed')
   │       │
   │       └─> 6. Success (on error: rollback)
   │
   └─> Response: { success: true, message: "..." }
```

---

## 6. Patrones de Diseño

### 6.1. Patrón: Facade Pattern

**Dónde:** HybridRouteConfigService

**Por qué:** Simplificar la interfaz compleja de dos sistemas de almacenamiento

**Cómo:** El servicio oculta la complejidad de coordinar .env y JSON, exponiendo una API simple y unificada. Los clientes no necesitan saber sobre el sistema híbrido.

```typescript
// Client code (simple)
const routes = await hybridService.getAllRoutes();

// Behind the scenes (complex)
// - Read from .env
// - Read from JSON
// - Merge data
// - Validate consistency
// - Apply defaults
```

### 6.2. Patrón: Strategy Pattern

**Dónde:** EnvFileManager y JsonConfigManager

**Por qué:** Diferentes estrategias de almacenamiento intercambiables

**Cómo:** Ambos managers implementan una interfaz común de lectura/escritura, permitiendo cambiar la estrategia de almacenamiento en el futuro (ej: migrar a SQLite).

```typescript
interface IStorageManager {
  read(): Promise<any>;
  write(data: any): Promise<void>;
}

class EnvFileManager implements IStorageManager { ... }
class JsonConfigManager implements IStorageManager { ... }
// Future: class SQLiteManager implements IStorageManager { ... }
```

### 6.3. Patrón: Observer Pattern

**Dónde:** FileWatcherService

**Por qué:** Reaccionar a cambios en archivos de configuración

**Cómo:** FileWatcherService emite eventos cuando detecta cambios. Múltiples listeners pueden suscribirse para reaccionar (reindex, update cache, log).

```typescript
fileWatcher.on('config-changed', () => {
  this.reloadConfig();
  this.librarianService.reindex();
  this.logger.info('Config reloaded');
});
```

### 6.4. Patrón: Command Pattern con Rollback

**Dónde:** Operaciones de escritura (add, update, remove)

**Por qué:** Garantizar atomicidad y permitir rollback

**Cómo:** Cada operación crea backups antes de modificar. Si hay error, restaura desde backup.

```typescript
async addRoute(dto: CreateRouteDto) {
  const envBackup = await this.envManager.backupEnv();
  const jsonBackup = await this.jsonManager.backup();
  
  try {
    await this.envManager.writePaths([...paths, dto.path]);
    await this.jsonManager.write(config);
  } catch (error) {
    await this.envManager.restoreEnv(envBackup);
    await this.jsonManager.restore(jsonBackup);
    throw error;
  }
}
```

### 6.5. Patrón: Cache-Aside

**Dónde:** HybridRouteConfigService

**Por qué:** Optimizar lecturas frecuentes

**Cómo:** Mantener configuración en memoria, invalida cache al detectar cambios.

```typescript
private cachedConfig: RouteConfig[] | null = null;

async getAllRoutes() {
  if (this.cachedConfig) {
    return this.cachedConfig;
  }
  
  this.cachedConfig = await this.loadConfig();
  return this.cachedConfig;
}

private invalidateCache() {
  this.cachedConfig = null;
}
```

---

## 7. Decisiones de Arquitectura

### 7.1. Decisión: .env como Source of Truth para Paths

**Contexto:** Necesidad de decidir qué archivo tiene prioridad en caso de conflicto

**Opciones Consideradas:**
1. `.env` como fuente de verdad
2. JSON como fuente de verdad
3. Última modificación gana

**Decisión:** `.env` como fuente de verdad

**Justificación:**
- Backward compatibility con código existente
- `.env` es más simple y menos propenso a corrupción
- Usuarios básicos solo necesitan tocar `.env`
- JSON es opcional y extendido

**Consecuencias:**
- ✅ Compatible con sistema actual
- ✅ Degradación graciosa si JSON falta
- ⚠️ JSON entries huérfanos deben limpiarse

### 7.2. Decisión: Atomic Operations con Backup

**Contexto:** Prevenir corrupción de datos en operaciones fallidas

**Opciones Consideradas:**
1. Sin backup, best effort
2. Backup antes de cada operación
3. Transacciones con journal

**Decisión:** Backup antes de cada operación con rollback

**Justificación:**
- Balance entre seguridad y complejidad
- Fácil implementar con file system
- Transacciones completas requieren SQLite
- Archivos pequeños hacen backup rápido

**Consecuencias:**
- ✅ Operaciones atómicas garantizadas
- ✅ Fácil de implementar
- ⚠️ Overhead de I/O en cada escritura
- ⚠️ Backups ocupan espacio (limpieza periódica)

### 7.3. Decisión: Hot Reload con Debouncing

**Contexto:** Evitar múltiples reindexaciones por ediciones rápidas

**Opciones Consideradas:**
1. Reindex inmediato en cada cambio
2. Debounce 500ms
3. Manual trigger solo

**Decisión:** Debounce 500ms con auto-reindex

**Justificación:**
- Balance entre reactividad y eficiencia
- Múltiples ediciones rápidas son comunes
- 500ms imperceptible para usuarios
- Auto-reindex mantiene data sincronizada

**Consecuencias:**
- ✅ No múltiples reindexes innecesarios
- ✅ UX responsive
- ⚠️ Delay mínimo en aplicar cambios
- ⚠️ Requiere gestión de timers

### 7.4. Decisión: Zod para Validación en lugar de Class-Validator

**Contexto:** Validación de JSON schema y DTOs

**Opciones Consideradas:**
1. Zod (ya en proyecto)
2. Class-validator (NestJS standard)
3. Joi

**Decisión:** Usar Zod

**Justificación:**
- Ya existe en dependencias
- Perfecto para validar JSON files
- Type inference automático
- Mejor para estructuras dinámicas

**Consecuencias:**
- ✅ Zero nuevas dependencias
- ✅ Type-safe compilation
- ⚠️ Mezcla con class-validator en controllers
- ⚠️ Documentación NestJS usa class-validator

### 7.5. Decisión: Ubicación del JSON Config

**Contexto:** Dónde almacenar el archivo JSON

**Opciones Consideradas:**
1. `akuri-acp/.akuri/routes-config.json`
2. `akuri-acp/public/.akuri/config/`
3. `akuri-acp/config/routes.json`

**Decisión:** `akuri-acp/.akuri/routes-config.json`

**Justificación:**
- Convención Akuri (`.akuri/` para archivos del sistema)
- Fuera de `public/` (no accesible vía web)
- Consistente con estructura existente
- Fácil encontrar

**Consecuencias:**
- ✅ Siguiendo convenciones del proyecto
- ✅ Seguridad (no web-accessible)
- ✅ Co-located con documentación Akuri

---

## 8. Validaciones Zod Schema

### 8.1. RouteMetadata Schema

```typescript
import { z } from 'zod';

export const RouteMetadataSchema = z.object({
  id: z.string().min(1),
  description: z.string().optional(),
  priority: z.number().int().min(0).max(10).default(5),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  category: z.enum(['internal', 'project', 'workspace', 'external']).default('external'),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type RouteMetadata = z.infer<typeof RouteMetadataSchema>;
```

### 8.2. JsonConfig Schema

```typescript
export const JsonConfigSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  lastUpdated: z.coerce.date(),
  settings: z.object({
    autoReindex: z.boolean().default(true),
    watchMode: z.boolean().default(true),
    debounceMs: z.number().int().min(100).max(5000).default(500),
  }),
  routes: z.record(z.string(), RouteMetadataSchema),
});

export type JsonConfig = z.infer<typeof JsonConfigSchema>;
```

### 8.3. CreateRouteDto Schema

```typescript
export const CreateRouteDtoSchema = z.object({
  path: z.string().min(1),
  description: z.string().optional(),
  priority: z.number().int().min(0).max(10).optional().default(5),
  isActive: z.boolean().optional().default(true),
  tags: z.array(z.string()).optional().default([]),
  category: z.enum(['internal', 'project', 'workspace', 'external']).optional().default('external'),
});

export type CreateRouteDto = z.infer<typeof CreateRouteDtoSchema>;
```

---

## 9. Dependencias

### 9.1. Externas (Ya Existentes)

- **@nestjs/common v11.0.1:** Framework principal
- **@nestjs/config v4.0.2:** Gestión de variables de entorno
- **zod v3.25.76:** Validación de schemas
- **chokidar v4.0.3:** File watching
- **winston v3.18.3:** Logging estructurado

### 9.2. Internas

- **AkuriConfigService:** Legacy service (a migrar gradualmente)
- **LibrarianService:** Reindexación de documentos
- **LoggerService:** Logging centralizado

### 9.3. Nuevas Dependencias

**Ninguna** - Todo se implementa con dependencias existentes

---

## 10. Consideraciones de Seguridad

### 10.1. Path Traversal Prevention

```typescript
// Validación de paths
private validatePath(path: string): void {
  const normalized = path.normalize(path);
  
  // Prevent path traversal
  if (normalized.includes('..')) {
    throw new BadRequestException('Path traversal not allowed');
  }
  
  // Only allow absolute paths
  if (!path.isAbsolute(normalized)) {
    throw new BadRequestException('Only absolute paths allowed');
  }
  
  // Check path exists and is directory
  if (!fs.existsSync(normalized) || !fs.statSync(normalized).isDirectory()) {
    throw new BadRequestException('Path must be an existing directory');
  }
}
```

### 10.2. Input Sanitization

```typescript
// Sanitizar inputs de usuario
private sanitizePath(path: string): string {
  return path
    .trim()
    .replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, '') // Remove special chars
    .replace(/\/{2,}/g, '/'); // Normalize slashes
}
```

### 10.3. File Permissions

- `.env`: Solo lectura para usuario de aplicación
- JSON config: Read/Write para aplicación, no web-accessible
- Backups: Carpeta con permisos restrictivos (700)

### 10.4. Logging Sensitivo

```typescript
// No loggear paths completos en producción
this.logger.info('Route added', {
  pathHash: crypto.createHash('sha256').update(path).digest('hex'),
  category: route.category
});
```

---

## 11. Consideraciones de Performance

### 11.1. Caching Strategy

```typescript
export class HybridRouteConfigService {
  private configCache: {
    data: RouteConfig[] | null;
    timestamp: number;
    ttl: number; // 5 minutes
  } = { data: null, timestamp: 0, ttl: 300000 };

  async getAllRoutes(): Promise<RouteConfig[]> {
    const now = Date.now();
    
    // Return from cache if valid
    if (this.configCache.data && 
        (now - this.configCache.timestamp) < this.configCache.ttl) {
      return this.configCache.data;
    }
    
    // Load fresh data
    const routes = await this.loadConfig();
    this.configCache = { data: routes, timestamp: now, ttl: this.configCache.ttl };
    
    return routes;
  }
}
```

### 11.2. Debouncing File Watchers

```typescript
export class FileWatcherService {
  private envDebounce: Timer | null = null;
  private jsonDebounce: Timer | null = null;
  
  watchEnvFile(callback: () => void): void {
    this.watcher.on('change', (path) => {
      if (path.endsWith('.env')) {
        // Clear previous timer
        if (this.envDebounce) clearTimeout(this.envDebounce);
        
        // Set new timer
        this.envDebounce = setTimeout(() => {
          callback();
          this.envDebounce = null;
        }, 500); // 500ms debounce
      }
    });
  }
}
```

### 11.3. Lazy Loading de Metadata

```typescript
// Solo cargar metadata cuando se solicita
async getRoute(path: string): Promise<RouteConfig | null> {
  // Quick check in .env
  const paths = await this.envManager.readPaths();
  if (!paths.includes(path)) {
    return null;
  }
  
  // Load metadata only if path exists
  const jsonConfig = await this.jsonManager.read();
  return this.mergeRouteConfig(path, jsonConfig.routes[path]);
}
```

### 11.4. Benchmarks Objetivo

- **Cold start:** < 100ms (cargar configuración inicial)
- **Cache hit:** < 5ms (lectura desde memoria)
- **Add route:** < 150ms (validación + escritura + reindex trigger)
- **Remove route:** < 100ms (escritura de archivos)
- **File change detection:** < 50ms (evento de watcher)
- **Hot reload:** < 200ms (reload + cache update)

---

## 12. Testing Strategy

### 12.1. Unit Tests

**EnvFileManager Tests:**
```typescript
describe('EnvFileManager', () => {
  it('should read paths from .env file', async () => {
    // Test parsing AKURI_DOCS_PATH
  });
  
  it('should write paths array to .env', async () => {
    // Test CSV serialization
  });
  
  it('should create backup before writing', async () => {
    // Test atomic operations
  });
  
  it('should restore from backup on error', async () => {
    // Test rollback
  });
});
```

**JsonConfigManager Tests:**
```typescript
describe('JsonConfigManager', () => {
  it('should validate JSON with Zod schema', async () => {
    // Test schema validation
  });
  
  it('should return default config if file not exists', async () => {
    // Test degradation
  });
  
  it('should merge defaults for missing metadata', async () => {
    // Test default values
  });
  
  it('should migrate old config versions', async () => {
    // Test version migrations
  });
});
```

**HybridRouteConfigService Tests:**
```typescript
describe('HybridRouteConfigService', () => {
  it('should merge .env and JSON correctly', async () => {
    // Test merge logic
  });
  
  it('should auto-fix consistency issues', async () => {
    // Test auto-repair
  });
  
  it('should handle missing JSON gracefully', async () => {
    // Test backward compatibility
  });
  
  it('should rollback on error', async () => {
    // Test atomic operations
  });
});
```

### 12.2. Integration Tests

```typescript
describe('Hybrid Config System (Integration)', () => {
  it('should add route and update both files', async () => {
    // E2E: POST /config/routes
    // Verify .env updated
    // Verify JSON updated
    // Verify reindex triggered
  });
  
  it('should detect external .env changes', async () => {
    // Modify .env externally
    // Wait for file watcher
    // Verify config reloaded
    // Verify cache invalidated
  });
  
  it('should maintain consistency on partial failure', async () => {
    // Mock JSON write failure
    // Verify .env rolled back
    // Verify original state preserved
  });
});
```

### 12.3. E2E Tests

```typescript
describe('Routes Management (E2E)', () => {
  it('should complete full CRUD lifecycle', async () => {
    // Create route
    // Read routes
    // Update metadata
    // Delete route
    // Verify all steps
  });
  
  it('should handle concurrent operations', async () => {
    // Multiple simultaneous adds
    // Verify no race conditions
    // Verify data consistency
  });
});
```

### 12.4. Test Coverage Goals

- **Unit Tests:** > 80% coverage
- **Integration Tests:** All critical flows
- **E2E Tests:** Main user scenarios
- **Performance Tests:** Benchmark validations

---

## 13. Riesgos y Mitigaciones

### 13.1. Riesgo: Desincronización .env ↔ JSON

**Probabilidad:** Media  
**Impacto:** Alto  

**Mitigación:**
```typescript
// Run on startup and periodically
async validateConsistency(): Promise<ConsistencyReport> {
  const envPaths = await this.envManager.readPaths();
  const jsonConfig = await this.jsonManager.read();
  const issues: ConsistencyIssue[] = [];
  const autoFixed: string[] = [];
  
  // Check for orphaned JSON entries
  for (const path in jsonConfig.routes) {
    if (!envPaths.includes(path)) {
      delete jsonConfig.routes[path];
      issues.push({
        type: 'missing_env',
        path,
        message: 'JSON entry exists but path not in .env',
        severity: 'warning'
      });
      autoFixed.push(`Removed JSON entry for ${path}`);
    }
  }
  
  // Check for paths without metadata
  for (const path of envPaths) {
    if (!jsonConfig.routes[path]) {
      jsonConfig.routes[path] = this.createDefaultMetadata(path);
      autoFixed.push(`Created default metadata for ${path}`);
    }
  }
  
  // Save fixes
  if (autoFixed.length > 0) {
    await this.jsonManager.write(jsonConfig);
  }
  
  return { isConsistent: issues.length === 0, issues, autoFixed };
}
```

### 13.2. Riesgo: Race Conditions en Escrituras

**Probabilidad:** Baja  
**Impacto:** Alto  

**Mitigación:**
```typescript
// Use queue for serializing writes
import { Queue } from 'async';

export class HybridRouteConfigService {
  private writeQueue: Queue = queue(async (task: WriteTask) => {
    await task.execute();
  }, 1); // Concurrency: 1
  
  async addRoute(dto: CreateRouteDto): Promise<RouteConfig> {
    return new Promise((resolve, reject) => {
      this.writeQueue.push({
        execute: async () => {
          try {
            const result = await this._addRouteInternal(dto);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }
      });
    });
  }
}
```

### 13.3. Riesgo: Corrupción de Archivos

**Probabilidad:** Muy Baja  
**Impacto:** Alto  

**Mitigación:**
```typescript
// Atomic writes with temp files
async writePathsSafe(paths: string[]): Promise<void> {
  const tempFile = `${this.envPath}.tmp`;
  const content = this.serialize(paths);
  
  try {
    // Write to temp file
    await fs.writeFile(tempFile, content, 'utf8');
    
    // Verify temp file
    const verified = await fs.readFile(tempFile, 'utf8');
    if (verified !== content) {
      throw new Error('File verification failed');
    }
    
    // Atomic rename
    await fs.rename(tempFile, this.envPath);
    
  } catch (error) {
    // Clean up temp file
    await fs.unlink(tempFile).catch(() => {});
    throw error;
  }
}
```

### 13.4. Riesgo: Performance Degradation con Muchas Rutas

**Probabilidad:** Baja  
**Impacto:** Medio  

**Mitigación:**
- Implementar paginación en API si > 50 rutas
- Agregar índices en memoria para búsquedas rápidas
- Considerar migración a SQLite si > 100 rutas
- Monitoreo de performance con métricas

---

## 14. Plan de Migración

### 14.1. Fase 1: Implementación Core (Semana 1)

**Día 1-2: Setup y Schemas**
- [ ] Crear estructura de carpetas `.akuri/`
- [ ] Definir schemas Zod completos
- [ ] Crear interfaces TypeScript
- [ ] Setup testing framework

**Día 3-4: Managers**
- [ ] Implementar EnvFileManager con tests
- [ ] Implementar JsonConfigManager con tests
- [ ] Implementar FileWatcherService con tests
- [ ] Testing de integración entre managers

**Día 5: Service Principal**
- [ ] Implementar HybridRouteConfigService
- [ ] Lógica de merge .env + JSON
- [ ] Validación de consistencia
- [ ] Auto-repair functionality
- [ ] Unit tests completos

### 14.2. Fase 2: API y UI (Semana 2)

**Día 1-2: API Endpoints**
- [ ] Actualizar ConfigController con nuevos endpoints
- [ ] Implementar DTOs y validación
- [ ] Error handling robusto
- [ ] Integration tests

**Día 3-4: UI Dashboard**
- [ ] Actualizar `rutas.html` con campos de metadata
- [ ] Formularios para descripción, tags, prioridad
- [ ] Vista simple vs avanzada
- [ ] UX improvements

**Día 5: Testing E2E**
- [ ] E2E tests completos
- [ ] Performance benchmarks
- [ ] Load testing
- [ ] Bug fixes

### 14.3. Fase 3: Deployment y Validación (Semana 3)

**Día 1-2: Migración de Datos**
- [ ] Script de migración automática desde `.env` actual
- [ ] Generar JSON inicial con metadata por defecto
- [ ] Validación de migración
- [ ] Backup de configuración actual

**Día 3-4: Deploy y Monitoreo**
- [ ] Deploy a staging
- [ ] Testing en ambiente real
- [ ] Monitoreo de logs y performance
- [ ] Documentación de usuario

**Día 5: Productivo**
- [ ] Deploy a producción
- [ ] Monitoreo activo 24h
- [ ] Support y bug fixes
- [ ] Recopilación de feedback

---

## 15. Métricas de Éxito

### 15.1. Métricas Técnicas

- [ ] **Test Coverage:** > 80% unit tests, 100% critical paths
- [ ] **Performance:** Todos los benchmarks cumplidos
- [ ] **Zero Breaking Changes:** Sistema legacy funciona sin modificaciones
- [ ] **Zero Data Loss:** Migración 100% exitosa
- [ ] **Hot Reload:** < 500ms desde cambio hasta aplicación

### 15.2. Métricas de Negocio

- [ ] **Tiempo de Configuración:** Reducido de 5min (reinicio) a < 10s (hot reload)
- [ ] **User Satisfaction:** > 90% feedback positivo
- [ ] **Support Tickets:** No aumento por el cambio
- [ ] **Adoption:** 100% usuarios migrados en 1 semana

---

## 16. Próximos Pasos

1. **Revisión de Diseño:** Validar con equipo técnico
2. **Aprobación:** Get stakeholder buy-in
3. **Crear Documento PLAN:** Descomponer en tasks granulares
4. **Sprint Planning:** Asignar recursos y timeline
5. **Implementación:** Seguir plan de migración en fases

---

## 17. Referencias Cruzadas

- **Documento RESEARCH:** [`RESEARCH.dynamic-documentation-routes-storage.md`](RESEARCH.dynamic-documentation-routes-storage.md)
- **Código Actual:**
  - [`AkuriConfigService`](akuri-acp/src/akuri-core/config/config.service.ts)
  - [`ConfigController`](akuri-acp/src/config.controller.ts)
  - [`rutas.html`](akuri-acp/public/rutas.html)
- **Documentación Externa:**
  - [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)
  - [Zod Documentation](https://zod.dev/)
  - [Chokidar File Watching](https://github.com/paulmillr/chokidar)

---

## 18. Checklist de Conformidad

- [x] Todos los requisitos funcionales están documentados
- [x] Todos los requisitos no funcionales están especificados
- [x] Los componentes principales están identificados con responsabilidades claras
- [x] Las interfaces y contratos están definidos con TypeScript
- [x] Los modelos de datos están completamente especificados
- [x] El flujo de datos está claro con diagramas
- [x] Los patrones de diseño están justificados
- [x] Las dependencias están listadas (zero nuevas)
- [x] Las decisiones arquitectónicas están documentadas con justificación
- [x] Los riesgos están identificados con mitigaciones concretas
- [x] La estrategia de testing está definida exhaustivamente
- [x] Consideraciones de seguridad están cubiertas
- [x] Consideraciones de performance están cubiertas
- [x] Plan de migración está detallado en fases
- [x] Métricas de éxito están definidas

---

**Documento completado:** 2025-11-28  
**Estado:** Ready for PLAN phase  
**Próximo Documento:** [PLAN] Tasks granulares para implementación  
**Estimación Total:** 3 semanas (15 días hábiles)