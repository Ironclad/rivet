import { css } from '@emotion/react';
import { FC, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { graphState } from '../state/graph';
import { savedGraphsState } from '../state/savedGraphs';
import { orderBy } from 'lodash-es';
import { DropdownItem } from '@atlaskit/dropdown-menu';
import { useDeleteGraph } from '../hooks/useDeleteGraph';
import { useLoadGraph } from '../hooks/useLoadGraph';
import { GraphId, emptyNodeGraph } from '@ironclad/rivet-core';
import clsx from 'clsx';
import { LoadingSpinner } from './LoadingSpinner';
import { runningGraphsState } from '../state/dataFlow';
import { useDuplicateGraph } from '../hooks/useDuplicateGraph';
import { useContextMenu } from '../hooks/useContextMenu';
import Portal from '@atlaskit/portal';
import TableTree, { Rows, Row, Cell } from '@atlaskit/table-tree';
import { NodeGraph } from '@ironclad/rivet-core';

const styles = css`
  display: flex;
  flex-direction: column;
  flex-shrink: 1;
  min-height: 100%;
  margin-top: 8px;

  .graph-list {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-height: 0;
    overflow: auto;
    flex-shrink: 1;
    margin-top: 8px;
  }

  .graph-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    user-select: none;
    padding: 0 4px;
    font-size: 12px;

    &:hover {
      background-color: var(--grey-darkish);
    }
  }

  .graph-item-select {
    cursor: pointer;
    padding: 4px 8px;
    flex: 1;
  }

  .selected {
    background-color: var(--primary);
    color: var(--grey-dark);

    &:hover {
      background-color: var(--primary-dark);
    }
  }

  .spinner {
    position: absolute;
    right: 32px;
    width: 16px;
    padding-left: 4px;
  }

  .selected .spinner svg {
    color: var(--grey-dark);
  }
`;

const contextMenuStyles = css`
  position: absolute;
  border: 1px solid var(--grey);
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
  background: var(--grey-dark);
  min-width: max-content;
`;

interface NodeGraphFolder {
  type: 'folder';
  name: string;
  fullPath: string;
  children: NodeGraphFolderItem[];
}

interface NodeGraphFolderGraph {
  type: 'graph'
  name: string;
  graph: NodeGraph;
}

type NodeGraphFolderItem = NodeGraphFolder | NodeGraphFolderGraph;

function createFoldersFromGraphs(graphs: NodeGraph[], folderNames: string[]): NodeGraphFolderItem[] {
  const rootFolder: NodeGraphFolderItem = {
    name: '',
    fullPath: '',
    type: 'folder',
    children: [],
  };

  // Create folders for each folder name, to guarantee that empty folders don't disappear
  folderNames.forEach((folderName) => {
    let currentFolder = rootFolder;
    const folderNameParts = folderName.split('/');

    for (let i = 0; i < folderNameParts.length; i++) {
      const existingFolder = currentFolder.children.find((child): child is NodeGraphFolder => child.name === folderNameParts[i] && child.type === 'folder');

      if (existingFolder) {
        currentFolder = existingFolder;
      } else {
        const newFolder: NodeGraphFolder = {
          name: folderNameParts[i] ?? '',
          fullPath: folderNameParts.slice(0, i + 1).join('/'),
          type: 'folder',
          children: [],
        };
        currentFolder.children.push(newFolder);
        currentFolder = newFolder;
      }
    }
  });

  graphs.forEach((graph) => {
    const graphNameParts = graph.metadata?.name?.split('/') ?? [];

    let currentFolder = rootFolder;
    for (let i = 0; i < graphNameParts.length - 1; i++) {
      const folderName = graphNameParts[i] ?? '';
      const existingFolder = currentFolder.children.find((child): child is NodeGraphFolder => child.name === folderName && child.type === 'folder');

      if (existingFolder) {
        currentFolder = existingFolder;
      } else {
        const newFolder: NodeGraphFolder = {
          name: folderName,
          fullPath: graphNameParts.slice(0, i + 1).join('/'),
          type: 'folder',
          children: [],
        };
        currentFolder.children.push(newFolder);
        currentFolder = newFolder;
      }
    }

    currentFolder.children.push({
      name: graphNameParts[graphNameParts.length - 1] ?? '',
      type: 'graph',
      graph,
    });
  });

  // Order by name recursively
  const sortFolder = (folder: NodeGraphFolder) => {
    folder.children = orderBy(folder.children, ['name'], ['asc']);
    folder.children.forEach((child) => {
      if (child.type === 'folder') {
        sortFolder(child);
      }
    });
  }

  sortFolder(rootFolder);

  return rootFolder.children;
}

function getFolderNames(folderedGraphs: NodeGraphFolderItem[]): string[] {
  const folderNames: string[] = [];

  const traverseFolder = (folder: NodeGraphFolderItem) => {
    if (folder.type === 'folder') {
      folder.children.forEach((child) => {
        traverseFolder(child);
      });
      folderNames.push(folder.fullPath);
    }
  }

  folderedGraphs.forEach((folder) => {
    traverseFolder(folder);
  });

  return folderNames;
}

export const GraphList: FC = () => {
  const graph = useRecoilValue(graphState);
  const [savedGraphs, setSavedGraphs] = useRecoilState(savedGraphsState);

  // Track folders on deletion or creation, so that empty folders aren't automatically deleted.
  const [folderNames, setFolderNames] = useState<string[]>([]);
  
  const folderedGraphs = createFoldersFromGraphs(savedGraphs, folderNames);

  const runningGraphs = useRecoilValue(runningGraphsState);

  const deleteGraph = useDeleteGraph();
  const loadGraph = useLoadGraph();

  const duplicateGraph = useDuplicateGraph();

  function handleNew(folderPath?: string) {
    const graph = emptyNodeGraph();
    if (folderPath) {
      graph.metadata!.name = `${folderPath}/${graph.metadata!.name}`;
    }
    loadGraph(graph);
    setSavedGraphs([...savedGraphs, graph]);
  }

  function handleNewFolder() {
    setFolderNames((prev) => [...prev, 'New Folder']);
  }

  function handleDelete(graph: NodeGraph) {
    setFolderNames(getFolderNames(folderedGraphs));
    deleteGraph(graph);
  }

  function handleDeleteFolder(folderName: string) {
    const graphsToDelete = savedGraphs.filter((graph) => graph.metadata?.name?.startsWith(folderName));
    graphsToDelete.forEach((graph) => deleteGraph(graph));
    setFolderNames((prev) => prev.filter((name) => name !== folderName));
  }

  const { contextMenuRef, showContextMenu, contextMenuData, handleContextMenu } = useContextMenu();

  const selectedGraphForContextMenu = contextMenuData.data
    ? savedGraphs.find((graph) => graph.metadata!.id === contextMenuData.data?.element.dataset.graphid)
    : null;

  const selectedFolderNameForContextMenu = contextMenuData.data
    ? contextMenuData.data?.element.dataset.folderpath
    : undefined;

  return <div css={styles} ref={contextMenuRef} onContextMenu={handleContextMenu}>
    <div className="graph-list">
      <TableTree>
        <Rows
          items={folderedGraphs}
          render={(item: NodeGraphFolderItem) => {
            const savedGraph = item.type === 'graph' ? item.graph : undefined;
            const graphIsRunning = savedGraph && runningGraphs.includes(savedGraph.metadata?.id ?? ('' as GraphId));

            return <Row
              itemId={savedGraph?.metadata?.id ?? item.name}
              items={item.type === 'folder' && item.children}
              isDefaultExpanded
              hasChildren={item.type === 'folder'}>
              <Cell>
                <div
                  className={clsx('graph-item', { selected: graph.metadata?.id === savedGraph?.metadata?.id })}
                  data-contextmenutype={item.type === 'folder' ? 'graph-folder' : 'graph-item'}
                  data-graphid={savedGraph?.metadata?.id}
                  data-folderpath={item.type === 'folder' ? item.fullPath : item.graph.metadata?.name}
                >
                  <div className="spinner">{graphIsRunning && <LoadingSpinner />}</div>
                  <div className="graph-item-select" onClick={() => item.type === 'graph' && loadGraph(item.graph)}>
                    {item.name ?? 'Untitled Graph'}
                  </div>
                </div>
              </Cell>
            </Row>
          }}
        />
      </TableTree>
      <Portal>
        {showContextMenu && contextMenuData.data?.type === 'graph-item' && (
          <div
            className="graph-item-context-menu"
            css={contextMenuStyles}
            style={{
              zIndex: 500,
              left: contextMenuData.x,
              top: contextMenuData.y,
            }}
          >
            <DropdownItem onClick={() => duplicateGraph(selectedGraphForContextMenu!)}>
              Duplicate
            </DropdownItem>
            <DropdownItem onClick={() => handleDelete(selectedGraphForContextMenu!)}>Delete</DropdownItem>
          </div>
        )}
        {showContextMenu && contextMenuData.data?.type === 'graph-folder' && (
          <div
          className="graph-item-context-menu"
          css={contextMenuStyles}
          style={{
            zIndex: 500,
            left: contextMenuData.x,
            top: contextMenuData.y,
          }}
        >
          <DropdownItem onClick={() => handleNew(selectedFolderNameForContextMenu!)}>New Graph</DropdownItem>
          <DropdownItem onClick={() => handleDeleteFolder(selectedFolderNameForContextMenu!)}>Delete</DropdownItem>
        </div>
      )}
      </Portal>
    </div>
    <Portal>
      {showContextMenu && contextMenuData.data?.type === 'graph-list' && (
        <div
          className="graph-list-context-menu"
          css={contextMenuStyles}
          style={{
            zIndex: 500,
            left: contextMenuData.x,
            top: contextMenuData.y,
          }}
        >
          <DropdownItem onClick={() => handleNew()}>New Graph</DropdownItem>
          <DropdownItem onClick={handleNewFolder}>New Folder</DropdownItem>
        </div>
      )}
    </Portal>
  </div>;
}