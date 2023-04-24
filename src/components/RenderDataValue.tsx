import { FC } from 'react';
import { DataValue, ScalarDataValue } from '../model/DataValue';
import { match } from 'ts-pattern';

export const RenderDataValue: FC<{ value: DataValue | undefined }> = ({ value }) => {
  if (value?.type.endsWith('[]')) {
    const items = (value.value as unknown[]).map(
      (v) =>
        ({
          type: value.type.slice(0, -2) as ScalarDataValue['type'],
          value: v,
        } as ScalarDataValue),
    );
    return (
      <>
        {items.map((v, i) => (
          <div>
            <RenderDataValue key={i} value={v} />
          </div>
        ))}
      </>
    );
  }

  return match(value as ScalarDataValue | undefined)
    .with({ type: 'boolean' }, (value) => <>{value.value ? 'true' : 'false'}</>)
    .with({ type: 'number' }, (value) => <>{value.value}</>)
    .with({ type: 'string' }, (value) => <>{value.value}</>)
    .with({ type: 'chat-message' }, (value) => <>{value.value.message}</>)
    .with({ type: 'chat-messages' }, (value) => <>{value.value.length}</>)
    .with({ type: 'date' }, (value) => <>{value.value}</>)
    .with({ type: 'time' }, (value) => <>{value.value}</>)
    .with({ type: 'datetime' }, (value) => <>{value.value}</>)
    .with({ type: 'control-flow-excluded' }, () => <>Not ran</>)
    .with({ type: 'any' }, (value) => <>{JSON.stringify(value.value)}</>)
    .with(undefined, () => <>undefined</>)
    .exhaustive();
};
