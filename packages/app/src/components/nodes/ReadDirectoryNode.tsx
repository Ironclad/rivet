import { type FC } from 'react';
import { css } from '@emotion/react';
import Toggle from '@atlaskit/toggle';
import Button from '@atlaskit/button';
import { type ChartNode, type Outputs, type PortId, type ReadDirectoryNode, expectType } from '@ironclad/rivet-core';
import { type NodeComponentDescriptor } from '../../hooks/useNodeTypes.js';
import { ioProvider } from '../../utils/globals.js';

export const ReadDirectoryNodeOutput: FC<{ outputs: Outputs }> = ({ outputs }) => {
  const outputPaths = expectType(outputs['paths' as PortId], 'string[]');
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
  node: ReadDirectoryNode;
  onChange?: (node: ChartNode<'readDirectory', ReadDirectoryNode['data']>) => void;
};

export const ReadDirectoryNodeEditor: FC<ReadDirectoryNodeEditorProps> = ({ node, onChange }) => {
  const handleBrowseClick = async () => {
    const directory = await ioProvider.openDirectory();
    if (directory) {
      onChange?.({
        ...node,
        data: { ...node.data, path: directory as string },
      });
    }
  };

  return (
    <div css={container}>
      <div className="row">
        <label className="label" htmlFor="baseDirectory">
          Pick Directory
        </label>
        <div>
          <Button onClick={handleBrowseClick}>Browse...</Button>
          <div>Current Directory: {node.data.path}</div>
        </div>
        <Toggle
          id="usePathInput"
          isChecked={node.data.usePathInput}
          onChange={() =>
            onChange?.({
              ...node,
              data: { ...node.data, usePathInput: !node.data.usePathInput },
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
          isChecked={node.data.recursive}
          onChange={(e) => onChange?.({ ...node, data: { ...node.data, recursive: e.target.checked } })}
        />
        <Toggle
          id="useRecursiveInput"
          isChecked={node.data.useRecursiveInput}
          onChange={(e) =>
            onChange?.({
              ...node,
              data: { ...node.data, useRecursiveInput: e.target.checked },
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
          isChecked={node.data.includeDirectories}
          onChange={(e) =>
            onChange?.({
              ...node,
              data: { ...node.data, includeDirectories: e.target.checked },
            })
          }
        />
        <Toggle
          id="useIncludeDirectoriesInput"
          isChecked={node.data.useIncludeDirectoriesInput}
          onChange={(e) =>
            onChange?.({
              ...node,
              data: { ...node.data, useIncludeDirectoriesInput: e.target.checked },
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
          isChecked={node.data.relative}
          onChange={(e) =>
            onChange?.({
              ...node,
              data: { ...node.data, relative: e.target.checked },
            })
          }
        />
        <Toggle
          id="useRelativeInput"
          isChecked={node.data.useRelativeInput}
          onChange={(e) =>
            onChange?.({
              ...node,
              data: { ...node.data, useRelativeInput: e.target.checked },
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
          value={node.data.filterGlobs[0]}
          onChange={(e) =>
            onChange?.({
              ...node,
              data: { ...node.data, filterGlobs: [e.target.value] },
            })
          }
        />
        <Toggle
          id="useFilterGlobsInput"
          isChecked={node.data.useFilterGlobsInput}
          onChange={(e) =>
            onChange?.({
              ...node,
              data: { ...node.data, useFilterGlobsInput: e.target.checked },
            })
          }
        />
      </div>
      <div className="row">
        <label className="label" htmlFor="ignores">
          Excludes (comma separated)
        </label>
        <input
          id="ignores"
          className="input"
          type="text"
          value={node.data.ignores?.join(',') ?? ''}
          onChange={(e) =>
            onChange?.({
              ...node,
              data: { ...node.data, ignores: e.target.value.split(',').map((s) => s.trim()) },
            })
          }
        />
        <Toggle
          id="useIgnoresInput"
          isChecked={node.data.useIgnoresInput}
          onChange={(e) =>
            onChange?.({
              ...node,
              data: { ...node.data, useIgnoresInput: e.target.checked },
            })
          }
        />
      </div>
    </div>
  );
};

export const readDirectoryNodeDescriptor: NodeComponentDescriptor<'readDirectory'> = {
  OutputSimple: ReadDirectoryNodeOutput,
  Editor: ReadDirectoryNodeEditor,
};
