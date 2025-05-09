#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { buildRollupCaches } from './helpers.js'

const { rollupSpecsCache, rollupListCache, supportedRollupsEnum } = await buildRollupCaches();

// Create server instance
const server = new McpServer({
  name: "rollup-codes",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

server.tool(
  "getRollupSpecs",
  `Returns structured JSON data for a given rollup, including metadata, opcodes, precompiles, system contracts, and more. It supports: ${supportedRollupsEnum.join(", ")}`,
  {
    rollupName: z.enum(supportedRollupsEnum).describe("Name of the rollup to fetch specs for"),
  },
  async ({ rollupName }) => {
    const data = rollupSpecsCache[rollupName];
    return {
      content: [
        {
          type: "text",
          text: data ? JSON.stringify(data, null, 2) : `No data found for rollup: ${rollupName}`,
        },
      ],
    };
  },
);

server.tool(
  "listRollups",
  "Returns a list of all supported rollups with high-level metadata (for autocomplete, dropdowns, etc.)",
  {},
  async () => {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(rollupListCache, null, 2),
        },
      ],
    };
  },
);

async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("RollupCodes Server running on stdio");
    
    // Keep the process running
    process.on('SIGINT', () => {
      console.error("Server shutting down");
      process.exit(0);
    });
  } catch (error) {
    console.error("Error connecting to transport:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});