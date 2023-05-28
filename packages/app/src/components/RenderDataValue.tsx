import { FC } from 'react';
import {
  DataValue,
  Outputs,
  ScalarDataType,
  ScalarDataValue,
  arrayizeDataValue,
  getScalarTypeOf,
  inferType,
  isArrayDataValue,
  isFunctionDataValue,
} from '@ironclad/nodai-core';
import { css } from '@emotion/react';
import { keys } from '../utils/typeSafety';

const multiOutput = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const scalarRenderers: {
  [P in ScalarDataType]: FC<{ value: ScalarDataValue & { type: P } }>;
} = {
  boolean: ({ value }) => <>{value.value ? 'true' : 'false'}</>,
  number: ({ value }) => <>{value.value}</>,
  string: ({ value }) => <pre className="pre-wrap">{value.value}</pre>,
  'chat-message': ({ value }) => (
    <div>
      <div>
        <em>{value.type}:</em>
      </div>
      <pre className="pre-wrap">{value.value.message}</pre>
    </div>
  ),
  date: ({ value }) => <>{value.value}</>,
  time: ({ value }) => <>{value.value}</>,
  datetime: ({ value }) => <>{value.value}</>,
  'control-flow-excluded': () => <>Not ran</>,
  any: ({ value }) => {
    const inferred = inferType(value.value);
    return <RenderDataValue value={inferred} />;
  },
  object: ({ value }) => <>{JSON.stringify(value.value)}</>,
};

export const RenderDataValue: FC<{ value: DataValue | undefined }> = ({ value }) => {
  if (!value) {
    return <>undefined</>;
  }

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

  if (isFunctionDataValue(value)) {
    const type = getScalarTypeOf(value.type);
    return (
      <div>
        <em>Function{`<${type}>`}</em>
      </div>
    );
  }

  const Renderer = scalarRenderers[value.type as ScalarDataType] as FC<{ value: ScalarDataValue }>;

  return <Renderer value={value} />;
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
