import { FC } from 'react';
import {
  DataValue,
  Outputs,
  ScalarDataValue,
  arrayizeDataValue,
  inferType,
  isArrayDataValue,
} from '@ironclad/nodai-core';
import { match } from 'ts-pattern';
import { css } from '@emotion/react';
import { keys } from '../utils/typeSafety';

const multiOutput = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const RenderDataValue: FC<{ value: DataValue | undefined }> = ({ value }) => {
  if (isArrayDataValue(value)) {
    const items = arrayizeDataValue(value);
    return (
      <div css={multiOutput}>
        {items.map((v, i) => (
          <div key={i}>
            <RenderDataValue key={i} value={v} />
          </div>
        ))}
      </div>
    );
  }

  return match(value)
    .with({ type: 'boolean' }, (value) => <>{value.value ? 'true' : 'false'}</>)
    .with({ type: 'number' }, (value) => <>{value.value}</>)
    .with({ type: 'string' }, (value) => <pre className="pre-wrap">{value.value}</pre>)
    .with({ type: 'chat-message' }, (value) => (
      <div>
        <div>
          <em>{value.value.type}:</em>
        </div>
        <pre className="pre-wrap">{value.value.message}</pre>
      </div>
    ))
    .with({ type: 'date' }, (value) => <>{value.value}</>)
    .with({ type: 'time' }, (value) => <>{value.value}</>)
    .with({ type: 'datetime' }, (value) => <>{value.value}</>)
    .with({ type: 'control-flow-excluded' }, () => <>Not ran</>)
    .with({ type: 'any' }, (value) => {
      const inferred = inferType(value.value);
      return <RenderDataValue value={inferred} />;
    })
    .with({ type: 'object' }, (value) => <>{JSON.stringify(value.value)}</>)
    .with(undefined, () => <>undefined</>)
    .exhaustive();
};

export const RenderDataOutputs: FC<{ outputs: Outputs }> = ({ outputs }) => {
  const outputPorts = keys(outputs);

  if (outputPorts.length === 1) {
    return (
      <div>
        <RenderDataValue value={outputs[outputPorts[0]!]!} />
      </div>
    );
  }

  return (
    <div>
      {outputPorts.map((portId) => (
        <div key={portId}>
          <div>
            <em>{portId}:</em>
          </div>
          <RenderDataValue value={outputs![portId]!} />
        </div>
      ))}
    </div>
  );
};
