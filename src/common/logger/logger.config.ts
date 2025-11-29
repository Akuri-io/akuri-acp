import * as winston from 'winston';
import { ConfigService } from '@nestjs/config';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Create the logger
export function createLogger(configService: ConfigService) {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const logLevel =
    configService.get<string>('LOG_LEVEL') || (isProduction ? 'info' : 'debug');

  // Detectar si estamos ejecutando como MCP server (sin puerto HTTP)
  const isMcpMode =
    !configService.get<string>('PORT') ||
    configService.get<string>('MCP_MODE') === 'true';

  const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    isMcpMode
      ? winston.format.uncolorize()
      : winston.format.colorize({ all: true }),
  );

  const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    isMcpMode
      ? winston.format.uncolorize()
      : winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
      const ctx = context ? `[${String(context)}]` : '';
      const metaStr = Object.keys(meta).length
        ? ` ${JSON.stringify(meta)}`
        : '';
      return `${timestamp} ${level}${ctx}: ${String(message)}${metaStr}`;
    }),
  );

  const transports: winston.transport[] = [];

  // En modo MCP, NO agregamos ningún transporte para silencio total
  if (!isMcpMode) {
    // Console transport solo en modo NO-MCP
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
      }),
    );
  }

  // File transports for production (siempre disponibles, excepto en MCP)
  if (isProduction && !isMcpMode) {
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        ),
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        ),
      }),
    );
  }

  return winston.createLogger({
    level: logLevel,
    levels,
    format,
    transports,
    silent: isMcpMode, // Silenciar completamente en modo MCP
  });
}

// Logger instance (will be initialized in module)
export let logger: winston.Logger;

export function setLoggerInstance(configService: ConfigService) {
  logger = createLogger(configService);
}
