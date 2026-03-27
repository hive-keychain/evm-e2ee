import type { DeployableContractConfig } from '../types';

const placeholderBytecode =
  '0x6080604052348015600f57600080fd5b50600080fdfea2646970667358221220000000000000000000000000000000000000000000000000000000000000000064736f6c634300081a0033' as const;

export const deployableContracts: DeployableContractConfig[] = [
  {
    id: 'generic',
    label: 'Generic',
    description: 'Placeholder creation bytecode for generic deployment smoke tests.',
    bytecode: placeholderBytecode,
    constructorInputs: [],
    constructorAbi: [],
  },
  {
    id: 'erc20',
    label: 'ERC-20',
    description: 'Sample ERC-20 bytecode placeholder. Replace with compiled artifact output later.',
    bytecode: placeholderBytecode,
    constructorInputs: [
      { name: 'name', type: 'string', placeholder: 'Test Token' },
      { name: 'symbol', type: 'string', placeholder: 'TST' },
      { name: 'initialSupply', type: 'uint256', placeholder: '1000000000000000000000' },
    ],
    constructorAbi: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'initialSupply', type: 'uint256' },
    ],
  },
  {
    id: 'erc721',
    label: 'ERC-721',
    description: 'Sample ERC-721 bytecode placeholder. Replace with compiled artifact output later.',
    bytecode: placeholderBytecode,
    constructorInputs: [
      { name: 'name', type: 'string', placeholder: 'Test Collectible' },
      { name: 'symbol', type: 'string', placeholder: 'NFT' },
      { name: 'baseUri', type: 'string', placeholder: 'ipfs://collection/' },
    ],
    constructorAbi: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'baseUri', type: 'string' },
    ],
  },
  {
    id: 'erc1155',
    label: 'ERC-1155',
    description: 'Sample ERC-1155 bytecode placeholder. Replace with compiled artifact output later.',
    bytecode: placeholderBytecode,
    constructorInputs: [{ name: 'uri', type: 'string', placeholder: 'ipfs://collection/{id}.json' }],
    constructorAbi: [{ name: 'uri', type: 'string' }],
  },
];
