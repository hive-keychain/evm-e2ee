import { erc20Functions } from '../config/abi';
import { deployableContracts } from '../config/deployables';
import {
  buildContractFunctionRequest,
  buildDeploymentTransactionRequest,
  buildNativeTransferRequest,
} from '../utils/evm';

describe('EVM request builders', () => {
  it('normalizes native transfer fields to hex request fields', () => {
    const request = buildNativeTransferRequest(
      {
        to: '0x1111111111111111111111111111111111111111',
        value: '1000',
        gasLimit: '21000',
        gasPrice: '20000000000',
        maxFeePerGas: '',
        maxPriorityFeePerGas: '',
        nonce: '1',
        data: '0x',
      },
      '0x2222222222222222222222222222222222222222',
    );

    expect(request).toMatchObject({
      from: '0x2222222222222222222222222222222222222222',
      to: '0x1111111111111111111111111111111111111111',
      value: '0x3e8',
      gas: '0x5208',
      gasPrice: '0x4a817c800',
      nonce: '0x1',
      data: '0x',
    });
  });

  it('builds deployment data with constructor arguments appended to bytecode', () => {
    const request = buildDeploymentTransactionRequest(
      deployableContracts.find((contract) => contract.id === 'erc20')!,
      {
        name: 'Test Token',
        symbol: 'TST',
        initialSupply: '1000',
      },
      '0x2222222222222222222222222222222222222222',
    );

    expect(request.from).toBe('0x2222222222222222222222222222222222222222');
    expect(request.data).toMatch(/^0x/);
    expect(request.data!.length).toBeGreaterThan(deployableContracts[1].bytecode.length);
  });

  it('uses eth_call for view functions and eth_sendTransaction for writes', () => {
    const readAction = buildContractFunctionRequest({
      contractAddress: '0x3333333333333333333333333333333333333333',
      from: '0x2222222222222222222222222222222222222222',
      fn: erc20Functions.find((fn) => fn.signature === 'balanceOf(address)')!,
      rawValues: {
        account: '0x1111111111111111111111111111111111111111',
      },
    });

    const writeAction = buildContractFunctionRequest({
      contractAddress: '0x3333333333333333333333333333333333333333',
      from: '0x2222222222222222222222222222222222222222',
      fn: erc20Functions.find((fn) => fn.signature === 'transfer(address,uint256)')!,
      rawValues: {
        to: '0x1111111111111111111111111111111111111111',
        amount: '10',
      },
    });

    expect(readAction.mode).toBe('call');
    expect(writeAction.mode).toBe('sendTransaction');
  });
});
