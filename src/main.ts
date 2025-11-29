import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

async function bootstrap() {
  try {
    console.log('Starting bootstrap...');
    console.log('Creating NestJS app...');

    // Create app first to get config
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      // Enable basic logging for HTTP mode, silent for pure MCP
      logger:
        process.env.NODE_ENV === 'development'
          ? ['error', 'warn', 'log', 'debug']
          : false,
    });
    console.log('App created successfully');
    console.log('Getting ConfigService...');

    const configService = app.get(ConfigService);
    const isMcpMode = configService.get('MCP_MODE') === 'true';
    const port = configService.get('PORT', 3001);

    // Configure Swagger
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Akuri ACP API')
      .setDescription(
        `
# Akuri ACP - Dynamic Paths Management API

This API enables dynamic documentation path management for the Akuri ACP system.

## Main Features

- **Hybrid Path Management**: Combines fixed paths (.env) with editable dynamic paths
- **Complete CRUD Operations**: Create, read, update and delete dynamic paths
- **Real-time Validation**: Check filesystem path accessibility
- **JSON Persistence**: Atomic storage in JSON files
- **Swagger Documentation**: Fully documented API with OpenAPI 3.0

## System Architecture

### Fixed Paths (from .env)
- Configured in the \`AKURI_DOCS_PATH\` variable
- Comma-separated values
- No server restart required
- \`env-\` prefix in ID

### Dynamic Paths (JSON)
- Stored in \`public/paths/paths.json\`
- Managed via REST API
- Unique UUID IDs
- Complete CRUD operations

## Authentication and Security

Currently without authentication implemented. Consider adding JWT or API keys for production environments.

## Common Error Codes

- \`400\` - Invalid input data
- \`404\` - Resource not found
- \`409\` - Conflict (duplicate name)
- \`500\` - Internal server error
        `,
      )
      .setVersion('1.0.0')
      .setContact(
        'Akuri Development Team',
        'https://akuri.io',
        'admin@akuri.io',
      )
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .addServer(`http://localhost:${port}`, 'Development server')
      .addServer('https://api.akuri.com', 'Production server')
      .addTag(
        'Paths Management',
        `
Endpoints para gestionar rutas de documentación dinámicas.

**Funcionalidades:**
- Listar todas las rutas (fijas + dinámicas)
- Crear nuevas rutas dinámicas
- Actualizar rutas existentes
- Eliminar rutas dinámicas
- Validar accesibilidad de rutas
        `,
      )
      .addTag(
        'Admin',
        'Endpoints administrativos para configuración del sistema',
      )
      .addTag('Health', 'Endpoints para verificar el estado del sistema')
      .addTag(
        'MCP',
        'Endpoints del servidor MCP (Model Context Protocol) para integración con herramientas externas',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);

    // Enable CORS for web interface
    app.enableCors();

    // Always start HTTP server for admin interface
    await app.listen(port);
    console.error(`🚀 HTTP Server running on http://localhost:${port}`);

    // MCP mode: Initialize MCP server alongside HTTP
    if (isMcpMode) {
      // MCP is initialized via McpService.onModuleInit()
      console.error(`🔌 MCP Server initialized alongside HTTP`);
    }

    // Nota: McpService se inicia en onModuleInit, así que en ambos casos
    // el servidor MCP está disponible para conexiones stdio si es necesario.
  } catch (error) {
    console.error('Error during bootstrap:', error);
    process.exit(1);
  }
}

void bootstrap();
