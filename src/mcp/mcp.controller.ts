import { Controller, Get, Post, Res, Req, Body, Query } from '@nestjs/common';
import { Response, Request } from 'express';
import { McpService } from './mcp.service';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import * as crypto from 'crypto';

@Controller('mcp')
export class McpController {
  // Mapa para mantener referencia a los transportes activos si es necesario
  // Aunque SSEServerTransport maneja su propio estado, necesitamos rutear los mensajes POST al transporte correcto
  private transports = new Map<string, SSEServerTransport>();

  constructor(private mcpService: McpService) {}

  @Get('sse')
  async handleSse(@Res() res: Response) {
    // Crear nuevo transporte SSE
    // El endpoint para mensajes POST será /mcp/messages?sessionId={sessionId}
    const transport = new SSEServerTransport('/mcp/messages', res);

    // Conectar al servidor MCP principal
    await this.mcpService.connectTransport(transport);

    // Cuando el transporte se cierre (cliente desconectado), limpiar
    transport.onclose = () => {
      // Transport closed
    };

    // Iniciar el transporte (esto mantiene la conexión abierta)
    await transport.start();
  }

  @Post('messages')
  async handleMessages(@Req() req: Request, @Res() res: Response) {
    // SSEServerTransport.handlePostMessage espera (req, res) y maneja el parsing
    // Pero necesitamos saber A QUÉ transporte enviar el mensaje.
    // El SDK de MCP maneja esto internamente si usamos el endpoint correcto?
    // No, SSEServerTransport es una instancia por conexión.

    // PROBLEMA: NestJS crea una nueva instancia del controlador? No, es singleton por defecto.
    // Pero handleSse crea una instancia de transport local.
    // Necesitamos una forma de recuperar el transporte correcto para el mensaje POST.

    // El cliente MCP enviará el sessionId en la URL o query params?
    // SSEServerTransport genera un endpoint URL que incluye el sessionId?
    // Revisando la implementación usual de SSEServerTransport:
    // El constructor toma (endpoint, res).
    // Cuando el cliente conecta, el transporte envía un evento 'endpoint' con la URL para POST.
    // Esa URL suele ser la que pasamos en el constructor.

    // Si pasamos '/mcp/messages', todos los clientes postearán ahí.
    // ¿Cómo distinguimos los clientes?
    // SSEServerTransport de @modelcontextprotocol/sdk < 0.6.0 (o versiones recientes)
    // maneja esto de forma diferente.

    // En implementaciones simples de express:
    // app.get('/sse', (req, res) => { transport = new SSE...; transport.start() })
    // app.post('/messages', (req, res) => { transport.handlePostMessage(req, res) })
    // Esto solo funciona para UN cliente (el último).

    // Para múltiples clientes, necesitamos gestionar sesiones.
    // Vamos a asumir un manejo simple por ahora o usar un Map si podemos identificar la sesión.
    // Pero el cliente MCP estándar no siempre envía un ID de sesión en el POST a menos que se lo demos en el evento 'endpoint'.

    // TRUCO: SSEServerTransport permite anexar query params al endpoint que envía al cliente?
    // Si instanciamos `new SSEServerTransport('/mcp/messages?sessionId=' + id, res)`
    // El cliente recibirá esa URL y la usará para POST.

    // Vamos a implementar eso.

    const sessionId = req.query.sessionId as string;
    if (!sessionId) {
      // Si no hay sessionId, intentamos manejarlo con el transporte más reciente o error?
      // O quizás el SDK maneja esto internamente si usamos el mismo path?
      // No, handlePostMessage es un método de instancia.
      return res.status(400).send('Session ID required');
    }

    const transport = this.transports.get(sessionId);
    if (!transport) {
      return res.status(404).send('Session not found');
    }

    await transport.handlePostMessage(req, res);
  }

  @Get('sse-connect')
  async handleSseConnect(@Res() res: Response) {
    const sessionId = crypto.randomUUID();
    const transport = new SSEServerTransport(
      `/mcp/messages?sessionId=${sessionId}`,
      res,
    );

    this.transports.set(sessionId, transport);

    transport.onclose = () => {
      this.transports.delete(sessionId);
    };

    // await this.mcpService.connectTransport(transport);
    await transport.start();
  }
}
