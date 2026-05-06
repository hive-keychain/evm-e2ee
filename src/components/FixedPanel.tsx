import { ConnectionCard } from './ConnectionCard';
import type { EventLogEntry, InspectorState } from '../types';
import { EventMonitorCard } from './EventMonitorCard';
import { InspectorCard } from './InspectorCard';

interface FixedPanelProps {
  providers: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
  providerReady: boolean;
  isConnected: boolean;
  connectingProviderId: string | null;
  accounts: string[];
  chainId?: string;
  events: EventLogEntry[];
  inspector: InspectorState;
  onConnect: (providerId: string) => Promise<void>;
  onAddAnotherAccount: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  isDisconnecting: boolean;
}

export function FixedPanel({
  providers,
  providerReady,
  isConnected,
  connectingProviderId,
  accounts,
  chainId,
  events,
  inspector,
  onConnect,
  onAddAnotherAccount,
  onDisconnect,
  isDisconnecting,
}: FixedPanelProps) {
  return (
    <aside className="fixed-panel">
      <ConnectionCard
        providers={providers}
        providerReady={providerReady}
        isConnected={isConnected}
        connectingProviderId={connectingProviderId}
        onConnect={onConnect}
        onAddAnotherAccount={onAddAnotherAccount}
        onDisconnect={onDisconnect}
        isDisconnecting={isDisconnecting}
      />
      <EventMonitorCard accounts={accounts} chainId={chainId} events={events} />
      <InspectorCard inspector={inspector} />
    </aside>
  );
}
