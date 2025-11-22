import { Injectable, Logger } from '@nestjs/common';
import { LibrarianService } from '../librarian/librarian.service';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(private librarian: LibrarianService) {}

  /**
   * Valida si se cumplen los prerrequisitos metodológicos de Akuri.
   * @param intent La fase que se quiere iniciar (PLAN, BUILD, REFACTOR)
   * @param contextKeywords Palabras clave para buscar los docs (ej: "login auth")
   */
  async validateWorkflow(intent: string, contextKeywords: string) {
    // Definición de Reglas Estrictas de Akuri
    const rules: Record<string, string[]> = {
      'PLAN': ['DESIGN'],           // Para hacer PLAN, necesito DESIGN
      'BUILD': ['DESIGN', 'PLAN'],  // Para hacer BUILD, necesito DESIGN y PLAN
      'REFACTOR': ['AUDIT'],        // Para REFACTOR, necesito AUDIT
      'AUDIT': []                   // AUDIT es libre
    };

    const requirements = rules[intent.toUpperCase()];
    
    // Si no hay reglas para esta intención, pasamos (ej. INFO)
    if (!requirements || requirements.length === 0) {
      return { allowed: true, missing: [], context: [] };
    }

    console.error(`[AKURI WORKFLOW] Validando intento de ${intent} con contexto: "${contextKeywords}"`);

    const foundDocs: any[] = [];
    const missingDocs: string[] = [];

    // Verificamos cada requisito
    for (const reqType of requirements) {
      // Buscamos documentos que coincidan con el TIPO (ej. DESIGN) y el CONTEXTO (ej. login)
      // Usamos la búsqueda del bibliotecario
      const query = `${reqType} ${contextKeywords}`;
      const results = await this.librarian.searchDocs(query, 10);

      // Filtramos: El documento encontrado debe ser realmente del tipo requerido
      // Buscamos en el path o en el contenido del snippet
      const match = results.find(doc => {
        const pathUpper = doc.path.toUpperCase();
        // Es válido si el path contiene "DESIGN" (ej: akuri-work/DESIGN.login.md)
        return pathUpper.includes(reqType.toUpperCase());
      });

      if (match) {
        console.error(`[AKURI WORKFLOW] ✅ Requisito encontrado: ${reqType} -> ${match.path}`);
        foundDocs.push(match);
      } else {
        console.error(`[AKURI WORKFLOW] ❌ Requisito faltante: ${reqType}`);
        missingDocs.push(reqType);
      }
    }

    if (missingDocs.length > 0) {
      return {
        allowed: false,
        error: `🛑 BLOQUEO DE METODOLOGÍA AKURI\n\nNo puedes proceder a la fase **${intent}** para "${contextKeywords}".\n\nFaltan los siguientes documentos obligatorios:\n${missingDocs.map(m => `- ${m}`).join('\n')}\n\nPor favor, crea estos documentos o búscalos si ya existen con otro nombre.`,
        missing: missingDocs
      };
    }

    return {
      allowed: true,
      message: `✅ Protocolo AKURI Validado. Fase ${intent} autorizada.`,
      context: foundDocs // Devolvemos los docs encontrados para que la IA los lea
    };
  }
}