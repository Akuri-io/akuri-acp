import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';

@Controller('admin')
export class AdminController {
  @Get()
  serveAdmin(@Res() res: Response) {
    res.sendFile(join(__dirname, '..', '..', 'public', 'index.html'));
  }

  @Get('extensions')
  serveExtensions(@Res() res: Response) {
    res.sendFile(join(__dirname, '..', '..', 'public', 'extensions.html'));
  }

  @Get('install')
  serveInstall(@Res() res: Response) {
    res.sendFile(join(__dirname, '..', '..', 'public', 'install.html'));
  }

  @Get('paths')
  servePaths(@Res() res: Response) {
    res.sendFile(join(__dirname, '..', '..', 'public', 'paths.html'));
  }

  @Get('config')
  serveConfig(@Res() res: Response) {
    res.sendFile(join(__dirname, '..', '..', 'public', 'config.html'));
  }
}
