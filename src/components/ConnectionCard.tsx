interface ConnectionCardProps {
  providers: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
  providerReady: boolean;
  isConnected: boolean;
  connectingProviderId: string | null;
  onConnect: (providerId: string) => Promise<void>;
  onAddAnotherAccount: () => Promise<void>;
}

export function ConnectionCard({
  providers,
  providerReady,
  isConnected,
  connectingProviderId,
  onConnect,
  onAddAnotherAccount,
}: ConnectionCardProps) {
  return (
    <section className="panel-card">
      <header className="card-header">
        <div>
          <h2>{isConnected ? 'Connection' : 'Connect Wallet'}</h2>
          <p>
            {isConnected
              ? 'Manage your Keychain session and attach more accounts if needed.'
              : 'Connect a detected EVM provider to start sending requests through Keychain.'}
          </p>
        </div>
      </header>

      {providerReady ? (
        <div className="connect-button-list">
          {providers.map((provider) => (
            <button
              key={provider.id}
              className="primary-button provider-button"
              type="button"
              onClick={() => void onConnect(provider.id)}
              disabled={connectingProviderId !== null}
            >
              <span aria-hidden="true" className="provider-icon-shell">
                <img className="provider-icon-image" src={provider.icon} alt="" />
              </span>
              <span>
                {connectingProviderId === provider.id
                  ? `Connecting ${provider.name}...`
                  : `Connect ${provider.name}`}
              </span>
            </button>
          ))}

          {isConnected ? (
            <button
              className="primary-button"
              type="button"
              onClick={() => void onAddAnotherAccount()}
              disabled={connectingProviderId !== null}
            >
              Add Another Account
            </button>
          ) : null}
        </div>
      ) : (
        <p className="helper-text">
          No EVM provider detected. Make sure Keychain is available in this browser context.
        </p>
      )}
    </section>
  );
}
