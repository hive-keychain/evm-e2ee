import type { AbiInputConfig } from '../types';

interface DynamicAbiFormProps {
  idPrefix: string;
  inputs: AbiInputConfig[];
  values: Record<string, string>;
  disabled?: boolean;
  onChange: (name: string, value: string) => void;
}

function isMultilineInput(type: string): boolean {
  return type.endsWith('[]') || type === 'bytes' || /^bytes\d+$/.test(type);
}

export function DynamicAbiForm({
  idPrefix,
  inputs,
  values,
  disabled = false,
  onChange,
}: DynamicAbiFormProps) {
  if (inputs.length === 0) {
    return <p className="muted-text">This action does not require additional arguments.</p>;
  }

  return (
    <div className="field-grid">
      {inputs.map((input) => {
        const fieldId = `${idPrefix}-${input.name}`;
        const fieldValue = values[input.name] ?? (input.type === 'bool' ? 'false' : '');

        return (
          <label key={fieldId} className="field-label" htmlFor={fieldId}>
            <span>
              {input.name} <code>{input.type}</code>
            </span>
            {input.type === 'bool' ? (
              <select
                id={fieldId}
                className="field-input"
                value={fieldValue}
                disabled={disabled}
                onChange={(event) => onChange(input.name, event.target.value)}
              >
                <option value="false">false</option>
                <option value="true">true</option>
              </select>
            ) : isMultilineInput(input.type) ? (
              <textarea
                id={fieldId}
                className="field-input field-textarea"
                value={fieldValue}
                disabled={disabled}
                placeholder={input.placeholder}
                onChange={(event) => onChange(input.name, event.target.value)}
              />
            ) : (
              <input
                id={fieldId}
                className="field-input"
                type="text"
                value={fieldValue}
                disabled={disabled}
                placeholder={input.placeholder}
                onChange={(event) => onChange(input.name, event.target.value)}
              />
            )}
            {input.helpText ? <small className="helper-text">{input.helpText}</small> : null}
          </label>
        );
      })}
    </div>
  );
}
