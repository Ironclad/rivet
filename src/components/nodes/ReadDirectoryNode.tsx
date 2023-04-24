import { FC } from 'react';
import { ReadDirectoryNode } from '../../model/nodes/ReadDirectoryNode';
import { ChartNode } from '../../model/NodeBase';
import { RenderDataValue } from '../RenderDataValue';
import { PortId } from '../../model/NodeBase';
import { useRecoilValue } from 'recoil';
import { lastRunData } from '../../state/dataFlow';
import { css } from '@emotion/react';
import Toggle from '@atlaskit/toggle';
import { assertBaseDir } from '../../model/native/BaseDir';
import { expectType } from '../../model/DataValue';

type ReadDirectoryNodeBodyProps = {
  node: ReadDirectoryNode;
};

export const ReadDirectoryNodeBody: FC<ReadDirectoryNodeBodyProps> = ({ node }) => {
  return (
    <div>
      <div>Base Directory: {node.data.useBaseDirectoryInput ? '(Input)' : node.data.baseDirectory}</div>
      <div>Path: {node.data.usePathInput ? '(Input)' : node.data.path}</div>
      <div>Recursive: {node.data.useRecursiveInput ? '(Input)' : node.data.recursive ? 'Yes' : 'No'}</div>
      <div>
        Include Directories:{' '}
        {node.data.useIncludeDirectoriesInput ? '(Input)' : node.data.includeDirectories ? 'Yes' : 'No'}
      </div>
      <div>Relative: {node.data.useRelativeInput ? '(Input)' : node.data.relative ? 'Yes' : 'No'}</div>
      <div>
        Filters:{' '}
        {node.data.useFilterGlobsInput
          ? '(Input)'
          : node.data.filterGlobs.length > 0
          ? node.data.filterGlobs.join(', ')
          : 'None'}
      </div>
    </div>
  );
};

export const ReadDirectoryNodeOutput: FC<ReadDirectoryNodeBodyProps> = ({ node }) => {
  const output = useRecoilValue(lastRunData(node.id));

  if (!output) {
    return null;
  }

  if (output.status?.type === 'error') {
    return <div>Error: {output.status.error}</div>;
  }

  if (!output.outputData) {
    return null;
  }

  const outputPaths = expectType(output.outputData['paths' as PortId], 'string[]');
  return (
    <div>
      {outputPaths.length === 0 ? (
        <div>No files found</div>
      ) : (
        <div>
          {outputPaths.map((path) => (
            <div key={path}>{path}</div>
          ))}
        </div>
      )}
    </div>
  );
};

const container = css`
  font-family: 'Roboto', sans-serif;
  color: var(--foreground);
  background-color: var(--grey-darker);

  display: grid;
  grid-template-columns: auto 1fr auto;
  row-gap: 16px;
  column-gap: 32px;
  align-items: center;
  grid-auto-rows: 40px;

  .row {
    display: contents;
  }

  .label {
    font-weight: 500;
    color: var(--foreground);
  }

  .input {
    padding: 6px 12px;
    background-color: var(--grey-darkish);
    border: 1px solid var(--grey);
    border-radius: 4px;
    color: var(--foreground);
    outline: none;
    transition: border-color 0.3s;

    &:hover {
      border-color: var(--primary);
    }
  }

  .checkbox-input {
    margin-left: 8px;
    cursor: pointer;

    &:hover {
      opacity: 0.8;
    }
  }
`;

export type ReadDirectoryNodeEditorProps = {
  node: ChartNode;
  onChange?: (node: ChartNode<'readDirectory', ReadDirectoryNode['data']>) => void;
};

export const ReadDirectoryNodeEditor: FC<ReadDirectoryNodeEditorProps> = ({ node, onChange }) => {
  const readDirectoryNode = node as ReadDirectoryNode;

  return (
    <div css={container}>
      <div className="row">
        <label className="label" htmlFor="baseDirectory">
          Base Directory
        </label>
        <input
          id="baseDirectory"
          className="input"
          type="text"
          value={readDirectoryNode.data.baseDirectory}
          onChange={(e) => {
            const baseDir = e.target.value;
            assertBaseDir(baseDir);
            onChange?.({ ...readDirectoryNode, data: { ...readDirectoryNode.data, baseDirectory: baseDir } });
          }}
        />
        <Toggle
          id="useBaseDirectoryInput"
          isChecked={readDirectoryNode.data.useBaseDirectoryInput}
          onChange={(e) =>
            onChange?.({
              ...readDirectoryNode,
              data: { ...readDirectoryNode.data, useBaseDirectoryInput: e.target.checked },
            })
          }
        />
      </div>
      <div className="row">
        <label className="label" htmlFor="path">
          Path
        </label>
        <input
          id="path"
          className="input"
          type="text"
          value={readDirectoryNode.data.path}
          onChange={(e) =>
            onChange?.({ ...readDirectoryNode, data: { ...readDirectoryNode.data, path: e.target.value } })
          }
        />
        <Toggle
          id="usePathInput"
          isChecked={readDirectoryNode.data.usePathInput}
          onChange={(e) =>
            onChange?.({
              ...readDirectoryNode,
              data: { ...readDirectoryNode.data, usePathInput: e.target.checked },
            })
          }
        />
      </div>
      <div className="row">
        <label className="label" htmlFor="recursive">
          Recursive
        </label>
        <Toggle
          id="recursive"
          isChecked={readDirectoryNode.data.recursive}
          onChange={(e) =>
            onChange?.({ ...readDirectoryNode, data: { ...readDirectoryNode.data, recursive: e.target.checked } })
          }
        />
        <Toggle
          id="useRecursiveInput"
          isChecked={readDirectoryNode.data.useRecursiveInput}
          onChange={(e) =>
            onChange?.({
              ...readDirectoryNode,
              data: { ...readDirectoryNode.data, useRecursiveInput: e.target.checked },
            })
          }
        />
      </div>
      <div className="row">
        <label className="label" htmlFor="includeDirectories">
          Include Directories
        </label>
        <Toggle
          id="includeDirectories"
          isChecked={readDirectoryNode.data.includeDirectories}
          onChange={(e) =>
            onChange?.({
              ...readDirectoryNode,
              data: { ...readDirectoryNode.data, includeDirectories: e.target.checked },
            })
          }
        />
        <Toggle
          id="useIncludeDirectoriesInput"
          isChecked={readDirectoryNode.data.useIncludeDirectoriesInput}
          onChange={(e) =>
            onChange?.({
              ...readDirectoryNode,
              data: { ...readDirectoryNode.data, useIncludeDirectoriesInput: e.target.checked },
            })
          }
        />
      </div>
      <div className="row">
        <label className="label" htmlFor="relative">
          Relative
        </label>
        <Toggle
          id="relative"
          isChecked={readDirectoryNode.data.relative}
          onChange={(e) =>
            onChange?.({
              ...readDirectoryNode,
              data: { ...readDirectoryNode.data, relative: e.target.checked },
            })
          }
        />
        <Toggle
          id="useRelativeInput"
          isChecked={readDirectoryNode.data.useRelativeInput}
          onChange={(e) =>
            onChange?.({
              ...readDirectoryNode,
              data: { ...readDirectoryNode.data, useRelativeInput: e.target.checked },
            })
          }
        />
      </div>
      <div className="row">
        <label className="label" htmlFor="filterGlobs">
          Filter Glob
        </label>
        <input
          id="filterGlobs"
          className="input"
          type="text"
          value={readDirectoryNode.data.filterGlobs.join(', ')}
          onChange={(e) =>
            onChange?.({
              ...readDirectoryNode,
              data: { ...readDirectoryNode.data, filterGlobs: e.target.value.split(',').map((s) => s.trim()) },
            })
          }
        />
        <Toggle
          id="useFilterGlobsInput"
          isChecked={readDirectoryNode.data.useFilterGlobsInput}
          onChange={(e) =>
            onChange?.({
              ...readDirectoryNode,
              data: { ...readDirectoryNode.data, useFilterGlobsInput: e.target.checked },
            })
          }
        />
      </div>
    </div>
  );
};
