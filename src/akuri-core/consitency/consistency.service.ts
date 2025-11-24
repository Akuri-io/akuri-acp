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
export class ConsistencyService {
  constructor(
    private librarian: LibrarianService,
    private logger: LoggerService,
  ) {
    this.logger.setContext?.('ConsistencyService');
  }

  /**
   * Genera un Prompt Estructurado basado en un Blueprint y variables.
   * Además, inyecta automáticamente las reglas de oro (Naming Convention).
   */
  async generateFromBlueprint(
    blueprintName: string,
    variables: Record<string, string>,
  ) {
    this.logger.info('Generating prompt from blueprint', {
      blueprintName,
      variables,
      service: 'ConsistencyService',
    });

    // 1. Buscar el Blueprint
    const docs: SearchResult[] = await this.librarian.searchDocs(
      `BLUEPRINT ${blueprintName}`,
      5,
    );
    // Buscamos uno que tenga "BLUEPRINT" en el nombre o path
    const blueprintDoc = docs.find((d: SearchResult) =>
      d.path.toUpperCase().includes('BLUEPRINT'),
    );

    if (!blueprintDoc) {
      return {
        success: false,
        error: `No encontré ningún archivo Blueprint llamado "${blueprintName}". Asegúrate de crear uno (ej: BLUEPRINT.table.md).`,
      };
    }

    let promptContent = blueprintDoc.snippet; // En producción usaríamos content completo, aquí snippet funciona si es corto
    // NOTA: En tu implementación real de Librarian, asegúrate de retornar 'content' completo si es necesario.
    // Por ahora asumimos que 'snippet' trae el texto suficiente o modificaremos Librarian para traer 'full_content'.

    // 2. Reemplazo de Variables (Template Engine simple)
    // Busca {{variable}} y lo reemplaza por el valor
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      promptContent = promptContent.replace(placeholder, value);
    }

    // 3. Inyección de Guardrails (Reglas de Oro)
    const guardrails = await this.getGuardrails();

    // 4. Construcción del Prompt Final
    const finalPrompt = `
# 🏗️ AKURI GENERATED PROMPT
**Source:** ${blueprintDoc.path}
**Context:** ${JSON.stringify(variables)}

---

## 1. INSTRUCTION (BLUEPRINT)
${promptContent}

---

## 2. 🛡️ MANDATORY STANDARDS (GUARDRAILS)
${guardrails}

---

## 3. OUTPUT FORMAT
Return ONLY the code. No chatter.
`;

    return {
      success: true,
      prompt: finalPrompt,
    };
  }

  /**
   * Busca las convenciones de nombres para inyectarlas siempre.
   */
  private async getGuardrails(): Promise<string> {
    // Buscamos específicamente el archivo de naming convention
    const docs = await this.librarian.searchDocs('naming convention', 1);
    if (docs.length > 0) {
      // Retornamos un resumen o el contenido
      return `
### Naming Conventions (Reference: ${docs[0].path})
- Files must be kebab-case (e.g., user-profile.component.ts).
- Classes must be PascalCase (e.g., UserProfileComponent).
- Use specific suffixes: .service, .component, .guard.
      `;
    }
    return 'WARNING: No Naming Conventions found.';
  }
}
