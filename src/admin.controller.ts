import { Controller, Get, Post, Body } from '@nestjs/common';
import { LibrarianService } from './akuri-core/librarian/librarian.service';

/**
 * @deprecated Use ConfigController instead. This controller will be removed in v0.0.4
 */
@Controller('api/admin')
export class AdminController {
  constructor(private readonly librarianService: LibrarianService) {}

  @Get('config')
  getConfig() {
    return {
      paths: this.librarianService.getDocsPaths(),
    };
  }

  @Post('config')
  async updateConfig(@Body() body: { paths: string[] }) {
    try {
      await this.librarianService.updatePaths(body.paths);
      return { success: true, message: 'Configuración actualizada' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Post('reindex')
  async reindex() {
    try {
      const totalDocs = await this.librarianService.reindex();
      return { success: true, totalDocs };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}