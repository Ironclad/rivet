import { useState, type FC, type FormEvent } from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { newProjectModalOpenState } from '../state/ui';
import Modal, { ModalTransition, ModalBody, ModalHeader, ModalTitle, ModalFooter } from '@atlaskit/modal-dialog';
import { ButtonItem, SideNavigation, Section } from '@atlaskit/side-navigation';
import { css } from '@emotion/react';
import { Field } from '@atlaskit/form';
import TextField from '@atlaskit/textfield';
import { match } from 'ts-pattern';
import Button from '@atlaskit/button';
import Textarea from '@atlaskit/textarea';
import { useNewProject } from '../hooks/useNewProject';
import Select, { type OptionType, type GroupType } from '@atlaskit/select';
import documentationTutorialProject from '../assets/tutorials/documentation-tutorial.rivet-project?raw';
import { useNewProjectFromTemplate } from '../hooks/useNewProjectFromTemplate';

export const NewProjectModalRenderer: FC = () => {
  const [newProjectModalOpen] = useRecoilState(newProjectModalOpenState);

  return <ModalTransition>{newProjectModalOpen && <NewProjectModal />}</ModalTransition>;
};

const modalBody = css`
  min-height: 300px;
  display: grid;
  grid-template-columns: 240px 1fr;

  nav {
    padding-bottom: 20px;
  }

  main {
    padding: 0 30px 100px 30px;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }
`;

const buttonsContainer = css`
  > button span {
    // Fix invisible text on Ubuntu/Kubuntu
    overflow-x: visible !important;
  }
`;

export const NewProjectModal: FC = () => {
  const setNewProjectModalOpen = useSetRecoilState(newProjectModalOpenState);

  const [selectedTemplate, setSelectedTemplate] = useState<string>('blank_project');

  const onProjectCreated = () => {
    setNewProjectModalOpen(false);
  };

  return (
    <Modal onClose={() => setNewProjectModalOpen(false)} width="75%">
      <ModalHeader>
        <ModalTitle>New Rivet Project</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <div css={modalBody}>
          <nav>
            <SideNavigation label="Templates">
              <Section title="Empty Projects">
                <div css={buttonsContainer}>
                  <ButtonItem
                    isSelected={selectedTemplate === 'blank_project'}
                    onClick={() => setSelectedTemplate('blank_project')}
                  >
                    Blank Project
                  </ButtonItem>
                </div>
              </Section>
              <Section title="Templates">
                <ButtonItem
                  isSelected={selectedTemplate === 'tutorial'}
                  onClick={() => setSelectedTemplate('tutorial')}
                >
                  From Tutorial
                </ButtonItem>
                <ButtonItem
                  isSelected={selectedTemplate === 'community_templates'}
                  onClick={() => setSelectedTemplate('community_templates')}
                >
                  ⭐ Community Templates
                </ButtonItem>
              </Section>
              <Section title="Examples">
                <ButtonItem
                  isSelected={selectedTemplate === 'community_examples'}
                  onClick={() => setSelectedTemplate('community_examples')}
                >
                  ⭐ Community Examples
                </ButtonItem>
              </Section>
            </SideNavigation>
          </nav>
          <main>
            {match(selectedTemplate)
              .with('blank_project', () => <BlankProjectTemplate onCreated={onProjectCreated} />)
              .with('tutorial', () => <FromTutorialTemplate onCreated={onProjectCreated} />)
              .with('community_templates', () => <div>Coming soon!</div>)
              .with('community_examples', () => <div>Coming soon!</div>)
              .otherwise((template) => (
                <div>Unknown template: {template}</div>
              ))}
          </main>
        </div>
      </ModalBody>
      <ModalFooter>
        <span />
      </ModalFooter>
    </Modal>
  );
};

const BlankProjectTemplate: FC<{
  onCreated: () => void;
}> = ({ onCreated }) => {
  const [projectName, setProjectName] = useState<string>('');
  const [projectDescription, setProjectDescription] = useState<string>('');

  const newProject = useNewProject();

  const createProject = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    newProject({ title: projectName, description: projectDescription });
    onCreated();
  };

  return (
    <div className="template blank-project">
      <h1>Blank Project</h1>
      <p>
        Creates a new blank Rivet project. The project will have no graphs and no nodes. Great when you have an idea and
        want to start from scratch.
      </p>
      <form onSubmit={createProject}>
        <Field name="projectName" label="Project Name">
          {() => (
            <TextField
              name="projectName"
              value={projectName}
              onChange={(e) => setProjectName((e.target as HTMLInputElement).value)}
              placeholder="Project Name"
              autoComplete="off"
            />
          )}
        </Field>
        <Field name="projectDescription" label="Project Description (optional)">
          {() => (
            <Textarea
              name="projectDescription"
              placeholder="Project Description"
              autoComplete="off"
              value={projectDescription}
              onChange={(e) => setProjectDescription((e.target as HTMLTextAreaElement).value)}
            />
          )}
        </Field>
        <div className="actions">
          <Button appearance="primary" type="submit">
            Create Project
          </Button>
        </div>
      </form>
    </div>
  );
};

const tutorials = [
  {
    label: 'Documentation Tutorials',
    options: [
      {
        label: 'Documentation Tutorial Project',
        value: 'documentation_tutorial_project',
      },
    ],
  },
] satisfies GroupType<OptionType>[];

const FromTutorialTemplate: FC<{
  onCreated: () => void;
}> = ({ onCreated }) => {
  const [selectedTutorial, setSelectedTutorial] = useState<string | undefined>();

  const selectedTutorialData = tutorials.flatMap((t) => t.options).find((t) => t.value === selectedTutorial);

  const newProjectFromTemplate = useNewProjectFromTemplate();

  const createProject = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedTutorial) {
      return;
    }

    match(selectedTutorial)
      .with('documentation_tutorial_project', () => {
        newProjectFromTemplate(documentationTutorialProject);
      })
      .otherwise((tutorial) => {});

    onCreated();
  };

  return (
    <div className="template from-tutorial">
      <h1>From Tutorial</h1>
      <p>
        Creates a new project from a Rivet tutorial. Select your tutorial using the dropdown below and a new project
        will be created, containing the contents of the tutorial project.
      </p>
      <form onSubmit={createProject}>
        <Field name="tutorial" label="Tutorial">
          {() => (
            <Select
              options={tutorials as any}
              value={selectedTutorialData}
              onChange={(option) => setSelectedTutorial(option?.value)}
              placeholder="Select a tutorial"
            />
          )}
        </Field>
        <div className="actions">
          <Button appearance="primary" type="submit">
            Create Project
          </Button>
        </div>
      </form>
    </div>
  );
};
