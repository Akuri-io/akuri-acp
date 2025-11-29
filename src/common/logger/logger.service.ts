import { Injectable } from '@nestjs/common';
import { logger } from './logger.config';
import * as winston from 'winston';

@Injectable()
export class LoggerService {
  private context: string = 'App';

  constructor() {
    // Initialize logger if not already done
    if (!logger) {
      // Create a basic logger to prevent errors
      const basicLogger = winston.createLogger({
        level: 'info',
        transports: [new winston.transports.Console()],
      });
      // Assign to the exported logger
      require('./logger.config').logger = basicLogger;
    }
  }

  setContext(context: string) {
    this.context = context;
  }

  error(message: string, meta?: any) {
    if (logger) logger.error(message, { context: this.context, ...meta });
    else console.error(`[${this.context}] ERROR: ${message}`, meta);
  }

  warn(message: string, meta?: any) {
    if (logger) logger.warn(message, { context: this.context, ...meta });
    else console.warn(`[${this.context}] WARN: ${message}`, meta);
  }

  info(message: string, meta?: any) {
    if (logger) logger.info(message, { context: this.context, ...meta });
    else console.log(`[${this.context}] INFO: ${message}`, meta);
  }

  http(message: string, meta?: any) {
    if (logger) logger.http(message, { context: this.context, ...meta });
    else console.log(`[${this.context}] HTTP: ${message}`, meta);
  }

  debug(message: string, meta?: any) {
    if (logger) logger.debug(message, { context: this.context, ...meta });
    else console.debug(`[${this.context}] DEBUG: ${message}`, meta);
  }

  // Convenience methods for common operations
  logSearch(query: string, resultsCount: number, duration: number) {
    this.info('Search executed', {
      query,
      resultsCount,
      duration,
      operation: 'search',
    });
  }

  logWorkflowValidation(
    intent: string,
    context: string,
    allowed: boolean,
    duration: number,
  ) {
    this.info('Workflow validation completed', {
      intent,
      context,
      allowed,
      duration,
      operation: 'workflow_validation',
    });
  }

  logBlueprintGeneration(
    blueprintName: string,
    variables: any,
    success: boolean,
    duration: number,
  ) {
    this.info('Blueprint generation completed', {
      blueprintName,
      variablesCount: Object.keys(variables || {}).length,
      success,
      duration,
      operation: 'blueprint_generation',
    });
  }
}
