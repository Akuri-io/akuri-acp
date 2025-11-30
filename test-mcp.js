const { spawn } = require('child_process');

const server = spawn('node', ['dist/main.js'], {
  cwd: __dirname,
  stdio: ['pipe', 'pipe', 'inherit'],
  env: { ...process.env, MCP_MODE: 'true' }
});

let messageId = 1;

// Send initialize
const initMessage = {
  jsonrpc: '2.0',
  id: messageId++,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-client', version: '1.0.0' }
  }
};

console.log('Sending initialize...');
server.stdin.write(JSON.stringify(initMessage) + '\n');

// Wait for response and send tools/list
setTimeout(() => {
  const listMessage = {
    jsonrpc: '2.0',
    id: messageId++,
    method: 'tools/list',
    params: {}
  };

  console.log('Sending tools/list...');
  server.stdin.write(JSON.stringify(listMessage) + '\n');

  // Wait and send tool call for search
  setTimeout(() => {
    const callMessage = {
      jsonrpc: '2.0',
      id: messageId++,
      method: 'tools/call',
      params: {
        name: 'akuri_search_docs',
        arguments: {
          query: 'naming conventions',
          limit: 5
        }
      }
    };

    console.log('Sending tools/call for akuri_search_docs...');
    server.stdin.write(JSON.stringify(callMessage) + '\n');

    // Wait and send workflow validation
    setTimeout(() => {
      const workflowMessage = {
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/call',
        params: {
          name: 'akuri_check_workflow',
          arguments: {
            intent: 'BUILD',
            feature_context: 'user authentication'
          }
        }
      };

      console.log('Sending tools/call for akuri_check_workflow...');
      server.stdin.write(JSON.stringify(workflowMessage) + '\n');

      // Wait and send blueprint generation
      setTimeout(() => {
        const blueprintMessage = {
          jsonrpc: '2.0',
          id: messageId++,
          method: 'tools/call',
          params: {
            name: 'akuri_generate_blueprint',
            arguments: {
              blueprint_name: 'datatable',
              variables: JSON.stringify({
                entity: 'User',
                color: 'blue'
              })
            }
          }
        };

        console.log('Sending tools/call for akuri_generate_blueprint...');
        server.stdin.write(JSON.stringify(blueprintMessage) + '\n');

        // Exit after a bit
        setTimeout(() => {
          server.kill();
        }, 3000);
      }, 2000);
    }, 2000);
  }, 1000);
}, 1000);

// Listen for responses
server.stdout.on('data', (data) => {
  console.log('Server response:', data.toString().trim());
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
});