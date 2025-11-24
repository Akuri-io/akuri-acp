import { Injectable } from '@nestjs/common';
import { logger } from '../../config/logger.config';

@Injectable()
export class LoggerService {
  private context: string = 'App';

  constructor() {}

  setContext(context: string) {
    this.context = context;
  }

  error(message: string, meta?: any) {
    logger.error(message, { context: this.context, ...meta });
  }

  warn(message: string, meta?: any) {
    logger.warn(message, { context: this.context, ...meta });
  }

  info(message: string, meta?: any) {
    logger.info(message, { context: this.context, ...meta });
  }

  http(message: string, meta?: any) {
    logger.http(message, { context: this.context, ...meta });
  }

  debug(message: string, meta?: any) {
    logger.debug(message, { context: this.context, ...meta });
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
