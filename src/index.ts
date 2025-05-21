#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { buildRollupCaches } from './util/helpers.js'

const { rollupSpecsCache, rollupMap } = await buildRollupCaches();

const supportedRollupsEnum = Object.keys(rollupMap) as [string, ...string[]];
const multipleExecEnvRollups = supportedRollupsEnum.filter((rollup) => rollupMap[rollup].length > 1);

// Get all unique execution environments
const executionEnvironmentsSet = Object.values(rollupMap)
  .flat()
  .reduce((acc, env) => {
    acc.add(env);
    return acc;
  }, new Set<string>());
const executionEnvironments = Array.from(executionEnvironmentsSet) as [string, ...string[]];

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
    execEnv: z.optional(z.enum(executionEnvironments)).describe(`Execution environment to fetch specs for. It must be provided for ${multipleExecEnvRollups.join(", ")}`),
  },
  async ({ rollupName, execEnv }) => {
    const data = rollupSpecsCache[rollupName][execEnv || "evm"];
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
          text: JSON.stringify(supportedRollupsEnum, null, 2),
        },
      ],
    };
  },
);

server.tool(
  "listExecutionEnvironments",
  "Returns a list of all supported execution environments for a given rollup",
  {
    rollupName: z.enum(supportedRollupsEnum).describe("Name of the rollup to fetch execution environments for"),
  },
  async ({ rollupName }) => {
    const execEnvs = Object.values(rollupMap[rollupName]).reduce((acc, env) => {
      acc.push({env, description: rollupSpecsCache[rollupName][env].description});
      return acc;
    }, [] as {env: string, description: string}[]);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(Object.values(execEnvs), null, 2),
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