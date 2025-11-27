---
trigger: on_demand
description: "Auditoría de la interfaz gráfica actual (index.html) para evaluar funcionalidad y mantenibilidad."
status: active
version: 1.0.0
last_updated: "2025-11-27"
author: "Akuri System"
use_case: [AUDIT]
tags: [audit, ui, frontend, refactor]
---

# AUDIT: Interfaz Gráfica Akuri ACP

## Información del Audit

**Fecha**: 2025-11-27
**Auditor**: Akuri System
**Alcance**: `akuri-acp/public/index.html`
**Objetivo**: Evaluar la funcionalidad actual y la viabilidad de separar la interfaz en múltiples páginas.

## Resumen Ejecutivo

**Estado General**: 🟡 Aceptable (Funcional pero difícil de mantener)

**Hallazgos Totales**: 4
- Críticos: 0
- Altos: 1
- Medios: 2
- Bajos: 1

**Recomendación**: Refactorizar urgentemente para separar responsabilidades. La estructura actual monolítica (HTML + JS + CSS en un solo archivo) dificulta la escalabilidad y el mantenimiento.

## Criterios de Evaluación

### Calidad de Código
- [ ] **Separación de Responsabilidades**: ❌ Todo en un solo archivo.
- [ ] **Modularidad**: ❌ Componentes UI acoplados fuertemente.
- [ ] **Mantenibilidad**: 🟡 Baja. Modificar una pestaña requiere editar el archivo entero.

### UX/UI
- [ ] **Navegación**: 🟡 Funcional (Tabs), pero no refleja estado en URL.
- [ ] **Feedback**: ✅ Sistema de Toasts implementado.

## Hallazgos Detallados

### 🟠 Altos

#### HIGH-001: Estructura Monolítica
**Archivo**: `public/index.html`
**Categoría**: Mantenibilidad
**Descripción**: La lógica de negocio (JS), la estructura (HTML) y los estilos (Tailwind classes) están mezclados.
**Impacto**: Dificulta la lectura y la colaboración. Riesgo alto de romper funcionalidades al editar estilos.
**Recomendación**: Separar en archivos distintos (`.js`, `.css`, `.html`) o múltiples páginas HTML.

### 🟡 Medios

#### MED-001: Navegación por Tabs sin Routing
**Categoría**: UX
**Descripción**: El cambio de pestañas es visual (`display: none`). Si se recarga la página, se pierde el estado (aunque hay un intento de `switchTab('rutas')` al inicio).
**Recomendación**: Usar páginas separadas o un router simple que actualice la URL.

#### MED-002: Lógica de API dispersa
**Categoría**: Calidad
**Descripción**: Las llamadas a `fetch` están dispersas en funciones globales.
**Recomendación**: Centralizar llamadas API en un servicio o módulo JS.

## Plan de Acción Recomendado

1.  **Separación de Páginas**: Crear archivos HTML independientes para cada sección mayor.
    -   `index.html` (Dashboard/Métricas)
    -   `rutas.html` (Gestión de Rutas)
    -   `extensiones.html` (Configuración)
2.  **Componentes Comunes**: Extraer Header y Navegación (si se usa un SSG o JS para incluirlos, o duplicarlos controladamente si es HTML puro).
3.  **Extracción de JS**: Mover lógica a archivos `.js` externos (`api.js`, `ui.js`).

## Conclusiones

La interfaz es funcional y tiene un diseño visual aceptable, pero su arquitectura interna es frágil. La solicitud del usuario de "separar en páginas diferentes" es la estrategia correcta para mejorar la mantenibilidad y permitir un crecimiento ordenado del panel de control.
