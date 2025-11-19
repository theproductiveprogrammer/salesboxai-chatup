#!/usr/bin/env node

import { fileURLToPath } from "url";
import { dirname} from "path";
import { spawn } from "child_process";

// Get the directory where this launcher script is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the MCP server directory
const mcpServerDir = __dirname;

// Change to the MCP server directory and start the server
process.chdir(mcpServerDir);

// Start the MCP server
const child = spawn('node', ['build/index.js'], {
    stdio: 'inherit',
    cwd: mcpServerDir
});

child.on('error', (error) => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
});

child.on('exit', (code) => {
    process.exit(code);
});

// Forward termination signals to child process to prevent orphans
process.on('SIGTERM', () => {
    child.kill('SIGTERM');
});

process.on('SIGINT', () => {
    child.kill('SIGINT');
});

process.on('SIGHUP', () => {
    child.kill('SIGHUP');
});

// Handle parent process exit
process.on('exit', () => {
    child.kill();
});

