import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // 1. Desactivar logs automáticos o enviarlos a stderr
    logger: ['error', 'warn'], // Solo errores, y NestJS suele enviarlos bien.
    // O mejor aún: false para silencio total en producción
  });

  // 2. Asegurar que no escuche en puerto HTTP si solo vamos a usar Stdio
  // O si quieres HTTP para health checks, asegura que no interfiera.
  // Para MCP puro local, usamos init() en lugar de listen()
  
  await app.init();
  
  // Nota: McpService se inicia en onModuleInit, así que al hacer init()
  // el servidor MCP empieza a escuchar en Stdio.
}
bootstrap();