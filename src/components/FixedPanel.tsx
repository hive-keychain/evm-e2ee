import type { EventLogEntry, InspectorState } from '../types';
import { EventMonitorCard } from './EventMonitorCard';
import { InspectorCard } from './InspectorCard';

interface FixedPanelProps {
  accounts: string[];
  chainId?: string;
  events: EventLogEntry[];
  inspector: InspectorState;
}

export function FixedPanel({ accounts, chainId, events, inspector }: FixedPanelProps) {
  return (
    <aside className="fixed-panel">
      <EventMonitorCard accounts={accounts} chainId={chainId} events={events} />
      <InspectorCard inspector={inspector} />
    </aside>
  );
}
