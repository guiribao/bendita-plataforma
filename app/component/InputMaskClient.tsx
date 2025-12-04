import InputMask from '@mona-health/react-input-mask';
import type { ComponentProps } from 'react';
import { ClientOnly } from './ClientOnly';

type InputMaskProps = ComponentProps<typeof InputMask>;

export function InputMaskClient(props: InputMaskProps) {
  return (
    <ClientOnly>
      <InputMask {...props} className={`form-control ${props.className || ''}`} />
    </ClientOnly>
  );
}
