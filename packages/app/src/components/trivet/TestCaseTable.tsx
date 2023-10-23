import { type FC, useMemo, type MouseEvent, useState } from 'react';
import Button from '@atlaskit/button';
import clsx from 'clsx';
import { css } from '@emotion/react';
import { type TrivetTestCase, type TrivetTestCaseResult } from '@ironclad/trivet';
import { keyBy } from 'lodash-es';
import { LoadingSpinner } from '../LoadingSpinner';
import { useContextMenu } from '../../hooks/useContextMenu';
import { useStableCallback } from '../../hooks/useStableCallback';
import Portal from '@atlaskit/portal';
import { DropdownItem } from '@atlaskit/dropdown-menu';
import MultiplyIcon from 'majesticons/line/multiply-line.svg?react';
import PlayIcon from 'majesticons/line/play-circle-line.svg?react';
import Popup from '@atlaskit/popup';
import TextField from '@atlaskit/textfield';

const containerStyles = css`
  display: flex;
  flex-direction: column;
  flex: 0 1 auto;
  min-height: 0;

  h3 {
    margin-top: 32px;
    margin-bottom: 0;
    padding: 0;
    font-size: 16px;
  }
`;

const styles = css`
  display: grid;
  grid-template-columns: 8px auto 36px 1fr 1fr;
  padding-top: 10px;

  min-height: 0;
  flex: 0 1 auto;
  overflow: auto;

  .cell {
    padding: 8px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    user-select: none;
    display: flex;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    min-height: 32px;
  }

  .test-case-row {
    cursor: pointer;
    display: contents;

    &:hover .cell:not(.nobg) {
      background-color: var(--grey-darkish);
    }
  }

  .test-case-row.selected {
    /* .cell:not(.nobg) {
      background-color: var(--primary);
      color: var(--grey-dark);
    }

    &:hover .cell:not(.nobg) {
      background-color: var(--primary-dark);
    } */
  }

  .status-icon {
    .failing {
      color: red !important;
    }

    .passing {
      color: var(--success);
    }

    font-size: 20px;
    line-height: 20px;
  }

  .add-test-case {
    grid-column: 2 / span 3;
    margin-top: 8px;
  }

  .run-test-button {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0;
    margin: 0;
    width: 24px;
    height: 24px;
    border-radius: 0;
    background-color: transparent;
    color: var(--foreground);
    border: 0;
    cursor: pointer;

    &:hover {
      background-color: var(--grey-darkish);
      color: var(--primary-text);
    }
  }

  .header-cell {
    border-bottom: 1px solid var(--grey);
  }

  .input-or-output-pair {
    display: flex;
    gap: 8px;

    .key {
      color: var(--primary-text);
    }

    .json {
      font-family: var(--font-family-monospace);
    }
  }

  .inputs-or-outputs {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .test-case-row-container {
    display: contents;

    &.selected {
      .cell.selected-cell-indicator {
        background-color: var(--primary);
        border-radius: 4px;
      }
    }
  }

  .cell.outputs {
    padding-left: 16px;
  }
`;

const contextMenuStyles = css`
  position: absolute;
  border: 1px solid var(--grey);
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
  background: var(--grey-dark);
  min-width: max-content;

  > button span {
    // This fixes a bug in Ubuntu where the text is missing
    overflow-x: visible !important;
  }
`;

const runWithIterationPopupStyles = css`
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export type TestCaseTableProps = {
  testCases: TrivetTestCase[];
  editingTestCaseId: string | undefined;
  testCaseResults: TrivetTestCaseResult[];
  running: boolean;
  onAddTestCase: () => void;
  onDeleteTestCase: (id: string) => void;
  onSetEditingTestCase: (id: string | undefined) => void;
  onRunTestCase: (id: string, iterationCount?: number) => void;
  onDuplicateTestCase: (id: string) => void;
};

export const TestCaseTable: FC<TestCaseTableProps> = ({
  testCases,
  editingTestCaseId,
  testCaseResults,
  running,
  onAddTestCase,
  onSetEditingTestCase,
  onDeleteTestCase,
  onRunTestCase,
  onDuplicateTestCase,
}) => {
  function toggleSelected(id: string) {
    if (editingTestCaseId === id) {
      onSetEditingTestCase(undefined);
    } else {
      onSetEditingTestCase(id);
    }
  }

  const { contextMenuRef, showContextMenu, contextMenuData, handleContextMenu } = useContextMenu();

  const handleSidebarContextMenu = useStableCallback((e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleContextMenu(e);
  });

  const selectedTestCaseIdForContextMenu = contextMenuData.data
    ? contextMenuData.data?.element.dataset.testcaseid
    : undefined;

  const [showingIterationPopupState, setShowingIterationPopupState] = useState<
    | {
        testCaseId: string;
        iterationCount: number;
      }
    | undefined
  >();

  const runWithIterationCount = (testCaseId: string) => () => {
    onRunTestCase(testCaseId, showingIterationPopupState?.iterationCount);
    setShowingIterationPopupState(undefined);
  };

  return (
    <div
      onContextMenu={handleSidebarContextMenu}
      data-contextmenutype="test-case-table"
      ref={contextMenuRef}
      css={containerStyles}
    >
      <h3>Test Cases</h3>
      <div css={styles}>
        <div className="cell header-cell" style={{ gridColumn: 'span 3' }} />
        <div className="cell header-cell">Inputs</div>
        <div className="cell header-cell">Outputs</div>

        {testCases.map((testCase) => (
          <div
            key={testCase.id}
            className={clsx('test-case-row-container', { selected: editingTestCaseId === testCase.id })}
          >
            <div className="cell selected-cell-indicator" />
            <div className="cell nobg">
              <button className="run-test-button" onClick={() => onRunTestCase(testCase.id)}>
                <PlayIcon />
              </button>

              <Popup
                isOpen={showingIterationPopupState?.testCaseId === testCase.id}
                trigger={(props) => <div {...props} style={{ height: '24px', width: '1px' }} />}
                content={(props) => (
                  <div {...props} css={runWithIterationPopupStyles}>
                    <TextField
                      type="number"
                      value={showingIterationPopupState?.iterationCount}
                      autoFocus
                      onChange={(e) =>
                        setShowingIterationPopupState((state) => ({
                          ...state!,
                          iterationCount: (e.target as HTMLInputElement).valueAsNumber ?? 1,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          runWithIterationCount(testCase.id)();
                        }
                      }}
                    />
                    <Button onClick={runWithIterationCount(testCase.id)}>Run</Button>
                    <Button onClick={() => setShowingIterationPopupState(undefined)}>Cancel</Button>
                  </div>
                )}
              />
            </div>
            <div
              key={testCase.id}
              className={clsx('test-case-row', { selected: editingTestCaseId === testCase.id })}
              onClick={() => toggleSelected(testCase.id)}
              data-contextmenutype="test-case-item"
              data-testcaseid={testCase.id}
            >
              <div className="cell status-icon">
                <TestCaseStatusIcon results={testCaseResults.filter((r) => r.id === testCase.id)} running={running} />
              </div>
              <div className="cell inputs">
                <DisplayInputsOrOutputs data={testCase.input} />
              </div>
              <div className="cell outputs">
                <DisplayInputsOrOutputs data={testCase.expectedOutput} />
              </div>
            </div>
          </div>
        ))}
        <div className="add-test-case">
          <Button onClick={() => onAddTestCase()}>Add Test Case</Button>
        </div>
      </div>
      <Portal>
        {showContextMenu && contextMenuData.data?.type === 'test-case-table' && (
          <div
            css={contextMenuStyles}
            className="test-suite-list-context-menu"
            style={{
              zIndex: 500,
              left: contextMenuData.x,
              top: contextMenuData.y,
            }}
          >
            <DropdownItem onClick={() => onAddTestCase()}>New Test Case</DropdownItem>
          </div>
        )}
        {showContextMenu && contextMenuData.data?.type === 'test-case-item' && (
          <div
            css={contextMenuStyles}
            className="test-suite-list-context-menu"
            style={{
              zIndex: 500,
              left: contextMenuData.x,
              top: contextMenuData.y,
            }}
          >
            <DropdownItem
              onClick={() => selectedTestCaseIdForContextMenu && onRunTestCase(selectedTestCaseIdForContextMenu)}
            >
              Run Test Case
            </DropdownItem>
            <DropdownItem
              onClick={() =>
                selectedTestCaseIdForContextMenu &&
                setShowingIterationPopupState({ testCaseId: selectedTestCaseIdForContextMenu, iterationCount: 1 })
              }
            >
              Run With Iteration Count...
            </DropdownItem>
            <DropdownItem
              onClick={() => selectedTestCaseIdForContextMenu && onDuplicateTestCase(selectedTestCaseIdForContextMenu)}
            >
              Duplicate
            </DropdownItem>
            <DropdownItem
              onClick={() => selectedTestCaseIdForContextMenu && onDeleteTestCase(selectedTestCaseIdForContextMenu)}
            >
              Delete
            </DropdownItem>
          </div>
        )}
      </Portal>
    </div>
  );
};

const DisplayInputsOrOutputs: FC<{ data: Record<string, unknown> }> = ({ data }) => {
  if (data == null) {
    return JSON.stringify(data);
  }

  const keys = Object.keys(data);

  if (keys.length === 0) {
    return '(Empty)';
  }

  const displayValue = (value: unknown) => {
    if (value == null) {
      return 'null';
    }

    if (typeof value === 'string') {
      return value;
    }

    return <span className="json">{JSON.stringify(value)}</span>;
  };

  return (
    <div className="inputs-or-outputs">
      {keys.map((key) => (
        <div className="input-or-output-pair" key={key}>
          <div className="key">{key}</div>
          <div className="value">{displayValue(data[key])}</div>
        </div>
      ))}
    </div>
  );
};

const TestCaseStatusIcon: FC<{ results?: TrivetTestCaseResult[]; running: boolean }> = ({ results, running }) => {
  const passing = results?.every((r) => r.passing) ?? false;

  if (results == null || results.length === 0) {
    if (running) {
      return <LoadingSpinner />;
    } else {
      return <div />;
    }
  } else {
    return <div className={passing ? 'passing' : 'failing'}>{passing ? '✓' : <MultiplyIcon />}</div>;
  }
};
