# Documentación del Módulo MCP (Model Context Protocol)

Este documento describe el módulo `mcp` de la aplicación Akuri Context Protocol (ACP), que es responsable de la integración y gestión de las interacciones con el Model Context Protocol (MCP).

## Tecnologías Utilizadas

*   **NestJS**: Un framework progresivo de Node.js para construir aplicaciones del lado del servidor eficientes y escalables.
*   **Model Context Protocol (MCP) SDK**: Librerías específicas (`@modelcontextprotocol/sdk/server/mcp.js`, `@modelcontextprotocol/sdk/server/stdio.js`, `@modelcontextprotocol/sdk/server/sse.js`) para implementar el servidor MCP y sus mecanismos de transporte (Standard I/O y Server-Sent Events).
*   **TypeScript**: Lenguaje de programación utilizado para el desarrollo de la aplicación, proporcionando tipado estático.
*   **Express**: El framework HTTP subyacente que NestJS utiliza, manejando las solicitudes y respuestas HTTP.
*   **Zod**: Una librería de declaración y validación de esquemas, utilizada para validar los argumentos de las herramientas MCP.
*   **crypto (Node.js built-in)**: Utilizado para generar identificadores únicos universales (UUIDs) para las sesiones SSE.

## Componentes del Módulo MCP

El módulo `mcp` se compone principalmente de un servicio (`McpService`) y un controlador (`McpController`), orquestados por el `McpModule`.

### `McpModule`

[`akuri-acp/src/mcp/mcp.module.ts`](akuri-acp/src/mcp/mcp.module.ts)

El [`McpModule`](akuri-acp/src/mcp/mcp.module.ts) es el módulo principal de NestJS que encapsula la lógica del MCP.
*   **Importa**: [`AkuriCoreModule`](akuri-acp/src/akuri-core/akuri-core.module.ts), lo que le permite acceder a servicios como `LibrarianService`, `WorkflowService` y `ConsistencyService`.
*   **Provee**: [`McpService`](akuri-acp/src/mcp/mcp.service.ts), haciéndolo disponible para inyección de dependencias en otros componentes.
*   **Exporta**: [`McpService`](akuri-acp/src/mcp/mcp.service.ts), permitiendo que otros módulos utilicen el servicio MCP.

### `McpService`

[`akuri-acp/src/mcp/mcp.service.ts`](akuri-acp/src/mcp/mcp.service.ts)

El [`McpService`](akuri-acp/src/mcp/mcp.service.ts) es el corazón de la integración con el Model Context Protocol.
*   **Inicialización**: Crea una instancia de `McpServer` con el nombre "Akuri Context Protocol" y versión "1.0.0".
*   **`onModuleInit()`**: Este método del ciclo de vida de NestJS se ejecuta una vez que el módulo ha sido inicializado.
    *   Registra todas las herramientas MCP disponibles.
    *   Conecta un `StdioServerTransport` al servidor MCP si la variable de entorno `MCP_MODE` está configurada como `true`. Esto permite la comunicación a través de la entrada/salida estándar, útil para entornos de línea de comandos o depuración.
*   **`connectTransport(transport: any)`**: Permite conectar dinámicamente otros tipos de transportes (como SSE) al servidor MCP.
*   **`registerTools()`**: Define y registra las herramientas que el servidor MCP ofrecerá a los clientes. Cada herramienta tiene un nombre, un esquema de entrada (validado con Zod) y una función asíncrona que implementa su lógica.

### `McpController`

[`akuri-acp/src/mcp/mcp.controller.ts`](akuri-acp/src/mcp/mcp.controller.ts)

El [`McpController`](akuri-acp/src/mcp/mcp.controller.ts) maneja las interacciones HTTP relacionadas con el MCP, específicamente para Server-Sent Events (SSE).
*   **Gestión de Sesiones SSE**: Utiliza un `Map` (`this.transports`) para mantener una referencia a las instancias de `SSEServerTransport` activas, indexadas por un `sessionId` único. Esto es crucial para soportar múltiples clientes MCP concurrentes a través de SSE.
*   **`@Get('sse-connect')`**: Endpoint para iniciar una conexión SSE.
    *   Genera un `sessionId` único usando `crypto.randomUUID()`.
    *   Crea una nueva instancia de `SSEServerTransport`, configurando el endpoint para mensajes POST con el `sessionId` incluido (`/mcp/messages?sessionId={sessionId}`).
    *   Almacena el transporte en el mapa `this.transports`.
    *   Define un callback `onclose` para limpiar el transporte del mapa cuando la conexión SSE se cierra.
    *   Inicia el transporte SSE, manteniendo la conexión abierta con el cliente.
*   **`@Post('messages')`**: Endpoint para recibir mensajes POST de los clientes MCP a través de SSE.
    *   Extrae el `sessionId` de los parámetros de la consulta (`req.query.sessionId`).
    *   Recupera la instancia `SSEServerTransport` correspondiente del mapa `this.transports`.
    *   Delega el manejo del mensaje POST al método `handlePostMessage` del transporte recuperado.
    *   Maneja casos de error si el `sessionId` no está presente o si la sesión no se encuentra.

## Herramientas MCP Registradas

El `McpService` registra las siguientes herramientas que pueden ser invocadas por clientes MCP:

### `akuri_search_docs`

*   **Descripción**: Permite realizar búsquedas semánticas o por palabras clave en la base de documentos de Akuri.
*   **Esquema de Entrada**:
    ```json
    {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "minLength": 1,
          "maxLength": 500,
          "description": "La búsqueda semántica o palabras clave"
        },
        "limit": {
          "type": "integer",
          "minimum": 1,
          "maximum": 50,
          "default": 5,
          "description": "Número máximo de documentos a retornar"
        }
      },
      "required": ["query"]
    }
    ```
*   **Lógica**: Utiliza el `LibrarianService` para ejecutar la búsqueda y retorna los resultados en formato JSON.

### `akuri_check_workflow`

*   **Descripción**: Valida un flujo de trabajo basándose en la intención del usuario y el contexto de la característica.
*   **Esquema de Entrada**:
    ```json
    {
      "type": "object",
      "properties": {
        "intent": {
          "type": "string",
          "enum": ["PLAN", "BUILD", "REFACTOR", "AUDIT"],
          "description": "La actividad que el usuario quiere realizar."
        },
        "feature_context": {
          "type": "string",
          "minLength": 1,
          "maxLength": 200,
          "pattern": "^[a-zA-Z0-9\\s\\-_]+$",
          "description": "Palabras clave del feature (ej: \"login\", \"user-table\", \"auth\")."
        }
      },
      "required": ["intent", "feature_context"]
    }
    ```
*   **Lógica**: Invoca el `WorkflowService` para validar el flujo de trabajo. Retorna un estado de aprobación, un mensaje y las rutas de los documentos requeridos encontrados, o un mensaje de error si la validación falla.

### `akuri_generate_blueprint`

*   **Descripción**: Genera contenido a partir de un "blueprint" (plantilla) específico, utilizando un conjunto de variables proporcionadas.
*   **Esquema de Entrada**:
    ```json
    {
      "type": "object",
      "properties": {
        "blueprint_name": {
          "type": "string",
          "minLength": 1,
          "maxLength": 100,
          "pattern": "^[a-zA-Z0-9\\-_]+$",
          "description": "Nombre del blueprint a usar (ej: \"datatable\", \"crud-service\")"
        },
        "variables": {
          "type": "string",
          "minLength": 1,
          "maxLength": 5000,
          "description": "JSON string con las variables (ej: {\"entity\": \"User\", \"color\": \"blue\"})"
        }
      },
      "required": ["blueprint_name", "variables"]
    }
    ```
*   **Lógica**: Parsea y valida las variables JSON de entrada. Luego, utiliza el `ConsistencyService` para generar el contenido del blueprint. Retorna el contenido generado o un mensaje de error si la generación falla o las variables son inválidas.