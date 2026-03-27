import {
  concatHex,
  encodeAbiParameters,
  encodeFunctionData,
  toHex,
  type AbiParameter,
  type Hex,
} from 'viem';

import type {
  AbiFunctionConfig,
  AbiInputConfig,
  ContractFunctionAction,
  DeployableContractConfig,
  NativeTransferFormValues,
  NormalizedCallRequest,
  NormalizedTransactionRequest,
} from '../types';

function ensureHex(value: string): Hex {
  const normalizedValue = value.trim();
  if (!normalizedValue.startsWith('0x')) {
    throw new Error(`Expected a hex value starting with 0x, received "${value}".`);
  }

  return normalizedValue as Hex;
}

export function normalizeNumberish(value: string): Hex | undefined {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return undefined;
  }

  return toHex(BigInt(normalizedValue));
}

export function normalizeHexData(value: string): Hex | undefined {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return undefined;
  }

  return ensureHex(normalizedValue);
}

export function parseTypedValue(type: string, rawValue: string): unknown {
  const normalizedValue = rawValue.trim();

  if (type.endsWith('[]')) {
    if (!normalizedValue) {
      return [];
    }

    const parsedValue = JSON.parse(normalizedValue);
    if (!Array.isArray(parsedValue)) {
      throw new Error(`Expected JSON array input for ${type}.`);
    }

    const innerType = type.slice(0, -2);
    return parsedValue.map((item) => parseTypedValue(innerType, String(item)));
  }

  if (type === 'bool') {
    return normalizedValue === 'true';
  }

  if (type === 'address' || type === 'string') {
    if (!normalizedValue) {
      throw new Error(`Value required for ${type}.`);
    }

    return normalizedValue;
  }

  if (type === 'bytes' || /^bytes\d+$/.test(type)) {
    return normalizedValue ? ensureHex(normalizedValue) : ('0x' as Hex);
  }

  if (type.startsWith('uint') || type.startsWith('int')) {
    if (!normalizedValue) {
      throw new Error(`Value required for ${type}.`);
    }

    return BigInt(normalizedValue);
  }

  return normalizedValue;
}

export function parseArgumentValues(
  inputs: AbiInputConfig[],
  rawValues: Record<string, string>,
): unknown[] {
  return inputs.map((input) => parseTypedValue(input.type, rawValues[input.name] ?? ''));
}

export function buildNativeTransferRequest(
  values: NativeTransferFormValues,
  from: string,
): NormalizedTransactionRequest {
  if (!values.to.trim()) {
    throw new Error('Recipient address is required.');
  }

  if (!values.value.trim()) {
    throw new Error('Transfer value is required.');
  }

  return {
    from,
    to: values.to.trim(),
    value: normalizeNumberish(values.value) ?? (() => { throw new Error('Transfer value is required.'); })(),
    gas: normalizeNumberish(values.gasLimit),
    gasPrice: normalizeNumberish(values.gasPrice),
    maxFeePerGas: normalizeNumberish(values.maxFeePerGas),
    maxPriorityFeePerGas: normalizeNumberish(values.maxPriorityFeePerGas),
    nonce: normalizeNumberish(values.nonce),
    data: normalizeHexData(values.data),
  };
}

export function buildDeploymentTransactionRequest(
  contract: DeployableContractConfig,
  rawValues: Record<string, string>,
  from: string,
): NormalizedTransactionRequest {
  const args = parseArgumentValues(contract.constructorInputs, rawValues);
  const constructorData =
    contract.constructorAbi.length > 0
      ? encodeAbiParameters(contract.constructorAbi as AbiParameter[], args)
      : undefined;

  return {
    from,
    data: constructorData ? concatHex([contract.bytecode, constructorData]) : contract.bytecode,
  };
}

export function buildContractFunctionRequest(params: {
  contractAddress: string;
  from: string;
  fn: AbiFunctionConfig;
  rawValues: Record<string, string>;
}): ContractFunctionAction {
  const { contractAddress, from, fn, rawValues } = params;
  if (!contractAddress.trim()) {
    throw new Error('Contract address is required.');
  }

  const args = parseArgumentValues(fn.inputs, rawValues);
  const data = encodeFunctionData({
    abi: [fn.abi],
    functionName: fn.methodName,
    args,
  });

  const baseRequest = {
    from,
    to: contractAddress.trim(),
    data,
  };

  if (fn.stateMutability === 'view' || fn.stateMutability === 'pure') {
    return {
      mode: 'call',
      request: baseRequest satisfies NormalizedCallRequest,
    };
  }

  return {
    mode: 'sendTransaction',
    request: baseRequest satisfies NormalizedTransactionRequest,
  };
}
