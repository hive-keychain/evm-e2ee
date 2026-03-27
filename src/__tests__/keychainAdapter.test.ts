import { vi } from 'vitest';

import {
  BrowserKeychainAdapter,
  createDetectedProviderFromAdapter,
  createDetectedProviderFromAnnounce,
  type Eip6963ProviderDetail,
  type Eip1193Provider,
} from '../services/keychainAdapter';

describe('BrowserKeychainAdapter', () => {
  it('uses the expected EIP-1193 methods for connect, call, and sendTransaction', async () => {
    const request = vi
      .fn<Eip1193Provider['request']>()
      .mockResolvedValueOnce(['0x1111111111111111111111111111111111111111'])
      .mockResolvedValueOnce('0x1')
      .mockResolvedValueOnce('0xresponse')
      .mockResolvedValueOnce('0xtxhash');
    const on = vi.fn();
    const removeListener = vi.fn();

    const adapter = new BrowserKeychainAdapter({
      request,
      on,
      removeListener,
    });

    await expect(adapter.connect()).resolves.toEqual({
      accounts: ['0x1111111111111111111111111111111111111111'],
      chainId: '0x1',
    });

    await expect(
      adapter.call({
        from: '0x1111111111111111111111111111111111111111',
        to: '0x2222222222222222222222222222222222222222',
        data: '0x1234',
      }),
    ).resolves.toBe('0xresponse');

    await expect(
      adapter.sendTransaction({
        from: '0x1111111111111111111111111111111111111111',
        to: '0x2222222222222222222222222222222222222222',
        data: '0x1234',
      }),
    ).resolves.toBe('0xtxhash');

    adapter.onAccountsChanged(() => undefined);
    adapter.onChainChanged(() => undefined);
    adapter.removeListeners();

    expect(request).toHaveBeenNthCalledWith(1, { method: 'eth_requestAccounts' });
    expect(request).toHaveBeenNthCalledWith(2, { method: 'eth_chainId' });
    expect(request).toHaveBeenNthCalledWith(3, {
      method: 'eth_call',
      params: [
        {
          from: '0x1111111111111111111111111111111111111111',
          to: '0x2222222222222222222222222222222222222222',
          data: '0x1234',
        },
        'latest',
      ],
    });
    expect(request).toHaveBeenNthCalledWith(4, {
      method: 'eth_sendTransaction',
      params: [
        {
          from: '0x1111111111111111111111111111111111111111',
          to: '0x2222222222222222222222222222222222222222',
          data: '0x1234',
        },
      ],
    });
    expect(on).toHaveBeenCalledTimes(2);
    expect(removeListener).toHaveBeenCalledTimes(2);
  });
});

describe('provider discovery helpers', () => {
  it('normalizes an announced EIP-6963 provider', () => {
    const detail = {
      info: {
        uuid: 'wallet-1',
        name: 'MetaMask',
        icon: 'data:image/svg+xml;base64,abc',
        rdns: 'io.metamask',
      },
      provider: {
        request: vi.fn(),
      },
    } satisfies Eip6963ProviderDetail;

    expect(createDetectedProviderFromAnnounce(detail)).toEqual(
      expect.objectContaining({
        id: 'wallet-1',
        uuid: 'wallet-1',
        name: 'MetaMask',
        icon: 'data:image/svg+xml;base64,abc',
        rdns: 'io.metamask',
      }),
    );
  });

  it('builds a fallback detected provider for a manually supplied adapter', () => {
    const adapter = new BrowserKeychainAdapter({
      request: vi.fn(),
    } satisfies Eip1193Provider);

    expect(createDetectedProviderFromAdapter(adapter, 'Injected Provider')).toEqual(
      expect.objectContaining({
        name: 'Injected Provider',
        rdns: 'local.adapter',
      }),
    );
  });
});
