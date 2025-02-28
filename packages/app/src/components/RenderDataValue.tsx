import { useMemo, type FC } from 'react';
import {
  type DataValue,
  type ScalarDataType,
  arrayizeDataValue,
  getScalarTypeOf,
  inferType,
  isFunctionDataValue,
  type NodeOutputDefinition,
  type ChatMessageMessagePart,
  type DataType,
  type ImageDataValue,
  type BinaryDataValue,
  type AudioDataValue,
  isArrayDataType,
  type ScalarOrArrayDataValue,
  type DocumentDataValue,
  type ChatMessageDataValue,
} from '@ironclad/rivet-core';
import { css } from '@emotion/react';
import { keys } from '../../../core/src/utils/typeSafety';
import { useMarkdown } from '../hooks/useMarkdown';
import ColorizedPreformattedText from './ColorizedPreformattedText';
import { P, match } from 'ts-pattern';
import clsx from 'clsx';
import { type InputsOrOutputsWithRefs, type DataValueWithRefs, type ScalarDataValueWithRefs } from '../state/dataFlow';
import { getGlobalDataRef } from '../utils/globals';
import prettyBytes from 'pretty-bytes';

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
  value: Extract<ScalarDataValueWithRefs, { type: T }>;
  depth?: number;
  renderMarkdown?: boolean;
  truncateLength?: number;
  isCompact?: boolean;
};

/* eslint-disable react-hooks/rules-of-hooks -- These are components (ish) */
const scalarRenderers: {
  [P in ScalarDataType]: FC<ScalarRendererProps<P>>;
} = {
  boolean: ({ value }) => <>{value.value ? 'true' : 'false'}</>,
  number: ({ value }) => <>{value.value}</>,
  string: ({ value, renderMarkdown, truncateLength, isCompact }) => {
    let truncated = truncateLength ? value.value.slice(0, truncateLength) + '...' : value.value;

    if (isCompact) {
      // Take first 2 lines only
      truncated = truncated.split('\n').slice(0, 2).join('\n');
    }

    const markdownRendered = useMarkdown(truncated, renderMarkdown);

    if (renderMarkdown) {
      return <div dangerouslySetInnerHTML={markdownRendered} />;
    }

    return <pre className="pre-wrap">{truncated}</pre>;
  },
  'chat-message': ({ value, renderMarkdown, isCompact }) => {
    const resolved = getGlobalDataRef(value.value.ref);

    if (!resolved) {
      return <div>Could not find data.</div>;
    }

    const { value: realValue } = resolved as ChatMessageDataValue;

    let parts = Array.isArray(realValue.message) ? realValue.message : [realValue.message];

    if (isCompact && parts.length > 1) {
      parts = parts.slice(0, 1);
    }

    const message = realValue;

    const messageContent = (
      <div className="message-content">
        {parts.map((part, i) => (
          <div className="chat-message-message-part" key={i}>
            <RenderChatMessagePart part={part} renderMarkdown={renderMarkdown} isCompact={isCompact} />
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
          {message.function_calls ? (
            <div className="function-calls">
              <h4>Function Calls:</h4>
              <div className="pre-wrap">
                {message.function_calls.map((fc, i) => (
                  <div key={i}>
                    <RenderDataValue value={inferType(fc) as DataValueWithRefs} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            message.function_call && (
              <div className="function-call">
                <h4>Function Call:</h4>
                <div className="pre-wrap">
                  <RenderDataValue value={inferType(message.function_call) as DataValueWithRefs} />
                </div>
              </div>
            )
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
    return (
      <RenderDataValue value={inferred as DataValueWithRefs} depth={(depth ?? 0) + 1} renderMarkdown={renderMarkdown} />
    );
  },
  object: ({ value, isCompact }) => {
    let stringified = JSON.stringify(value.value, null, 2);

    if (isCompact) {
      stringified = stringified.split('\n').slice(0, 2).join('\n') + '\n...';
    }

    return (
      <div className="rendered-object-type">
        <ColorizedPreformattedText text={stringified} language="json" />
      </div>
    );
  },
  'gpt-function': ({ value }) => (
    <>
      GPT Function: <em>{value.value.name}</em>
    </>
  ),
  vector: ({ value }) => <>Vector (length {value.value.length})</>,
  image: ({ value }) => {
    const resolved = getGlobalDataRef(value.value.ref);
    if (!resolved) {
      return <div>Could not find data.</div>;
    }

    const {
      value: { data, mediaType },
    } = resolved as ImageDataValue;

    const imageUrl = useMemo(() => {
      const blob = new Blob([data], { type: mediaType });
      return URL.createObjectURL(blob);
    }, [data, mediaType]);

    return (
      <div>
        <img src={imageUrl} alt="" />
      </div>
    );
  },
  binary: ({ value }) => {
    const resolved = getGlobalDataRef(value.value.ref);
    if (!resolved) {
      return <div>Could not find data.</div>;
    }

    // FIXME: Coercing `value.value` into a `Uint8Array` here because `Uint8Array` gets parsed as an
    //        object of shape `{ [index: number]: number }` when stringified via `JSON.stringify()`.
    //        Consider coercing it back to `Uint8Array` at the entrypoints of the boundaries between
    //        browser and node.js instead.
    const coercedValue = useMemo(() => {
      const resolved = getGlobalDataRef(value.value.ref);
      if (resolved!.value instanceof Uint8Array) {
        return resolved!.value;
      }
      return new Uint8Array(Object.values((resolved as BinaryDataValue).value));
    }, [value.value.ref]);

    return <>Binary (length {coercedValue.length.toLocaleString()})</>;
  },
  audio: ({ value }) => {
    const resolved = getGlobalDataRef(value.value.ref);
    if (!resolved) {
      return <div>Could not find data.</div>;
    }

    const {
      value: { data, mediaType },
    } = resolved as AudioDataValue;

    const dataUri = useMemo(() => {
      const blob = new Blob([data], { type: mediaType });
      return URL.createObjectURL(blob);
    }, [data, mediaType]);

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
  document: ({ value }) => {
    const resolved = getGlobalDataRef(value.value.ref);
    if (!resolved) {
      return <div>Could not find data.</div>;
    }

    const {
      value: { context, data, title, enableCitations, mediaType },
    } = resolved as DocumentDataValue;

    return (
      <div>
        <p>
          {title ? `Document: ${title}` : 'Document'} ({mediaType})
        </p>
        {context && <p>{context}</p>}
        {enableCitations && <p>(Citations enabled)</p>}
        Size: {data.length > 0 ? prettyBytes(data.length) : '0 bytes'}
      </div>
    );
  },
};
/* eslint-enable react-hooks/rules-of-hooks -- These are components (ish) */

const RenderChatMessagePart: FC<{ part: ChatMessageMessagePart; renderMarkdown?: boolean; isCompact?: boolean }> = ({
  part,
  renderMarkdown,
  isCompact,
}) => {
  return match(part)
    .with(P.string, (part) => {
      const Renderer = scalarRenderers.string;
      return <Renderer value={{ type: 'string', value: part }} renderMarkdown={renderMarkdown} isCompact={isCompact} />;
    })
    .with({ type: 'image' }, (part) => {
      const blob = new Blob([part.data], { type: part.mediaType });
      const imageUrl = URL.createObjectURL(blob);

      return (
        <div>
          <img src={imageUrl} alt="" />
        </div>
      );
    })
    .with({ type: 'url' }, (part) => {
      return <img className="chat-message-url-image" src={part.url} alt={part.url} />;
    })
    .with({ type: 'document' }, (part) => {
      const { data, mediaType, context, title, enableCitations } = part;

      return (
        <div>
          <p>
            {title ? `Document: ${title}` : 'Document'} ({mediaType})
          </p>
          {context && <p>{context}</p>}
          {enableCitations && <p>(Citations enabled)</p>}
          Size: {data.length > 0 ? prettyBytes(data.length) : '0 bytes'}
        </div>
      );
    })
    .exhaustive();
};

export const RenderDataValue: FC<{
  value: DataValueWithRefs | undefined;
  depth?: number;
  renderMarkdown?: boolean;
  truncateLength?: number;
  isCompact?: boolean;
}> = ({ value, depth, renderMarkdown, truncateLength, isCompact }) => {
  if ((depth ?? 0) > 100) {
    return <>ERROR: FAILED TO RENDER {JSON.stringify(value)}</>;
  }
  if (!value) {
    return <>undefined</>;
  }

  if (isArrayDataType(value.type)) {
    let items = arrayizeDataValue(value as ScalarOrArrayDataValue);

    const count = items.length;

    if (isCompact) {
      items = items.slice(0, 1);
    }

    return (
      <div
        css={multiOutput}
        className={clsx({
          'chat-message-list': value.type === 'chat-message[]',
        })}
      >
        <div className="array-info">
          ({count.toLocaleString()} element{count === 1 ? '' : 's'})
        </div>
        {items.map((v, i) => (
          <div className="multi-output-item" key={i}>
            <RenderDataValue
              key={i}
              value={v as DataValueWithRefs}
              depth={(depth ?? 0) + 1}
              renderMarkdown={renderMarkdown}
              truncateLength={truncateLength}
              isCompact={isCompact}
            />
          </div>
        ))}
      </div>
    );
  }

  if (isFunctionDataValue(value as DataValue)) {
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
        value={value as ScalarDataValueWithRefs}
        depth={(depth ?? 0) + 1}
        renderMarkdown={renderMarkdown}
        truncateLength={truncateLength}
        isCompact={isCompact}
      />
    </div>
  );
};

export const RenderDataOutputs: FC<{
  definitions?: NodeOutputDefinition[];
  outputs: InputsOrOutputsWithRefs;
  renderMarkdown?: boolean;
  isCompact: boolean;
}> = ({ definitions, outputs, renderMarkdown, isCompact }) => {
  let outputPorts = keys(outputs);

  if (outputPorts.length === 1) {
    return (
      <div>
        <RenderDataValue value={outputs[outputPorts[0]!]!} renderMarkdown={renderMarkdown} isCompact={isCompact} />
      </div>
    );
  }

  if (isCompact) {
    outputPorts = outputPorts.slice(0, 1);
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
            <RenderDataValue value={outputs![portId]!} renderMarkdown={renderMarkdown} isCompact={isCompact} />
          </div>
        );
      })}
    </div>
  );
};
