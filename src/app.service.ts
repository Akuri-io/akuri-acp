import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getSystemInfo() {
    return {
      name: 'Akuri Context Protocol (ACP)',
      version: process.env.npm_package_version || '0.0.2',
      description: 'Smart Context Server & Workflow Enforcer for AI Agents',
      status: 'running',
      port: process.env.PORT || 3001,
      environment: process.env.NODE_ENV || 'development',
      mcpMode: process.env.MCP_MODE === 'true',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      docsPath: process.env.AKURI_DOCS_PATH,
      endpoints: {
        health: '/health',
        admin: {
          html: '/admin',
          api: '/api/admin',
        },
        mcp: '/mcp',
      },
    };
  }
}
