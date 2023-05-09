import { FC } from 'react';
import { DataValue, ScalarDataValue, isArrayDataValue } from '@ironclad/nodai-core';
import { match } from 'ts-pattern';
import { css } from '@emotion/react';

const multiOutput = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const RenderDataValue: FC<{ value: DataValue | undefined }> = ({ value }) => {
  if (value?.type === 'string[]') {
    return (
      <div css={multiOutput}>
        {value.value.map((s, i) => (
          <pre key={i} className="pre-wrap">
            {s}
          </pre>
        ))}
      </div>
    );
  }

  if (isArrayDataValue(value)) {
    const items = value.value.map(
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

  return match(value)
    .with({ type: 'boolean' }, (value) => <>{value.value ? 'true' : 'false'}</>)
    .with({ type: 'number' }, (value) => <>{value.value}</>)
    .with({ type: 'string' }, (value) => <>{value.value}</>)
    .with({ type: 'chat-message' }, (value) => <>{value.value.message}</>)
    .with({ type: 'date' }, (value) => <>{value.value}</>)
    .with({ type: 'time' }, (value) => <>{value.value}</>)
    .with({ type: 'datetime' }, (value) => <>{value.value}</>)
    .with({ type: 'control-flow-excluded' }, () => <>Not ran</>)
    .with({ type: 'any' }, (value) => <>{JSON.stringify(value.value)}</>)
    .with(undefined, () => <>undefined</>)
    .exhaustive();
};
