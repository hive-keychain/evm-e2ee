import { useState } from 'react';

import type { NativeTransferFormValues, RequestStatus } from '../types';
import { ActionCard } from './ActionCard';

interface NativeTransferCardProps {
  status: RequestStatus;
  onSubmit: (values: NativeTransferFormValues) => Promise<void>;
}

const initialValues: NativeTransferFormValues = {
  to: '',
  value: '',
  gasLimit: '',
  gasPrice: '',
  maxFeePerGas: '',
  maxPriorityFeePerGas: '',
  nonce: '',
  data: '',
};

export function NativeTransferCard({ status, onSubmit }: NativeTransferCardProps) {
  const [values, setValues] = useState<NativeTransferFormValues>(initialValues);

  function updateValue(name: keyof NativeTransferFormValues, value: string) {
    setValues((currentValues) => ({ ...currentValues, [name]: value }));
  }

  return (
    <ActionCard
      title="Native Transfer"
      description="Build and send a raw EVM native asset transfer through Keychain."
    >
      <form
        className="card-form"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit(values);
        }}
      >
        <div className="field-grid">
          <label className="field-label" htmlFor="native-to">
            <span>to</span>
            <input
              id="native-to"
              className="field-input"
              type="text"
              value={values.to}
              placeholder="0x..."
              onChange={(event) => updateValue('to', event.target.value)}
            />
          </label>

          <label className="field-label" htmlFor="native-value">
            <span>value</span>
            <input
              id="native-value"
              className="field-input"
              type="text"
              value={values.value}
              placeholder="10000000000000000"
              onChange={(event) => updateValue('value', event.target.value)}
            />
          </label>

          <label className="field-label" htmlFor="native-gas-limit">
            <span>gasLimit</span>
            <input
              id="native-gas-limit"
              className="field-input"
              type="text"
              value={values.gasLimit}
              placeholder="21000"
              onChange={(event) => updateValue('gasLimit', event.target.value)}
            />
          </label>

          <label className="field-label" htmlFor="native-gas-price">
            <span>gasPrice</span>
            <input
              id="native-gas-price"
              className="field-input"
              type="text"
              value={values.gasPrice}
              placeholder="20000000000"
              onChange={(event) => updateValue('gasPrice', event.target.value)}
            />
          </label>

          <label className="field-label" htmlFor="native-max-fee">
            <span>maxFeePerGas</span>
            <input
              id="native-max-fee"
              className="field-input"
              type="text"
              value={values.maxFeePerGas}
              placeholder="30000000000"
              onChange={(event) => updateValue('maxFeePerGas', event.target.value)}
            />
          </label>

          <label className="field-label" htmlFor="native-priority-fee">
            <span>maxPriorityFeePerGas</span>
            <input
              id="native-priority-fee"
              className="field-input"
              type="text"
              value={values.maxPriorityFeePerGas}
              placeholder="2000000000"
              onChange={(event) => updateValue('maxPriorityFeePerGas', event.target.value)}
            />
          </label>

          <label className="field-label" htmlFor="native-nonce">
            <span>nonce</span>
            <input
              id="native-nonce"
              className="field-input"
              type="text"
              value={values.nonce}
              placeholder="0"
              onChange={(event) => updateValue('nonce', event.target.value)}
            />
          </label>

          <label className="field-label field-span-full" htmlFor="native-data">
            <span>data</span>
            <textarea
              id="native-data"
              className="field-input field-textarea"
              value={values.data}
              placeholder="0x"
              onChange={(event) => updateValue('data', event.target.value)}
            />
          </label>
        </div>

        <div className="card-actions">
          <button className="primary-button" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Sending...' : 'Send Native Transfer'}
          </button>
        </div>
      </form>
    </ActionCard>
  );
}
