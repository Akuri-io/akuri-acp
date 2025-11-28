---
trigger: on_demand
description: "Investigación de alternativas para implementar almacenamiento y gestión dinámica de rutas de documentación en Akuri ACP"
status: completed
version: 1.0.0
date_created: "2025-11-28"
author: "Akuri System"
use_case: [RESEARCH]
tags: [research, configuration, storage, persistence, routes-management, nestjs]
related_documents: []
---

# RESEARCH: Almacenamiento Dinámico de Rutas de Documentación

## 1. Objetivo

Investigar y evaluar alternativas técnicas para implementar un sistema de almacenamiento persistente y configurable de rutas de carpetas de documentación en Akuri ACP, que permita a los usuarios agregar, modificar y eliminar rutas dinámicamente a través de una interfaz web, garantizando persistencia de datos, escalabilidad y facilidad de gestión.

## 2. Contexto

### 2.1. Estado Actual del Sistema

**Arquitectura Existente:**
- **Backend:** NestJS v11 con TypeScript
- **Almacenamiento Actual:** Variable de entorno `AKURI_DOCS_PATH` en archivo `.env`
- **Formato Actual:** Rutas separadas por comas (CSV string)
- **Gestión:** Servicio [`AkuriConfigService`](akuri-acp/src/akuri-core/config/config.service.ts) que lee/escribe en `.env`
- **Interfaz:** Dashboard web HTML/TailwindCSS en [`akuri-acp/public/rutas.html`](akuri-acp/public/rutas.html)

**Funcionalidad Actual:**
```typescript
// Ejemplo de configuración actual en .env
AKURI_DOCS_PATH=/path/to/docs1,/path/to/docs2
```

**Limitaciones Identificadas:**
- ⚠️ Reinicio del servidor requerido para aplicar cambios en `.env`
- ⚠️ No hay metadata adicional por ruta (descripción, prioridad, tags)
- ⚠️ No hay historial de cambios
- ⚠️ Formato CSV es frágil y propenso a errores
- ⚠️ No hay validación estructurada de datos
- ⚠️ Dificultad para implementar características avanzadas (categorización, permisos)

### 2.2. Necesidad de Investigación

El sistema requiere un mecanismo de almacenamiento que soporte:
- Modificación dinámica sin reinicio del servidor
- Almacenamiento de metadata adicional por ruta
- Validación y consistencia de datos
- Facilidad de backup y recuperación
- Escalabilidad para futuras características
- Gestión a través de interfaz web

## 3. Opciones Evaluadas

### 3.1. Opción 1: Base de Datos SQLite

**Descripción:**
Implementar una base de datos SQLite local para almacenar configuraciones de rutas con su metadata asociada. SQLite es una base de datos relacional embebida que no requiere servidor separado.

**Arquitectura Propuesta:**
```typescript
// Schema propuesto
interface DocumentRoute {
  id: number;
  path: string;
  description?: string;
  isActive: boolean;
  priority: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  lastIndexed?: Date;
  documentCount?: number;
}
```

**Implementación:**
- **ORM Recomendado:** TypeORM o Prisma
- **Ubicación BD:** `akuri-acp/data/config.db`
- **Migración:** Script para importar rutas actuales desde `.env`

**Ventajas:**
- ✅ **Estructura de Datos:** Datos completamente estructurados y tipados
- ✅ **Queries Complejas:** Soporte para filtros, ordenamiento, búsquedas avanzadas
- ✅ **Integridad Referencial:** Constraints y validaciones a nivel de BD
- ✅ **Transacciones ACID:** Garantiza consistencia de datos
- ✅ **Escalabilidad:** Fácil agregar nuevas tablas (configuraciones, logs, auditoría)
- ✅ **Performance:** Índices optimizan consultas frecuentes
- ✅ **Metadata Rica:** Múltiples campos adicionales sin límite
- ✅ **Historial de Cambios:** Facilidad para implementar auditoría
- ✅ **Migraciones:** Control de versión de schema con herramientas ORM
- ✅ **Testing:** Fácil crear bases de datos de prueba

**Desventajas:**
- ❌ **Dependencias Adicionales:** Requiere instalar ORM (TypeORM ~2MB, Prisma ~15MB)
- ❌ **Complejidad Inicial:** Configuración de ORM, entidades y migraciones
- ❌ **Curva de Aprendizaje:** Equipo debe conocer ORM y SQL
- ❌ **Overhead:** Puede ser excesivo para configuración simple
- ❌ **Binary Lock:** Archivo SQLite puede tener problemas en sistemas de archivos compartidos
- ❌ **Backup Específico:** Requiere herramientas específicas para dump completo
- ❌ **Debugging:** Más complejo que archivos de texto plano

**Casos de Uso Ideales:**
- Aplicaciones con múltiples tipos de configuración
- Necesidad de relaciones entre entidades
- Requisitos de auditoría y trazabilidad completa
- Equipos con experiencia en bases de datos
- Proyectos con roadmap de características complejas

**Esfuerzo de Implementación:**
- **Tiempo Estimado:** 4-6 horas
- **Complejidad:** Media-Alta
- **Dependencias:** TypeORM/Prisma + sqlite3

---

### 3.2. Opción 2: Archivos de Configuración en `/public`

**Descripción:**
Crear archivos JSON/YAML en la carpeta `akuri-acp/public/.akuri/config/` para almacenar la configuración de rutas. Los archivos serían editables tanto por la interfaz web como manualmente.

**Arquitectura Propuesta:**
```json
// akuri-acp/public/.akuri/config/routes.json
{
  "version": "1.0.0",
  "lastUpdated": "2025-11-28T03:00:00Z",
  "routes": [
    {
      "id": "route-1",
      "path": "/mnt/docs/AKURI",
      "description": "Documentación principal de Akuri",
      "isActive": true,
      "priority": 1,
      "tags": ["core", "methodology"],
      "createdAt": "2025-11-01T00:00:00Z"
    },
    {
      "id": "route-2",
      "path": "/mnt/docs/DOCS-EXTRA",
      "description": "Documentación adicional",
      "isActive": true,
      "priority": 2,
      "tags": ["extra"],
      "createdAt": "2025-11-15T00:00:00Z"
    }
  ]
}
```

**Implementación:**
- **Lectura/Escritura:** Node.js `fs` module (sin dependencias)
- **Validación:** Zod schemas (ya está en [`package.json`](akuri-acp/package.json))
- **Backup:** Versionado de archivos con timestamps

**Ventajas:**
- ✅ **Simplicidad:** Sin dependencias adicionales, usa Node.js nativo
- ✅ **Legibilidad:** Archivos JSON/YAML son human-readable
- ✅ **Edición Manual:** Usuarios avanzados pueden editar directamente
- ✅ **Versionado Git:** Fácil trackear cambios con control de versiones
- ✅ **Backup Simple:** Copy/paste de archivos
- ✅ **Portabilidad:** Fácil migrar configuración entre entornos
- ✅ **Debugging:** Ver estado actual con cualquier editor de texto
- ✅ **Zero Dependencies:** No requiere librerías adicionales
- ✅ **Config as Code:** Archivos pueden ser parte del repositorio
- ✅ **Implementación Rápida:** Código simple y directo

**Desventajas:**
- ❌ **Concurrencia:** Race conditions posibles en escrituras simultáneas
- ❌ **No Transaccional:** Sin rollback automático en caso de error
- ❌ **Performance:** Lectura/escritura completa del archivo en cada operación
- ❌ **Validación Manual:** Debe implementarse explícitamente
- ❌ **Sin Queries:** Filtrado y búsqueda requieren código custom
- ❌ **Escalabilidad Limitada:** Archivo grande puede ser problemático
- ❌ **Integridad:** Sin constraints automáticas (IDs únicos, etc.)
- ❌ **Auditoría Manual:** Historial de cambios requiere implementación custom
- ❌ **Fragmentación:** Múltiples archivos pueden desincronizarse

**Casos de Uso Ideales:**
- Configuraciones simples con pocos cambios
- Equipos pequeños con acceso controlado
- Proyectos que priorizan simplicidad sobre características avanzadas
- Entornos donde el versionado de configuración es crítico
- Aplicaciones con configuración mayormente estática

**Esfuerzo de Implementación:**
- **Tiempo Estimado:** 2-3 horas
- **Complejidad:** Baja
- **Dependencias:** Ninguna (usa Zod ya existente)

---

### 3.3. Opción 3: Arquitectura Híbrida JSON + .env (Recomendada)

**Descripción:**
Mantener compatibilidad con `.env` para rutas básicas, pero agregar un archivo JSON estructurado para metadata avanzada. Esta solución combina lo mejor de ambos mundos: simplicidad para casos básicos y flexibilidad para características avanzadas.

**Arquitectura Propuesta:**
```typescript
// Sistema de dos niveles:

// 1. .env - Configuración básica (backward compatible)
AKURI_DOCS_PATH=/path1,/path2

// 2. akuri-acp/.akuri/routes-config.json - Metadata extendida
{
  "version": "1.0.0",
  "lastUpdated": "2025-11-28T03:00:00Z",
  "settings": {
    "autoReindex": true,
    "watchMode": true
  },
  "routes": {
    "/path1": {
      "id": "akuri-core-docs",
      "description": "Documentación core de Akuri",
      "priority": 1,
      "isActive": true,
      "tags": ["core", "methodology", "guidelines"],
      "category": "internal",
      "createdAt": "2025-11-01T00:00:00Z",
      "updatedAt": "2025-11-28T03:00:00Z"
    },
    "/path2": {
      "id": "extra-docs",
      "description": "Documentación adicional",
      "priority": 2,
      "isActive": true,
      "tags": ["extra"],
      "category": "external",
      "createdAt": "2025-11-15T00:00:00Z",
      "updatedAt": "2025-11-28T03:00:00Z"
    }
  }
}
```

**Lógica de Sincronización:**
```typescript
// Service logic
class HybridConfigService {
  // 1. Leer rutas desde .env (fuente de verdad para paths)
  // 2. Enriquecer con metadata desde JSON (si existe)
  // 3. Para nuevas rutas: actualizar ambos archivos
  // 4. Para metadata: solo JSON
  // 5. Reindex automático detecta cambios en .env
}
```

**Implementación:**
```typescript
// ConfigService híbrido
export class HybridRouteConfigService {
  private envPath = '.env';
  private jsonPath = '.akuri/routes-config.json';
  
  async loadConfig(): Promise<RouteConfig[]> {
    const envPaths = this.loadFromEnv();
    const metadata = this.loadFromJson();
    return this.merge(envPaths, metadata);
  }
  
  async updateRoute(route: RouteConfig): Promise<void> {
    await this.updateEnv(route.path);
    await this.updateJson(route);
    await this.notifyReindex();
  }
}
```

**Ventajas:**
- ✅ **Backward Compatible:** Sistema existente sigue funcionando
- ✅ **Simplicidad Inicial:** Usuarios básicos solo usan `.env`
- ✅ **Escalabilidad Progresiva:** Metadata avanzada cuando se necesite
- ✅ **Migración Suave:** Sin breaking changes, adopción gradual
- ✅ **Dos Niveles de Complejidad:** Simple para inicio, potente para avanzados
- ✅ **Independencia:** JSON faltante no rompe el sistema
- ✅ **Mejor de Ambos Mundos:** Combina simplicidad y flexibilidad
- ✅ **Performance Balanceada:** `.env` rápido, JSON solo cuando necesario
- ✅ **Debugging Fácil:** Ver `.env` para rutas, JSON para detalles
- ✅ **Zero Breaking Changes:** Compatible con código actual

**Desventajas:**
- ❌ **Complejidad de Sincronización:** Dos fuentes de verdad requieren lógica de merge
- ❌ **Consistencia:** Posible desincronización entre `.env` y JSON
- ❌ **Confusión Inicial:** Usuarios deben entender dos archivos
- ❌ **Testing Más Complejo:** Validar ambos archivos en tests
- ❌ **Documentación Extra:** Explicar cuándo usar cada archivo
- ❌ **Overhead de Mantenimiento:** Dos sistemas que mantener

**Casos de Uso Ideales:**
- Migración gradual desde sistema actual
- Equipos con usuarios de diferentes niveles técnicos
- Proyectos que valoran backward compatibility
- Necesidad de features avanzadas sin romper simplicidad
- Sistemas con configuración legacy que debe mantenerse

**Esfuerzo de Implementación:**
- **Tiempo Estimado:** 3-4 horas
- **Complejidad:** Media
- **Dependencias:** Zod (ya existente)

---

## 4. Análisis Comparativo

### 4.1. Matriz de Evaluación

| Criterio | SQLite (Opción 1) | Archivos JSON (Opción 2) | Híbrido .env+JSON (Opción 3) |
|----------|-------------------|--------------------------|------------------------------|
| **Facilidad de Implementación** | ⭐⭐ (4-6h) | ⭐⭐⭐⭐ (2-3h) | ⭐⭐⭐ (3-4h) |
| **Escalabilidad** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **Performance Reads** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Performance Writes** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Mantenibilidad** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Curva de Aprendizaje** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Backup/Recuperación** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Debugging** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Seguridad** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Portabilidad** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Zero Dependencies** | ❌ | ✅ | ✅ |
| **Backward Compatible** | ❌ | ✅ | ✅✅ |
| **Gestión por UI** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Edición Manual** | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Metadata Rica** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Audit Trail** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Consistencia Datos** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

### 4.2. Análisis por Requisitos del Sistema

**Requisitos Críticos:**
1. **Modificación sin reinicio:** 
   - SQLite: ✅ Excelente
   - JSON: ✅ Excelente  
   - Híbrido: ✅ Excelente (con hot reload)

2. **Backward Compatibility:**
   - SQLite: ❌ Requiere migración completa
   - JSON: ⚠️ Requiere cambio de ubicación
   - Híbrido: ✅✅ Mantiene `.env` actual

3. **Facilidad de Backup:**
   - SQLite: ⭐⭐⭐ Requiere dump o copy de .db
   - JSON: ⭐⭐⭐⭐⭐ Simple file copy
   - Híbrido: ⭐⭐⭐⭐ Copy de 2 archivos

4. **Gestión por UI:**
   - SQLite: ⭐⭐⭐⭐⭐ CRUD completo
   - JSON: ⭐⭐⭐⭐ CRUD completo
   - Híbrido: ⭐⭐⭐⭐⭐ CRUD completo + legacy support

5. **Escalabilidad Futura:**
   - SQLite: ⭐⭐⭐⭐⭐ Múltiples tablas, relaciones
   - JSON: ⭐⭐ Limitado a configuración
   - Híbrido: ⭐⭐⭐⭐ Puede migrar a SQLite después

### 4.3. Trade-offs Principales

**SQLite vs JSON:**
- SQLite ofrece más estructura y features, pero mayor complejidad
- JSON es más simple pero menos potente para casos complejos

**Híbrido vs Puro:**
- Híbrido mantiene compatibilidad pero agrega complejidad de sincronización
- Soluciones puras son más limpias pero requieren breaking changes

---

## 5. Recomendación

### 5.1. Solución Recomendada: Opción 3 - Arquitectura Híbrida .env + JSON

**Justificación:**

1. **Compatibilidad Total:** No rompe el sistema existente, migración gradual

2. **Balance Perfecto:** Combina simplicidad inicial con escalabilidad futura

3. **Adopción Progresiva:** Usuarios básicos continúan con `.env`, avanzados usan metadata JSON

4. **Implementación Rápida:** 3-4 horas vs 4-6 de SQLite, con 80% de beneficios

5. **Path to Scale:** Si en el futuro se necesita SQLite, el JSON facilita la migración

6. **Zero Breaking Changes:** El código actual del [`AkuriConfigService`](akuri-acp/src/akuri-core/config/config.service.ts:31) sigue funcionando

7. **Mejor Debugging:** Ver `.env` para quick check, JSON para detalles completos

8. **Documentación Mínima:** Usuarios actuales no necesitan aprender nada nuevo

### 5.2. Plan de Implementación Recomendado

**Fase 1: Core (2 horas)**
```typescript
// 1. Crear schema Zod para JSON config
// 2. Implementar HybridConfigService
// 3. Mantener backward compatibility con .env
// 4. Auto-migración de rutas existentes a JSON
```

**Fase 2: UI (1 hora)**
```typescript
// 1. Actualizar rutas.html para mostrar metadata
// 2. Forms para editar descripción, tags, priority
// 3. View switching: simple/advanced
```

**Fase 3: Testing (1 hora)**
```typescript
// 1. Unit tests para merge logic
// 2. E2E tests para CRUD operations
// 3. Test migración desde .env puro
```

### 5.3. Criterios de Migración Futura a SQLite

Considerar migrar a SQLite cuando:
- [ ] Más de 50 rutas configuradas
- [ ] Necesidad de usuarios/roles con permisos diferentes
- [ ] Requisitos de auditoría completa regulatoria
- [ ] Performance issues con archivos JSON
- [ ] Necesidad de relaciones complejas entre entidades

---

## 6. Alternativas Viables para Casos Específicos

### 6.1. Si Prioridad es Escalabilidad Extrema

**Recomendación Alternativa:** Opción 1 - SQLite

**Cuándo Elegir:**
- Roadmap incluye: multi-tenant, permisos granulares, auditoría regulatoria
- Equipo tiene experiencia sólida con ORMs
- Performance crítico con >100 rutas
- Budget permite 6+ horas de implementación

### 6.2. Si Prioridad es Máxima Simplicidad

**Recomendación Alternativa:** Opción 2 - JSON Puro

**Cuándo Elegir:**
- Proyecto pequeño/mediano (<20 rutas)
- Equipo junior sin experiencia en bases de datos
- Config-as-code es requisito crítico
- Backward compatibility no es importante

---

## 7. Riesgos Identificados

### 7.1. Riesgos de la Solución Recomendada (Híbrido)

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Desincronización .env ↔ JSON** | Media | Alto | - Implementar validación en startup<br>- Auto-repair si JSON missing<br>- `.env` es source of truth para paths |
| **Confusión de usuarios** | Baja | Medio | - Documentación clara<br>- UI explica qué va en cada archivo<br>- Defaults inteligentes |
| **Overhead de mantenimiento** | Baja | Bajo | - Tests exhaustivos<br>- Helpers para sync<br>- Logging detallado |
| **Performance degradation** | Muy Baja | Bajo | - Cache en memoria<br>- Lazy load de metadata<br>- Watchers para cambios |

### 7.2. Estrategias de Mitigación Específicas

**Para Consistencia:**
```typescript
// Auto-repair en startup
async validateConsistency() {
  const envPaths = this.loadFromEnv();
  const jsonPaths = Object.keys(this.loadFromJson().routes);
  
  // Remove JSON entries for non-existent .env paths
  // Add JSON defaults for new .env paths
  // Log discrepancies
}
```

**Para Hot Reload:**
```typescript
// Watcher pattern
chokidar.watch(['.env', '.akuri/routes-config.json'])
  .on('change', () => this.reloadConfig());
```

---

## 8. Próximos Pasos

### 8.1. Acción Inmediata

1. **Crear documento DESIGN** para arquitectura híbrida detallada
2. **Definir schema Zod** completo para JSON config
3. **Planificar migración** desde `.env` actual
4. **Diseñar API endpoints** para nuevas operaciones

### 8.2. Implementación Sugerida

```typescript
// Secuencia de desarrollo
DESIGN → PLAN → BUILD
  ├─ DESIGN: Arquitectura híbrida detallada
  ├─ PLAN: Tasks granulares con estimaciones
  └─ BUILD: Implementación iterativa con tests
```

### 8.3. Validación Post-Implementación

- [ ] Performance benchmark: <50ms para cargar config
- [ ] Zero breaking changes en tests existentes
- [ ] Documentación actualizada
- [ ] UI acepta feedback de beta users

---

## 9. Referencias

### 9.1. Código Existente Analizado

- [`akuri-acp/src/akuri-core/config/config.service.ts`](akuri-acp/src/akuri-core/config/config.service.ts) - ConfigService actual
- [`akuri-acp/src/config.controller.ts`](akuri-acp/src/config.controller.ts) - API endpoints existentes
- [`akuri-acp/public/rutas.html`](akuri-acp/public/rutas.html) - Interfaz web actual
- [`akuri-acp/.env`](akuri-acp/.env) - Configuración actual

### 9.2. Referencias Técnicas

**SQLite + NestJS:**
- [TypeORM Documentation](https://typeorm.io/)
- [Prisma with NestJS](https://docs.nestjs.com/recipes/prisma)
- [Better-SQLite3](https://github.com/WiseLibs/better-sqlite3)

**File-based Config:**
- [Node.js fs/promises](https://nodejs.org/api/fs.html#promises-api)
- [Zod Schema Validation](https://zod.dev/)
- [Chokidar File Watcher](https://github.com/paulmillr/chokidar)

**Configuration Patterns:**
- [Twelve-Factor App Config](https://12factor.net/config)
- [NestJS Configuration Module](https://docs.nestjs.com/techniques/configuration)

---

## 10. Checklist de Conformidad

- [x] Objetivo de investigación está claramente definido
- [x] Al menos 3 opciones fueron evaluadas exhaustivamente
- [x] Cada opción tiene ventajas y desventajas documentadas
- [x] Existe un análisis comparativo detallado con matriz
- [x] Hay una recomendación clara y justificada técnicamente
- [x] Los riesgos están identificados con mitigaciones
- [x] Las referencias están documentadas y son verificables
- [x] Se consideró backward compatibility
- [x] Se evaluó esfuerzo de implementación realista
- [x] Se incluyen criterios para decisión alternativa

---

**Conclusión:** La arquitectura híbrida .env + JSON ofrece el mejor balance entre simplicidad, backward compatibility y escalabilidad para las necesidades actuales de Akuri ACP, con un path claro para migrar a SQLite si el proyecto lo requiere en el futuro.

**Documento creado por:** Akuri System - Modo RESEARCH  
**Fecha:** 2025-11-28  
**Próximo paso sugerido:** Crear documento [DESIGN] basado en esta investigación