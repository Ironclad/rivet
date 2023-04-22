import { FC } from 'react';
import { DataValue } from '../model/DataValue';
import { match } from 'ts-pattern';

export const RenderDataValue: FC<{ value: DataValue | undefined }> = ({ value }) => {
  return match(value)
    .with({ type: 'boolean' }, (value) => <>{value.value ? 'true' : 'false'}</>)
    .with({ type: 'number' }, (value) => <>{value.value}</>)
    .with({ type: 'string' }, (value) => <>{value.value}</>)
    .with({ type: 'chat-message' }, (value) => <>{value.value.message}</>)
    .with({ type: 'chat-messages' }, (value) => <>{value.value.length}</>)
    .with({ type: 'date' }, (value) => <>{value.value}</>)
    .with({ type: 'time' }, (value) => <>{value.value}</>)
    .with({ type: 'datetime' }, (value) => <>{value.value}</>)
    .with(undefined, () => <>undefined</>)
    .exhaustive();
};
