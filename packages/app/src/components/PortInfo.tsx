import Portal from '@atlaskit/portal';
import { css } from '@emotion/react';
import {
  canBeCoercedAny,
  isDataTypeAccepted,
  type NodeId,
  type NodeInputDefinition,
  type NodeOutputDefinition,
  type PortId,
} from '@ironclad/rivet-core';
import { type CSSProperties, forwardRef } from 'react';
import { useRecoilValue } from 'recoil';
import { draggingWireState } from '../state/graphBuilder';

const style = css`
  position: absolute;

  padding: 12px;
  border-radius: 5px;
  background-color: var(--grey-darker);
  color: var(--foreground);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  border: 1px solid var(--grey);
  z-index: 1000;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  dl {
    display: grid;
    grid-template-columns: auto 2fr;
    flex-direction: column;
    margin: 0;
    padding: 0;
    align-items: center;
    column-gap: 16px;
    row-gap: 4px;

    dt {
      font-weight: bold;
      margin: 0;
      white-space: nowrap;
      padding: 0;
    }

    dd {
      margin: 0;
      padding: 0;
      min-width: 200px;
    }

    dt.id-title {
      grid-column: 1 / span 2;

      .id {
        font-family: var(--font-family-monospace);
        font-weight: 400;
        font-size: 12px;
      }
    }

    dd.description {
      grid-column: 1 / span 2;
    }
  }

  .will-be-coerced {
    color: var(--warning);

    code {
      font-family: var(--font-family-monospace);
      font-size: 12px;
    }
  }

  .incompatible {
    color: var(--error);

    code {
      font-family: var(--font-family-monospace);
      font-size: 12px;
    }
  }
`;

export const PortInfo = forwardRef<
  HTMLDivElement,
  {
    port: {
      nodeId: NodeId;
      isInput: boolean;
      portId: PortId;
      definition: NodeInputDefinition | NodeOutputDefinition;
    };
    floatingStyles: CSSProperties;
  }
>(({ port, floatingStyles }, ref) => {
  const { definition } = port;
  const { dataType, title, description, id } = definition;

  const draggingWire = useRecoilValue(draggingWireState);

  const dataTypeDisplay: string = Array.isArray(dataType) ? dataType.join(' or ') : (dataType as string);
  let dataTypeDisplayWithCoerced = dataTypeDisplay;

  let canCoerce = false;
  if (port.isInput && ((definition as NodeInputDefinition).coerced ?? true)) {
    canCoerce = true;
    dataTypeDisplayWithCoerced += ' (coerced)';
  }

  const willCoerce =
    canCoerce &&
    draggingWire &&
    canBeCoercedAny(draggingWire.dataType, definition.dataType) &&
    !isDataTypeAccepted(draggingWire.dataType, definition.dataType);

  const incompatible =
    draggingWire &&
    !isDataTypeAccepted(draggingWire.dataType, definition.dataType) &&
    (!canCoerce || !canBeCoercedAny(draggingWire.dataType, definition.dataType));

  return (
    <Portal>
      <div css={style} ref={ref} style={floatingStyles}>
        <dl>
          <dt className="id-title">
            {title === id ? (
              title
            ) : (
              <span>
                {title} <span className="id">({id})</span>
              </span>
            )}
          </dt>
          <dt>Data Type</dt>
          <dd>{dataTypeDisplayWithCoerced}</dd>

          {(definition as NodeInputDefinition).required && (
            <>
              <dt>Required</dt>
              <dd>Yes</dd>
            </>
          )}

          {description && (
            <>
              <dd className="description">{description}</dd>
            </>
          )}
        </dl>
        {willCoerce && (
          <div className="will-be-coerced">
            Your data of type <code>{draggingWire.dataType}</code> will be coerced to <code>{dataTypeDisplay}</code> if
            you connect it here.
          </div>
        )}
        {incompatible && (
          <div className="incompatible">
            Your data of type <code>{draggingWire.dataType}</code> is incompatible with <code>{dataTypeDisplay}</code>.
            You may still connect it, but your graph may error.
          </div>
        )}
      </div>
    </Portal>
  );
});
