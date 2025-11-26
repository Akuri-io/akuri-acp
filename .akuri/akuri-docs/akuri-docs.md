# Akuri Context Protocol (ACP) - Technical Specification

## 1. Introduction

### 1.1 Overview
Akuri Context Protocol (ACP) is a Model Context Protocol (MCP) compatible server built with NestJS that serves as an intelligent bridge between local documentation systems and AI agents. It enforces the Akuri Methodology workflow while providing semantic search capabilities and automated prompt generation.

### 1.2 Purpose
ACP acts as the "methodological brain" for AI agents, ensuring that development activities follow a structured workflow and maintain consistency with project guidelines. Unlike simple file searchers, ACP understands development phases and prevents out-of-order execution.

### 1.3 Key Features
- **Intelligent Search**: Semantic search across local documentation using Orama vector database
- **Workflow Enforcement**: Validates development phase dependencies
- **Automated Consistency**: Injects project guardrails into AI prompts
- **Real-time Indexing**: Watches documentation directories for changes
- **Dual Mode Operation**: Supports both HTTP API and MCP stdio communication

## 2. Architecture

### 2.1 System Architecture
ACP follows a modular architecture built on NestJS framework:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Agents     │◄──►│   MCP Layer     │◄──►│  Akuri Core     │
│ (Cursor, Windsurf│    │  (Stdio/HTTP)  │    │   Business       │
│  Kilo Code)     │    │                 │    │   Logic          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                    ┌─────────────────┐    ┌─────────────────┐
                    │   Librarian     │    │   Workflow      │
                    │   (Search)      │    │   Engine        │
                    └─────────────────┘    └─────────────────┘
                                                       │
                    ┌─────────────────┐    ┌─────────────────┐
                    │   Consistency   │    │   Config        │
                    │   (Templates)   │    │   Service       │
                    └─────────────────┘    └─────────────────┘
```

### 2.2 Core Components

#### 2.2.1 MCP Layer (`src/mcp/`)
- **McpService**: Manages MCP server lifecycle and tool registration
- **Transport**: StdioServerTransport for AI agent communication
- **Tool Registry**: Registers and handles MCP tool calls

#### 2.2.2 Akuri Core (`src/akuri-core/`)
- **LibrarianService**: Handles document indexing and semantic search
- **WorkflowService**: Enforces development phase dependencies
- **ConsistencyService**: Manages blueprint templates and prompt generation
- **ConfigService**: Manages document paths and configuration

#### 2.2.3 HTTP API Layer
- **AppController**: Basic application endpoints
- **HealthController**: System health monitoring
- **ConfigController**: Configuration management API

### 2.3 Data Flow
1. **Indexing Phase**: Documents are indexed using Orama with metadata extraction
2. **Query Phase**: AI agents call MCP tools to search or validate workflows
3. **Validation Phase**: Workflow engine checks phase dependencies
4. **Generation Phase**: Consistency service generates structured prompts

## 3. API Endpoints

### 3.1 Health Endpoints

#### GET /health
Basic health check endpoint that validates:
- Memory usage (< 150MB heap)
- Filesystem access to configured document paths
- Database connectivity (Orama instance)
- MCP service initialization

**Response:**
```json
{
  "status": "ok",
  "info": {
    "memory_heap": { "status": "up" },
    "filesystem": {
      "status": "up",
      "message": "All X docs directories accessible",
      "directories": ["/path/to/docs"]
    },
    "database": {
      "status": "up",
      "documentCount": 42,
      "message": "Database healthy with 42 documents"
    },
    "mcp": {
      "status": "up",
      "message": "MCP server operational"
    }
  }
}
```

#### GET /health/detailed
Extended health check with additional metrics:
- System uptime and version
- Memory usage statistics
- Document path status
- Search performance metrics

### 3.2 Configuration Endpoints

#### GET /config/status
Returns current configuration status including document paths and indexing status.

#### GET /config/paths
Returns list of configured document paths.

#### POST /config/paths
Adds a new document path for indexing.

**Request Body:**
```json
{
  "path": "/path/to/documents"
}
```

#### DELETE /config/paths/:path
Removes a document path from configuration.

#### POST /config/test-path
Tests if a path is valid for document indexing.

**Request Body:**
```json
{
  "path": "/path/to/test"
}
```

**Response:**
```json
{
  "valid": true,
  "message": "Path is valid",
  "documentCount": 15
}
```

#### POST /config/paths/bulk
Updates all document paths at once.

**Request Body:**
```json
{
  "paths": ["/path/1", "/path/2"]
}
```

## 4. MCP Tools

### 4.1 akuri_search_docs
Performs semantic search across indexed documentation.

**Parameters:**
- `query` (string, required): Search query or keywords (1-500 chars)
- `limit` (number, optional): Maximum results (1-50, default: 5)

**Response:**
```json
[
  {
    "path": "/docs/guide.md",
    "score": 0.85,
    "metadata": {
      "title": "Getting Started",
      "tags": ["guide", "tutorial"],
      "status": "published"
    },
    "snippet": "This guide will help you get started..."
  }
]
```

### 4.2 akuri_check_workflow
Validates if a development phase can be executed based on existing documentation.

**Parameters:**
- `intent` (enum, required): Phase to validate ("PLAN", "BUILD", "REFACTOR", "AUDIT")
- `feature_context` (string, required): Feature keywords (1-200 chars, alphanumeric + spaces/dashes/underscores)

**Workflow Rules:**
- PLAN requires existing DESIGN document
- BUILD requires existing DESIGN + PLAN documents
- REFACTOR requires existing AUDIT document

**Response (Approved):**
```json
{
  "status": "APPROVED",
  "message": "Workflow validated successfully",
  "required_docs_found": ["/docs/design/login.md", "/docs/plan/login.md"]
}
```

**Response (Blocked):**
```json
{
  "isError": true,
  "content": [
    {
      "type": "text",
      "text": "Cannot proceed with BUILD phase: Missing required documents: DESIGN for login feature"
    }
  ]
}
```

### 4.3 akuri_generate_blueprint
Generates structured prompts using predefined templates.

**Parameters:**
- `blueprint_name` (string, required): Template name (1-100 chars, alphanumeric + dashes/underscores)
- `variables` (string, required): JSON string of template variables (1-5000 chars)

**Example Request:**
```json
{
  "blueprint_name": "datatable",
  "variables": "{\"entity\": \"User\", \"columns\": \"name,email,role\"}"
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Generate a data table component for User entity with columns: name, email, role..."
    }
  ]
}
```

## 5. Configuration

### 5.1 Environment Variables

#### Required
- `AKURI_DOCS_PATH`: Path to documentation directory (fails to start without this)

#### Optional
- `LOG_LEVEL`: Logging level (error, warn, info, http, debug, verbose)
- `PORT`: HTTP server port (default: 3000)
- `MCP_MODE`: Enable MCP stdio mode (default: false)
- `NODE_ENV`: Node environment (development/production)

### 5.2 Document Structure
ACP expects documentation in the following structure:
```
akuri-docs/
├── akuri-guidelines/     # Project standards and rules
├── akuri-work/          # Work documentation
│   ├── design/          # DESIGN phase documents
│   ├── plan/            # PLAN phase documents
│   ├── build/           # BUILD phase documents
│   └── audit/           # AUDIT phase documents
└── blueprints/          # Template definitions
```

### 5.3 Document Metadata
Documents support YAML frontmatter for enhanced search:
```yaml
---
title: "User Authentication Design"
status: "approved"
tags: ["auth", "security", "design"]
use_case: "user-management"
layers: ["frontend", "backend"]
phase: "DESIGN"
---
```

## 6. Dependencies

### 6.1 Core Dependencies
- **@nestjs/core**: ^11.0.1 - Main framework
- **@modelcontextprotocol/sdk**: ^1.22.0 - MCP protocol implementation
- **@orama/orama**: ^3.1.16 - Vector search database
- **chokidar**: ^4.0.3 - File system watching
- **gray-matter**: ^4.0.3 - Frontmatter parsing
- **winston**: ^3.18.3 - Logging
- **zod**: ^3.25.76 - Schema validation

### 6.2 Development Dependencies
- **TypeScript**: ^5.7.3
- **Jest**: ^29.7.0 - Testing framework
- **ESLint**: ^9.18.0 - Code linting
- **Prettier**: ^3.4.2 - Code formatting

## 7. Deployment

### 7.1 Build Process
```bash
npm install
npm run build
```

### 7.2 Running Modes

#### HTTP Mode (Configuration Interface)
```bash
npm run start:prod
# Server runs on http://localhost:3000
```

#### MCP Mode (AI Agent Integration)
Configure in IDE's MCP settings:
```json
{
  "mcpServers": {
    "akuri-core": {
      "command": "node",
      "args": ["/absolute/path/to/dist/main.js"],
      "env": {
        "NODE_ENV": "production",
        "MCP_MODE": "true"
      }
    }
  }
}
```

### 7.3 Production Considerations
- Set `NODE_ENV=production` for optimized performance
- Ensure `AKURI_DOCS_PATH` points to correct documentation location
- Use absolute paths in MCP configuration
- Monitor memory usage via health endpoints
- Implement log aggregation for production logging

## 8. Monitoring and Health Checks

### 8.1 Health Check Integration
ACP integrates with standard health check libraries and provides:
- Memory usage monitoring
- Filesystem accessibility validation
- Database connectivity checks
- MCP service status

### 8.2 Logging
- Structured logging with Winston
- Configurable log levels
- Context-aware log messages
- Performance metrics logging

### 8.3 Metrics
- Document indexing statistics
- Search performance metrics
- API request rates and errors
- Memory and CPU usage

## 9. Security Considerations

### 9.1 Access Control
- Rate limiting (10 req/sec short, 100 req/min medium)
- Input validation with Zod schemas
- Path traversal protection
- CORS configuration for web interface

### 9.2 Data Protection
- Local document indexing only
- No external data transmission
- Secure file system access validation

## 10. Development Workflow

### 10.1 Akuri Methodology Integration
ACP enforces the following development phases:

1. **INFO/RESEARCH**: Free exploration and information gathering
2. **DESIGN**: Architectural definition (human input required)
3. **PLAN**: Task breakdown and planning (requires DESIGN)
4. **BUILD**: Code implementation (requires PLAN)
5. **AUDIT**: Quality review and testing
6. **REFACTOR**: Code improvement (requires AUDIT)

### 10.2 Blueprint System
- Template-based prompt generation
- Variable substitution
- Consistent code generation patterns
- Project-specific customization

## 11. Testing

### 11.1 Test Coverage
- Unit tests for all services
- Integration tests for MCP tools
- E2E tests for HTTP API
- Health check validation tests

### 11.2 Test Scripts
```bash
npm run test          # Unit tests
npm run test:e2e      # End-to-end tests
npm run test:cov      # Coverage report
```

## 12. Future Enhancements

### 12.1 Planned Features
- Advanced blueprint templating engine
- Multi-language document support
- Real-time collaboration features
- Plugin architecture for custom tools
- Advanced workflow customization

### 12.2 Scalability Improvements
- Distributed document indexing
- Caching layer for search results
- Horizontal scaling support
- Advanced search algorithms

---

**Version**: 0.0.1
**Last Updated**: 2025-11-24
**License**: MIT
**Authors**: Akuri Team