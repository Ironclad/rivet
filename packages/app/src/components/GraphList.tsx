import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { css } from '@emotion/react';
import { CSSProperties, FC, useState, useMemo, FocusEvent, MouseEvent, KeyboardEvent, useEffect, memo } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { graphState } from '../state/graph.js';
import { savedGraphsState } from '../state/savedGraphs.js';
import { orderBy, range } from 'lodash-es';
import { DropdownItem } from '@atlaskit/dropdown-menu';
import { useDeleteGraph } from '../hooks/useDeleteGraph.js';
import { useLoadGraph } from '../hooks/useLoadGraph.js';
import { GraphId, emptyNodeGraph } from '@ironclad/rivet-core';
import clsx from 'clsx';
import { LoadingSpinner } from './LoadingSpinner.js';
import { runningGraphsState } from '../state/dataFlow.js';
import { useDuplicateGraph } from '../hooks/useDuplicateGraph.js';
import { useContextMenu } from '../hooks/useContextMenu.js';
import Portal from '@atlaskit/portal';
import { NodeGraph } from '@ironclad/rivet-core';
import { ReactComponent as ArrowRightIcon } from 'majesticons/line/arrow-right-line.svg';
import { ReactComponent as ArrowDownIcon } from 'majesticons/line/arrow-down-line.svg';
import { ReactComponent as MenuLineIcon } from 'majesticons/line/menu-line.svg';
import { toast } from 'react-toastify';
import { useStableCallback } from '../hooks/useStableCallback.js';
import TextField from '@atlaskit/textfield';

const styles = css`
  display: flex;
  flex-direction: column;
  flex-shrink: 1;
  min-height: 100%;
  margin-top: 8px;

  .graph-list {
    overflow-y: auto;
    overflow-x: hidden;
  }

  .graph-list,
  .folder-children {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-height: 0;
    flex-shrink: 1;
    margin-top: 8px;
  }

  .folder-children {
    display: none;
    &.expanded {
      display: flex;
    }
  }

  .graph-item {
    display: flex;
    flex-direction: row;
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

  .depthSpacer {
    width: 10px;
    flex-shrink: 0;
  }

  .selected {
    background-color: var(--primary);
    color: var(--foreground-on-primary);

    &:hover {
      background-color: var(--primary-dark);
    }
  }

  .selected .spinner svg {
    color: var(--foreground-on-primary);
  }

  .dragger {
    visibility: hidden;
    cursor: grab;
  }

  .graph-item:hover .dragger {
    visibility: visible;
  }

  .graph-list-spacer {
    min-height: 100px;
  }

  .dragging-over {
    background: var(--grey-darkish);
  }

  .dragging {
    opacity: 0.5;
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
  type: 'graph';
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
      const existingFolder = currentFolder.children.find(
        (child): child is NodeGraphFolder => child.name === folderNameParts[i] && child.type === 'folder',
      );

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
      const existingFolder = currentFolder.children.find(
        (child): child is NodeGraphFolder => child.name === folderName && child.type === 'folder',
      );

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
    folder.children = orderBy(folder.children, ['type', 'name'], ['asc', 'asc']);
    folder.children.forEach((child) => {
      if (child.type === 'folder') {
        sortFolder(child);
      }
    });
  };

  sortFolder(rootFolder);

  return rootFolder.children;
}

function isInFolder(folderPath: string, itemPath: string): boolean {
  return itemPath.startsWith(folderPath + '/');
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
  };

  folderedGraphs.forEach((folder) => {
    traverseFolder(folder);
  });

  return folderNames;
}

export const GraphList: FC = () => {
  const [graph, setGraph] = useRecoilState(graphState);
  const [savedGraphs, setSavedGraphs] = useRecoilState(savedGraphsState);

  // Track the graph that is being renamed, so that we can update the name when the user is done.
  const [renamingItemFullPath, setRenamingItemFullPath] = useState<string | undefined>();

  const [draggingItemFullPath, setDraggingItemFullPath] = useState<string | undefined>();
  const draggingItemFolder = draggingItemFullPath?.split('/').slice(0, -1).join('/');

  // Track folders on deletion or creation, so that empty folders aren't automatically deleted.
  const [folderNames, setFolderNames] = useState<string[]>([]);

  const folderedGraphs = createFoldersFromGraphs(savedGraphs, folderNames);

  const runningGraphs = useRecoilValue(runningGraphsState);

  const deleteGraph = useDeleteGraph();
  const loadGraph = useLoadGraph();

  const duplicateGraph = useDuplicateGraph();

  const handleNew = useStableCallback((folderPath?: string) => {
    const graph = emptyNodeGraph();
    let i = 1;
    if (folderPath) {
      if (savedGraphs.some((g) => g.metadata?.name === `${folderPath}/Untitled Graph`)) {
        i++;
      }

      // eslint-disable-next-line no-loop-func
      while (savedGraphs.some((g) => g.metadata?.name === `${folderPath}/Untitled Graph ${i}`)) {
        i++;
      }

      graph.metadata!.name = i === 1 ? `${folderPath}/Untitled Graph` : `${folderPath}/Untitled Graph ${i}`;
    } else {
      if (savedGraphs.some((g) => g.metadata?.name === 'Untitled Graph')) {
        i++;
      }

      // eslint-disable-next-line no-loop-func
      while (savedGraphs.some((g) => g.metadata?.name === `Untitled Graph ${i}`)) {
        i++;
      }

      graph.metadata!.name = i === 1 ? `Untitled Graph` : `Untitled Graph ${i}`;
    }
    loadGraph(graph);
    setSavedGraphs((savedGraphs) => [...savedGraphs, graph]);
    startRename(graph.metadata!.name!);
  });

  const handleNewFolder = useStableCallback((parentPath?: string) => {
    const newFolderPath = parentPath ? `${parentPath}/New Folder` : 'New Folder';
    setFolderNames((prev) => [...prev, newFolderPath]);
    startRename(newFolderPath);
  });

  const handleDelete = useStableCallback((graph: NodeGraph) => {
    setFolderNames(getFolderNames(folderedGraphs));
    deleteGraph(graph);
  });

  const handleDeleteFolder = useStableCallback((folderName: string) => {
    const graphsToDelete = savedGraphs.filter(
      (graph) => graph.metadata?.name && isInFolder(folderName, graph.metadata?.name),
    );
    graphsToDelete.forEach((graph) => deleteGraph(graph));
    setFolderNames((prev) => prev.filter((name) => folderName !== name && !isInFolder(folderName, name)));
  });

  const startRename = useStableCallback((folderItemName: string) => {
    setRenamingItemFullPath(folderItemName);
  });

  const renameFolderItem = useStableCallback((fullPath: string, newFullPath: string, itemId?: string) => {
    if (fullPath === newFullPath || !newFullPath || /\/$/.test(newFullPath)) {
      setRenamingItemFullPath(undefined);
      return;
    }

    if (newFullPath.split('/').some((part) => part === '')) {
      toast.error('Names contains invalid segments');
      return;
    }

    if (savedGraphs.some((g) => g.metadata?.name === newFullPath) || folderNames.includes(newFullPath)) {
      toast.error('A graph or folder with that name already exists.');
      return;
    }
    setSavedGraphs(
      savedGraphs.map((g) => {
        if (g.metadata?.name && (fullPath === g.metadata.name || isInFolder(fullPath, g.metadata.name))) {
          return {
            ...g,
            metadata: {
              ...g.metadata,
              name: g.metadata.name.replace(fullPath, newFullPath),
            },
          };
        } else {
          return g;
        }
      }),
    );
    setGraph({
      ...graph,
      metadata: {
        ...graph.metadata,
        name: graph.metadata?.name?.replace(fullPath, newFullPath),
      },
    });
    setFolderNames((prev) =>
      prev.map((name) =>
        name === fullPath || isInFolder(fullPath, name) ? name.replace(fullPath, newFullPath) : name,
      ),
    );
    setRenamingItemFullPath(undefined);
  });

  function handleDragStart(drag: DragStartEvent) {
    const activeFullPath = drag.active?.id as string;
    setDraggingItemFullPath(activeFullPath);
  }

  const handleDragEnd = useStableCallback((dragResult: DragEndEvent) => {
    setDragOverFolderName(undefined);
    const activeFullPath = dragResult.active?.id as string;
    const overFullPath = dragResult.over?.id as string;
    if (overFullPath && activeFullPath) {
      if (isInFolder(activeFullPath, overFullPath)) {
        // Don't allow dragging into a folder that is a child of the active item
        return;
      }
      const overFolderName = overFullPath.indexOf('/') > 0 ? overFullPath.replace(/\/[^/]*$/, '') : '';
      // Get the last part of the active id's name
      const itemName = activeFullPath.split('/').pop()!;
      const newItemFullPath = overFolderName === '' ? itemName : `${overFolderName}/${itemName}`;
      if (activeFullPath !== newItemFullPath) {
        renameFolderItem(activeFullPath, newItemFullPath);
      }
    }
  });

  const [dragOverFolderName, setDragOverFolderName] = useState<string | undefined>();

  function handleDragOver(dragOver: DragOverEvent) {
    const overFullPath = dragOver.over?.id as string;
    if (overFullPath == null) {
      setDragOverFolderName(undefined);
    } else {
      setDragOverFolderName(overFullPath.indexOf('/') > 0 ? overFullPath.replace(/\/[^/]*$/, '') : '');
    }
  }

  const { contextMenuRef, showContextMenu, contextMenuData, handleContextMenu } = useContextMenu();
  const handleSidebarContextMenu = useStableCallback((e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleContextMenu(e);
  });

  const selectedGraphForContextMenu = contextMenuData.data
    ? savedGraphs.find((graph) => graph.metadata!.id === contextMenuData.data?.element.dataset.graphid)
    : null;

  const selectedFolderNameForContextMenu = contextMenuData.data
    ? contextMenuData.data?.element.dataset.folderpath
    : undefined;

  return (
    <div css={styles} ref={contextMenuRef} onContextMenu={handleSidebarContextMenu}>
      <div className={clsx('graph-list', { 'dragging-over': dragOverFolderName === '' && draggingItemFolder !== '' })}>
        <DndContext onDragEnd={handleDragEnd} onDragOver={handleDragOver} onDragStart={handleDragStart}>
          {folderedGraphs.map((item) => (
            <FolderItem
              key={item.type === 'graph' ? item.graph.metadata?.id : item.fullPath}
              item={item}
              runningGraphs={runningGraphs}
              renamingItemFullPath={renamingItemFullPath}
              graph={graph}
              dragOverFolderName={dragOverFolderName}
              draggingItemFolder={draggingItemFolder}
              depth={0}
              onGraphSelected={loadGraph}
              onRenameItem={renameFolderItem}
            />
          ))}
          <GraphListSpacer />
        </DndContext>
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
              <DropdownItem onClick={() => startRename(selectedFolderNameForContextMenu!)}>Rename Graph</DropdownItem>
              <DropdownItem onClick={() => duplicateGraph(selectedGraphForContextMenu!)}>Duplicate</DropdownItem>
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
              <DropdownItem onClick={() => startRename(selectedFolderNameForContextMenu!)}>Rename Folder</DropdownItem>
              <DropdownItem onClick={() => handleNew(selectedFolderNameForContextMenu!)}>New Graph</DropdownItem>
              <DropdownItem onClick={() => handleNewFolder(selectedFolderNameForContextMenu!)}>New Folder</DropdownItem>
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
            <DropdownItem onClick={() => handleNewFolder()}>New Folder</DropdownItem>
          </div>
        )}
      </Portal>
    </div>
  );
};

// Allows the bottom of the list to be a drop target
export const GraphListSpacer: FC = () => {
  const { setNodeRef: setDroppableNodeRef } = useDroppable({ id: '/' });
  return <div className="graph-list-spacer" ref={setDroppableNodeRef} />;
};

export const FolderItem: FC<{
  item: NodeGraphFolderItem;
  runningGraphs: GraphId[];
  renamingItemFullPath: string | undefined;
  graph: NodeGraph;
  depth: number;
  dragOverFolderName: string | undefined;
  draggingItemFolder: string | undefined;
  onGraphSelected?: (savedGraph: NodeGraph) => void;
  onRenameItem: (fullPath: string, newFullPath: string) => void;
}> = memo(
  ({
    item,
    runningGraphs,
    renamingItemFullPath,
    graph,
    draggingItemFolder,
    onGraphSelected,
    onRenameItem,
    depth,
    dragOverFolderName,
  }) => {
    const [isExpanded, setExpanded] = useState(true);
    const savedGraph = item.type === 'graph' ? item.graph : undefined;
    const graphIsRunning = savedGraph && runningGraphs.includes(savedGraph.metadata?.id ?? ('' as GraphId));
    const fullPath = item.type === 'folder' ? item.fullPath : item.graph.metadata?.name ?? 'Untitled Graph';
    const isRenaming = renamingItemFullPath === fullPath;
    const isSelected = graph.metadata?.id === savedGraph?.metadata?.id;
    const isDraggingOver =
      item.type === 'folder' && dragOverFolderName === fullPath && draggingItemFolder !== dragOverFolderName;

    const handleRenameSaved = useStableCallback((newName: string) => {
      onRenameItem(fullPath, fullPath.replace(/[^/]+$/, newName));
    });

    const {
      attributes,
      listeners,
      setNodeRef: setDraggableNodeRef,
      transform,
      isDragging,
    } = useDraggable({ id: fullPath });
    const style: CSSProperties = transform ? { transform: `translate3d(0, ${transform.y}px, 0)`, zIndex: 100 } : {};
    const { setNodeRef: setDroppableNodeRef } = useDroppable({
      id: item.type === 'folder' ? fullPath + '/' : fullPath,
    });

    const virtualDepth = useMemo(
      () =>
        isDragging && item.type === 'folder' && item.fullPath !== dragOverFolderName
          ? dragOverFolderName?.split('/').length ?? 0
          : depth,
      [isDragging, dragOverFolderName, depth, item],
    );

    return (
      <div ref={setDroppableNodeRef}>
        <div
          className={clsx('folder-item', { 'dragging-over': isDraggingOver, dragging: isDragging })}
          ref={setDraggableNodeRef}
          style={style}
        >
          <div
            className={clsx('graph-item', { selected: isSelected })}
            data-contextmenutype={item.type === 'folder' ? 'graph-folder' : 'graph-item'}
            data-graphid={savedGraph?.metadata?.id}
            data-folderpath={item.type === 'folder' ? item.fullPath : item.graph.metadata?.name}
            title={fullPath}
          >
            {range(virtualDepth + 1).map((idx) => {
              const isSpinner = idx === 0 && graphIsRunning;
              const isExpander = idx === virtualDepth && item.type === 'folder' && !isSpinner;
              return (
                <div className="depthSpacer" key={idx}>
                  {isSpinner && (
                    <div className="spinner">
                      <LoadingSpinner />
                    </div>
                  )}
                  {isExpander && (
                    <div className="expander" onClick={() => setExpanded(!isExpanded)}>
                      {isExpanded ? <ArrowDownIcon /> : <ArrowRightIcon />}
                    </div>
                  )}
                </div>
              );
            })}
            <div
              className="graph-item-select"
              onClick={() => (item.type === 'graph' ? onGraphSelected?.(item.graph) : setExpanded(!isExpanded))}
            >
              {isRenaming ? (
                <FolderItemRename value={fullPath.replace(/.*\//, '')} onSaved={handleRenameSaved} />
              ) : (
                <span>{item.name}</span>
              )}
            </div>
            <div className="dragger" {...listeners} {...attributes}>
              <MenuLineIcon />
            </div>
          </div>
          {item.type === 'folder' && (
            <div className={clsx('folder-children', { expanded: isExpanded })}>
              {item.children.map((child) => (
                <FolderItem
                  key={child.type === 'graph' ? child.graph.metadata?.id : child.fullPath}
                  item={child}
                  runningGraphs={runningGraphs}
                  renamingItemFullPath={renamingItemFullPath}
                  graph={graph}
                  onGraphSelected={onGraphSelected}
                  onRenameItem={onRenameItem}
                  dragOverFolderName={dragOverFolderName}
                  depth={virtualDepth + 1}
                  draggingItemFolder={draggingItemFolder}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  },
);

const FolderItemRename: FC<{
  value: string;
  onSaved?: (newName: string) => void;
}> = ({ value, onSaved }) => {
  const [renameValue, setRenameValue] = useState(value);

  const handleRenameFocus = useStableCallback((e: FocusEvent<HTMLInputElement>) => {
    e.target.select();
    e.preventDefault();
  });

  const handleRenameBlur = useStableCallback((e: FocusEvent<HTMLInputElement>) => {
    onSaved?.(renameValue);
  });

  const handleRenameKeyDown = useStableCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSaved?.(renameValue);
    }
  });

  return (
    <TextField
      autoFocus
      onFocus={handleRenameFocus}
      onBlur={handleRenameBlur}
      onKeyDown={handleRenameKeyDown}
      value={renameValue}
      onChange={(e) => setRenameValue((e.target as HTMLInputElement).value)}
    />
  );
};
