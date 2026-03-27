import type { EventLogEntry } from '../types';
import { shortValue, stringifyJson } from '../utils/format';

interface EventMonitorCardProps {
  accounts: string[];
  chainId?: string;
  events: EventLogEntry[];
}

export function EventMonitorCard({ accounts, chainId, events }: EventMonitorCardProps) {
  return (
    <section className="panel-card">
      <header className="card-header">
        <div>
          <h2>Event Monitor</h2>
          <p>Connected accounts, active chain, and incoming provider events.</p>
        </div>
      </header>

      <div className="meta-block">
        <span className="meta-label">Accounts</span>
        {accounts.length > 0 ? (
          <ul className="account-list">
            {accounts.map((account) => (
              <li key={account}>
                <code>{shortValue(account, 8)}</code>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted-text">No connected accounts.</p>
        )}
      </div>

      <div className="meta-block">
        <span className="meta-label">Current chain ID</span>
        <code>{chainId ?? 'Unavailable'}</code>
      </div>

      <div className="meta-block">
        <span className="meta-label">Recent events</span>
        <div className="event-log">
          {events.length > 0 ? (
            events.map((event) => (
              <article key={event.id} className="event-item">
                <div className="event-item-header">
                  <strong>{event.type}</strong>
                  <time>{new Date(event.timestamp).toLocaleTimeString()}</time>
                </div>
                <pre>{stringifyJson(event.payload)}</pre>
              </article>
            ))
          ) : (
            <p className="muted-text">No events captured yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
