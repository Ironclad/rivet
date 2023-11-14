import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { css } from '@emotion/react';
import {
  type CSSProperties,
  type FC,
  useState,
  useMemo,
  type FocusEvent,
  type MouseEvent,
  type KeyboardEvent,
  memo,
} from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { graphState } from '../state/graph.js';
import { projectMetadataState, savedGraphsState } from '../state/savedGraphs.js';
import { orderBy, range } from 'lodash-es';
import { DropdownItem } from '@atlaskit/dropdown-menu';
import { useDeleteGraph } from '../hooks/useDeleteGraph.js';
import { useLoadGraph } from '../hooks/useLoadGraph.js';
import { type GraphId, emptyNodeGraph, type NodeGraph } from '@ironclad/rivet-core';
import clsx from 'clsx';
import { LoadingSpinner } from './LoadingSpinner.js';
import { runningGraphsState } from '../state/dataFlow.js';
import { useDuplicateGraph } from '../hooks/useDuplicateGraph.js';
import { useContextMenu } from '../hooks/useContextMenu.js';
import Portal from '@atlaskit/portal';
import ArrowRightIcon from 'majesticons/line/arrow-right-line.svg?react';
import ArrowDownIcon from 'majesticons/line/arrow-down-line.svg?react';
import MenuLineIcon from 'majesticons/line/menu-line.svg?react';
import CrossIcon from 'majesticons/line/multiply-line.svg?react';
import { toast } from 'react-toastify';
import { useStableCallback } from '../hooks/useStableCallback.js';
import TextField from '@atlaskit/textfield';
import { useFuseSearch } from '../hooks/useFuseSearch';
import { useImportGraph } from '../hooks/useImportGraph';
import { expandedFoldersState } from '../state/ui';

const styles = css`
  display: flex;
  flex-direction: column;
  flex-shrink: 1;
  min-height: 100%;

  .graph-list-container {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
  }

  .graph-list {
    overflow-y: auto;
    overflow-x: hidden;
    flex: 1 1 auto;
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
    flex-grow: 1;
  }

  .dragging-over {
    background: var(--grey-darkish);
  }

  .dragging {
    opacity: 0.5;
  }

  .search {
    position: relative;

    input {
      width: 100%;
      font-size: 12px;
      background: var(--grey-darkerish);
      border: 0;
      border-bottom: 1px solid var(--grey);
      padding: 8px 16px;

      &:focus {
        outline: 0;
        border-bottom: 1px solid var(--primary);
      }
    }

    .clear {
      position: absolute;
      right: 8px;
      top: 6px;
      width: 20px;
      height: 20px;
      background: var(--grey);
      border: 1px solid var(--grey-dark);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;

      &:hover {
        background: var(--grey-lightish);
      }

      svg {
        width: 12px;
        height: 12px;
      }
    }
  }
`;

const contextMenuStyles = css`
  border: 1px solid var(--grey);
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
  background: var(--grey-dark);
  min-width: max-content;

  > button span {
    // This fixes a bug in Ubuntu where the text is missing
    overflow-x: visible !important;
  }
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

export const GraphList: FC<{ onRunGraph?: (graphId: GraphId) => void }> = memo(({ onRunGraph }) => {
  const projectMetadata = useRecoilValue(projectMetadataState);
  const [graph, setGraph] = useRecoilState(graphState);
  const [savedGraphs, setSavedGraphs] = useRecoilState(savedGraphsState);
  const [searchText, setSearchText] = useState('');

  const searchedGraphs = useFuseSearch(
    savedGraphs,
    searchText,
    ['metadata.name' as keyof NodeGraph, 'metadata.description' as keyof NodeGraph],
    {},
  );
  const filteredGraphs = useMemo(() => searchedGraphs.map((g) => g.item), [searchedGraphs]);

  // Track the graph that is being renamed, so that we can update the name when the user is done.
  const [renamingItemFullPath, setRenamingItemFullPath] = useState<string | undefined>();

  const [draggingItemFullPath, setDraggingItemFullPath] = useState<string | undefined>();
  const draggingItemFolder = draggingItemFullPath?.split('/').slice(0, -1).join('/');

  // Track folders on deletion or creation, so that empty folders aren't automatically deleted.
  const [folderNames, setFolderNames] = useState<string[]>([]);

  const folderedGraphs = useMemo(
    () => createFoldersFromGraphs(filteredGraphs, folderNames),
    [filteredGraphs, folderNames],
  );

  const runningGraphs = useRecoilValue(runningGraphsState);

  const deleteGraph = useDeleteGraph();
  const loadGraph = useLoadGraph();

  const duplicateGraph = useDuplicateGraph();
  const importGraph = useImportGraph();

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

  const setExpandedFolders = useSetRecoilState(expandedFoldersState);

  const handleNewFolder = useStableCallback((parentPath?: string) => {
    const newFolderPath = parentPath ? `${parentPath}/New Folder` : 'New Folder';
    setFolderNames((prev) => [...prev, newFolderPath]);
    startRename(newFolderPath);
    setExpandedFolders((prev) => ({
      ...prev,
      [`${projectMetadata.id}/${newFolderPath}`]: true,
    }));
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

  const runGraph = useStableCallback((folderName: string) => {
    const graph = savedGraphs.find((graph) => graph.metadata?.name === folderName);
    if (graph) {
      onRunGraph?.(graph.metadata!.id!);
    }
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
    setExpandedFolders((prev) => ({
      ...prev,
      [`${projectMetadata.id}/${newFullPath}`]: prev[`${projectMetadata.id}/${fullPath}`] ?? false,
    }));
  });

  const handleDragStart = useStableCallback((drag: DragStartEvent) => {
    const activeFullPath = drag.active?.id as string;
    setDraggingItemFullPath(activeFullPath);
  });

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

  const handleDragOver = useStableCallback((dragOver: DragOverEvent) => {
    const overFullPath = dragOver.over?.id as string;
    if (overFullPath == null) {
      setDragOverFolderName(undefined);
    } else {
      setDragOverFolderName(overFullPath.indexOf('/') > 0 ? overFullPath.replace(/\/[^/]*$/, '') : '');
    }
  });

  const { setShowContextMenu, showContextMenu, contextMenuData, handleContextMenu, floatingStyles, refs } =
    useContextMenu();
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

  const handleSearchKeyDown = useStableCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSearchText('');
      (e.target as HTMLElement).blur();
    }
  });

  return (
    <div css={styles}>
      <div className="search">
        <input
          autoComplete="off"
          spellCheck={false}
          type="text"
          placeholder="Search..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
        {searchText.length > 0 && (
          <button className="clear" onClick={() => setSearchText('')}>
            <CrossIcon />
          </button>
        )}
      </div>
      <div className="graph-list-container" onContextMenu={handleSidebarContextMenu}>
        <div
          className={clsx('graph-list', { 'dragging-over': dragOverFolderName === '' && draggingItemFolder !== '' })}
        >
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
                className="graph-item-context-menu-pos"
                ref={refs.setReference}
                style={{
                  zIndex: 500,
                  position: 'absolute',
                  left: contextMenuData.x,
                  top: contextMenuData.y,
                }}
              >
                <div
                  className="graph-item-context-menu"
                  css={contextMenuStyles}
                  style={floatingStyles}
                  ref={refs.setFloating}
                >
                  <DropdownItem
                    onClick={() => {
                      runGraph(selectedFolderNameForContextMenu!);
                      setShowContextMenu(false);
                    }}
                  >
                    Run
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => {
                      startRename(selectedFolderNameForContextMenu!);
                      setShowContextMenu(false);
                    }}
                  >
                    Rename Graph
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => {
                      duplicateGraph(selectedGraphForContextMenu!);
                      setShowContextMenu(false);
                    }}
                  >
                    Duplicate
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => {
                      handleDelete(selectedGraphForContextMenu!);
                      setShowContextMenu(false);
                    }}
                  >
                    Delete
                  </DropdownItem>
                </div>
              </div>
            )}
            {showContextMenu && contextMenuData.data?.type === 'graph-folder' && (
              <div
                className="graph-item-context-menu-pos"
                ref={refs.setReference}
                style={{
                  zIndex: 500,
                  position: 'absolute',
                  left: contextMenuData.x,
                  top: contextMenuData.y,
                }}
              >
                <div
                  className="graph-item-context-menu"
                  css={contextMenuStyles}
                  style={floatingStyles}
                  ref={refs.setFloating}
                >
                  <DropdownItem
                    onClick={() => {
                      startRename(selectedFolderNameForContextMenu!);
                      setShowContextMenu(false);
                    }}
                  >
                    Rename Folder
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => {
                      handleNew(selectedFolderNameForContextMenu!);
                      setShowContextMenu(false);
                    }}
                  >
                    New Graph
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => {
                      handleNewFolder(selectedFolderNameForContextMenu!);
                      setShowContextMenu(false);
                    }}
                  >
                    New Folder
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => {
                      handleDeleteFolder(selectedFolderNameForContextMenu!);
                      setShowContextMenu(false);
                    }}
                  >
                    Delete
                  </DropdownItem>
                </div>
              </div>
            )}
          </Portal>
        </div>
        <Portal>
          {showContextMenu && contextMenuData.data?.type === 'graph-list' && (
            <div
              className="graph-list-context-menu-pos"
              ref={refs.setReference}
              style={{
                position: 'absolute',
                zIndex: 500,
                left: contextMenuData.x,
                top: contextMenuData.y,
              }}
            >
              <div
                className="graph-list-context-menu"
                css={contextMenuStyles}
                style={floatingStyles}
                ref={refs.setFloating}
              >
                <DropdownItem
                  onClick={() => {
                    handleNew();
                    setShowContextMenu(false);
                  }}
                >
                  New Graph
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    handleNewFolder();
                    setShowContextMenu(false);
                  }}
                >
                  New Folder
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    importGraph();
                    setShowContextMenu(false);
                  }}
                >
                  Import Graph...
                </DropdownItem>
              </div>
            </div>
          )}
        </Portal>
      </div>
    </div>
  );
});

GraphList.displayName = 'GraphList';

// Allows the bottom of the list to be a drop target
export const GraphListSpacer: FC = memo(() => {
  const { setNodeRef: setDroppableNodeRef } = useDroppable({ id: '/' });
  return <div className="graph-list-spacer" ref={setDroppableNodeRef} />;
});

GraphListSpacer.displayName = 'GraphListSpacer';

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
    const projectMetadata = useRecoilValue(projectMetadataState);
    const [expandedFolders, setExpandedFolders] = useRecoilState(expandedFoldersState);

    const savedGraph = item.type === 'graph' ? item.graph : undefined;
    const graphIsRunning = savedGraph && runningGraphs.includes(savedGraph.metadata?.id ?? ('' as GraphId));
    const fullPath = item.type === 'folder' ? item.fullPath : item.graph.metadata?.name ?? 'Untitled Graph';
    const isExpanded = expandedFolders[`${projectMetadata.id}/${fullPath}`] ?? true; // Default open

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

    const setExpanded = useStableCallback((expanded: boolean) => {
      setExpandedFolders((prev) => ({
        ...prev,
        [`${projectMetadata.id}/${fullPath}`]: expanded,
      }));
    });

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

FolderItem.displayName = 'FolderItem';

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
