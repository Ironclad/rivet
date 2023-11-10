import { Field, HelperMessage } from '@atlaskit/form';
import TextField from '@atlaskit/textfield';
import Toggle from '@atlaskit/toggle';
import { type GraphId } from '@ironclad/rivet-core';
import clsx from 'clsx';
import { orderBy } from 'lodash-es';
import { type FormEvent, Suspense, useMemo, useState, type FC } from 'react';
import { useRecoilValue } from 'recoil';
import { projectState } from '../../state/savedGraphs';
import { LazyCodeEditor } from '../LazyComponents';
import { css } from '@emotion/react';
import Button from '@atlaskit/button';
import { type TemplateResponse } from '../../utils/communityApi';
import { inc } from 'semver';
import { isNotNull } from '../../utils/genericUtilFunctions';

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
  existingTemplate?: TemplateResponse;
  working?: boolean;
  onCreate?: (templateInfo: {
    templateName: string;
    version: string;
    graphsToInclude: GraphId[];
    description: string;
    versionDescription: string;
  }) => void;
}> = ({ existingTemplate, working, onCreate }) => {
  const project = useRecoilValue(projectState);

  const [templateName, setTemplateName] = useState<string>(existingTemplate?.name ?? project.metadata.title);

  const latestVersion = existingTemplate?.versions[existingTemplate.versions.length - 1];

  const nextVersion = inc(latestVersion?.version ?? '0.0.0', 'minor') ?? '0.1.0';
  const [version, setVersion] = useState<string>(nextVersion);

  const allLocalGraphs = Object.values(project.graphs);

  const initialGraphsToInclude = existingTemplate
    ? latestVersion?.graphNames
        .map((g) => allLocalGraphs.find((lg) => lg.metadata!.name === g))
        .filter(isNotNull)
        .map((g) => g.metadata!.id!) ?? allLocalGraphs.map((g) => g.metadata!.id!)
    : allLocalGraphs.map((g) => g.metadata!.id!);

  const [graphsToInclude, setGraphsToInclude] = useState<GraphId[]>(initialGraphsToInclude);
  const [description, setDescription] = useState<string>(
    latestVersion?.descriptionMarkdown ?? project.metadata.description,
  );

  const [versionDescription, setVersionDescription] = useState<string>('');

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

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isValid) {
      onCreate?.({
        templateName,
        version,
        graphsToInclude,
        description,
        versionDescription,
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
            isDisabled={working || existingTemplate != null}
          />
        )}
      </Field>
      <Field name="version" label={existingTemplate ? 'New Version' : 'Initial Version'}>
        {() => (
          <TextField
            name="version"
            placeholder="Enter initial version"
            value={version}
            onChange={(e) => setVersion(e.currentTarget.value)}
            isDisabled={working}
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
                isDisabled={working}
              >
                Select all
              </Button>
              <Button appearance="link" onClick={() => setGraphsToInclude([])} isDisabled={working}>
                Select none
              </Button>
            </div>
            <div className="graphs-to-include">
              {sortedGraphs.map((g) => (
                <div
                  key={g.metadata!.id!}
                  className={clsx('graph', { active: graphsToInclude.includes(g.metadata!.id!) })}
                  onClick={() => {
                    if (working) {
                      return;
                    }
                    toggleGraph(g.metadata!.id!);
                  }}
                >
                  <div className="info">
                    <span className="name">{g.metadata!.name!}</span>
                  </div>
                  <div className="selected">
                    <Toggle isChecked={graphsToInclude.includes(g.metadata!.id!)} isDisabled={working} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Field>
      <Field name="versionDescription" label="Version Description">
        {() => (
          <>
            <HelperMessage>Markdown is supported</HelperMessage>
            <div className="description-editor" style={{ height: 125 }}>
              <Suspense fallback={<div>Loading...</div>}>
                <LazyCodeEditor
                  language="markdown"
                  text={versionDescription}
                  onChange={(v) => setVersionDescription(v)}
                  isReadonly={working}
                />
              </Suspense>
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
                <LazyCodeEditor
                  language="markdown"
                  text={description}
                  onChange={(v) => setDescription(v)}
                  isReadonly={working}
                />
              </Suspense>
            </div>
          </>
        )}
      </Field>
      <div className="actions">
        <Button appearance="primary" type="submit" isDisabled={!isValid || working}>
          {existingTemplate ? 'Publish Version' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
};
