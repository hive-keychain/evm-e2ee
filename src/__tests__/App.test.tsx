import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import App from '../App';
import { ToastProvider } from '../components/ToastProvider';
import type {
  ConnectResult,
  NormalizedCallRequest,
  NormalizedTransactionRequest,
} from '../types';
import type { DetectedWalletProvider, KeychainAdapter } from '../services/keychainAdapter';
import { shortValue } from '../utils/format';

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

class MockAdapter implements KeychainAdapter {
  private readonly accountsListeners: Array<(accounts: string[]) => void> = [];
  private readonly chainListeners: Array<(chainId: string) => void> = [];

  connect = vi.fn<() => Promise<ConnectResult>>().mockResolvedValue({
    accounts: ['0x1111111111111111111111111111111111111111'],
    chainId: '0x1',
  });

  getAccounts = vi.fn<() => Promise<string[]>>().mockResolvedValue([
    '0x1111111111111111111111111111111111111111',
  ]);

  getChainId = vi.fn<() => Promise<string>>().mockResolvedValue('0x1');

  sendTransaction = vi.fn<(request: NormalizedTransactionRequest) => Promise<string>>().mockResolvedValue(
    '0xtxhash',
  );

  call = vi.fn<(request: NormalizedCallRequest) => Promise<string>>().mockResolvedValue(
    '0x0000000000000000000000000000000000000000000000000000000000000001',
  );

  isAvailable(): boolean {
    return true;
  }

  onAccountsChanged(listener: (accounts: string[]) => void): void {
    this.accountsListeners.push(listener);
  }

  onChainChanged(listener: (chainId: string) => void): void {
    this.chainListeners.push(listener);
  }

  removeListeners(): void {
    this.accountsListeners.length = 0;
    this.chainListeners.length = 0;
  }

  emitAccounts(accounts: string[]) {
    this.accountsListeners.forEach((listener) => listener(accounts));
  }

  emitChain(chainId: string) {
    this.chainListeners.forEach((listener) => listener(chainId));
  }
}

function renderApp(adapter: KeychainAdapter, detectedProviders?: DetectedWalletProvider[]) {
  return render(
    <ToastProvider>
      <App adapter={adapter} detectedProviders={detectedProviders} />
    </ToastProvider>,
  );
}

describe('App', () => {
  it('renders the locked state before connecting and unlocks after connect', async () => {
    const user = userEvent.setup();
    const adapter = new MockAdapter();

    renderApp(adapter);

    expect(
      screen.getByText(/connect an evm account to unlock the test dashboard/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /connect injected provider/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /keychain evm test dashboard/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: /^native transfer$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /request \/ result inspector/i })).toBeInTheDocument();
  });

  it('updates the inspector lifecycle during a native transfer and stores the response', async () => {
    const user = userEvent.setup();
    const adapter = new MockAdapter();
    const deferred = createDeferred<string>();
    adapter.sendTransaction.mockImplementationOnce(() => deferred.promise);

    renderApp(adapter);

    await user.click(screen.getByRole('button', { name: /connect injected provider/i }));
    await screen.findByRole('heading', { name: /^native transfer$/i });

    await user.type(screen.getByLabelText(/^to$/i), '0x2222222222222222222222222222222222222222');
    await user.type(screen.getByLabelText(/^value$/i), '1000');
    await user.click(screen.getByRole('button', { name: /send native transfer/i }));

    expect(screen.getByText(/^loading$/i)).toBeInTheDocument();

    deferred.resolve('0xtxhash');

    await waitFor(() => {
      expect(screen.getByText(/^success$/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/native transfer submitted/i)).toBeInTheDocument();
    expect(screen.getByText(/0xtxhash/i)).toBeInTheDocument();
  });

  it('records provider events and emits toasts for account and chain changes', async () => {
    const user = userEvent.setup();
    const adapter = new MockAdapter();

    renderApp(adapter);

    await user.click(screen.getByRole('button', { name: /connect injected provider/i }));
    await screen.findByText(/event monitor/i);

    await act(async () => {
      adapter.emitAccounts(['0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa']);
      adapter.emitChain('0x89');
    });

    await waitFor(() => {
      expect(screen.getByText(shortValue('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 8))).toBeInTheDocument();
      expect(screen.getAllByText('0x89').length).toBeGreaterThan(0);
    });

    expect(screen.getByText(/accounts changed/i)).toBeInTheDocument();
    expect(screen.getByText(/chain changed/i)).toBeInTheDocument();
  });

  it('shows request errors in the inspector when a transaction fails', async () => {
    const user = userEvent.setup();
    const adapter = new MockAdapter();
    adapter.sendTransaction.mockRejectedValueOnce(new Error('Rejected by provider'));

    renderApp(adapter);

    await user.click(screen.getByRole('button', { name: /connect injected provider/i }));
    await screen.findByRole('heading', { name: /^native transfer$/i });

    await user.type(screen.getByLabelText(/^to$/i), '0x2222222222222222222222222222222222222222');
    await user.type(screen.getByLabelText(/^value$/i), '1000');
    await user.click(screen.getByRole('button', { name: /send native transfer/i }));

    await waitFor(() => {
      expect(screen.getByText(/^error$/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText(/rejected by provider/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/native transfer failed/i)).toBeInTheDocument();
  });

  it('renders one connect button for each detected provider', () => {
    const adapter = new MockAdapter();

    renderApp(adapter, [
      {
        id: 'metamask-1',
        uuid: 'metamask-1',
        name: 'MetaMask',
        icon: 'data:image/svg+xml;base64,abc',
        rdns: 'io.metamask',
        adapter,
      },
      {
        id: 'rabby-1',
        uuid: 'rabby-1',
        name: 'Rabby',
        icon: 'data:image/svg+xml;base64,def',
        rdns: 'io.rabby',
        adapter,
      },
    ]);

    expect(screen.getByRole('button', { name: /connect metamask/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /connect rabby/i })).toBeInTheDocument();
    expect(document.querySelectorAll('.provider-icon-image').length).toBeGreaterThanOrEqual(2);
  });
});
