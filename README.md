# RollupCodes MCP

MCP server that provides rollup data from [RollupCodes](https://rollup.codes)

## Setup

### Claude Desktop or Cursor

Add the following configuration:

```json
{
  "mcpServers": {
    "rollup-codes": {
      "command": "npx",
      "args": [
        "@limechain/rollup-codes-mcp"
      ]
    }
  }
}
```

#### Claude Desktop config file location

**Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

#### Cursor config file location

**Mac**: `~/.cursor/mcp.json`

**Windows**: `%USERPROFILE%\.cursor\mcp.json`

## Usage

Once configured, you can ask agent for rollup-specific information, for example:

 -  Can I deploy this smart contract on [RollupName]
 -  What OPCODEs are available on [RollupName]
 - What are the addresses of built-in contracts (e.g. bridges or oracles) on [RollupName]?

## Development
1. Clone the repository:
```bash
git clone https://github.com/LimeChain/rollup-codes-mcp
cd rollup-codes-mcp
```
2. Install dependencies
```bash
npm install
```
3. Build the project
```bash
npm run build
```

### Configuration with Claude Desktop or Cursor

```json
{
  "mcpServers": {
    "rollup-codes": {
      "command": "node",
      "args": [
          "<absoute_path_to_repo>/build/index.js"
      ]
    }
  }
}
```