# SalesboxAI Zoho MCP Server

A Model Context Protocol (MCP) server for integrating with Zoho CRM.

## Installation

### Local Installation
```bash
npm install
npm run build
```

## Usage

### From the Project Directory
```bash
# Using npm scripts
npm start

# Using the built files directly
node build/index.js

# Using the wrapper script
node run-mcp-server.js
```

### From Any Location (Alternative Approaches)

#### Option 1: Node.js Launcher (Recommended)
```bash
# Run from anywhere using the launcher script
node /path/to/mcp-zoho/launch-mcp.js

# Example from /tmp directory
node /Users/charleslobo/Desktop/chaRcoal/me/SalesBox/workspace/salesboxai-chatgpt/mcp-zoho/launch-mcp.js
```

#### Option 2: Shell Script
```bash
# Run from anywhere using the shell script
/path/to/mcp-zoho/start-mcp-server.sh

# Example from /tmp directory
/Users/charleslobo/Desktop/chaRcoal/me/SalesBox/workspace/salesboxai-chatgpt/mcp-zoho/start-mcp-server.sh
```

#### Option 3: Direct Wrapper Script
```bash
# Run the wrapper script directly from anywhere
node /path/to/mcp-zoho/run-mcp-server.js
```

#### Option 4: Using npm scripts from anywhere
```bash
# Change to the project directory and use npm
cd /path/to/mcp-zoho
npm run start-from-anywhere
# or
npm run start-shell
```

## For External Applications

Other applications can now run your MCP server from any location using:

1. **Absolute Paths**: Use the full path to any of the launcher scripts
2. **Configuration File**: Reference `mcp-server-config.json` for server details
3. **Environment Variables**: Set `MCP_SERVER_PATH` to point to your server directory

### Example Integration
```javascript
// In another application
const { spawn } = require('child_process');

// Start the MCP server from anywhere
const mcpServer = spawn('node', [
  '/path/to/mcp-zoho/launch-mcp.js'
], {
  stdio: ['pipe', 'pipe', 'pipe']
});
```

## Environment Configuration

The server automatically loads the `.env` file from its installation directory, so it works regardless of the current working directory.

## MCP Integration

This server implements the Model Context Protocol and can be integrated with MCP-compatible clients.

## Development

```bash
npm run build    # Build TypeScript to JavaScript
npm start        # Build and start the server
npm run test-mcp # Run MCP integration tests
```

## Files Overview

- `build/index.js` - Main compiled server (requires .env in same directory)
- `run-mcp-server.js` - Wrapper script that can be run from anywhere
- `launch-mcp.js` - Node.js launcher for cross-platform compatibility
- `start-mcp-server.sh` - Shell script launcher for Unix-like systems
- `mcp-server-config.json` - Configuration and usage information
