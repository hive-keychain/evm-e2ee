import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { DynamicAbiForm } from '../components/DynamicAbiForm';

describe('DynamicAbiForm', () => {
  it('renders scalar, bool, and array inputs and forwards changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <DynamicAbiForm
        idPrefix="abi"
        inputs={[
          { name: 'recipient', type: 'address', placeholder: '0x...' },
          { name: 'approved', type: 'bool' },
          { name: 'ids', type: 'uint256[]', placeholder: '[1,2]' },
        ]}
        values={{ recipient: '', approved: 'false', ids: '[]' }}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText(/recipient/i), {
      target: { value: '0x1234' },
    });
    await user.selectOptions(screen.getByLabelText(/approved/i), 'true');
    fireEvent.change(screen.getByLabelText(/ids/i), {
      target: { value: '[1,2,3]' },
    });

    expect(screen.getByLabelText(/recipient/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/approved/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ids/i)).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith('recipient', '0x1234');
    expect(onChange).toHaveBeenCalledWith('approved', 'true');
    expect(onChange).toHaveBeenCalledWith('ids', '[1,2,3]');
  });
});
