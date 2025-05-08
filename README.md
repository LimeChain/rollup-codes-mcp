# RollupCodes MCP

MCP server that provides rollup data from [RollupCodes](https://rollup.codes)

## Building

### Add submodules

```bash
git submodule update --recursive --remote
```

### Build

```bash
npm run build
```

## Adding the MCP server to Cursor

Change your `mcp.json` file based on the version you want

> [!CAUTION]
> NOT WORKING FOR NOW

### Default

```json
{
  "mcpServers": {
    "rollup-codes": {
      "command": "npx",
      "args": [
        "limechain/rollup-codes-mcp",
      ]
    }
  }
}
```

### Local

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