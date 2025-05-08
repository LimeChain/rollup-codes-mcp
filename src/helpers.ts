import fs from 'fs'
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

export type CustomChainSpec = {
  opcodes: ChainSpecElementsMap,
  precompiles: ChainSpecElementsMap,
  system_contracts: ChainSpecElementsMap
}

export type ChainSpecElementsMap = {
  [index: string]: ChainSpecElement
}

export type ChainSpecElement = {
  name: string,
  description?: string,
  description2?: string,
  url?: string
}

export type ChainSpecElementStatus = "Unsupported" | "Modified" | "Added"

export type CustomChainSpecWithMeta = {
  chainId: number | null,
  opcodes: ChainSpecElementsMap,
  precompiles: ChainSpecElementsMap,
  system_contracts: ChainSpecElementsMap
}

export const getChainSpec = (network: string, rootDir: string): CustomChainSpecWithMeta => {
  const folder = `${rootDir}/chain-specs/specifications/`;
  let opcodes: ChainSpecElementsMap = {};
  let precompiles: ChainSpecElementsMap = {};
  let system_contracts: ChainSpecElementsMap = {};
  let chainId: number | null = null;
  try {
    const fileContents = fs.readFileSync(`${folder}${network}.json`, 'utf8');
    const chainSpec = JSON.parse(fileContents);
    chainId = chainSpec.chain_id ?? null;
    chainSpec.forks.map((fork: CustomChainSpec) => {
      Object.entries(fork.opcodes || {}).forEach(([opcode, data]) => {
        opcodes[opcode] = data;
      });
      Object.entries(fork.precompiles || {}).forEach(([precompile, data]) => {
        precompiles[precompile] = data;
      });
      Object.entries(fork.system_contracts || {}).forEach(([system_contract, data]) => {
        system_contracts[system_contract] = data;
      });
    });
  } catch (e) {
    console.error('Error in getChainSpec:', e);
  }
  return {
    chainId,
    opcodes,
    precompiles,
    system_contracts,
  };
}

export type MessagingFields = {
  l1ToL2: {
    latency: string | null,
    cost: string | null,
  },
  l2ToL1: {
    latency: string | null,
    cost: string | null,
  }
};

export const getRollupMarkdownFields = (rollupName: string, rootDir: string): {
  blockTime: string | null,
  finality: string | null,
  sequencingFrequency: string | null,
  supportedTransactionTypes: string | null,
  gasLimit: string | null,
  messaging: MessagingFields,
  supportedRpcCalls: Array<{
    method: string,
    params: string,
    rollupBehaviour: string,
    ethereumL1Behaviour: string
  }>
} => {
  const mdxPath = `${rootDir}/src/docs/${rollupName.toLowerCase()}.mdx`;
  let blockTime: string | null = null;
  let finality: string | null = null;
  let sequencingFrequency: string | null = null;
  let supportedTransactionTypes: string | null = null;
  let gasLimit: string | null = null;
  // New fields for messaging
  let messaging: MessagingFields = {
    l1ToL2: {
      latency: null as string | null,
      cost: null as string | null,
    },
    l2ToL1: {
      latency: null as string | null,
      cost: null as string | null,
    },
  };
  let supportedRpcCalls: Array<{
    method: string,
    params: string,
    rollupBehaviour: string,
    ethereumL1Behaviour: string
  }> = [];
  try {
    const mdxContent = fs.readFileSync(mdxPath, 'utf8');
    const blockTimeMatch = mdxContent.match(/<Parameter name="Block\s+Time" value="([^"]+)"/i);
    if (blockTimeMatch) blockTime = blockTimeMatch[1];
    const gasLimitMatch = mdxContent.match(/<Parameter name="Gas Limit" value="([^"]+)"/i);
    if (gasLimitMatch) gasLimit = gasLimitMatch[1];
    const finalityMatch = mdxContent.match(/<Parameter name="Objective Finality"\s+value="([^"]+)"/);
    if (finalityMatch) finality = finalityMatch[1];
    const sequencingFrequencyMatch = mdxContent.match(/<Parameter name="Sequencing Frequency" value="([^"]+)"/);
    if (sequencingFrequencyMatch) sequencingFrequency = sequencingFrequencyMatch[1];
    // Extract supported transaction types as the indented list after the Transaction Types parameter
    const txTypesMatch = mdxContent.match(/<Parameter name="Transaction Types"[^>]*>\s*([\s\S]*?)(?:<|$)/);
    if (txTypesMatch) {
      // Try to extract the markdown list (lines starting with '-') after the parameter
      const listMatch = txTypesMatch[1].match(/(- .*(?:\n|$))+?/g);
      if (listMatch) {
        supportedTransactionTypes = listMatch.map(line => line.trim()).join('\n');
      } else {
        // fallback: just return the raw block
        supportedTransactionTypes = txTypesMatch[1].trim();
      }
    }
    // Extract Messaging MultiRowParameters block
    const messagingMatch = mdxContent.match(/<MultiRowParameters[^>]*title=["']Messaging["'][^>]*data=\{\[([\s\S]*?)\]\}\s*\/>/);
    if (messagingMatch) {
      // Try to parse the JS-like array inside data={[ ... ]}
      const dataBlock = messagingMatch[1];
      // Extract L1 -> L2 and L2 -> L1 blocks
      const l1ToL2Match = dataBlock.match(/title:\s*['"]L1\s*→\s*L2['"],\s*rows:\s*\[([\s\S]*?)\]/);
      const l2ToL1Match = dataBlock.match(/title:\s*['"]L2\s*→\s*L1['"],\s*rows:\s*\[([\s\S]*?)\]/);
      function extractField(rowsBlock: string | undefined, label: string): string | null {
        if (!rowsBlock) return null;
        const match = rowsBlock.match(new RegExp(`label:\\s*['\"]${label}['\"],[^}]*value:\\s*(['\"])(.*?)\\1`));
        return match ? match[2] : null;
      }
      messaging.l1ToL2.latency = extractField(l1ToL2Match ? l1ToL2Match[1] : undefined, 'Latency');
      messaging.l1ToL2.cost = extractField(l1ToL2Match ? l1ToL2Match[1] : undefined, 'Cost');
      messaging.l2ToL1.latency = extractField(l2ToL1Match ? l2ToL1Match[1] : undefined, 'Latency');
      messaging.l2ToL1.cost = extractField(l2ToL1Match ? l2ToL1Match[1] : undefined, 'Cost');
    }
    // Extract supported RPC calls from the RPC-API section
    const rpcSectionMatch = mdxContent.match(/<Section title=["']RPC-API["']>[\s\S]*?<Legend \/>[\s\S]*?(\| Method \|[\s\S]*?\|[\s\S]*?\|)(?:\n\n|<\/Section>|$)/);
    if (rpcSectionMatch) {
      const tableBlock = rpcSectionMatch[1];
      // Split into lines, skip header and separator
      const lines = tableBlock.split('\n').filter(line => line.trim().startsWith('|') && !line.includes(':-----'));
      if (lines.length > 1) {
        // Remove header
        lines.shift();
        for (const line of lines) {
          // | `method` | params | rollup | l1 |
          const cols = line.split('|').map(col => col.trim());
          if (cols.length >= 5) {
            // Remove backticks from method
            const method = cols[1].replace(/`/g, '');
            const params = cols[2];
            const rollupBehaviour = cols[3];
            // Remove <Unsupported />, <Modified />, <Added /> tags from ethereumL1Behaviour
            let ethereumL1Behaviour = cols[4].replace(/<Unsupported\s*\/>|<Modified\s*\/>|<Added\s*\/>/g, '').trim();
            supportedRpcCalls.push({ method, params, rollupBehaviour, ethereumL1Behaviour });
          }
        }
      }
    }
  } catch (e) {
    // File not found or parse error, leave as null
  }
  return { blockTime, finality, sequencingFrequency, supportedTransactionTypes, gasLimit, messaging, supportedRpcCalls };
}

export function getRootDir(importMetaUrl: string): string {
  const __filename = fileURLToPath(importMetaUrl);
  let rootDir = dirname(__filename);
  if (rootDir.includes('/build')) {
    rootDir = rootDir.split('/build')[0];
  } else if (rootDir.includes('/src')) {
    rootDir = rootDir.split('/src')[0];
  }
  return rootDir;
}

/**
 * Lists all rollups by reading .mdx files in the docs directory and extracting title and subtitle.
 * @param rootDir The root directory of the project
 * @returns Array of { name, description } objects for each rollup
 */
export function listRollupsFromDocs(rootDir: string): Array<{ name: string; description: string }> {
  const docsDir = `${rootDir}/src/docs/`;
  let rollups: Array<{ name: string; description: string }> = [];
  try {
    const files = fs.readdirSync(docsDir);
    for (const file of files) {
      if (file.endsWith('.mdx')) {
        const filePath = path.join(docsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(content);
        if (data.title && data.subtitle) {
          rollups.push({ name: data.title, description: data.subtitle });
        }
      }
    }
  } catch (e) {
    // Let the caller handle errors if needed
    throw e;
  }
  return rollups;
}

export const getRollupCodesName = (rollupName: string): string => {
  const formattedRollupName = rollupName.toLowerCase().replace(/ /g, '-');
  const names = {
    "arbitrum": "arbitrum-one",
    "world": "world-chain",
    "zksync": "zksync-era",
    "zkevm": "polygon-zkevm",
  } as Record<string, string>;
  return names[formattedRollupName] || formattedRollupName;
}