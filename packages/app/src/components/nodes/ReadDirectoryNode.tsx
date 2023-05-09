import { FC } from 'react';
import { useRecoilValue } from 'recoil';
import { lastRunData } from '../../state/dataFlow';
import { css } from '@emotion/react';
import Toggle from '@atlaskit/toggle';
import { openDirectory } from '../../utils/fileIO';
import Button from '@atlaskit/button';
import { ChartNode, PortId, ReadDirectoryNode, expectType } from '@ironclad/nodai-core';

type ReadDirectoryNodeBodyProps = {
  node: ReadDirectoryNode;
};

export const ReadDirectoryNodeBody: FC<ReadDirectoryNodeBodyProps> = ({ node }) => {
  return (
    <div>
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
  node: ReadDirectoryNode;
  onChange?: (node: ChartNode<'readDirectory', ReadDirectoryNode['data']>) => void;
};

export const ReadDirectoryNodeEditor: FC<ReadDirectoryNodeEditorProps> = ({ node, onChange }) => {
  const handleBrowseClick = async () => {
    const directory = await openDirectory();
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
        <Button onClick={handleBrowseClick}>Browse...</Button>
        <div>Current Directory: {node.data.path}</div>
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
          value={node.data.filterGlobs.join(', ')}
          onChange={(e) =>
            onChange?.({
              ...node,
              data: { ...node.data, filterGlobs: e.target.value.split(',').map((s) => s.trim()) },
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
    </div>
  );
};
