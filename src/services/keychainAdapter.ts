import type {
  ConnectResult,
  NormalizedCallRequest,
  NormalizedTransactionRequest,
} from '../types';

export interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
}

export interface Eip6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface Eip6963ProviderDetail {
  info: Eip6963ProviderInfo;
  provider: Eip1193Provider;
}

export interface DetectedWalletProvider {
  id: string;
  name: string;
  icon: string;
  rdns: string;
  uuid: string;
  provider?: Eip1193Provider;
  adapter?: KeychainAdapter;
}

export interface KeychainAdapter {
  isAvailable(): boolean;
  connect(): Promise<ConnectResult>;
  getAccounts(): Promise<string[]>;
  getChainId(): Promise<string>;
  request(method: string, params?: unknown[] | Record<string, unknown>): Promise<unknown>;
  sendTransaction(request: NormalizedTransactionRequest): Promise<string>;
  call(request: NormalizedCallRequest): Promise<string>;
  onAccountsChanged(listener: (accounts: string[]) => void): void;
  onChainChanged(listener: (chainId: string) => void): void;
  removeListeners(): void;
}

export class BrowserKeychainAdapter implements KeychainAdapter {
  private readonly provider?: Eip1193Provider;
  private readonly trackedListeners: Array<{ event: string; listener: (...args: unknown[]) => void }> = [];

  constructor(provider = window.ethereum) {
    this.provider = provider;
  }

  isAvailable(): boolean {
    return Boolean(this.provider);
  }

  async connect(): Promise<ConnectResult> {
    const provider = this.getProvider();

    // Replace these EIP-1193 requests with Keychain-specific connect APIs if the
    // production integration exposes a dedicated SDK or provider method.
    const accounts = (await provider.request({
      method: 'eth_requestAccounts',
    })) as string[];
    const chainId = await this.getChainId();

    return { accounts, chainId };
  }

  async getAccounts(): Promise<string[]> {
    return (await this.getProvider().request({ method: 'eth_accounts' })) as string[];
  }

  async getChainId(): Promise<string> {
    return (await this.getProvider().request({ method: 'eth_chainId' })) as string;
  }

  async request(method: string, params?: unknown[] | Record<string, unknown>): Promise<unknown> {
    return this.getProvider().request({
      method,
      params,
    });
  }

  async sendTransaction(request: NormalizedTransactionRequest): Promise<string> {
    // Replace eth_sendTransaction here if Keychain requires a different outbound method.
    return (await this.getProvider().request({
      method: 'eth_sendTransaction',
      params: [request],
    })) as string;
  }

  async call(request: NormalizedCallRequest): Promise<string> {
    // Replace eth_call here if Keychain exposes a richer contract-call helper.
    return (await this.getProvider().request({
      method: 'eth_call',
      params: [request, 'latest'],
    })) as string;
  }

  onAccountsChanged(listener: (accounts: string[]) => void): void {
    const wrappedListener = (accounts: unknown) => {
      listener(Array.isArray(accounts) ? (accounts as string[]) : []);
    };

    this.provider?.on?.('accountsChanged', wrappedListener);
    this.trackedListeners.push({ event: 'accountsChanged', listener: wrappedListener });
  }

  onChainChanged(listener: (chainId: string) => void): void {
    const wrappedListener = (chainId: unknown) => {
      listener(typeof chainId === 'string' ? chainId : '');
    };

    this.provider?.on?.('chainChanged', wrappedListener);
    this.trackedListeners.push({ event: 'chainChanged', listener: wrappedListener });
  }

  removeListeners(): void {
    for (const trackedListener of this.trackedListeners) {
      this.provider?.removeListener?.(trackedListener.event, trackedListener.listener);
    }

    this.trackedListeners.length = 0;
  }

  private getProvider(): Eip1193Provider {
    if (!this.provider) {
      throw new Error('No EVM provider was found. Ensure Keychain is available before connecting.');
    }

    return this.provider;
  }
}

const fallbackProviderIcon =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="16" fill="%23476985"/><text x="16" y="21" font-family="Arial, sans-serif" font-size="14" font-weight="700" text-anchor="middle" fill="white">W</text></svg>';

export function createDetectedProviderFromAnnounce(
  detail: Eip6963ProviderDetail,
): DetectedWalletProvider {
  return {
    id: detail.info.uuid,
    uuid: detail.info.uuid,
    name: detail.info.name,
    icon: detail.info.icon,
    rdns: detail.info.rdns,
    provider: detail.provider,
  };
}

export function createDetectedProviderFromAdapter(
  adapter: KeychainAdapter,
  name = 'Injected Provider',
): DetectedWalletProvider {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return {
    id: `adapter-${slug}`,
    uuid: `adapter-${slug}`,
    name,
    icon: fallbackProviderIcon,
    rdns: 'local.adapter',
    adapter,
  };
}
