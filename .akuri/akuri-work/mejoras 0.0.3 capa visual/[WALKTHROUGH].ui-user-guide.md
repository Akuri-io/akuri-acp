---
trigger: on_demand
description: "Guía paso a paso para usar la interfaz de configuración de Akuri ACP v0.0.3"
status: active
version: 1.0.0
last_updated: "2025-11-26"
author: "Akuri Agent"
use_case: [WALKTHROUGH]
tags: [guide, ui, configuration, v0.0.3]
---

# Guía de Uso: Interfaz de Configuración Akuri ACP v0.0.3

## Requisitos Previos

- Proyecto `akuri-acp` compilado (`npm run build`)
- Servidor corriendo en modo HTTP (no MCP)

## Inicio Rápido

### 1. Iniciar el Servidor

```bash
cd /ruta/a/akuri-acp
MCP_MODE=false PORT=3001 npm run start:prod
```

**Resultado esperado**:
```
🚀 HTTP Server running on http://localhost:3001
```

### 2. Abrir la Interfaz

Abre tu navegador y navega a:
```
http://localhost:3001
```

Deberías ver la interfaz con modo oscuro y tres tabs: **Rutas**, **Extensiones**, **Métricas**.

---

## Tab 1: Gestión de Rutas

### Visualizar Rutas Configuradas

1. El tab **Rutas** se abre por defecto
2. Verás una tabla con las rutas actualmente configuradas
3. Cada ruta muestra:
   - **Ruta**: Path completo
   - **Estado**: ✓ Válida (verde)
   - **Documentos**: Cantidad de archivos
   - **Acciones**: Botón "Eliminar"

### Agregar una Nueva Ruta

1. Localiza la sección **"Agregar Nueva Ruta"**
2. Escribe la ruta en el campo de texto:
   ```
   /ruta/a/tus/documentos
   ```
3. Haz clic en **"Validar"** o presiona Tab para salir del campo
4. Espera la validación:
   - ✓ Verde: Ruta válida con X documentos
   - ✗ Rojo: Ruta inválida o sin documentos
5. Si es válida, el botón **"Agregar"** se habilitará
6. Haz clic en **"Agregar"**
7. Verás una notificación verde de éxito
8. La tabla se actualizará automáticamente

### Eliminar una Ruta

1. En la tabla, localiza la ruta que deseas eliminar
2. Haz clic en el botón **"Eliminar"** en la columna de Acciones
3. Confirma la eliminación en el diálogo
4. La ruta se eliminará y la tabla se actualizará

### Reindexar Documentos

1. Haz clic en el botón **"🔄 Reindexar Todo"**
2. Confirma la acción (puede tomar tiempo)
3. Espera la notificación de éxito con el total de documentos indexados

---

## Tab 2: Configuración de Extensiones

### Visualizar Extensiones Permitidas

1. Haz clic en el tab **"Extensiones"**
2. Verás chips con las extensiones actuales:
   - `.md` (Markdown)
   - `.pdf` (PDF)
   - `.txt` (Texto plano)

### Ajustar Pesos de Búsqueda (Boosting)

Los sliders permiten ajustar la prioridad de búsqueda según el origen del documento:

1. **Proyecto** (1.0x - 3.0x, default: 2.0x)
   - Documentos específicos del proyecto actual
   - Mayor peso = mayor prioridad en resultados

2. **Workspace** (1.0x - 2.0x, default: 1.5x)
   - Documentos del workspace general
   - Prioridad media

3. **General** (0.5x - 1.5x, default: 1.0x)
   - Documentación general/externa
   - Prioridad estándar

4. **Interno** (0.5x - 1.0x, default: 0.8x)
   - Documentación interna del sistema
   - Menor prioridad

**Cómo ajustar**:
1. Arrastra el slider a la posición deseada
2. El valor se actualiza en tiempo real
3. Los cambios se guardan automáticamente (funcionalidad en desarrollo)

---

## Tab 3: Métricas y Estado

### Visualizar Métricas del Sistema

1. Haz clic en el tab **"Métricas"**
2. Verás 4 cards con información:
   - **Documentos Indexados**: Total de documentos en el índice
   - **Búsquedas Realizadas**: Cantidad de queries procesadas
   - **Tiempo Promedio**: Tiempo promedio de búsqueda en ms
   - **Última Indexación**: Fecha/hora de la última indexación

### Estado de Ingesta de PDFs

En la sección inferior verás el estado de conversión de archivos PDF:
- **Pendiente**: PDF detectado, esperando procesamiento
- **Procesando**: Conversión a Markdown en curso
- **Completado**: PDF convertido exitosamente
- **Error**: Falló la conversión

---

## Notificaciones del Sistema

La interfaz muestra notificaciones toast en la esquina inferior derecha:
- **Verde**: Operación exitosa
- **Rojo**: Error en la operación

Las notificaciones se auto-ocultan después de 5 segundos.

---

## Comandos Útiles

```bash
# Compilar el proyecto
npm run build

# Iniciar en modo HTTP (interfaz web)
MCP_MODE=false PORT=3001 npm run start:prod

# Iniciar en modo MCP (sin interfaz)
MCP_MODE=true npm run start:prod

# Desarrollo con hot-reload
npm run start:dev
```

---

**Versión del documento**: 1.0.0  
**Última actualización**: 2025-11-26
