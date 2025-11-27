import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';

@Controller('admin')
export class AdminController {
  @Get()
  serveAdmin(@Res() res: Response) {
    res.sendFile(join(__dirname, '..', '..', 'public', 'index.html'));
  }

  @Get('extensiones')
  serveExtensiones(@Res() res: Response) {
    res.sendFile(join(__dirname, '..', '..', 'public', 'extensiones.html'));
  }

  @Get('install')
  serveInstall(@Res() res: Response) {
    res.sendFile(join(__dirname, '..', '..', 'public', 'install.html'));
  }

  @Get('rutas')
  serveRutas(@Res() res: Response) {
    res.sendFile(join(__dirname, '..', '..', 'public', 'rutas.html'));
  }
}