import { useEffect, useState } from 'react';

import type { DeployableContractConfig, RequestStatus } from '../types';
import { ActionCard } from './ActionCard';
import { DynamicAbiForm } from './DynamicAbiForm';

interface ContractDeploymentCardProps {
  deployables: DeployableContractConfig[];
  status: RequestStatus;
  onSubmit: (deployable: DeployableContractConfig, values: Record<string, string>) => Promise<void>;
}

export function ContractDeploymentCard({
  deployables,
  status,
  onSubmit,
}: ContractDeploymentCardProps) {
  const [selectedId, setSelectedId] = useState<DeployableContractConfig['id']>(deployables[0].id);
  const [values, setValues] = useState<Record<string, string>>({});

  const selectedDeployable =
    deployables.find((deployable) => deployable.id === selectedId) ?? deployables[0];

  useEffect(() => {
    const nextValues = Object.fromEntries(
      selectedDeployable.constructorInputs.map((input) => [input.name, input.type === 'bool' ? 'false' : '']),
    );
    setValues(nextValues);
  }, [selectedDeployable]);

  return (
    <ActionCard
      title="Contract Deployment"
      description="Deploy one of the local bytecode definitions through the shared Keychain helper."
    >
      <form
        className="card-form"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit(selectedDeployable, values);
        }}
      >
        <label className="field-label" htmlFor="deployable-select">
          <span>Deployable target</span>
          <select
            id="deployable-select"
            className="field-input"
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value as DeployableContractConfig['id'])}
          >
            {deployables.map((deployable) => (
              <option key={deployable.id} value={deployable.id}>
                {deployable.label}
              </option>
            ))}
          </select>
        </label>

        <p className="helper-text">{selectedDeployable.description}</p>

        <DynamicAbiForm
          idPrefix={`deploy-${selectedDeployable.id}`}
          inputs={selectedDeployable.constructorInputs}
          values={values}
          disabled={status === 'loading'}
          onChange={(name, value) => {
            setValues((currentValues) => ({ ...currentValues, [name]: value }));
          }}
        />

        <div className="card-actions">
          <button className="primary-button" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Submitting...' : 'Deploy Contract'}
          </button>
        </div>
      </form>
    </ActionCard>
  );
}
