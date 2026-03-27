import { useEffect, useState } from 'react';

import type { AbiFunctionConfig, RequestStatus } from '../types';
import { ActionCard } from './ActionCard';
import { DynamicAbiForm } from './DynamicAbiForm';

interface AbiActionCardProps {
  title: string;
  description: string;
  functions: AbiFunctionConfig[];
  status: RequestStatus;
  onSubmit: (
    fn: AbiFunctionConfig,
    contractAddress: string,
    values: Record<string, string>,
  ) => Promise<void>;
}

export function AbiActionCard({
  title,
  description,
  functions,
  status,
  onSubmit,
}: AbiActionCardProps) {
  const [contractAddress, setContractAddress] = useState('');
  const [selectedSignature, setSelectedSignature] = useState(functions[0].signature);
  const [values, setValues] = useState<Record<string, string>>({});

  const selectedFunction = functions.find((fn) => fn.signature === selectedSignature) ?? functions[0];

  useEffect(() => {
    const nextValues = Object.fromEntries(
      selectedFunction.inputs.map((input) => [input.name, input.type === 'bool' ? 'false' : '']),
    );
    setValues(nextValues);
  }, [selectedFunction]);

  return (
    <ActionCard title={title} description={description}>
      <form
        className="card-form"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit(selectedFunction, contractAddress, values);
        }}
      >
        <div className="inline-row">
          <span className="status-pill status-static">
            {selectedFunction.stateMutability === 'view' || selectedFunction.stateMutability === 'pure'
              ? 'Read'
              : 'Write'}
          </span>
          <code>{selectedFunction.signature}</code>
        </div>

        <label className="field-label" htmlFor={`${title}-contract-address`}>
          <span>Contract address</span>
          <input
            id={`${title}-contract-address`}
            className="field-input"
            type="text"
            value={contractAddress}
            placeholder="0x..."
            onChange={(event) => setContractAddress(event.target.value)}
          />
        </label>

        <label className="field-label" htmlFor={`${title}-function-select`}>
          <span>Function</span>
          <select
            id={`${title}-function-select`}
            className="field-input"
            value={selectedSignature}
            onChange={(event) => setSelectedSignature(event.target.value)}
          >
            {functions.map((fn) => (
              <option key={fn.signature} value={fn.signature}>
                {fn.label}
              </option>
            ))}
          </select>
        </label>

        <DynamicAbiForm
          idPrefix={`${title}-${selectedFunction.methodName}`}
          inputs={selectedFunction.inputs}
          values={values}
          disabled={status === 'loading'}
          onChange={(name, value) => {
            setValues((currentValues) => ({ ...currentValues, [name]: value }));
          }}
        />

        <div className="card-actions">
          <button className="primary-button" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Submitting...' : 'Send Request'}
          </button>
        </div>
      </form>
    </ActionCard>
  );
}
