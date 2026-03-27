interface LockedStateProps {
  providers: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
  providerReady: boolean;
  connectingProviderId: string | null;
  onConnect: (providerId: string) => Promise<void>;
}

export function LockedState({
  providers,
  providerReady,
  connectingProviderId,
  onConnect,
}: LockedStateProps) {
  return (
    <div className="locked-shell">
      <div className="locked-card">
        <div className="brand-lockup">
          <img className="brand-mark" src="/favicon.png" alt="Keychain logo" />
          <span className="eyebrow">Keychain EVM Dashboard</span>
        </div>
        <h1>Connect an EVM account to unlock the test dashboard.</h1>
        <p>
          The dashboard stays locked until a wallet connection is established through Keychain.
        </p>
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
          </div>
        ) : null}
        <p className="helper-text">
          {providerReady
            ? 'Choose one of the detected EVM providers to start a Keychain session.'
            : 'No EVM provider detected. Make sure Keychain is available in this browser context.'}
        </p>
      </div>
    </div>
  );
}
