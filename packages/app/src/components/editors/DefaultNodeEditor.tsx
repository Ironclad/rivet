import { FC, useEffect, useState } from 'react';
import { ChartNode, EditorDefinitionOrGroup, getError, globalRivetNodeRegistry } from '@ironclad/rivet-core';
import { css } from '@emotion/react';
import { toast } from 'react-toastify';
import { SharedEditorProps } from './SharedEditorProps';

export const defaultEditorContainerStyles = css`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  align-content: start;
  gap: 8px;
  flex: 1 1 auto;
  min-height: 0;

  .row {
    display: grid;
    grid-template-columns: 1fr auto;
    column-gap: 16px;
  }

  .use-input-toggle {
    align-self: center;
    margin-top: 32px;
  }

  .data-type-selector {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    column-gap: 16px;
  }

  .editor-wrapper-wrapper {
    min-height: 200px;
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    position: relative;
    /* height: 100%; */
  }

  .editor-wrapper {
    position: absolute;
    top: 24px;
    left: 0;
    right: 0;
    bottom: 0;
  }

  .editor-container {
    height: 100%;
  }

  .row.code {
    min-height: min-content;
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
  }

  .row.toggle > div {
    display: flex;
    align-items: center;
    gap: 8px;

    label:first-child {
      min-width: 75px;
    }

    &.use-input-toggle label:first-child {
      min-width: unset;
    }

    div,
    label {
      margin: 0;
    }
  }
`;

export const DefaultNodeEditor: FC<
  SharedEditorProps & {
    onClose?: () => void;
  }
> = ({ node, onChange, isReadonly, onClose }) => {
  const [editors, setEditors] = useState<EditorDefinitionOrGroup<ChartNode>[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const dynamicImpl = globalRivetNodeRegistry.createDynamicImpl(node);

        // eslint-disable-next-line @typescript-eslint/await-thenable -- Is is thenable you dummy
        const loadedEditors = await dynamicImpl.getEditors();

        setEditors(loadedEditors);
      } catch (err) {
        toast.error(`Failed to load editors for node ${node.id}: ${getError(err).message}`);
      }
    })();
  }, [node]);

  return (
    <div css={defaultEditorContainerStyles}>
      {editors.map((editor, i) => (
        <DefaultNodeEditorField
          key={editor.dataKey}
          node={node}
          onChange={onChange}
          editor={editor}
          isReadonly={isReadonly}
          onClose={onClose}
        />
      ))}
    </div>
  );
};
