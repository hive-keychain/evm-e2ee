/// <reference types="vite/client" />

declare global {
  interface Window {
    ethereum?: import('./services/keychainAdapter').Eip1193Provider;
  }

  interface WindowEventMap {
    'eip6963:announceProvider': CustomEvent<import('./services/keychainAdapter').Eip6963ProviderDetail>;
  }
}

export {};
