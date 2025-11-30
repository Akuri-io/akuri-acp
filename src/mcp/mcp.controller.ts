import {
  Controller,
  Get,
  Post,
  Res,
  Req,
  Body,
  Query,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { McpService } from './mcp.service';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import * as crypto from 'crypto';

@Controller('mcp')
export class McpController {
  private readonly logger = new Logger(McpController.name);
  private transports = new Map<string, SSEServerTransport>();

  constructor(private mcpService: McpService) {}

  @Post('messages')
  async handleMessages(@Req() req: Request, @Res() res: Response) {
    const sessionId = req.query.sessionId as string;
    if (!sessionId) {
      this.logger.warn('MCP message received without session ID');
      return res.status(400).send('Session ID required');
    }

    const transport = this.transports.get(sessionId);
    if (!transport) {
      this.logger.warn(`MCP message for unknown session: ${sessionId}`);
      return res.status(404).send('Session not found');
    }

    await transport.handlePostMessage(req, res);
  }

  @Get('sse-connect')
  async handleSseConnect(@Res() res: Response) {
    const sessionId = crypto.randomUUID();
    this.logger.log(`New MCP SSE connection: ${sessionId}`);

    const transport = new SSEServerTransport(
      `/mcp/messages?sessionId=${sessionId}`,
      res,
    );

    this.transports.set(sessionId, transport);

    // Cleanup session after 30 minutes of inactivity
    const cleanupTimer = setTimeout(
      () => {
        this.logger.log(`Cleaning up inactive MCP session: ${sessionId}`);
        this.transports.delete(sessionId);
      },
      30 * 60 * 1000,
    ); // 30 minutes

    transport.onclose = () => {
      this.logger.log(`MCP SSE connection closed: ${sessionId}`);
      clearTimeout(cleanupTimer);
      this.transports.delete(sessionId);
    };

    await this.mcpService.connectTransport(transport);
    await transport.start();
  }
}
