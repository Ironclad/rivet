import { type ChartNode, type EditorDefinitionGroup } from '@ironclad/rivet-core';
import { type FC } from 'react';
import { type SharedEditorProps } from './SharedEditorProps';
import { css } from '@emotion/react';
// eslint-disable-next-line import/no-cycle
import { DefaultNodeEditorField } from './DefaultNodeEditorField';
import Collapsible from 'react-collapsible';
import ChevronDownIcon from 'majesticons/line/chevron-down-line.svg?react';
import ChevronUpIcon from 'majesticons/line/chevron-up-line.svg?react';
import { getHelperMessage } from './editorUtils';
import { HelperMessage } from '@atlaskit/form';

const styles = css`
  grid-column: span 2;
  display: flex;
  flex-direction: column;
  align-items: stretch;

  > .Collapsible .editor-group-toggle-container {
    display: flex;
    flex-direction: column;
  }

  .editor-group-toggle-area {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .editor-group-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    margin: 0 -16px;
    border: none;
    background: none;
    cursor: pointer;
    outline: none;
    font-size: 14px;
    font-weight: 500;
    border-radius: 4px;
    transition: background 0.2s ease-out;
    font-family: var(--label-font-family);
    color: var(--label-color);
    font-weight: var(--label-font-weight);

    .indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
    }

    &:hover {
      background: var(--grey-darkish);
    }
  }

  .editor-group {
    border-bottom: 1px solid var(--grey-darkish);
    border-top: 1px solid var(--grey-darkish);
    margin-top: 5px;
    padding: 16px 0;

    display: flex;
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    align-content: start;
    gap: 8px;
    flex: 1 1 auto;
    min-height: 0;
  }
`;

const Toggle: FC<{ isOpen?: boolean; label: string; helperMessage?: string }> = ({ isOpen, label, helperMessage }) => (
  <div className="editor-group-toggle-area">
    <button type="button" className="editor-group-toggle">
      <span className="label">{label}</span>
      <span className="indicator">{isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}</span>
    </button>
    {helperMessage && <HelperMessage>{helperMessage}</HelperMessage>}
  </div>
);

export const EditorGroup: FC<
  SharedEditorProps & {
    editor: EditorDefinitionGroup<ChartNode>;
  }
> = ({ editor, ...sharedProps }) => {
  const { editors, label, hideIf, defaultOpen = false } = editor;

  if (hideIf?.(sharedProps.node.data)) {
    return null;
  }

  const helperMessage = getHelperMessage(editor, sharedProps.node.data);

  return (
    <div css={styles}>
      <Collapsible
        open={defaultOpen}
        trigger={<Toggle label={label} helperMessage={helperMessage} />}
        triggerClassName="editor-group-toggle-container"
        triggerOpenedClassName="editor-group-toggle-container open"
        triggerWhenOpen={<Toggle label={label} isOpen helperMessage={helperMessage} />}
        transitionTime={150}
        easing="ease-out"
      >
        <div className="editor-group">
          {editors.map((editor, i) => {
            return <DefaultNodeEditorField key={i} {...sharedProps} editor={editor} />;
          })}
        </div>
      </Collapsible>
    </div>
  );
};
