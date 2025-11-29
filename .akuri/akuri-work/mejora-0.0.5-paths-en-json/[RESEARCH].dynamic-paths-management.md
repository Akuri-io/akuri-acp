---
trigger: on_demand
description: "Investigación sobre las mejores estrategias para implementar un sistema híbrido de configuración de rutas de documentación que combine paths fijos del .env con paths dinámicos editables vía interfaz web, sin requerir reinicio del servidor."
status: active
version: 1.0.0
last_updated: "2025-11-29"
author: "Kilo Code"
use_case: [RESEARCH, DESIGN, BUILD]
tags: [paths, configuración, json, api, nestjs, frontend]
---

# [RESEARCH] Gestión Dinámica de Rutas de Documentación

## Objetivo

Investigar y evaluar las mejores estrategias para implementar un sistema híbrido de configuración de rutas de documentación que permita:
- Combinar rutas fijas definidas en variables de entorno (.env) con rutas dinámicas editables
- Gestionar las rutas dinámicas a través de una interfaz web (CRUD operations)
- Actualizar las rutas sin requerir reinicio del servidor MCP
- Mantener persistencia de las rutas dinámicas en formato JSON

## Contexto

El sistema actual utiliza únicamente la variable `AKURI_DOCS_PATH` en el archivo `.env` para definir las rutas de documentación. Se requiere un sistema más flexible que permita:
- Rutas fijas del .env (configuración base)
- Rutas dinámicas editables vía interfaz web
- Persistencia sin reinicio del servidor
- Interfaz existente en `rutas.html` para gestión CRUD

## Opciones Evaluadas

### Opción 1: JSON en Directorio Público (public/paths/paths.json)
**Descripción**: Almacenar las rutas dinámicas en un archivo JSON dentro del directorio público, accesible vía API del backend.

**Ventajas**:
- Fácil acceso desde el frontend (mismo origen)
- Persistencia simple en sistema de archivos
- No requiere base de datos adicional
- Compatible con la estructura existente de `rutas.html`

**Desventajas**:
- Archivo expuesto en directorio público (seguridad)
- Lectura/escritura síncrona puede bloquear el event loop
- Gestión de concurrencia limitada (un usuario)
- Requiere validación adicional de seguridad

**Casos de Uso Ideales**:
- Aplicaciones pequeñas con un solo usuario administrador
- Configuraciones que no requieren alta seguridad
- Prototipos y desarrollo rápido

### Opción 2: JSON en Backend con Servicio Dedicado
**Descripción**: Almacenar el archivo JSON en el directorio del backend (src/assets/ o similar), con un servicio NestJS dedicado para gestión.

**Ventajas**:
- Mayor seguridad (no expuesto públicamente)
- Mejor separación de responsabilidades
- Posibilidad de cache en memoria con recarga automática
- Integración nativa con el sistema de dependencias de NestJS
- Validación y transformación de datos más robusta

**Desventajas**:
- Mayor complejidad de implementación
- Requiere configuración adicional de rutas estáticas
- Posible latencia en operaciones de I/O

**Casos de Uso Ideales**:
- Aplicaciones con requisitos de seguridad moderados
- Sistemas que requieren integración con otros servicios
- Proyectos con arquitectura modular

### Opción 3: Base de Datos SQLite Ligera
**Descripción**: Utilizar SQLite como base de datos embebida para almacenar las rutas dinámicas en una tabla simple.

**Ventajas**:
- Consultas SQL eficientes
- Transacciones ACID para integridad de datos
- Mejor manejo de concurrencia
- Migraciones y versionado de esquema
- Fácil backup y restore

**Desventajas**:
- Dependencia adicional (sqlite3)
- Mayor complejidad que archivo JSON
- Overhead de base de datos para datos simples
- Curva de aprendizaje adicional

**Casos de Uso Ideales**:
- Aplicaciones que requieren integridad de datos
- Sistemas con múltiples operaciones CRUD frecuentes
- Proyectos que pueden crecer a usar BD completa

### Opción 4: Variables de Entorno Dinámicas con Archivo de Backup
**Descripción**: Mantener las rutas dinámicas en variables de entorno, con un archivo JSON como backup persistente.

**Ventajas**:
- Consistencia con el sistema actual (.env)
- Fácil integración con configuración existente
- Persistencia automática vía archivo de backup
- Compatible con contenedores y despliegues

**Desventajas**:
- Requiere reinicio para cambios en .env (aunque backup permite recarga)
- Gestión compleja de múltiples fuentes
- Posibles conflictos entre fuentes

**Casos de Uso Ideales**:
- Sistemas que ya usan extensivamente variables de entorno
- Despliegues en contenedores
- Configuraciones con múltiples entornos

## Análisis Comparativo

| Criterio | Opción 1 (JSON Público) | Opción 2 (JSON Backend) | Opción 3 (SQLite) | Opción 4 (Env Dinámico) |
|----------|------------------------|------------------------|------------------|-------------------------|
| **Simplicidad** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Seguridad** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Performance** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Mantenibilidad** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Escalabilidad** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Integración Actual** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Sin Reinicio** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

## Recomendación

**Opción Recomendada**: JSON en Backend con Servicio Dedicado (Opción 2)

**Justificación**:
- Equilibra simplicidad con seguridad y mantenibilidad
- Se integra perfectamente con la arquitectura NestJS existente
- Permite recarga dinámica sin reinicio del servidor
- Compatible con la interfaz `rutas.html` ya implementada
- Adecuado para un solo usuario administrador con conocimientos técnicos
- Facilita futuras extensiones (validación, cache, etc.)

## Alternativas Viables

1. **JSON en Directorio Público** (Opción 1): Si se prioriza la simplicidad máxima y se acepta el tradeoff de seguridad
2. **SQLite** (Opción 3): Si se anticipa crecimiento futuro con más operaciones CRUD complejas

## Riesgos Identificados

- **Riesgo de Pérdida de Datos**: Operaciones de escritura concurrentes podrían corromper el JSON
  - **Mitigación**: Implementar bloqueo de archivo o transacciones atómicas

- **Riesgo de Seguridad**: Exposición accidental de rutas sensibles
  - **Mitigación**: Validación estricta de paths y sanitización

- **Riesgo de Performance**: Lectura frecuente del archivo JSON
  - **Mitigación**: Implementar cache en memoria con invalidación automática

## Próximos Pasos

1. Implementar servicio NestJS para gestión de rutas JSON
2. Crear endpoints API para CRUD operations
3. Integrar con sistema existente de rutas .env
4. Implementar validación y sanitización de paths
5. Agregar cache en memoria para performance
6. Probar integración con interfaz `rutas.html`

## Referencias

- Documentación NestJS: https://docs.nestjs.com/
- Node.js File System: https://nodejs.org/api/fs.html
- JSON Schema Validation: https://json-schema.org/
- Akuri Guidelines: `../akuri-guidelines/documentation/creating-documents.guideline.md`