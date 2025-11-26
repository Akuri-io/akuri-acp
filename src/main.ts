import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // 1. Desactivar logs automáticos o enviarlos a stderr
    logger: ['error', 'warn'], // Solo errores, y NestJS suele enviarlos bien.
    // O mejor aún: false para silencio total en producción
  });

  const configService = app.get(ConfigService);
  const isMcpMode = configService.get<string>('MCP_MODE') === 'true';
  const port = configService.get<number>('PORT', 3001);

  // Enable CORS for web interface
  app.enableCors();

  // Serve static files from public directory
  app.useStaticAssets(join(__dirname, '..', 'public'));

  if (!isMcpMode) {
    // HTTP mode: Start web server for configuration interface
    await app.listen(port);
    console.log(`🚀 HTTP Server running on http://localhost:${port}`);
  } else {
    // MCP mode: Only initialize, don't listen on HTTP port
    await app.init();
    console.log(`🔧 MCP Server initialized (stdio mode)`);
  }

  // Nota: McpService se inicia en onModuleInit, así que en ambos casos
  // el servidor MCP está disponible para conexiones stdio si es necesario.
}

void bootstrap();
