import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
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
      logger: process.env.NODE_ENV === 'development' ? ['error', 'warn', 'log', 'debug'] : false,
    });
    console.log('App created successfully');
    console.log('Getting ConfigService...');

    const configService = app.get(ConfigService);
    const isMcpMode = configService.get('MCP_MODE') === 'true';
    const port = configService.get('PORT', 3001);

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
