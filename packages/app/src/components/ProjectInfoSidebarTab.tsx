import { useMemo, type FC, useState } from 'react';
import { InlineEditableTextfield } from '@atlaskit/inline-edit';
import { ProjectPluginsConfiguration } from './ProjectPluginConfiguration';
import { Field } from '@atlaskit/form';
import Select from '@atlaskit/select';
import { useRecoilState } from 'recoil';
import { projectContextState, projectState, savedGraphsState } from '../state/savedGraphs';
import Button from '@atlaskit/button';
import Modal, { ModalTransition, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@atlaskit/modal-dialog';
import { useToggle } from 'ahooks';
import TextField from '@atlaskit/textfield';
import { DataType, type DataValue } from '@ironclad/rivet-core';
import { produce } from 'immer';
import Toggle from '@atlaskit/toggle';
import { entries } from '../../../core/src/utils/typeSafety';
import { css } from '@emotion/react';

const styles = css`
  .context-list {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .context-list-item {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      padding: 4px 8px;
      border-bottom: 1px solid var(--grey-darkish);
      border-left: 2px solid var(--grey-darkish);

      .info {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .key {
          font-weight: bold;
        }

        .value {
          font-size: 12px;
          color: var(--grey-light);
          font-family: var(--font-family-monospace);
        }
      }

      .actions {
        display: flex;
        flex-direction: row;
        gap: 8px;
      }
    }
  }

  .context-list-actions {
    margin-top: 8px;
  }
`;

type ContextValue = {
  key: string;
  value: DataValue;
  secret: boolean;
};

export const ProjectInfoSidebarTab: FC = () => {
  const [project, setProject] = useRecoilState(projectState);
  const [savedGraphs, setSavedGraphs] = useRecoilState(savedGraphsState);
  const [projectContext, setProjectContext] = useRecoilState(projectContextState(project.metadata.id));

  const [projectEditContextModalOpen, toggleProjectEditContextModalOpen] = useToggle(false);
  const [editContextData, setEditContextData] = useState<ContextValue>();

  const graphOptions = useMemo(
    () => [
      { label: '(None)', value: undefined },
      ...savedGraphs.map((g) => ({ label: g.metadata!.name, value: g.metadata!.id })),
    ],
    [savedGraphs],
  );

  const selectedMainGraph = graphOptions.find((g) => g.value === project.metadata.mainGraphId);

  const setProjectContextValue = ({ key, value, secret }: ContextValue) => {
    setProjectContext((context) => ({
      ...context,
      [key]: {
        value,
        secret,
      },
    }));
    toggleProjectEditContextModalOpen.setLeft();
    setEditContextData(undefined);
  };

  const deleteProjectContextValue = (key: string) => {
    setProjectContext((context) =>
      produce(context, (draft) => {
        delete draft[key];
      }),
    );
    toggleProjectEditContextModalOpen.setLeft();
    setEditContextData(undefined);
  };

  const editContextValue = (value: ContextValue) => {
    setEditContextData(value);
    toggleProjectEditContextModalOpen.setRight();
  };

  const sortedContext = useMemo(() => {
    return entries(projectContext).sort(([a], [b]) => a.localeCompare(b));
  }, [projectContext]);

  return (
    <div css={styles} className="project-info-section">
      <InlineEditableTextfield
        key={`name-${project.metadata.id}`}
        label="Project Name"
        placeholder="Project Name"
        readViewFitContainerWidth
        defaultValue={project.metadata.title}
        onConfirm={(newValue) => setProject({ ...project, metadata: { ...project.metadata, title: newValue } })}
      />

      <InlineEditableTextfield
        key={`description-${project.metadata.id}`}
        label="Description"
        placeholder="Project Description"
        defaultValue={project.metadata?.description ?? ''}
        onConfirm={(newValue) => setProject({ ...project, metadata: { ...project.metadata, description: newValue } })}
        readViewFitContainerWidth
      />

      <Field name="mainGraph" label="Main Graph">
        {() => (
          <Select
            options={graphOptions}
            value={selectedMainGraph}
            onChange={(newValue) => {
              setProject({
                ...project,
                metadata: { ...project.metadata, mainGraphId: newValue?.value ?? undefined },
              });
            }}
          />
        )}
      </Field>

      <ProjectPluginsConfiguration />

      <Field name="context" label="Context">
        {() => (
          <>
            <div className="context-list">
              {sortedContext.map(([key, value]) => (
                <div className="context-list-item" key={key}>
                  <div className="info">
                    <span className="key">{key}</span>
                    <span className="value">{value.secret ? '(Hidden)' : (value.value.value as string)}</span>
                  </div>
                  <div className="actions">
                    <Button
                      appearance="link"
                      onClick={() => editContextValue({ key, value: value.value, secret: value.secret })}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="context-list-actions">
              <Button appearance="default" onClick={toggleProjectEditContextModalOpen.setRight}>
                Add Context Value
              </Button>
            </div>
            <ValueEditorModalRenderer
              isOpen={projectEditContextModalOpen}
              onClose={toggleProjectEditContextModalOpen.setLeft}
              initialKey={editContextData?.key}
              initialValue={editContextData?.value}
              initialSecret={editContextData?.secret}
              onSave={setProjectContextValue}
              onDelete={deleteProjectContextValue}
            />
          </>
        )}
      </Field>
    </div>
  );
};

const ValueEditorModalRenderer: FC<{
  initialKey?: string;
  initialValue?: DataValue;
  initialSecret?: boolean;
  isOpen: boolean;
  onSave: (value: ContextValue) => void;
  onDelete: (key: string) => void;
  onClose: () => void;
}> = ({ initialKey, initialValue, initialSecret, isOpen, onClose, onSave, onDelete }) => {
  return (
    <ModalTransition>
      {isOpen && (
        <ValueEditorModal
          initialKey={initialKey}
          initialValue={initialValue}
          initialSecret={initialSecret}
          onSave={onSave}
          onDelete={onDelete}
          onClose={onClose}
        />
      )}
    </ModalTransition>
  );
};

const ValueEditorModal: FC<{
  initialKey?: string;
  initialValue?: DataValue;
  initialSecret?: boolean;
  onSave: (value: ContextValue) => void;
  onDelete: (key: string) => void;
  onClose: () => void;
}> = ({ initialKey, initialValue, initialSecret, onSave, onDelete, onClose }) => {
  const [key, setKey] = useState(initialKey ?? '');
  const [value, setValue] = useState((initialValue?.value as string | undefined) ?? '');
  const [secret, setSecret] = useState(initialSecret ?? false);

  const handleDelete = () => {
    if (!key) {
      onClose();
    } else {
      onDelete(key);
    }
  };

  const handleSave = () => {
    const dataValue: DataValue = {
      type: 'string',
      value,
    };
    onSave({ key, value: dataValue, secret });
  };

  return (
    <Modal onClose={onClose}>
      <ModalHeader>
        <ModalTitle>Edit Context Value</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <p>
            Context values are accessible in any graph in the project. They can be used to store secrets or other
            configuration values. A <strong>Context Node</strong> can retrieve a value from the context. Context values
            here are not stored with the project file, but are stored the Rivet IDE.
          </p>
          <Field name="key" label="ID">
            {() => (
              <TextField
                placeholder="Context ID"
                value={key}
                onChange={(e) => setKey((e.target as HTMLInputElement).value)}
                isDisabled={initialKey != null}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSave();
                  }
                }}
              />
            )}
          </Field>
          <Field name="value" label="Value">
            {() => (
              <TextField
                placeholder="Value"
                type={secret ? 'password' : 'text'}
                value={value}
                onChange={(e) => setValue((e.target as HTMLInputElement).value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSave();
                  }
                }}
              />
            )}
          </Field>
          <Field name="secret" label="Secret Value (Hidden in UI)">
            {() => (
              <Toggle
                isChecked={secret}
                onChange={(e) => setSecret(e.target.checked)}
                label="Secret Value (Hidden in UI)"
                size="large"
              ></Toggle>
            )}
          </Field>
        </form>
      </ModalBody>
      <ModalFooter>
        <div
          css={css`
            display: flex;
            flex-direction: row;
            justify-content: flex-end;
            gap: 8px;
          `}
        >
          <Button appearance="default" onClick={onClose}>
            Cancel
          </Button>
          {initialKey && (
            <Button appearance="danger" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <Button appearance="primary" onClick={handleSave}>
            Save
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};
