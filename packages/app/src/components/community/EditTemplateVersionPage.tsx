import Button from '@atlaskit/button';
import { css } from '@emotion/react';
import { useState, type FC, Suspense } from 'react';
import { type TemplateResponse, type TemplateVersion } from '../../utils/communityApi';
import CrossIcon from 'majesticons/line/multiply-line.svg?react';
import { Field } from '@atlaskit/form';
import { LazyCodeEditor } from '../LazyComponents';
import prettyBytes from 'pretty-bytes';

const versionStyles = css`
  display: flex;
  flex-direction: column;
  overflow: hidden;

  > header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    button {
      padding: 0;

      span {
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }

  .actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-top: 16px;

    button {
      margin-left: 8px;
    }
  }

  .code-editor-container {
    position: relative;
    height: 400px;
    display: flex;
    flex-direction: column;
    padding-right: 100px;

    .editor-container {
      flex: 1;
    }
  }

  .form {
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;
    background: rgba(255, 255, 255, 0.05);
    padding: 16px;
    margin-top: 16px;
  }

  .pill {
    padding: 4px 8px;
    background: var(--grey-light);
    color: var(--grey-darker);
    border-radius: 8px;
  }

  .pill + .pill {
    margin-left: 4px;
  }

  .pill.warning {
    background: var(--warning);
    color: var(--grey-darker);
  }
`;

export const EditTemplateVersionPage: FC<{
  template: TemplateResponse;
  version: TemplateVersion;
  onClose?: () => void;
}> = ({ template, version, onClose }) => {
  const [description, setDescription] = useState(version.descriptionMarkdown);
  const [versionNotes, setVersionNotes] = useState(version.versionDescriptionMarkdown);

  return (
    <div css={versionStyles}>
      <header>
        <h1>{template.name}</h1>
        <div className="close">
          <Button appearance="subtle" onClick={onClose}>
            <CrossIcon />
          </Button>
        </div>
      </header>

      <div className="form">
        <h2>{version.version}</h2>
        <p>
          <span className="pill">Created: {new Date(version.createdAt).toLocaleDateString()}</span>
          {version.hasMainGraph && <span className="pill">Has Main Graph</span>}
          {version.canBeNode && <span className="pill">Can Be Node</span>}
          {version.includesCodeNodes && <span className="pill warning">Includes Code Nodes</span>}
          <span className="pill">{version.numNodes} Nodes</span>
          <span className="pill">{prettyBytes(version.sizeBytes)}</span>
        </p>
        <p>
          <strong>Graphs Included:</strong>
          <ul>
            {version.graphNames.map((graph) => (
              <li key={graph}>{graph}</li>
            ))}
          </ul>
        </p>
        <p>
          <strong>Inputs:{version.inputs.length === 0 ? ' None' : ''}</strong>
          <ul>
            {version.inputs.map((input) => (
              <li key={input}>{input}</li>
            ))}
          </ul>
        </p>
        <p>
          <strong>Outputs:{version.outputs.length === 0 ? ' None' : ''}</strong>
          <ul>
            {version.outputs.map((output) => (
              <li key={output}>{output}</li>
            ))}
          </ul>
        </p>
        <p>
          <strong>Plugins:{version.plugins.length === 0 ? ' None' : ''}</strong>
          <ul>
            {version.plugins.map((plugin) => (
              <li key={plugin}>{plugin}</li>
            ))}
          </ul>
        </p>
        <Field name="version-notes" label="Version Notes">
          {() => (
            <div className="code-editor-container" style={{ height: 125 }}>
              <Suspense fallback={<div />}>
                <LazyCodeEditor text={versionNotes} onChange={(value) => setVersionNotes(value)} language="markdown" />
              </Suspense>
            </div>
          )}
        </Field>
        <Field name="description" label="Description">
          {() => (
            <div className="code-editor-container">
              <Suspense fallback={<div />}>
                <LazyCodeEditor text={description} onChange={(value) => setDescription(value)} language="markdown" />
              </Suspense>
            </div>
          )}
        </Field>
        <div className="actions">
          <Button appearance="danger">Unpublish</Button>
          <Button appearance="primary">Save</Button>
        </div>
      </div>
    </div>
  );
};
