import { css } from "@emotion/react";
import { FC, MouseEvent } from "react";
import clsx from "clsx";
import { useContextMenu } from "../../hooks/useContextMenu";
import { useStableCallback } from "../../hooks/useStableCallback";
import Portal from "@atlaskit/portal";
import { DropdownItem } from "@atlaskit/dropdown-menu";
import { TrivetTestSuite } from "@ironclad/trivet";

const styles = css`
min-height: 100%;
border-right: 1px solid var(--grey);

.test-suite-item {
  &:hover {
    background-color: var(--grey-darkish);
  }
}

.test-suite-item.selected {
  background-color: var(--primary);
  color: var(--grey-dark);

  &:hover {
    background-color: var(--primary-dark);
  }
}
`;

const contextMenuStyles = css`
  position: absolute;
  border: 1px solid var(--grey);
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
  background: var(--grey-dark);
  min-width: max-content;
`;

export type TestSuiteListProps = {
  testSuites: TrivetTestSuite[];
  selectedTestSuite: TrivetTestSuite | undefined;
  setSelectedTestSuite: (id: string) => void;
  createNewTestSuite: () => void;
  deleteTestSuite: (id: string) => void;
};

export const TestSuiteList: FC<TestSuiteListProps> = ({
  testSuites,
  setSelectedTestSuite,
  selectedTestSuite,
  createNewTestSuite,
  deleteTestSuite,
}) => {
  const { contextMenuRef, showContextMenu, contextMenuData, handleContextMenu } = useContextMenu();

  const handleSidebarContextMenu = useStableCallback((e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleContextMenu(e);
  });

  function handleNew() {
    createNewTestSuite();
  }

  function handleDelete(id: string | undefined) {
    id && deleteTestSuite(id);
  }

  const selectedTestSuiteIdForContextMenu = contextMenuData.data
    ? contextMenuData.data?.element.dataset.testsuiteid
    : undefined;

  return (
    <div css={styles} onContextMenu={handleSidebarContextMenu} data-contextmenutype="test-suite-list" ref={contextMenuRef}>
      <h2>Test Suites</h2>
      <hr />
      {testSuites.map((testSuite) => (
        <div
          key={testSuite.id}
          onClick={() => setSelectedTestSuite(testSuite.id)}
          className={clsx('test-suite-item', { selected: testSuite.id === selectedTestSuite?.id })}
          data-contextmenutype="test-suite-item"
          data-testsuiteid={testSuite.id}>
          {testSuite.name ?? 'Untitled Test Suite'}
        </div>
      ))}
      <Portal>
        {showContextMenu && contextMenuData.data?.type === 'test-suite-list' && (
          <div
            css={contextMenuStyles}
            className="test-suite-list-context-menu"
            style={{
              zIndex: 500,
              left: contextMenuData.x,
              top: contextMenuData.y,
            }}
          >
            <DropdownItem onClick={handleNew}>New Test Suite</DropdownItem>
          </div>
        )}
        {showContextMenu && contextMenuData.data?.type === 'test-suite-item' && (
          <div
            css={contextMenuStyles}
            className="test-suite-list-context-menu"
            style={{
              zIndex: 500,
              left: contextMenuData.x,
              top: contextMenuData.y,
            }}
          >
            <DropdownItem onClick={() => handleDelete(selectedTestSuiteIdForContextMenu)}>Delete</DropdownItem>
          </div>
        )}
      </Portal>
    </div>
  );
};