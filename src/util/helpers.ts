import fs from 'fs';
import tmp from "tmp";
import {simpleGit} from "simple-git";
import { getRollupMarkdownFields } from './markdown.js';
import { CustomChainSpec, ChainSpecElementsMap, CustomChainSpecWithMeta, RollupMap } from '../types.js';

export async function buildRollupCaches() {
  const tmpDir = tmp.dirSync({ unsafeCleanup: true });
  await simpleGit().clone("https://github.com/LimeChain/RollupCodes.git", tmpDir.name, { "--depth": 1, "--branch": "main", "--recursive": null });

  const rollupMap = listRollupsFromChainSpecs(tmpDir.name);
  const supportedRollupsEnum = Object.keys(rollupMap) as [string, ...string[]];

  if (supportedRollupsEnum.length === 0) {
    throw new Error("No rollups found");
  }

  const rollupSpecsCache: Record<string, Record<string, any>> = {};
  Object.entries(rollupMap).forEach(([rollupName, execEnvs]) => {
    for (const execEnv of execEnvs) {
      // If there is only one execEnv, we don't need to specify it
      const optionalExecEnv = (execEnvs.length > 1) ? execEnv : undefined;

      const chainSpec = getChainSpec(rollupName, tmpDir.name, optionalExecEnv);
      const opcodes = Object.entries(chainSpec.opcodes).map(([opcode, data]) => ({ opcode, ...data }));
      const precompiles = Object.entries(chainSpec.precompiles).map(([address, data]) => ({ address, ...data }));
      const systemContracts = Object.entries(chainSpec.system_contracts).map(([address, data]) => ({ address, ...data }));

      const { blockTime, finality, sequencingFrequency, supportedTransactionTypes, gasLimit, messaging, supportedRpcCalls } = getRollupMarkdownFields(rollupName, tmpDir.name);
      
      if (!rollupSpecsCache[rollupName]) {
        rollupSpecsCache[rollupName] = {};
      }

      rollupSpecsCache[rollupName][execEnv]= {
        chainId: chainSpec.chainId,
        description: chainSpec.description,
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
    }
  });

  fs.rmSync(tmpDir.name, { recursive: true, force: true });
  return { rollupSpecsCache, rollupMap };
}

const getChainSpec = (network: string, rootDir: string, execEnv?: string,): CustomChainSpecWithMeta => {
  const folder = `${rootDir}/chain-specs/specifications/`;
  let opcodes: ChainSpecElementsMap = {};
  let precompiles: ChainSpecElementsMap = {};
  let system_contracts: ChainSpecElementsMap = {};
  let chainId: number | null = null;
  let description: string | null = null;
  try {
    const execEnvSuffix = execEnv ? `_${execEnv}` : "";
    const fileContents = fs.readFileSync(`${folder}${network}${execEnvSuffix}.json`, 'utf8');
    const chainSpec = JSON.parse(fileContents);
    chainId = chainSpec.chain_id ?? null;
    description = chainSpec.description ?? null;
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
    description,
    opcodes,
    precompiles,
    system_contracts,
  };
}

const listRollupsFromChainSpecs = (rootDir: string): RollupMap => {
  const folder = `${rootDir}/chain-specs/specifications/`;
  const files = fs.readdirSync(folder);

  return files.reduce((acc, file) => {
    const fileName = file.replace('.json', '');
    const [name, execEnv] = fileName.split('_');
    if (!acc[name]) {
      acc[name] = [];
    }
    acc[name].push(execEnv || "evm");
    return acc;
  }, {} as RollupMap);
}