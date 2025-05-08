import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getChainSpec, getRollupCodesName, getRollupMarkdownFields, listRollupsFromDocs } from './helpers.js'
import tmp from "tmp";
import {simpleGit} from "simple-git";

const tmpDir = tmp.dirSync({ unsafeCleanup: true });

await simpleGit().clone("https://github.com/LimeChain/RollupCodes.git", tmpDir.name, { "--depth": 1, "--branch": "main", "--recursive": null });

const supportedRollups: readonly [string, ...string[]] = [
  'ethereum',
  ...listRollupsFromDocs(tmpDir.name).map((rollup) => getRollupCodesName(rollup.name))
];

console.error(tmpDir.name);
console.error(supportedRollups);

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
  "Returns structured JSON data for a given rollup, including metadata, opcodes, precompiles, system contracts, and more. It supports: Abstract, Arbitrum, Base, Blast, Ink, Kakarot, Linea, Optimism, Polygon ZKevm, Scroll, Soneium, Taiko, World Chain, Zircuit and ZKsync Era",
  {
    rollupName: z.enum(supportedRollups).describe("Name of the rollup to fetch specs for"),
  },
  async ({ rollupName }) => {
    const chainSpec = getChainSpec(rollupName, tmpDir.name);
    const opcodes = Object.entries(chainSpec.opcodes).map(([opcode, data]) => ({ opcode, ...data }));
    const precompiles = Object.entries(chainSpec.precompiles).map(([address, data]) => ({ address, ...data }));
    const systemContracts = Object.entries(chainSpec.system_contracts).map(([address, data]) => ({ address, ...data }));

    // Use helper to get markdown fields
    const { blockTime, finality, sequencingFrequency, supportedTransactionTypes, gasLimit, messaging, supportedRpcCalls } = getRollupMarkdownFields(rollupName, tmpDir.name);

    const data = {
      chainId: chainSpec.chainId,
      opcodes,
      precompiles,
      systemContracts,
      blockTime,
      gasLimit,
      finality,
      sequencingFrequency,
      supportedTransactionTypes,
      messaging,
      supportedRpcCalls,
    };
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
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
    let rollups = [];
    try {
      rollups = listRollupsFromDocs(tmpDir.name);
    } catch (e) {
      const err = e as Error;
      return { content: [{ type: 'text', text: 'Error reading rollup docs: ' + err.message }] };
    }
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(rollups, null, 2),
        },
      ],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("RollupCodes Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});