type PermissionlessMethodPreset = unknown[] | Record<string, unknown>;

const noParamsMethods = new Set([
  'eth_accounts',
  'eth_blockNumber',
  'eth_chainId',
  'eth_coinbase',
  'eth_gasPrice',
  'eth_hashrate',
  'eth_mining',
  'eth_newBlockFilter',
  'eth_newPendingTransactionFilter',
  'eth_protocolVersion',
  'eth_syncing',
  'net_listening',
  'net_peerCount',
  'net_version',
  'wallet_getCapabilities',
  'wallet_getPermissions',
  'web3_clientVersion',
]);

const methodPresets: Record<string, PermissionlessMethodPreset> = {
  wallet_switchEthereumChain: [{ chainId: '0x64' }],
  wallet_revokePermissions: [{ eth_accounts: {} }],
  eth_call: [
    {
      to: '0x69498dd54bd25aa0c886cf1f8b8ae0856d55ff13',
      value: '0x1',
    },
    'latest',
  ],
  eth_estimateGas: [
    {
      from: '0x0000000000000000000000000000000000000000',
      to: '0x0000000000000000000000000000000000000000',
      value: '0x0',
      data: '0x',
    },
  ],
  eth_feeHistory: ['0x5', null, [20, 30]],
  eth_getBalance: ['0x0000000000000000000000000000000000000000', 'latest'],
  eth_getBlockByHash: [
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    false,
  ],
  eth_getBlockByNumber: ['latest', false],
  eth_getBlockTransactionCountByHash: [
    '0x0000000000000000000000000000000000000000000000000000000000000000',
  ],
  eth_getBlockTransactionCountByNumber: ['latest'],
  eth_getCode: ['0x0000000000000000000000000000000000000000', 'latest'],
  eth_getFilterChanges: ['0x1'],
  eth_getFilterLogs: ['0x1'],
  eth_getLogs: [
    {
      fromBlock: 'latest',
      toBlock: 'latest',
      address: '0x0000000000000000000000000000000000000000',
      topics: [],
    },
  ],
  eth_getProof: [
    '0x0000000000000000000000000000000000000000',
    ['0x0'],
    'latest',
  ],
  eth_getStorageAt: ['0x0000000000000000000000000000000000000000', '0x0', 'latest'],
  eth_getTransactionByBlockNumberAndIndex: ['latest', '0x0'],
  eth_getTransactionByHash: [
    '0x0000000000000000000000000000000000000000000000000000000000000000',
  ],
  eth_getTransactionCount: ['0x0000000000000000000000000000000000000000', 'latest'],
  eth_getTransactionReceipt: [
    '0x0000000000000000000000000000000000000000000000000000000000000000',
  ],
  eth_getUncleByBlockHashAndIndex: [
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    '0x0',
  ],
  eth_getUncleByBlockNumberAndIndex: ['latest', '0x0'],
  eth_getUncleCountByBlockHash: [
    '0x0000000000000000000000000000000000000000000000000000000000000000',
  ],
  eth_getUncleCountByBlockNumber: ['latest'],
  eth_newFilter: [
    {
      fromBlock: 'latest',
      toBlock: 'latest',
      address: '0x0000000000000000000000000000000000000000',
      topics: [],
    },
  ],
  eth_sendRawTransaction: ['0x'],
  eth_submitHashrate: ['0x1', '0x0000000000000000000000000000000000000000000000000000000000000000'],
  eth_submitWork: ['0x1', '0x0000000000000000000000000000000000000000000000000000000000000000', '0x0'],
  eth_subscribe: ['newHeads'],
  eth_uninstallFilter: ['0x1'],
  eth_unsubscribe: ['0x1'],
  web3_sha3: ['0x68656c6c6f20776f726c64'],
  personal_ecRecover: ['hello world', '0x'],
  kc_resolveEns: ['vitalik.eth'],
  kc_lookupEns: ['0x0000000000000000000000000000000000000000'],
};

export function getPermissionlessMethodParamsPreset(method: string): string | undefined {
  const preset = noParamsMethods.has(method) ? [] : methodPresets[method];

  if (preset === undefined) {
    return undefined;
  }

  return JSON.stringify(preset, null, 2);
}
