import { Field, HelperMessage } from '@atlaskit/form';
import TextField from '@atlaskit/textfield';
import Toggle from '@atlaskit/toggle';
import { type GraphId } from '@ironclad/rivet-core';
import clsx from 'clsx';
import { orderBy } from 'lodash-es';
import React, { Suspense, useMemo, useState, type FC } from 'react';
import { useRecoilValue } from 'recoil';
import { projectState } from '../../state/savedGraphs';
import { LazyCodeEditor } from '../LazyComponents';
import { css } from '@emotion/react';
import Button from '@atlaskit/button';

const styles = css`
  .graphs-to-include {
    display: flex;
    flex-direction: column;
    gap: 4px;

    max-height: 200px;
    overflow: auto;
    margin: 0 64px;

    .graph {
      border-bottom: 1px solid var(--grey);
      padding: 4px 0;
      cursor: pointer;
      user-select: none;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      &:hover {
        background: var(--grey);
      }

      &:not(.active) {
        opacity: 0.5;
      }
    }
  }

  .description-editor {
    height: 200px;
    position: relative;
    margin-right: 64px;

    > .editor-container {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 32px;
  }
`;

export const CreateTemplateForm: FC<{
  onCreate?: (templateInfo: {
    templateName: string;
    version: string;
    graphsToInclude: GraphId[];
    description: string;
  }) => void;
}> = ({ onCreate }) => {
  const project = useRecoilValue(projectState);

  const [templateName, setTemplateName] = useState<string>(project.metadata.title);
  const [version, setVersion] = useState<string>('0.1.0');
  const [graphsToInclude, setGraphsToInclude] = useState<GraphId[]>(
    Object.values(project.graphs).map((g) => g.metadata!.id!),
  );
  const [description, setDescription] = useState<string>(project.metadata.description);

  const toggleGraph = (graphId: GraphId) => {
    setGraphsToInclude((prev) => {
      if (prev.includes(graphId)) {
        return prev.filter((g) => g !== graphId);
      } else {
        return [...prev, graphId];
      }
    });
  };

  const sortedGraphs = useMemo(() => {
    return orderBy(Object.values(project.graphs), (g) => g.metadata!.name!.toLowerCase());
  }, [project.graphs]);

  const isValid = useMemo(() => {
    return templateName.length > 0 && version.length > 0 && graphsToInclude.length > 0 && description.length > 0;
  }, [templateName, version, graphsToInclude, description]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isValid) {
      onCreate?.({
        templateName,
        version,
        graphsToInclude,
        description,
      });
    }
  };

  return (
    <form css={styles} onSubmit={handleSubmit}>
      <Field name="templateName" label="Template name">
        {() => (
          <TextField
            name="templateName"
            placeholder="Enter template name"
            value={templateName}
            onChange={(e) => setTemplateName(e.currentTarget.value)}
          />
        )}
      </Field>
      <Field name="version" label="Initial Version">
        {() => (
          <TextField
            name="version"
            placeholder="Enter initial version"
            value={version}
            onChange={(e) => setVersion(e.currentTarget.value)}
          />
        )}
      </Field>
      <Field name="graphsToInclude" label="Graphs to include">
        {() => (
          <>
            <div className="helpers">
              <Button
                appearance="link"
                onClick={() => setGraphsToInclude(Object.values(project.graphs).map((g) => g.metadata!.id!))}
              >
                Select all
              </Button>
              <Button appearance="link" onClick={() => setGraphsToInclude([])}>
                Select none
              </Button>
            </div>
            <div className="graphs-to-include">
              {sortedGraphs.map((g) => (
                <div
                  className={clsx('graph', { active: graphsToInclude.includes(g.metadata!.id!) })}
                  onClick={(e) => toggleGraph(g.metadata!.id!)}
                >
                  <div className="info">
                    <span className="name">{g.metadata!.name!}</span>
                  </div>
                  <div className="selected">
                    <Toggle isChecked={graphsToInclude.includes(g.metadata!.id!)} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Field>
      <Field name="description" label="Description">
        {() => (
          <>
            <HelperMessage>Markdown is supported</HelperMessage>
            <div className="description-editor">
              <Suspense fallback={<div>Loading...</div>}>
                <LazyCodeEditor language="markdown" text={description} onChange={(v) => setDescription(v)} />
              </Suspense>
            </div>
          </>
        )}
      </Field>
      <div className="actions">
        <Button appearance="primary" type="submit" isDisabled={!isValid}>
          Create Template
        </Button>
      </div>
    </form>
  );
};
