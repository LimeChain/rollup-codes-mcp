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