import { css } from '@emotion/react';
import { useState, type FC, useMemo } from 'react';
import {
  type TemplateVersion,
  type TemplateResponse,
  unpublishTemplateResponseChecker,
} from '../../utils/communityApi';
import Button from '@atlaskit/button';
import CrossIcon from 'majesticons/line/multiply-line.svg?react';
import { EditTemplateVersionPage } from './EditTemplateVersionPage';
import TextField from '@atlaskit/textfield';
import { Field } from '@atlaskit/form';
import Modal, { ModalTransition, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@atlaskit/modal-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCommunity } from '../../utils/getCommunityApi';
import { toast } from 'react-toastify';
import { getError } from '@ironclad/rivet-core';
import { CreateTemplateVersionPage } from './CreateTemplateVersionPage';
import { orderBy } from 'lodash-es';
import { useMarkdown } from '../../hooks/useMarkdown';

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

    > header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      h4 {
        margin: 0;
      }

      .actions {
        display: flex;
        gap: 8px;
      }
    }

    .versions-list {
      background: var(--grey-darkish);
      margin-top: 8px;

      .version {
        padding: 8px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid var(--grey-dark);
        gap: 16px;

        .info {
          display: flex;
          align-items: center;
          gap: 4px;
          flex: 1;

          h3 {
            margin: 0;
          }
        }

        .left {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 150px;

          p {
            margin: 0;
          }
        }

        .actions {
        }
      }
    }
  }

  .template-info {
    flex: 1;
    overflow: auto;
    min-height: 0;

    > .actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      margin-top: 16px;

      button {
        margin-left: 8px;
      }
    }
  }

  .description-latest {
    border: 1px solid var(--grey);
    padding: 16px;
    margin-top: 16px;
    background: var(--grey-darkerish);
    border-radius: 4px;
  }

  .version-description {
    border: 1px solid var(--grey);
    padding: 8px;
    border-radius: 4px;
    flex: 1;
  }
`;

export const EditTemplatePage: FC<{ template: TemplateResponse; onClose?: () => void }> = ({ template, onClose }) => {
  const [editingVersion, setEditingVersion] = useState<string | null>(null);
  const [unpublishModalOpen, setUnpublishModalOpen] = useState(false);
  const [creatingVersion, setCreatingVersion] = useState(false);

  const sortedVersions = useMemo(() => orderBy(template.versions, (v) => v.createdAt, 'desc'), [template.versions]);

  const latestDescription = useMarkdown(template.versions.at(-1)?.descriptionMarkdown ?? '');

  if (editingVersion) {
    return (
      <EditTemplateVersionPage
        template={template}
        version={template.versions.find((v) => v.version === editingVersion)!}
        onClose={() => setEditingVersion(null)}
      />
    );
  }

  if (creatingVersion) {
    return <CreateTemplateVersionPage template={template} onClose={() => setCreatingVersion(false)} />;
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
      <div className="template-info">
        <p>Current Version: {template.versions[template.versions.length - 1]?.version}</p>
        <p>Stars: {template.stars}</p>
        <p>Tags: {template.tags.join(',')}</p>
        <p>ID: {template.id}</p>
        <div className="description-latest" dangerouslySetInnerHTML={latestDescription} />
        <div className="versions">
          <header>
            <h2>Versions: {template.versions.length}</h2>
            <div className="actions">
              <Button appearance="primary" onClick={() => setCreatingVersion(true)}>
                Upload Current Project As New Version
              </Button>
            </div>
          </header>
          <div className="versions-list">
            {sortedVersions.map((version) => (
              <VersionListItem
                key={version.version}
                version={version}
                onEdit={() => setEditingVersion(version.version)}
              />
            ))}
          </div>
        </div>
        <div className="actions">
          <Button appearance="danger" onClick={() => setUnpublishModalOpen(true)}>
            Unpublish
          </Button>
        </div>
        <UnpublishTemplateModal
          isOpen={unpublishModalOpen}
          template={template}
          onClose={() => setUnpublishModalOpen(false)}
          onDelete={() => {
            setUnpublishModalOpen(false);
            onClose?.();
          }}
        />
      </div>
    </div>
  );
};

const VersionListItem: FC<{ version: TemplateVersion; onEdit: () => void }> = ({ version, onEdit }) => {
  const description = useMarkdown(version.versionDescriptionMarkdown);

  return (
    <div className="version" key={version.version}>
      <div className="info">
        <div className="left">
          <h3>{version.version}</h3>
          <span className="pill">{new Date(version.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="version-description" dangerouslySetInnerHTML={description}></div>
      </div>
      <div className="actions">
        <Button appearance="default" onClick={onEdit}>
          Edit
        </Button>
      </div>
    </div>
  );
};

const UnpublishTemplateModal: FC<{
  isOpen: boolean;
  template: TemplateResponse;
  onDelete?: (templateId: string) => void;
  onClose?: () => void;
}> = ({ isOpen, template, onDelete, onClose }) => {
  const [name, setName] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ templateId }: { templateId: string }) => {
      const { success } = await fetchCommunity(`/templates/${templateId}`, unpublishTemplateResponseChecker, {
        method: 'DELETE',
      });
      return success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-templates'] });
    },
  });

  const doDelete = async () => {
    if (name === template.name) {
      try {
        await mutation.mutateAsync({ templateId: template.id });
        onDelete?.(template.id);
      } catch (err) {
        toast.error(`Failed to unpublish template: ${getError(err).toString()}`);
      }
    }
  };

  return (
    <ModalTransition>
      {isOpen && (
        <Modal onClose={onClose}>
          <ModalHeader>
            <ModalTitle>Unpublish Template</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <div
              css={css`
                code {
                  background: var(--grey-dark);
                  color: var(--grey-light);
                  padding: 4px 8px;
                  border-radius: 4px;
                }
              `}
            >
              <p>Are you sure you want to unpublish {template.name}?</p>
              <p>
                This will remove it from the community template list. It will not remove it from any projects that have
                already used it.
              </p>
              <p>
                To confirm, type <code>{template.name}</code> below:
              </p>
              <Field name="name" label="Template Name">
                {() => (
                  <TextField
                    autoFocus
                    value={name}
                    onChange={(e) => setName((e.target as HTMLInputElement).value)}
                    placeholder="Template Name"
                    autoComplete="off"
                    isDisabled={mutation.isPending}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        doDelete();
                      }
                    }}
                  />
                )}
              </Field>
            </div>
          </ModalBody>
          <ModalFooter>
            <div className="actions">
              <Button appearance="subtle" onClick={onClose} isDisabled={mutation.isPending}>
                Cancel
              </Button>
              <Button appearance="danger" onClick={doDelete} isDisabled={mutation.isPending}>
                Unpublish
              </Button>
            </div>
          </ModalFooter>
        </Modal>
      )}
    </ModalTransition>
  );
};
