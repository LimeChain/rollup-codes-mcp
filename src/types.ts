
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
  description: string | null,
  opcodes: ChainSpecElementsMap,
  precompiles: ChainSpecElementsMap,
  system_contracts: ChainSpecElementsMap
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

export type RollupExecutionEnvironments = string[]
export type RollupMap = {[name: string]: RollupExecutionEnvironments}