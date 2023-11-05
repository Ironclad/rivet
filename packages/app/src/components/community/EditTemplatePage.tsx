import { css } from '@emotion/react';
import { useState, type FC } from 'react';
import { type TemplateVersion, type TemplateResponse } from '../../utils/communityApi';
import Button from '@atlaskit/button';
import CrossIcon from 'majesticons/line/multiply-line.svg?react';

const styles = css`
  display: flex;
  flex-direction: column;
  overflow: hidden;

  > header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

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

  .versions {
    margin-top: 16px;

    .versions-list {
      background: var(--grey-darkish);
      margin-top: 8px;

      .version {
        padding: 8px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid var(--grey-dark);

        .actions {
        }
      }
    }
  }
`;

export const EditTemplatePage: FC<{ template: TemplateResponse; onClose?: () => void }> = ({ template, onClose }) => {
  const [editingVersion, setEditingVersion] = useState<TemplateVersion | null>(null);

  if (editingVersion) {
    return (
      <EditTemplateVersionPage template={template} version={editingVersion} onClose={() => setEditingVersion(null)} />
    );
  }

  return (
    <div css={styles}>
      <header>
        <h1>{template.name}</h1>
        <div className="close">
          <Button appearance="subtle" onClick={onClose}>
            <CrossIcon />
          </Button>
        </div>
      </header>
      <p>Current Version: {template.versions[template.versions.length - 1]?.version}</p>
      <p>Stars: {template.stars}</p>
      <p>Tags: {template.tags.join(',')}</p>
      <p>ID: {template.id}</p>
      <div className="versions">
        <h2>Versions: {template.versions.length}</h2>
        <div className="versions-list">
          {template.versions.map((version) => (
            <div className="version" key={version.version}>
              <div className="info">
                <h3>{version.version}</h3>
                <p>Created: {new Date(version.createdAt).toLocaleDateString()}</p>
                <p>Version Notes: {version.versionDescriptionMarkdown}</p>
              </div>
              <div className="actions">
                <Button appearance="primary" onClick={() => setEditingVersion(version)}>
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

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
`;

export const EditTemplateVersionPage: FC<{
  template: TemplateResponse;
  version: TemplateVersion;
  onClose?: () => void;
}> = ({ template, version, onClose }) => {
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
      <h2>{version.version}</h2>
      <p>Version Notes: {version.versionDescriptionMarkdown}</p>
      <p>Created: {new Date(version.createdAt).toLocaleDateString()}</p>
    </div>
  );
};
