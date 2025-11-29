---
trigger: on_demand
description: "Plan de implementación para el sistema híbrido de gestión dinámica de rutas de documentación basado en el diseño aprobado."
status: active
version: 1.0.0
last_updated: "2025-11-29"
author: "Kilo Code"
use_case: [PLAN, BUILD]
tags: [plan, implementación, rutas, json, nestjs, api]
---

# [PLAN] Sistema Híbrido de Gestión Dinámica de Rutas de Documentación

## Referencia al Diseño
**Documento DESIGN**: `[DESIGN].dynamic-paths-management.md`

## Resumen del Plan
Implementar un sistema híbrido que combine rutas fijas del .env con rutas dinámicas editables vía JSON, permitiendo gestión sin reinicio del servidor. El sistema incluirá API REST completa, documentación Swagger, y compatibilidad con la interfaz frontend existente.

## Dependencias Previas

### Packages a Instalar
```bash
npm install @nestjs/swagger class-validator class-transformer
# Ya deberían estar instalados en NestJS
```

### Configuraciones Necesarias
- Swagger configurado en main.ts
- Directorio public/paths/ creado
- Archivo paths.json inicial creado

## Tareas de Implementación

### Fase 1: Estructura Base y Modelos

#### Tarea 1.1: Crear DTOs
**Descripción**: Crear todos los Data Transfer Objects para validación de entrada/salida
**Archivos**:
- `src/paths/dto/create-path.dto.ts` (crear)
- `src/paths/dto/update-path.dto.ts` (crear)
- `src/paths/dto/path-query.dto.ts` (crear)
- `src/paths/dto/paths-response.dto.ts` (crear)
- `src/paths/dto/path-response.dto.ts` (crear)
- `src/paths/dto/delete-response.dto.ts` (crear)
- `src/paths/dto/validation-response.dto.ts` (crear)

**Dependencias**: Ninguna

**Comandos**:
```bash
mkdir -p src/paths/dto
```

**Criterios de Aceptación**:
- [ ] Todos los DTOs creados con decoradores de validación
- [ ] Interfaces de respuesta definidas correctamente
- [ ] Imports y exports configurados

**Estimación**: Baja

---

#### Tarea 1.2: Crear Entities e Interfaces
**Descripción**: Definir modelos de dominio y contratos de servicio
**Archivos**:
- `src/paths/entities/path.entity.ts` (crear)
- `src/paths/interfaces/paths-service.interface.ts` (crear)
- `src/paths/interfaces/index.ts` (crear)
- `src/paths/entities/index.ts` (crear)

**Dependencias**: Tarea 1.1

**Comandos**:
```bash
mkdir -p src/paths/entities src/paths/interfaces
```

**Criterios de Aceptación**:
- [ ] PathEntity con todos los campos definidos
- [ ] IPathsService con métodos completos
- [ ] Archivos index.ts con exports correctos

**Estimación**: Baja

---

### Fase 2: Servicio Core

#### Tarea 2.1: Implementar PathsService
**Descripción**: Crear servicio principal con lógica de gestión de rutas JSON
**Archivos**:
- `src/paths/paths.service.ts` (crear)
- `src/paths/paths.service.spec.ts` (crear)

**Dependencias**: Tarea 1.2

**Comandos**:
```bash
nest generate service paths --no-spec
# Crear archivo de test manualmente
```

**Criterios de Aceptación**:
- [ ] Métodos CRUD implementados
- [ ] Lectura/escritura JSON funcional
- [ ] Combinación con rutas .env
- [ ] Validación de unicidad de nombres
- [ ] Manejo de errores de archivo

**Estimación**: Media

---

#### Tarea 2.2: Crear PathsModule
**Descripción**: Configurar módulo NestJS con providers y exports
**Archivos**:
- `src/paths/paths.module.ts` (crear)

**Dependencias**: Tarea 2.1

**Comandos**:
```bash
nest generate module paths
```

**Criterios de Aceptación**:
- [ ] Módulo configurado con servicio
- [ ] Exports correctos
- [ ] Imports necesarios incluidos

**Estimación**: Baja

---

### Fase 3: API Controller

#### Tarea 3.1: Implementar PathsController
**Descripción**: Crear controlador REST con todos los endpoints
**Archivos**:
- `src/paths/paths.controller.ts` (crear)
- `src/paths/paths.controller.spec.ts` (crear)

**Dependencias**: Tarea 2.2

**Comandos**:
```bash
nest generate controller paths --no-spec
```

**Criterios de Aceptación**:
- [ ] Todos los endpoints implementados
- [ ] Decoradores HTTP correctos
- [ ] Inyección de servicio funcional
- [ ] Manejo de errores apropiado

**Estimación**: Media

---

#### Tarea 3.2: Agregar Documentación Swagger
**Descripción**: Configurar Swagger en controller y main.ts
**Archivos**:
- `src/paths/paths.controller.ts` (modificar)
- `src/main.ts` (modificar)

**Dependencias**: Tarea 3.1

**Comandos**:
```bash
# Modificaciones manuales
```

**Criterios de Aceptación**:
- [ ] Decoradores @ApiTags, @ApiOperation, @ApiResponse agregados
- [ ] Swagger configurado en main.ts
- [ ] Documentación accesible en /api/docs

**Estimación**: Baja

---

### Fase 4: Integración y Configuración

#### Tarea 4.1: Actualizar AppModule
**Descripción**: Registrar PathsModule en aplicación principal
**Archivos**:
- `src/app.module.ts` (modificar)

**Dependencias**: Tarea 3.2

**Comandos**:
```bash
# Modificación manual
```

**Criterios de Aceptación**:
- [ ] PathsModule importado
- [ ] Módulo registrado en imports

**Estimación**: Baja

---

#### Tarea 4.2: Crear Archivo JSON Inicial
**Descripción**: Crear estructura inicial de paths.json
**Archivos**:
- `public/paths/paths.json` (crear)

**Dependencias**: Tarea 4.1

**Comandos**:
```bash
mkdir -p public/paths
echo '[]' > public/paths/paths.json
```

**Criterios de Aceptación**:
- [ ] Directorio creado
- [ ] Archivo JSON válido con array vacío

**Estimación**: Baja

---

#### Tarea 4.3: Crear ConfigService para Paths
**Descripción**: Servicio de configuración para rutas del .env
**Archivos**:
- `src/config/paths.config.ts` (crear)

**Dependencias**: Tarea 4.2

**Comandos**:
```bash
# Creación manual
```

**Criterios de Aceptación**:
- [ ] Lectura de AKURI_DOCS_PATH del .env
- [ ] Parsing de rutas separado por comas
- [ ] Validación de rutas existentes

**Estimación**: Baja

---

### Fase 5: Testing

#### Tarea 5.1: Tests Unitarios
**Descripción**: Implementar tests para servicio y controller
**Archivos**:
- `src/paths/paths.service.spec.ts` (completar)
- `src/paths/paths.controller.spec.ts` (completar)

**Dependencias**: Tarea 4.3

**Comandos**:
```bash
npm run test
```

**Criterios de Aceptación**:
- [ ] Tests de servicio pasando
- [ ] Tests de controller pasando
- [ ] Coverage mínimo 80%

**Estimación**: Media

---

#### Tarea 5.2: Tests de Integración
**Descripción**: Tests E2E para API completa
**Archivos**:
- `test/paths.e2e-spec.ts` (crear)

**Dependencias**: Tarea 5.1

**Comandos**:
```bash
npm run test:e2e
```

**Criterios de Aceptación**:
- [ ] CRUD completo testeado
- [ ] Endpoints retornando respuestas correctas
- [ ] Validaciones funcionando

**Estimación**: Media

---

### Fase 6: Verificación Final

#### Tarea 6.1: Verificar Build
**Descripción**: Asegurar que aplicación compila correctamente
**Archivos**: Ninguno

**Dependencias**: Tarea 5.2

**Comandos**:
```bash
npm run build
```

**Criterios de Aceptación**:
- [ ] Build exitoso sin errores
- [ ] TypeScript compilation OK
- [ ] Linting sin errores

**Estimación**: Baja

---

#### Tarea 6.2: Probar API Manualmente
**Descripción**: Verificar funcionamiento manual de endpoints
**Archivos**: Ninguno

**Dependencias**: Tarea 6.1

**Comandos**:
```bash
npm start
# Probar endpoints con curl o Postman
```

**Criterios de Aceptación**:
- [ ] Servidor inicia correctamente
- [ ] Endpoints responden apropiadamente
- [ ] Swagger documentation accesible

**Estimación**: Baja

---

## Orden de Ejecución

```
Tarea 1.1 (DTOs)
    ↓
Tarea 1.2 (Entities & Interfaces)
    ↓
Tarea 2.1 (PathsService)
    ↓
Tarea 2.2 (PathsModule)
    ↓
Tarea 3.1 (PathsController)
    ↓
Tarea 3.2 (Swagger)
    ↓
Tarea 4.1 (AppModule)
    ↓
Tarea 4.2 (JSON inicial)
    ↓
Tarea 4.3 (ConfigService)
    ↓
Tarea 5.1 (Unit Tests)
    ↓
Tarea 5.2 (Integration Tests)
    ↓
Tarea 6.1 (Build)
    ↓
Tarea 6.2 (Manual Testing)
```

## Plan de Testing

### Tests Unitarios

#### PathsService
**Archivo**: `src/paths/paths.service.spec.ts`
**Tests a Implementar**:
- loadPaths() combina rutas .env y JSON
- createPath() valida unicidad y guarda
- updatePath() modifica correctamente
- deletePath() elimina y actualiza archivo
- validatePath() verifica existencia

#### PathsController
**Archivo**: `src/paths/paths.controller.spec.ts`
**Tests a Implementar**:
- GET /paths retorna rutas combinadas
- POST /paths crea nueva ruta
- PATCH /paths/:id actualiza ruta
- DELETE /paths/:id elimina ruta

### Tests de Integración

#### API E2E
**Archivo**: `test/paths.e2e-spec.ts`
**Escenarios**:
- CRUD completo de rutas dinámicas
- Validación de constraints
- Combinación correcta con rutas .env
- Manejo de errores

## Archivos a Crear/Modificar

### Crear
- [ ] `src/paths/dto/create-path.dto.ts`
- [ ] `src/paths/dto/update-path.dto.ts`
- [ ] `src/paths/dto/path-query.dto.ts`
- [ ] `src/paths/dto/paths-response.dto.ts`
- [ ] `src/paths/dto/path-response.dto.ts`
- [ ] `src/paths/dto/delete-response.dto.ts`
- [ ] `src/paths/dto/validation-response.dto.ts`
- [ ] `src/paths/entities/path.entity.ts`
- [ ] `src/paths/interfaces/paths-service.interface.ts`
- [ ] `src/paths/paths.service.ts`
- [ ] `src/paths/paths.controller.ts`
- [ ] `src/paths/paths.module.ts`
- [ ] `src/paths/paths.service.spec.ts`
- [ ] `src/paths/paths.controller.spec.ts`
- [ ] `src/config/paths.config.ts`
- [ ] `public/paths/paths.json`
- [ ] `test/paths.e2e-spec.ts`

### Modificar
- [ ] `src/app.module.ts` - Agregar PathsModule
- [ ] `src/main.ts` - Configurar Swagger

## Riesgos y Contingencias

### Riesgo 1: Conflictos de Concurrencia en JSON
**Probabilidad**: Media
**Impacto**: Alto
**Mitigación**: Operaciones atómicas, validación de estado
**Plan B**: Usar base de datos SQLite si es necesario

### Riesgo 2: Errores de Permisos en Sistema de Archivos
**Probabilidad**: Baja
**Impacto**: Alto
**Mitigación**: Verificar permisos en inicialización
**Plan B**: Cambiar ubicación del archivo JSON

### Riesgo 3: Incompatibilidad con MCP
**Probabilidad**: Baja
**Impacto**: Alto
**Mitigación**: Verificar que operaciones no bloqueen terminal
**Plan B**: Ejecutar en proceso separado si es necesario

## Estimación Total
**Complejidad General**: Media
**Tiempo Estimado**: 8-12 horas
**Tareas Totales**: 15 tareas

## Próximos Pasos
1. Revisión y aprobación del plan
2. Inicio de implementación siguiendo orden establecido
3. Verificación de compatibilidad con MCP
4. Testing completo antes de deploy