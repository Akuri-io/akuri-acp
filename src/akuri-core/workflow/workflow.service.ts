import { Injectable } from '@nestjs/common';
import { LibrarianService } from '../librarian/librarian.service';
import { LoggerService } from '../../common/logger/logger.service';

interface SearchResult {
  path: string;
  score: number;
  metadata: Record<string, any>;
  snippet: string;
}

@Injectable()
export class WorkflowService {
  constructor(
    private librarian: LibrarianService,
    private logger: LoggerService,
  ) {
    this.logger.setContext?.('WorkflowService');
  }

  /**
   * Valida si se cumplen los prerrequisitos metodológicos de Akuri.
   * @param intent La fase que se quiere iniciar (PLAN, BUILD, REFACTOR)
   * @param contextKeywords Palabras clave para buscar los docs (ej: "login auth")
   */
  async validateWorkflow(intent: string, contextKeywords: string) {
    // Definición de Reglas Estrictas de Akuri
    const rules: Record<string, string[]> = {
      PLAN: ['DESIGN'], // Para hacer PLAN, necesito DESIGN
      BUILD: ['DESIGN', 'PLAN'], // Para hacer BUILD, necesito DESIGN y PLAN
      REFACTOR: ['AUDIT'], // Para REFACTOR, necesito AUDIT
      AUDIT: [], // AUDIT es libre
    };

    const requirements = rules[intent.toUpperCase()];

    // Si no hay reglas para esta intención, pasamos (ej. INFO)
    if (!requirements || requirements.length === 0) {
      return { allowed: true, missing: [], context: [] };
    }

    this.logger.info('Validating workflow intent', {
      intent,
      contextKeywords,
      service: 'WorkflowService',
    });

    const foundDocs: SearchResult[] = [];
    const missingDocs: string[] = [];

    // Verificamos cada requisito
    for (const reqType of requirements) {
      // Buscamos documentos que coincidan con el TIPO (ej. DESIGN) y el CONTEXTO (ej. login)
      // Usamos la búsqueda del bibliotecario
      const query = `${reqType} ${contextKeywords}`;
      const results: SearchResult[] = await this.librarian.searchDocs(
        query,
        10,
      );

      // Filtramos: El documento encontrado debe ser realmente del tipo requerido
      // Buscamos en el path o en el contenido del snippet
      const match = results.find((doc: SearchResult) => {
        const pathUpper = doc.path.toUpperCase();
        // Es válido si el path contiene "DESIGN" (ej: akuri-work/DESIGN.login.md)
        return pathUpper.includes(reqType.toUpperCase());
      });

      if (match) {
        this.logger.info('Workflow requirement found', {
          requirement: reqType,
          documentPath: match.path,
          service: 'WorkflowService',
        });
        foundDocs.push(match);
      } else {
        this.logger.warn('Workflow requirement missing', {
          requirement: reqType,
          intent,
          contextKeywords,
          service: 'WorkflowService',
        });
        missingDocs.push(reqType);
      }
    }

    if (missingDocs.length > 0) {
      return {
        allowed: false,
        error: `🛑 BLOQUEO DE METODOLOGÍA AKURI\n\nNo puedes proceder a la fase **${intent}** para "${contextKeywords}".\n\nFaltan los siguientes documentos obligatorios:\n${missingDocs.map((m) => `- ${m}`).join('\n')}\n\nPor favor, crea estos documentos o búscalos si ya existen con otro nombre.`,
        missing: missingDocs,
      };
    }

    return {
      allowed: true,
      message: `✅ Protocolo AKURI Validado. Fase ${intent} autorizada.`,
      context: foundDocs, // Devolvemos los docs encontrados para que la IA los lea
    };
  }
}
