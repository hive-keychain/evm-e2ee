import { useState } from 'react';

import { getPermissionlessMethodParamsPreset } from '../config/permissionlessEvmMethodParams';
import { permissionlessEvmMethods } from '../config/permissionlessEvmMethods';
import type { PermissionlessEvmRequestFormValues, RequestStatus } from '../types';
import { ActionCard } from './ActionCard';

interface PermissionlessEvmRequestCardProps {
  status: RequestStatus;
  onSubmit: (values: PermissionlessEvmRequestFormValues) => Promise<void>;
}

const initialValues: PermissionlessEvmRequestFormValues = {
  method: permissionlessEvmMethods[0],
  rawParams: getPermissionlessMethodParamsPreset(permissionlessEvmMethods[0]) ?? '',
  repeatCount: '',
};

export function PermissionlessEvmRequestCard({
  status,
  onSubmit,
}: PermissionlessEvmRequestCardProps) {
  const [values, setValues] = useState<PermissionlessEvmRequestFormValues>(initialValues);

  function updateValue(name: keyof PermissionlessEvmRequestFormValues, value: string) {
    setValues((currentValues) => ({ ...currentValues, [name]: value }));
  }

  function updateMethod(method: string) {
    const preset = getPermissionlessMethodParamsPreset(method);

    setValues((currentValues) => ({
      ...currentValues,
      method,
      rawParams: preset ?? currentValues.rawParams,
    }));
  }

  return (
    <ActionCard
      title="Permissionless EVM Request"
      description="Send any Keychain-supported EVM method that does not require prior permission."
    >
      <form
        className="card-form"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit(values);
        }}
      >
        <label className="field-label" htmlFor="permissionless-method">
          <span>Method</span>
          <input
            id="permissionless-method"
            className="field-input"
            type="text"
            list="permissionless-method-options"
            value={values.method}
            onChange={(event) => updateMethod(event.target.value)}
            placeholder="Start typing an EVM method..."
            autoComplete="off"
            spellCheck={false}
          />
          <datalist id="permissionless-method-options">
            {permissionlessEvmMethods.map((method) => (
              <option key={method} value={method} />
            ))}
          </datalist>
        </label>

        <label className="field-label" htmlFor="permissionless-params">
          <span>Params JSON</span>
          <textarea
            id="permissionless-params"
            className="field-input field-textarea"
            value={values.rawParams}
            placeholder='[] or {"chainId":"0x1"}'
            onChange={(event) => updateValue('rawParams', event.target.value)}
          />
        </label>

        <label className="field-label" htmlFor="permissionless-repeat-count">
          <span>Repeat count</span>
          <input
            id="permissionless-repeat-count"
            className="field-input"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            value={values.repeatCount}
            placeholder="1"
            onChange={(event) => updateValue('repeatCount', event.target.value)}
          />
        </label>

        <p className="helper-text">
          Start typing to filter the method list. Recognized methods auto-fill example params from
          the MetaMask JSON-RPC docs when available. Requests are sent sequentially.
        </p>

        <div className="card-actions">
          <button className="primary-button" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </ActionCard>
  );
}
