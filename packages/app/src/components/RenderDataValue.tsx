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
  type NodeOutputDefinition,
  type ChatMessageMessagePart,
  type DataType,
} from '@ironclad/rivet-core';
import { css } from '@emotion/react';
import { keys } from '../../../core/src/utils/typeSafety';
import { useMarkdown } from '../hooks/useMarkdown';
import ColorizedPreformattedText from './ColorizedPreformattedText';
import { P, match } from 'ts-pattern';
import clsx from 'clsx';

const styles = css`
  .chat-message.user header em {
    color: var(--text-color-accent-3);
  }

  .chat-message.assistant header em {
    color: var(--text-color-accent-2);
  }

  .chat-message.function header em {
    color: var(--grey-light);
  }

  .chat-message.system header em {
    color: var(--grey-light);
  }

  .message-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .chat-message-url-image {
    max-width: 300px;
    object-fit: contain;
  }
`;

const multiOutput = css`
  display: flex;
  flex-direction: column;
  gap: 8px;

  .multi-output-item {
    border-bottom: 1px solid var(--grey-lightish);
    padding-bottom: 8px;

    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
  }

  &.chat-message-list {
    gap: 0;

    .multi-output-item {
      border-bottom: 1px solid var(--grey-lightish);
      padding: 4px 0 16px;
    }
  }

  .array-info {
    color: var(--grey-light);
    font-size: 0.8em;
  }
`;

type ScalarRendererProps<T extends DataType = DataType> = {
  value: Extract<ScalarDataValue, { type: T }>;
  depth?: number;
  renderMarkdown?: boolean;
  truncateLength?: number;
};

/* eslint-disable react-hooks/rules-of-hooks -- These are components (ish) */
const scalarRenderers: {
  [P in ScalarDataType]: FC<ScalarRendererProps<P>>;
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
    const parts = Array.isArray(value.value.message) ? value.value.message : [value.value.message];

    const message = value.value;

    const messageContent = (
      <div className="message-content">
        {parts.map((part, i) => (
          <div className="chat-message-message-part" key={i}>
            <RenderChatMessagePart part={part} renderMarkdown={renderMarkdown} />
          </div>
        ))}
      </div>
    );

    return match(message)
      .with({ type: 'system' }, () => (
        <div className="chat-message system">
          <header>
            <em>system</em>
          </header>
          {messageContent}
        </div>
      ))
      .with({ type: 'user' }, () => (
        <div className="chat-message user">
          <header>
            <em>user</em>
          </header>
          {messageContent}
        </div>
      ))
      .with({ type: 'assistant' }, (message) => (
        <div className="chat-message assistant">
          <header>
            <em>assistant</em>
          </header>
          {messageContent}
          {message.function_call && (
            <div className="function-call">
              <h4>Function Call:</h4>
              <div className="pre-wrap">
                <RenderDataValue value={inferType(message.function_call)} />
              </div>
            </div>
          )}
        </div>
      ))
      .with({ type: 'function' }, (message) => (
        <div className="chat-message function">
          <header>
            <em>function output for: {message.name}</em>
          </header>
          {messageContent}
        </div>
      ))
      .otherwise((message) => (
        <div className="chat-message unknown">
          <header>
            <em>{(message as any).type as string}</em>
          </header>
          {messageContent}
        </div>
      ));
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
  'graph-reference': ({ value }) => {
    return <div>(Reference to graph &quot;{value.value.graphName}&quot;)</div>;
  },
};
/* eslint-enable react-hooks/rules-of-hooks -- These are components (ish) */

const RenderChatMessagePart: FC<{ part: ChatMessageMessagePart; renderMarkdown?: boolean }> = ({
  part,
  renderMarkdown,
}) => {
  return match(part)
    .with(P.string, (part) => {
      const Renderer = scalarRenderers.string;
      return <Renderer value={{ type: 'string', value: part }} renderMarkdown={renderMarkdown} />;
    })
    .with({ type: 'image' }, (part) => {
      const Renderer = scalarRenderers.image;
      return <Renderer value={{ type: 'image', value: part }} renderMarkdown={renderMarkdown} />;
    })
    .with({ type: 'url' }, (part) => {
      return <img className="chat-message-url-image" src={part.url} alt={part.url} />;
    })
    .exhaustive();
};

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
  if (isArrayDataValue(value)) {
    const items = arrayizeDataValue(value);
    return (
      <div
        css={multiOutput}
        className={clsx({
          'chat-message-list': value.type === 'chat-message[]',
        })}
      >
        <div className="array-info">
          ({items.length.toLocaleString()} element{items.length === 1 ? '' : 's'})
        </div>
        {items.map((v, i) => (
          <div className="multi-output-item" key={i}>
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

  const Renderer = scalarRenderers[value.type as ScalarDataType] as FC<ScalarRendererProps>;

  if (!Renderer) {
    return <div>ERROR: UNKNOWN TYPE: {JSON.stringify(value)}</div>;
  }

  return (
    <div css={styles}>
      <Renderer
        value={value}
        depth={(depth ?? 0) + 1}
        renderMarkdown={renderMarkdown}
        truncateLength={truncateLength}
      />
    </div>
  );
};

export const RenderDataOutputs: FC<{
  definitions?: NodeOutputDefinition[];
  outputs: Outputs;
  renderMarkdown?: boolean;
}> = ({ definitions, outputs, renderMarkdown }) => {
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
      {outputPorts.map((portId) => {
        const def = definitions?.find((d) => d.id === portId);
        const label = def?.title ?? portId;

        return (
          <div className="port-value" key={portId}>
            <div>
              <em className="port-id-label">{label}</em>
            </div>
            <RenderDataValue value={outputs![portId]!} renderMarkdown={renderMarkdown} />
          </div>
        );
      })}
    </div>
  );
};
