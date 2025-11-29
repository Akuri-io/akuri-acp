---
trigger: on_demand
description: "Diseño detallado para implementar un sistema híbrido de configuración de rutas de documentación que combina paths fijos del .env con paths dinámicos editables vía interfaz web, sin requerir reinicio del servidor."
status: active
version: 1.0.0
last_updated: "2025-11-29"
author: "Kilo Code"
use_case: [DESIGN, BUILD]
tags: [paths, configuración, json, api, nestjs, frontend]
---

# [DESIGN] Sistema Híbrido de Gestión Dinámica de Rutas de Documentación

> **Propósito de este documento:** Especificar la implementación completa del sistema híbrido de rutas que permite gestionar paths de documentación de forma dinámica sin reinicio del servidor.

---

## 1. Resumen y Contexto

### 1.1. Propósito de este Documento

Este documento especifica la implementación completa del sistema híbrido de rutas de documentación que combina:
- Rutas fijas definidas en variables de entorno (.env)
- Rutas dinámicas editables vía interfaz web
- Gestión sin reinicio del servidor MCP
- Persistencia en formato JSON

### 1.2. Relación con High-Level Design

**HLD Asociado:** `[RESEARCH].dynamic-paths-management.md`

**Decisiones HLD que guían este DD:**
1. Opción 2 recomendada: JSON en Backend con Servicio Dedicado
2. Equilibra simplicidad, seguridad y mantenibilidad
3. Compatible con interfaz `rutas.html` existente
4. Sin reinicio requerido

**Tecnologías Confirmadas del HLD:**
- Framework: NestJS (Backend)
- Persistencia: JSON file system
- Frontend: HTML/JS existente
- Patrón: Servicio dedicado + API REST

### 1.3. Alcance de este DD

**Incluido:**
- ✅ Estructura completa de archivos y carpetas
- ✅ Especificación de servicios y controladores
- ✅ Definición completa de modelos de datos
- ✅ Endpoints API detallados
- ✅ Integración con sistema existente

**Excluido:**
- ❌ Implementación de código real
- ❌ Especificaciones visuales/UI (usa interfaz existente)
- ❌ Configuración de infraestructura

---

## 2. Documentos Guía

### 2.1. Documentos de Diseño Relacionados

#### Research Document
**Documento:** `[RESEARCH].dynamic-paths-management.md`
**Versión:** 1.0.0
**Secciones relevantes:**
- Opción 2: JSON en Backend con Servicio Dedicado
- Recomendación justificada
- Riesgos identificados

### 2.2. Documentos de Arquitectura del Proyecto

**Búsqueda con akuri_search_docs:**
```
Query: "nestjs file system service"
```

**Documentos encontrados:**
- NestJS File System documentation
- Node.js fs module patterns

### 2.3. Estándares y Convenciones

#### Naming Convention
**Documento:** `AKURI/akuri-guidelines/naming-convention/naming-convention.md`
**Convenciones aplicables:**
- Servicios: `[Feature]Service`
- Controladores: `[Feature]Controller`
- DTOs: `[Action][Feature]Dto`

#### Framework Best Practices
**Documento:** `AKURI/akuri-guidelines/frameworks/nestjs/nestjs-best-practices.md`
**Prácticas aplicadas:**
- Inyección de dependencias
- Validación con class-validator
- Estructura modular

---

## 3. Arquitectura de Carpetas y Archivos

### 3.1. Estructura Completa de Carpetas

```
akuri-acp/
├── public/
│   └── paths/
│       └── paths.json          # Archivo de rutas dinámicas
├── src/
│   ├── config/
│   │   └── paths.config.ts     # Configuración de paths
│   ├── paths/
│   │   ├── dto/
│   │   │   ├── create-path.dto.ts
│   │   │   ├── update-path.dto.ts
│   │   │   └── path-query.dto.ts
│   │   ├── entities/
│   │   │   └── path.entity.ts
│   │   ├── interfaces/
│   │   │   └── path.interface.ts
│   │   ├── paths.controller.ts
│   │   ├── paths.service.ts
│   │   ├── paths.module.ts
│   │   └── index.ts
│   └── app.module.ts            # Actualizar para incluir PathsModule
```

### 3.2. Justificación de Estructura

**Separación de Responsabilidades:**
- `public/paths/`: Almacenamiento persistente del JSON
- `src/paths/`: Lógica de negocio y API
- `config/`: Configuración centralizada

**Beneficios:**
- Modularidad: PathsModule independiente
- Mantenibilidad: Separación clara de concerns
- Escalabilidad: Fácil extensión futura

---

## 4. Especificación de Clases por Categoría

### 4.1. Servicios (Services)

#### 4.1.1. Clase: `PathsService`

**Archivo:** `src/paths/paths.service.ts`
**Tipo:** Service - Core Business Logic
**Responsabilidad:** Gestión de rutas dinámicas con persistencia JSON
**Dependencias:**
- `ConfigService` (para paths del .env)
- `fs` module de Node.js

**Propiedades:**
```typescript
private readonly pathsFilePath: string;
private readonly envPaths: string[];
private pathsCache: PathEntity[];
private lastModified: Date;
```

**Métodos:**

##### `loadPaths(): Promise<PathEntity[]>`
**Propósito:** Cargar rutas desde archivo JSON y combinar con .env
**Retorno:** `Promise<PathEntity[]>` - Lista completa de rutas
**Flujo:**
1. Leer archivo JSON si existe
2. Parsear contenido JSON
3. Combinar con rutas del .env
4. Actualizar cache
5. Retornar lista combinada

##### `savePaths(paths: PathEntity[]): Promise<void>`
**Propósito:** Guardar rutas dinámicas al archivo JSON
**Parámetros:**
- `paths: PathEntity[]` - Rutas a guardar
**Flujo:**
1. Validar estructura de datos
2. Serializar a JSON con formato legible
3. Escribir archivo de forma atómica
4. Actualizar timestamp de modificación

##### `createPath(dto: CreatePathDto): Promise<PathEntity>`
**Propósito:** Crear nueva ruta dinámica
**Parámetros:**
- `dto: CreatePathDto` - Datos de la nueva ruta
**Retorno:** `Promise<PathEntity>` - Ruta creada
**Flujo:**
1. Validar que no existe ruta con mismo name
2. Crear PathEntity con ID generado
3. Agregar a lista de rutas dinámicas
4. Guardar archivo
5. Retornar ruta creada

##### `updatePath(id: string, dto: UpdatePathDto): Promise<PathEntity>`
**Propósito:** Actualizar ruta existente
**Parámetros:**
- `id: string` - ID de la ruta
- `dto: UpdatePathDto` - Datos a actualizar
**Flujo:**
1. Buscar ruta por ID
2. Aplicar actualizaciones
3. Validar unicidad de name si cambió
4. Guardar archivo
5. Retornar ruta actualizada

##### `deletePath(id: string): Promise<void>`
**Propósito:** Eliminar ruta dinámica
**Parámetros:**
- `id: string` - ID de la ruta a eliminar
**Flujo:**
1. Verificar que existe
2. Remover de lista
3. Guardar archivo

##### `validatePath(path: string): Promise<boolean>`
**Propósito:** Validar que una ruta existe y es accesible
**Parámetros:**
- `path: string` - Ruta a validar
**Retorno:** `Promise<boolean>` - true si válida

**Tests Requeridos:**
- ✅ Carga correcta de rutas combinadas
- ✅ Persistencia atómica de cambios
- ✅ Validación de unicidad de nombres
- ✅ Manejo de errores de archivo

---

### 4.2. Controladores (Controllers)

#### 4.2.1. Clase: `PathsController`

**Archivo:** `src/paths/paths.controller.ts`
**Tipo:** Controller (NestJS)
**Responsabilidad:** Exponer API REST para gestión de rutas
**Decoradores:**
- `@Controller('paths')`
- `@UseGuards(AuthGuard)` (si aplica autenticación)

**Dependencias:**
```typescript
private readonly pathsService: PathsService;
```

**Endpoints:**

##### `@Get()`
##### `getAllPaths(): Promise<PathsResponse>`
**Propósito:** Obtener lista completa de rutas (fijas + dinámicas)
**HTTP Method:** GET
**Ruta:** `/api/paths`
**Response Status:** 200 OK
**Response Body:** `PathsResponse`
**Flujo:**
1. Llamar a `pathsService.loadPaths()`
2. Separar rutas fijas vs dinámicas en respuesta
3. Retornar con metadata

##### `@Post()`
##### `createPath(@Body() dto: CreatePathDto): Promise<PathResponse>`
**Propósito:** Crear nueva ruta dinámica
**HTTP Method:** POST
**Ruta:** `/api/paths`
**Request Body:** `CreatePathDto`
**Response Status:** 201 Created
**Flujo:**
1. Validar DTO
2. Llamar a `pathsService.createPath()`
3. Retornar ruta creada

##### `@Patch(':id')`
##### `updatePath(@Param('id') id: string, @Body() dto: UpdatePathDto): Promise<PathResponse>`
**Propósito:** Actualizar ruta dinámica
**HTTP Method:** PATCH
**Ruta:** `/api/paths/:id`
**Flujo:**
1. Validar ID y DTO
2. Llamar a `pathsService.updatePath()`
3. Retornar ruta actualizada

##### `@Delete(':id')`
##### `deletePath(@Param('id') id: string): Promise<DeleteResponse>`
**Propósito:** Eliminar ruta dinámica
**HTTP Method:** DELETE
**Ruta:** `/api/paths/:id`
**Flujo:**
1. Llamar a `pathsService.deletePath()`
2. Retornar confirmación

##### `@Post('validate')`
##### `validatePath(@Body() body: { path: string }): Promise<ValidationResponse>`
**Propósito:** Validar ruta antes de agregar
**HTTP Method:** POST
**Ruta:** `/api/paths/validate`
**Flujo:**
1. Llamar a `pathsService.validatePath()`
2. Retornar resultado de validación

---

## 5. Modelos de Datos (CRÍTICO)

### 5.1. Entities

#### 5.1.1. Entity: `PathEntity`

**Archivo:** `src/paths/entities/path.entity.ts`
**Propósito:** Representación de una ruta dinámica

**Definición Completa:**
```typescript
interface PathEntity {
  id: string;              // UUID
  name: string;            // Nombre descriptivo
  path: string;            // Ruta del sistema de archivos
  description?: string;    // Descripción opcional
  isActive: boolean;       // Si está activa
  createdAt: Date;         // Fecha de creación
  updatedAt: Date;         // Última actualización
}
```

**Validaciones:**
- id: UUID válido
- name: 1-50 caracteres, único
- path: Ruta válida del sistema de archivos
- isActive: boolean

---

### 5.2. Data Transfer Objects (DTOs)

#### 5.2.1. DTO: `CreatePathDto`

**Archivo:** `src/paths/dto/create-path.dto.ts`

**Definición Completa:**
```typescript
interface CreatePathDto {
  name: string;
  path: string;
  description?: string;
}
```

**Validaciones:**
```typescript
class CreatePathDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @IsString()
  @IsNotEmpty()
  path: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}
```

#### 5.2.2. DTO: `UpdatePathDto`

**Archivo:** `src/paths/dto/update-path.dto.ts`

**Definición Completa:**
```typescript
interface UpdatePathDto {
  name?: string;
  path?: string;
  description?: string;
  isActive?: boolean;
}
```

**Validaciones:** Todos los campos opcionales con mismas reglas que CreatePathDto

---

### 5.3. Response Objects

#### 5.3.1. Response: `PathsResponse`

**Archivo:** `src/paths/dto/paths-response.dto.ts`

**Definición Completa:**
```typescript
interface PathsResponse {
  success: boolean;
  data: {
    envPaths: string[];           // Rutas fijas del .env
    dynamicPaths: PathEntity[];   // Rutas dinámicas
    total: number;                // Total combinado
  };
  message: string;
  timestamp: string;
}
```

#### 5.3.2. Response: `PathResponse`

**Archivo:** `src/paths/dto/path-response.dto.ts`

**Definición Completa:**
```typescript
interface PathResponse {
  success: boolean;
  data: PathEntity;
  message: string;
  timestamp: string;
}
```

---

### 5.4. Interfaces

#### 5.4.1. Interface: `IPathsService`

**Archivo:** `src/paths/interfaces/paths-service.interface.ts`

**Definición:**
```typescript
interface IPathsService {
  loadPaths(): Promise<PathEntity[]>;
  savePaths(paths: PathEntity[]): Promise<void>;
  createPath(dto: CreatePathDto): Promise<PathEntity>;
  updatePath(id: string, dto: UpdatePathDto): Promise<PathEntity>;
  deletePath(id: string): Promise<void>;
  validatePath(path: string): Promise<boolean>;
}
```

---

## 6. API Endpoints

### 6.1. Resumen de Endpoints

| Method | Endpoint | Propósito | Auth | Swagger Tag |
|--------|----------|-----------|------|-------------|
| GET | `/api/paths` | Listar todas las rutas | No | Paths Management |
| POST | `/api/paths` | Crear ruta dinámica | No | Paths Management |
| PATCH | `/api/paths/:id` | Actualizar ruta | No | Paths Management |
| DELETE | `/api/paths/:id` | Eliminar ruta | No | Paths Management |
| POST | `/api/paths/validate` | Validar ruta | No | Paths Management |

### 6.2. Documentación Swagger

Todos los endpoints estarán documentados con Swagger/OpenAPI usando decoradores de NestJS:

```typescript
// Ejemplo de documentación
@ApiTags('Paths Management')
@ApiOperation({ summary: 'Get all paths' })
@ApiResponse({ status: 200, description: 'Paths retrieved successfully', type: PathsResponse })
@Get()
getAllPaths(): Promise<PathsResponse> {
  // implementation
}
```

**Configuración Swagger:**
- Incluir en `main.ts` con configuración estándar
- Generar documentación automática desde decoradores
- Disponible en `/api/docs` cuando el servidor esté ejecutando

### 6.3. Compatibilidad con MCP

**Aclaración Importante:** Esta funcionalidad no interfiere con el MCP que requiere terminal limpio.

**Justificación:**
- Las operaciones de archivos JSON son síncronas y no bloquean el event loop
- El MCP opera en un proceso separado (stdio-based server)
- No se ejecutan comandos del terminal ni se modifican variables de entorno
- Las rutas dinámicas se cargan en memoria y no afectan el estado del MCP

**Validación:**
- El sistema mantiene separación clara entre configuración MCP y gestión de rutas
- No se requieren reinicios del servidor para cambios en rutas
- Las operaciones CRUD son independientes del flujo MCP

### 6.4. Integración con Frontend

La interfaz `rutas.html` existente debe actualizarse para:
- Consumir `/api/paths` en lugar de lógica local
- Usar endpoints de CRUD para operaciones
- Mostrar distinción visual entre rutas fijas y dinámicas
- Mantener compatibilidad con flujo existente

---

## 7. Validaciones y Reglas de Negocio

### 7.1. Reglas de Negocio Específicas

#### Regla RN-001: Unicidad de Nombres
**Descripción:** No pueden existir dos rutas dinámicas con el mismo nombre
**Validación:** Backend verifica unicidad antes de crear/actualizar

#### Regla RN-002: Validación de Rutas
**Descripción:** Las rutas deben existir y ser directorios válidos
**Validación:** `validatePath()` verifica existencia y permisos

#### Regla RN-003: Separación de Contextos
**Descripción:** Rutas del .env son de solo lectura, rutas dinámicas son editables
**Validación:** API no permite modificar rutas del .env

---

## 8. Flujos de Datos Detallados

### 8.1. Flujo: Cargar Rutas Combinadas

```
1. Frontend llama GET /api/paths
2. PathsController.getAllPaths()
3. PathsService.loadPaths()
4. Leer .env AKURI_DOCS_PATH
5. Leer public/paths/paths.json
6. Combinar y retornar respuesta
7. Frontend muestra rutas fijas + dinámicas
```

### 8.2. Flujo: Crear Ruta Dinámica

```
1. Usuario ingresa datos en formulario
2. Frontend llama POST /api/paths
3. PathsController.createPath()
4. PathsService.createPath()
5. Validar unicidad y existencia
6. Agregar a JSON y guardar
7. Retornar ruta creada
8. Frontend actualiza lista
```

---

## 9. Manejo de Errores

### 9.1. Errores Específicos

- **PATH_NOT_FOUND:** Ruta no existe en sistema de archivos
- **PATH_NOT_READABLE:** Sin permisos de lectura
- **DUPLICATE_NAME:** Nombre ya existe
- **INVALID_PATH_FORMAT:** Formato de ruta inválido

---

## 10. Testing Strategy

### 10.1. Unit Tests

#### PathsService
- ✅ Carga correcta de rutas combinadas
- ✅ Persistencia atómica de JSON
- ✅ Validación de unicidad
- ✅ Manejo de errores de archivo

#### PathsController
- ✅ Endpoints retornan respuestas correctas
- ✅ Validación de DTOs
- ✅ Manejo de errores HTTP

### 10.2. Integration Tests

- ✅ CRUD completo de rutas dinámicas
- ✅ Combinación correcta con rutas .env
- ✅ Persistencia después de reinicio

---

## 11. Próximos Pasos

1. [ ] Crear estructura de archivos según especificación
2. [ ] Implementar PathsService con lógica de JSON
3. [ ] Crear PathsController con endpoints REST
4. [ ] Actualizar app.module.ts para incluir PathsModule
5. [ ] Actualizar rutas.html para consumir nueva API
6. [ ] Probar integración completa
7. [ ] Crear tests unitarios e integración

---

## 12. Checklist de Conformidad

- [ ] Estructura de archivos completa especificada
- [ ] Todos los modelos de datos definidos
- [ ] Endpoints API detallados
- [ ] Validaciones y reglas de negocio documentadas
- [ ] Flujos de datos especificados
- [ ] Estrategia de testing definida