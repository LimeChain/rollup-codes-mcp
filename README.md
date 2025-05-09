# RollupCodes MCP

MCP server that provides rollup data from [RollupCodes](https://rollup.codes)

## Adding the MCP server to Cursor

Change your `mcp.json` file based on the version you want

### Default

```json
{
  "mcpServers": {
    "rollup-codes": {
      "command": "npx",
      "args": [
        "@limechain/rollup-codes-mcp",
      ]
    }
  }
}
```

### Local


```bash
npm run build
```

```json
{
  "mcpServers": {
    "rollup-codes": {
      "command": "node",
      "args": [
          "~/Projects/mcp-server/server/build/index.js"
      ]
    }
  }
}
```