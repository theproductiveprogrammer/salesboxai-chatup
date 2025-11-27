use std::time::Duration;

// MCP Constants
pub const MCP_TOOL_CALL_TIMEOUT: Duration = Duration::from_secs(30);
pub const MCP_BASE_RESTART_DELAY_MS: u64 = 10000; // Start with 10 seconds (core restart takes 45+ seconds)
pub const MCP_MAX_RESTART_DELAY_MS: u64 = 60000; // Cap at 60 seconds
pub const MCP_BACKOFF_MULTIPLIER: f64 = 1.5; // 1.5x delay each time (10s -> 15s -> 22s -> 33s -> 50s)

pub const DEFAULT_MCP_CONFIG: &str = r#"{
  "mcpServers": {
    "browsermcp": {
      "command": "npx",
      "args": ["@browsermcp/mcp"],
      "env": {},
      "active": false
    },
    "fetch": {
      "command": "uvx",
      "args": ["mcp-server-fetch"],
      "env": {},
      "active": false
    },
    "serper": {
      "command": "npx",
      "args": ["-y", "serper-search-scrape-mcp-server"],
      "env": { "SERPER_API_KEY": "YOUR_SERPER_API_KEY_HERE" },
      "active": false
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/path/to/other/allowed/dir"
      ],
      "env": {},
      "active": false
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "env": {},
      "active": false
    }
  }
}"#;
