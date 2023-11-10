import { type FC } from 'react';
import {
  type DataValue,
  type Outputs,
  type ScalarDataType,
  type ScalarDataValue,
  arrayizeDataValue,
  getScalarTypeOf,
  inferType,
  isArrayDataValue,
  isFunctionDataValue,
  coerceTypeOptional,
} from '@ironclad/rivet-core';
import { css } from '@emotion/react';
import { keys } from '../../../core/src/utils/typeSafety';
import { useMarkdown } from '../hooks/useMarkdown';
import ColorizedPreformattedText from './ColorizedPreformattedText';

const multiOutput = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

/* eslint-disable react-hooks/rules-of-hooks -- These are components (ish) */
const scalarRenderers: {
  [P in ScalarDataType]: FC<{
    value: Extract<ScalarDataValue, { type: P }>;
    depth?: number;
    renderMarkdown?: boolean;
    truncateLength?: number;
  }>;
} = {
  boolean: ({ value }) => <>{value.value ? 'true' : 'false'}</>,
  number: ({ value }) => <>{value.value}</>,
  string: ({ value, renderMarkdown, truncateLength }) => {
    const truncated = truncateLength ? value.value.slice(0, truncateLength) + '...' : value.value;

    const markdownRendered = useMarkdown(truncated, renderMarkdown);

    if (renderMarkdown) {
      return <div dangerouslySetInnerHTML={markdownRendered} />;
    }

    return <pre className="pre-wrap">{truncated}</pre>;
  },
  'chat-message': ({ value, renderMarkdown }) => {
    const singleString = coerceTypeOptional(value, 'string') ?? '';

    const markdownRendered = useMarkdown(singleString, renderMarkdown);

    return (
      <div>
        <div>
          <em>
            {value.value.type}
            {value.value.name ? ` (${value.value.name})` : ''}:
          </em>
        </div>
        {renderMarkdown ? (
          <div dangerouslySetInnerHTML={markdownRendered} />
        ) : (
          <pre className="pre-wrap">{singleString}</pre>
        )}
        {value.value.function_call && (
          <div className="function-call">
            <h4>Function Call:</h4>
            <div className="pre-wrap">
              <RenderDataValue value={inferType(value.value.function_call)} />
            </div>
          </div>
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
  object: ({ value }) => (
    <div className="rendered-object-type">
      <ColorizedPreformattedText text={JSON.stringify(value.value, null, 2)} language="json" />
    </div>
  ),
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
/* eslint-enable react-hooks/rules-of-hooks -- These are components (ish) */

export const RenderDataValue: FC<{
  value: DataValue | undefined;
  depth?: number;
  renderMarkdown?: boolean;
  truncateLength?: number;
}> = ({ value, depth, renderMarkdown, truncateLength }) => {
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
            <RenderDataValue
              key={i}
              value={v}
              depth={(depth ?? 0) + 1}
              renderMarkdown={renderMarkdown}
              truncateLength={truncateLength}
            />
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
    truncateLength?: number;
  }>;

  if (!Renderer) {
    return <div>ERROR: UNKNOWN TYPE: {JSON.stringify(value)}</div>;
  }

  return (
    <Renderer value={value} depth={(depth ?? 0) + 1} renderMarkdown={renderMarkdown} truncateLength={truncateLength} />
  );
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
    <div className="rendered-data-outputs">
      {outputPorts.map((portId) => (
        <div className="port-value" key={portId}>
          <div>
            <em className="port-id-label">{portId}</em>
          </div>
          <RenderDataValue value={outputs![portId]!} renderMarkdown={renderMarkdown} />
        </div>
      ))}
    </div>
  );
};
