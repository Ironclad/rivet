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
} from '@ironclad/rivet-core';
import { css } from '@emotion/react';
import { keys } from '../../../core/src/utils/typeSafety';
import { useMarkdown } from '../hooks/useMarkdown';

const multiOutput = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const scalarRenderers: {
  [P in ScalarDataType]: FC<{ value: Extract<ScalarDataValue, { type: P }>; depth?: number; renderMarkdown?: boolean }>;
} = {
  boolean: ({ value }) => <>{value.value ? 'true' : 'false'}</>,
  number: ({ value }) => <>{value.value}</>,
  string: ({ value, renderMarkdown }) => {
    const markdownRendered = useMarkdown(value.value, renderMarkdown);

    if (renderMarkdown) {
      return <div dangerouslySetInnerHTML={markdownRendered} />;
    }

    return <pre className="pre-wrap">{value.value}</pre>;
  },
  'chat-message': ({ value, renderMarkdown }) => {
    const markdownRendered = useMarkdown(value.value.message, renderMarkdown);

    return (
      <div>
        <div>
          <em>{value.value.type}:</em>
        </div>
        {renderMarkdown ? (
          <div dangerouslySetInnerHTML={markdownRendered} />
        ) : (
          <pre className="pre-wrap">{value.value.message}</pre>
        )}
      </div>
    );
  },
  date: ({ value }) => <>{value.value}</>,
  time: ({ value }) => <>{value.value}</>,
  datetime: ({ value }) => <>{value.value}</>,
  'control-flow-excluded': () => <>Not ran</>,
  any: ({ value, depth, renderMarkdown }) => {
    const inferred = inferType(value.value);
    if (inferred.type === 'any') {
      return <>{JSON.stringify(inferred.value)}</>;
    }
    return <RenderDataValue value={inferred} depth={(depth ?? 0) + 1} renderMarkdown={renderMarkdown} />;
  },
  object: ({ value }) => <>{JSON.stringify(value.value)}</>,
  'gpt-function': ({ value }) => (
    <>
      GPT Function: <em>{value.value.name}</em>
    </>
  ),
  vector: ({ value }) => <>Vector (length {value.value.length})</>,
  image: ({ value }) => {
    const {
      value: { data, mediaType },
    } = value;

    const blob = new Blob([data], { type: mediaType });
    const imageUrl = URL.createObjectURL(blob);

    return (
      <div>
        <img src={imageUrl} alt="" />
      </div>
    );
  },
  binary: ({ value }) => <>Binary (length {value.value.length.toLocaleString()})</>,
  audio: ({ value }) => {
    const {
      value: { data },
    } = value;

    const dataUri = `data:audio/mp4;base64,${data}`;

    return (
      <div>
        <audio controls>
          <source src={dataUri} />
        </audio>
      </div>
    );
  },
};

export const RenderDataValue: FC<{ value: DataValue | undefined; depth?: number; renderMarkdown?: boolean }> = ({
  value,
  depth,
  renderMarkdown,
}) => {
  if ((depth ?? 0) > 100) {
    return <>ERROR: FAILED TO RENDER {JSON.stringify(value)}</>;
  }
  if (!value) {
    return <>undefined</>;
  }

  const keys = Object.keys(value?.value ?? {});
  if (keys.length === 2 && keys.includes('type') && keys.includes('value')) {
    return <div>ERROR: INVALID VALUE: {JSON.stringify(value)}</div>;
  }

  if (isArrayDataValue(value)) {
    const items = arrayizeDataValue(value);
    return (
      <div css={multiOutput}>
        {items.map((v, i) => (
          <div key={i}>
            <RenderDataValue key={i} value={v} depth={(depth ?? 0) + 1} renderMarkdown={renderMarkdown} />
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

  const Renderer = scalarRenderers[value.type as ScalarDataType] as FC<{
    value: ScalarDataValue;
    depth?: number;
    renderMarkdown?: boolean;
  }>;

  return <Renderer value={value} depth={(depth ?? 0) + 1} renderMarkdown={renderMarkdown} />;
};

export const RenderDataOutputs: FC<{ outputs: Outputs; renderMarkdown?: boolean }> = ({ outputs, renderMarkdown }) => {
  const outputPorts = keys(outputs);

  if (outputPorts.length === 1) {
    return (
      <div>
        <RenderDataValue value={outputs[outputPorts[0]!]!} renderMarkdown={renderMarkdown} />
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
          <RenderDataValue value={outputs![portId]!} renderMarkdown={renderMarkdown} />
        </div>
      ))}
    </div>
  );
};
