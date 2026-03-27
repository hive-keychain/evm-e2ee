import type { InspectorState } from '../types';
import { stringifyJson } from '../utils/format';

interface InspectorCardProps {
  inspector: InspectorState;
}

export function InspectorCard({ inspector }: InspectorCardProps) {
  return (
    <section className="panel-card">
      <header className="card-header">
        <div>
          <h2>Request / Result Inspector</h2>
          <p>Last outbound Keychain request, response, and error details.</p>
        </div>
        <span className={`status-pill status-${inspector.status}`}>{inspector.status}</span>
      </header>

      <div className="meta-block">
        <span className="meta-label">Most recent request</span>
        <pre className="json-block">{stringifyJson(inspector.lastRequest)}</pre>
      </div>

      <div className="meta-block">
        <span className="meta-label">Most recent response</span>
        <pre className="json-block">{stringifyJson(inspector.lastResponse)}</pre>
      </div>

      <div className="meta-block">
        <span className="meta-label">Errors</span>
        <pre className="json-block">{stringifyJson(inspector.lastError)}</pre>
      </div>
    </section>
  );
}
