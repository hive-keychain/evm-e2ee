import { useEffect, useRef, useState } from 'react';
import { decodeFunctionResult } from 'viem';

import { AbiActionCard } from './components/AbiActionCard';
import { ContractDeploymentCard } from './components/ContractDeploymentCard';
import { FixedPanel } from './components/FixedPanel';
import { LockedState } from './components/LockedState';
import { NativeTransferCard } from './components/NativeTransferCard';
import { useToast } from './components/ToastProvider';
import { erc20Functions, erc721Functions, erc1155Functions } from './config/abi';
import { deployableContracts } from './config/deployables';
import {
  BrowserKeychainAdapter,
  createDetectedProviderFromAdapter,
  createDetectedProviderFromAnnounce,
  type Eip6963ProviderDetail,
  type DetectedWalletProvider,
  type KeychainAdapter,
} from './services/keychainAdapter';
import { executeKeychainRequest } from './services/requestExecutor';
import type {
  AbiFunctionConfig,
  ConnectionState,
  DeployableContractConfig,
  EventLogEntry,
  InspectorState,
  NativeTransferFormValues,
} from './types';
import {
  buildContractFunctionRequest,
  buildDeploymentTransactionRequest,
  buildNativeTransferRequest,
} from './utils/evm';
import { shortValue } from './utils/format';

interface AppProps {
  adapter?: KeychainAdapter;
  detectedProviders?: DetectedWalletProvider[];
}

const defaultInspectorState: InspectorState = {
  status: 'idle',
  lastRequest: null,
  lastResponse: null,
  lastError: null,
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Unknown request error';
}

function mergeAccounts(currentAccounts: string[], nextAccounts: string[]): string[] {
  return [...new Set([...currentAccounts, ...nextAccounts])];
}

export default function App({ adapter, detectedProviders }: AppProps) {
  const [availableProviders, setAvailableProviders] = useState<DetectedWalletProvider[]>(() => {
    if (detectedProviders) {
      return detectedProviders;
    }

    if (adapter) {
      return [createDetectedProviderFromAdapter(adapter)];
    }

    return [];
  });
  const [resolvedAdapter, setResolvedAdapter] = useState<KeychainAdapter>(
    () => adapter ?? availableProviders[0]?.adapter ?? new BrowserKeychainAdapter(availableProviders[0]?.provider),
  );
  const [connection, setConnection] = useState<ConnectionState>(() => ({
    isConnected: false,
    providerReady: availableProviders.length > 0 || resolvedAdapter.isAvailable(),
    accounts: [],
  }));
  const [inspector, setInspector] = useState<InspectorState>(defaultInspectorState);
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const [connectingProviderId, setConnectingProviderId] = useState<string | null>(null);
  const eventIdRef = useRef(1);
  const { pushToast } = useToast();

  useEffect(() => {
    if (detectedProviders || adapter) {
      return;
    }

    const handleProviderAnnouncement = (event: Event) => {
      const detail = (event as CustomEvent<Eip6963ProviderDetail>).detail;
      const nextProvider = createDetectedProviderFromAnnounce(detail);

      setAvailableProviders((currentProviders) => {
        if (currentProviders.some((provider) => provider.uuid === nextProvider.uuid)) {
          return currentProviders;
        }

        return [...currentProviders, nextProvider];
      });
    };

    window.addEventListener(
      'eip6963:announceProvider',
      handleProviderAnnouncement as EventListener,
    );
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    return () => {
      window.removeEventListener(
        'eip6963:announceProvider',
        handleProviderAnnouncement as EventListener,
      );
    };
  }, [adapter, detectedProviders]);

  useEffect(() => {
    if (connection.isConnected) {
      return;
    }

    setConnection((currentConnection) => ({
      ...currentConnection,
      providerReady: availableProviders.length > 0 || resolvedAdapter.isAvailable(),
    }));
  }, [availableProviders, connection.isConnected, resolvedAdapter]);

  useEffect(() => {
    console.log(
      '[Keychain EVM Dashboard] Detected providers:',
      availableProviders.map((provider) => ({
        id: provider.id,
        uuid: provider.uuid,
        name: provider.name,
        rdns: provider.rdns,
        icon: provider.icon,
        hasProvider: Boolean(provider.provider),
        hasAdapter: Boolean(provider.adapter),
      })),
    );
  }, [availableProviders]);

  function appendEvent(type: EventLogEntry['type'], payload: unknown) {
    setEventLog((currentEvents) => [
      {
        id: eventIdRef.current++,
        type,
        timestamp: new Date().toISOString(),
        payload,
      },
      ...currentEvents,
    ].slice(0, 12));
  }

  function updateInspectorStart(request: unknown) {
    setInspector({
      status: 'loading',
      lastRequest: request,
      lastResponse: null,
      lastError: null,
    });
  }

  function updateInspectorSuccess(response: unknown) {
    setInspector((currentInspector) => ({
      ...currentInspector,
      status: 'success',
      lastResponse: response,
      lastError: null,
    }));
  }

  function updateInspectorError(error: unknown) {
    setInspector((currentInspector) => ({
      ...currentInspector,
      status: 'error',
      lastResponse: null,
      lastError: error,
    }));
  }

  async function connectWallet(providerId: string) {
    const selectedProvider = availableProviders.find((provider) => provider.id === providerId);
    if (!selectedProvider) {
      return;
    }

    const nextAdapter =
      selectedProvider.adapter ?? new BrowserKeychainAdapter(selectedProvider.provider);

    setConnectingProviderId(providerId);

    try {
      const connectResult = await executeKeychainRequest<
        { method: string; provider: string; params: string[] },
        { accounts: string[]; chainId: string }
      >(
        {
          method: 'connect',
          provider: selectedProvider.name,
          params: ['eth_requestAccounts', 'eth_chainId'],
        },
        () => nextAdapter.connect(),
        {
          onRequestStart: updateInspectorStart,
          onRequestSuccess: updateInspectorSuccess,
          onRequestError: (error) => {
            updateInspectorError(error);
            appendEvent('requestError', { scope: 'connect', error });
          },
        },
      );

      setResolvedAdapter(nextAdapter);
      setConnection({
        isConnected: connectResult.accounts.length > 0,
        providerReady: true,
        accounts: connectResult.accounts,
        activeAccount: connectResult.accounts[0],
        chainId: connectResult.chainId,
        connectedProviderName: selectedProvider.name,
      });
      appendEvent('connect', connectResult);
      pushToast({
        tone: 'success',
        title: `Connected to ${selectedProvider.name}`,
        message: `${shortValue(connectResult.accounts[0] ?? 'No account')} on ${connectResult.chainId}`,
      });
    } catch (error) {
      pushToast({
        tone: 'error',
        title: 'Connection failed',
        message: getErrorMessage(error),
      });
    } finally {
      setConnectingProviderId(null);
    }
  }

  async function addAnotherAccount() {
    if (!connection.isConnected) {
      return;
    }

    try {
      const connectResult = await executeKeychainRequest<
        { method: string; provider: string; params: string[]; action: string },
        { accounts: string[]; chainId: string }
      >(
        {
          method: 'connect',
          provider: connection.connectedProviderName ?? 'Active provider',
          params: ['eth_requestAccounts', 'eth_chainId'],
          action: 'connectAnotherKeychainAccount',
        },
        () => resolvedAdapter.connect(),
        {
          onRequestStart: updateInspectorStart,
          onRequestSuccess: updateInspectorSuccess,
          onRequestError: (error) => {
            updateInspectorError(error);
            appendEvent('requestError', { scope: 'connectAnotherKeychainAccount', error });
          },
        },
      );

      const nextAccounts = mergeAccounts(connection.accounts, connectResult.accounts);
      const addedAccounts = nextAccounts.filter((account) => !connection.accounts.includes(account));

      setConnection((currentConnection) => ({
        ...currentConnection,
        accounts: nextAccounts,
        activeAccount:
          currentConnection.activeAccount && nextAccounts.includes(currentConnection.activeAccount)
            ? currentConnection.activeAccount
            : nextAccounts[0],
        chainId: connectResult.chainId,
      }));
      appendEvent('accountsChanged', {
        source: 'manualAddAccount',
        addedAccounts,
        accounts: nextAccounts,
      });

      if (addedAccounts.length > 0) {
        pushToast({
          tone: 'success',
          title: 'Additional Keychain account connected',
          message: `${addedAccounts.length} new account${addedAccounts.length > 1 ? 's were' : ' was'} connected through Keychain.`,
        });
      } else {
        pushToast({
          tone: 'info',
          title: 'No new Keychain account connected',
          message: 'Keychain returned the same connected accounts.',
        });
      }
    } catch (error) {
      pushToast({
        tone: 'error',
        title: 'Connect account failed',
        message: getErrorMessage(error),
      });
    }
  }

  async function submitNativeTransfer(values: NativeTransferFormValues) {
    if (!connection.activeAccount) {
      return;
    }

    try {
      const transactionRequest = buildNativeTransferRequest(values, connection.activeAccount);
      await executeKeychainRequest(
        {
          method: 'eth_sendTransaction',
          params: [transactionRequest],
          action: 'nativeTransfer',
        },
        () => resolvedAdapter.sendTransaction(transactionRequest),
        {
          onRequestStart: updateInspectorStart,
          onRequestSuccess: updateInspectorSuccess,
          onRequestError: (error) => {
            updateInspectorError(error);
            appendEvent('requestError', { scope: 'nativeTransfer', error });
          },
        },
      );
      pushToast({
        tone: 'success',
        title: 'Native transfer submitted',
        message: 'The transaction request was sent through Keychain.',
      });
    } catch (error) {
      pushToast({
        tone: 'error',
        title: 'Native transfer failed',
        message: getErrorMessage(error),
      });
    }
  }

  async function submitDeployment(
    deployable: DeployableContractConfig,
    values: Record<string, string>,
  ) {
    if (!connection.activeAccount) {
      return;
    }

    try {
      const transactionRequest = buildDeploymentTransactionRequest(
        deployable,
        values,
        connection.activeAccount,
      );

      await executeKeychainRequest(
        {
          method: 'eth_sendTransaction',
          params: [transactionRequest],
          action: 'contractDeployment',
          contractId: deployable.id,
        },
        () => resolvedAdapter.sendTransaction(transactionRequest),
        {
          onRequestStart: updateInspectorStart,
          onRequestSuccess: updateInspectorSuccess,
          onRequestError: (error) => {
            updateInspectorError(error);
            appendEvent('requestError', { scope: 'contractDeployment', error });
          },
        },
      );
      pushToast({
        tone: 'success',
        title: 'Deployment submitted',
        message: `${deployable.label} deployment request sent.`,
      });
    } catch (error) {
      pushToast({
        tone: 'error',
        title: 'Deployment failed',
        message: getErrorMessage(error),
      });
    }
  }

  async function submitAbiAction(
    fn: AbiFunctionConfig,
    contractAddress: string,
    values: Record<string, string>,
  ) {
    if (!connection.activeAccount) {
      return;
    }

    try {
      const contractAction = buildContractFunctionRequest({
        contractAddress,
        from: connection.activeAccount,
        fn,
        rawValues: values,
      });

      if (contractAction.mode === 'call') {
        await executeKeychainRequest(
          {
            method: 'eth_call',
            params: [contractAction.request, 'latest'],
            action: fn.signature,
          },
          async () => {
            const rawResponse = await resolvedAdapter.call(contractAction.request);
            const decoded = decodeFunctionResult({
              abi: [fn.abi],
              functionName: fn.methodName,
              data: rawResponse as `0x${string}`,
            });

            return {
              raw: rawResponse,
              decoded,
            };
          },
          {
            onRequestStart: updateInspectorStart,
            onRequestSuccess: updateInspectorSuccess,
            onRequestError: (error) => {
              updateInspectorError(error);
              appendEvent('requestError', { scope: fn.signature, error });
            },
          },
        );

        pushToast({
          tone: 'success',
          title: 'Read call completed',
          message: `${fn.signature} returned a response.`,
        });
        return;
      }

      await executeKeychainRequest(
        {
          method: 'eth_sendTransaction',
          params: [contractAction.request],
          action: fn.signature,
        },
        () => resolvedAdapter.sendTransaction(contractAction.request),
        {
          onRequestStart: updateInspectorStart,
          onRequestSuccess: updateInspectorSuccess,
          onRequestError: (error) => {
            updateInspectorError(error);
            appendEvent('requestError', { scope: fn.signature, error });
          },
        },
      );
      pushToast({
        tone: 'success',
        title: 'Write request submitted',
        message: `${fn.signature} was sent through Keychain.`,
      });
    } catch (error) {
      pushToast({
        tone: 'error',
        title: 'Contract interaction failed',
        message: getErrorMessage(error),
      });
    }
  }

  useEffect(() => {
    if (!connection.isConnected) {
      resolvedAdapter.removeListeners();
      return;
    }

    resolvedAdapter.onAccountsChanged((accounts) => {
      setConnection((currentConnection) => ({
        ...currentConnection,
        isConnected: accounts.length > 0,
        accounts,
        activeAccount: accounts[0],
        chainId: accounts.length > 0 ? currentConnection.chainId : undefined,
      }));
      appendEvent('accountsChanged', accounts);
      pushToast({
        tone: 'info',
        title: 'Accounts changed',
        message: accounts.length > 0 ? shortValue(accounts[0]) : 'No connected accounts',
      });

      if (accounts.length === 0) {
        appendEvent('disconnect', { reason: 'accountsChanged returned an empty list' });
      }
    });

    resolvedAdapter.onChainChanged((chainId) => {
      setConnection((currentConnection) => ({
        ...currentConnection,
        chainId,
      }));
      appendEvent('chainChanged', chainId);
      pushToast({
        tone: 'info',
        title: 'Chain changed',
        message: chainId,
      });
    });

    return () => {
      resolvedAdapter.removeListeners();
    };
  }, [connection.isConnected, resolvedAdapter]);

  if (!connection.isConnected) {
    return (
      <LockedState
        providers={availableProviders}
        providerReady={connection.providerReady}
        connectingProviderId={connectingProviderId}
        onConnect={connectWallet}
      />
    );
  }

  return (
    <div className="app-shell">
      <FixedPanel
        accounts={connection.accounts}
        chainId={connection.chainId}
        events={eventLog}
        inspector={inspector}
      />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">Connected Session</span>
            <h1>Keychain EVM Test Dashboard</h1>
            <p>Use these cards to manually build and send EVM requests through Keychain.</p>
          </div>
          <div className="session-summary">
            <div>
              <span className="meta-label">Provider</span>
              <code>{connection.connectedProviderName ?? 'Unavailable'}</code>
            </div>
            <div>
              <span className="meta-label">Active account</span>
              <code>{connection.activeAccount ?? 'Unavailable'}</code>
            </div>
            <div>
              <span className="meta-label">Chain ID</span>
              <code>{connection.chainId ?? 'Unavailable'}</code>
            </div>
          </div>
        </header>

        <section className="dashboard-grid">
          <NativeTransferCard status={inspector.status} onSubmit={submitNativeTransfer} />
          <ContractDeploymentCard
            deployables={deployableContracts}
            status={inspector.status}
            onSubmit={submitDeployment}
          />
          <AbiActionCard
            title="ERC-20 Interaction"
            description="Run a small set of ERC-20 reads and writes against any token contract."
            functions={erc20Functions}
            status={inspector.status}
            onSubmit={submitAbiAction}
          />
          <AbiActionCard
            title="ERC-721 Interaction"
            description="Run a focused ERC-721 action set against NFT contracts."
            functions={erc721Functions}
            status={inspector.status}
            onSubmit={submitAbiAction}
          />
          <AbiActionCard
            title="ERC-1155 Interaction"
            description="Run common ERC-1155 reads and transfers through the same ABI-driven form."
            functions={erc1155Functions}
            status={inspector.status}
            onSubmit={submitAbiAction}
          />
        </section>
      </main>
    </div>
  );
}
