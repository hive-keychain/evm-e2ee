import type { AbiFunction, AbiParameter, Hex } from 'viem';

export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

export interface InspectorState<Request = unknown, Response = unknown> {
  status: RequestStatus;
  lastRequest: Request | null;
  lastResponse: Response | null;
  lastError: unknown | null;
}

export type EventLogType =
  | 'connect'
  | 'disconnect'
  | 'accountsChanged'
  | 'chainChanged'
  | 'requestError';

export interface EventLogEntry {
  id: number;
  type: EventLogType;
  timestamp: string;
  payload: unknown;
}

export interface ConnectionState {
  isConnected: boolean;
  providerReady: boolean;
  accounts: string[];
  activeAccount?: string;
  chainId?: string;
  connectedProviderName?: string;
}

export interface AbiInputConfig {
  name: string;
  type: string;
  placeholder?: string;
  helpText?: string;
}

export interface AbiFunctionConfig {
  label: string;
  signature: string;
  methodName: string;
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
  inputs: AbiInputConfig[];
  outputs: AbiInputConfig[];
  abi: AbiFunction;
  description?: string;
}

export interface DeployableContractConfig {
  id: 'generic' | 'erc20' | 'erc721' | 'erc1155';
  label: string;
  description?: string;
  bytecode: Hex;
  constructorInputs: AbiInputConfig[];
  constructorAbi: readonly AbiParameter[];
}

export interface NativeTransferFormValues {
  to: string;
  value: string;
  gasLimit: string;
  gasPrice: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  nonce: string;
  data: string;
}

export interface NormalizedTransactionRequest {
  from: string;
  to?: string;
  value?: Hex;
  gas?: Hex;
  gasPrice?: Hex;
  maxFeePerGas?: Hex;
  maxPriorityFeePerGas?: Hex;
  nonce?: Hex;
  data?: Hex;
}

export interface NormalizedCallRequest {
  from: string;
  to: string;
  data: Hex;
}

export type ContractFunctionAction =
  | {
      mode: 'call';
      request: NormalizedCallRequest;
    }
  | {
      mode: 'sendTransaction';
      request: NormalizedTransactionRequest;
    };

export interface ConnectResult {
  accounts: string[];
  chainId: string;
}
