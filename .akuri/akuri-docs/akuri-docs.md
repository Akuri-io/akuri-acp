# Reglas de Inicialización Akuri

## Reglas Fundamentales

- Programa en inglés, comunícate en español
- Ejecuta un triaje ante cada petición y clasifícala
- Sigue las instrucciones y no inventes
- Carga el documento [`AKURI/akuri.init.0.0.2.md`](../../AKURI/akuri-guidelines/init/akuri.init.0.0.2.md)
- Si necesitas información documental usa la herramienta `akuri_search_docs`

## Proceso de TRIAGE (Obligatorio)

El **TRIAGE** es el proceso de clasificación y análisis inicial que DEBE ejecutarse antes de cualquier actividad de desarrollo. Su propósito es garantizar que se cargue la documentación correcta y se siga el flujo adecuado.

### Los 6 Pasos Obligatorios del TRIAGE

#### 1. Recibir y Comprender Solicitud
- Analiza cuidadosamente la petición completa del usuario
- Identifica el objetivo principal y requisitos
- Detecta restricciones o limitaciones mencionadas
- Comprende el alcance real de la solicitud

#### 2. Clasificar Modo de Operación
Determina si la tarea es:
- **CREATIVE**: Exploración, brainstorming, investigación de opciones
- **INSTRUCTIONAL**: Implementación siguiendo patrones establecidos

#### 3. Determinar Tipo de Actividad
Clasifica la solicitud en:
- **RESEARCH**: Investigación y análisis de opciones
- **DESIGN**: Diseño y arquitectura de componentes
- **APPROVE-DESIGN**: Validación de calidad del diseño
- **PLAN**: Planificación y descomposición de tareas
- **APPROVE-PLAN**: Validación de calidad del plan
- **BUILD**: Construcción e implementación de código
- **AUDIT**: Revisión y evaluación de código
- **APPROVE**: Sistema de checkpoints de calidad
- **REFACTOR**: Optimización sin cambiar funcionalidad
- **INFO**: Información general

#### 4. Identificar Tecnologías Específicas
Detecta todos los elementos técnicos involucrados:
- Frameworks (Angular, NestJS, Flutter, Next.js, etc.)
- Lenguajes (TypeScript, JavaScript, Python, Dart)
- Arquitecturas (OMA, Clean Architecture, etc.)
- Bibliotecas (RxJS, PrimeNG, Tailwind CSS, etc.)

#### 5. Cargar Documentación Técnica
Según el contexto identificado, carga:
- Action-type específico: `akuri-guidelines/action-type/{TIPO}.md`
- Workflow del framework: `akuri-guidelines/workflows/{framework}.workflow.md`
- Mejores prácticas: `akuri-guidelines/frameworks/{framework}/01-*.md`
- Arquitecturas: `akuri-guidelines/architectures/{arch}/*.md`

#### 6. Solicitar Documentos Adicionales
Identifica si se necesita:
- Blueprints específicos
- Configuraciones del proyecto (package.json, tsconfig.json, etc.)
- Ejemplos de código existente
- Requisitos adicionales del usuario

### Flujos Validados Post-TRIAGE

```
SI tipo = "documentación nueva"
    RESEARCH → DESIGN → PLAN → BUILD

SI tipo = "feature nuevo"
    DESIGN → PLAN → BUILD

SI tipo = "mejora código"
    AUDIT → REFACTOR

SI tipo = "investigación"
    RESEARCH (directo)

SI tipo = "información"
    INFO (respuesta directa)
```

### Restricciones Críticas

⚠️ **NO SE PERMITE:**
- Proceder a BUILD sin TRIAGE completo
- Saltar ninguno de los 6 pasos
- Crear documentación sin cargar las guías correspondientes
- Alterar modo/tipo de actividad durante la sesión
- Ignorar validaciones de secuencia

### Comunicación Post-TRIAGE

Después del TRIAGE, comunica al usuario:
- Modo de operación identificado
- Tipo de actividad determinado
- Tecnologías detectadas
- Documentación cargada
- Flujo a seguir
- Próximo paso a ejecutar

---

**Documentación Completa del TRIAGE:** Ver [`AKURI/akuri-guidelines/action-type/TRIAGE.md`](../../AKURI/akuri-guidelines/action-type/TRIAGE.md)