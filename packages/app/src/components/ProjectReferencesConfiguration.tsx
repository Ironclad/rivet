import Button from '@atlaskit/button';
import { Label } from '@atlaskit/form';
import { css } from '@emotion/react';
import { type FC } from 'react';
import { ioProvider } from '../utils/globals';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { loadedProjectState, projectState } from '../state/savedGraphs';
import { type ProjectReference } from '@ironclad/rivet-core';

const styles = css`
  margin-top: 16px;

  .label {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
`;

export const ProjectReferencesConfiguration: FC = () => {
  const [project, setProject] = useAtom(projectState);

  const loadedProject = useAtomValue(loadedProjectState);

  const addProjectReference = () => {
    if (!loadedProject) {
      return;
    }

    ioProvider.loadProjectData((data) => {
      const currentProjectPath = loadedProject.path;

      if (!currentProjectPath) {
        return;
      }

      const newReferencePath = data.path;

      if (!newReferencePath) {
        return;
      }

      if (project.references?.some((ref) => ref.id === data.project.metadata.id)) {
        return; // Already referenced
      }

      const relativePath = calculateRelativePath(currentProjectPath, newReferencePath);

      const newReference: ProjectReference = {
        id: data.project.metadata.id,
        hintPaths: [relativePath],
        title: data.project.metadata.title,
      };

      setProject((prev) => {
        return {
          ...prev,
          references: [...(prev.references ?? []), newReference],
        };
      });
    });
  };

  return (
    <div css={styles}>
      <div className="label">
        <Label htmlFor="">Project References</Label>
      </div>

      <ul>
        {project.references?.map((ref) => (
          <li key={ref.id}>
            <span>{ref.title}</span>
          </li>
        ))}
      </ul>

      <Button appearance="default" onClick={addProjectReference}>
        Add Project Reference
      </Button>
    </div>
  );
};

// Calculate the relative path from the current project to the new reference
const calculateRelativePath = (from: string, to: string) => {
  // Normalize paths to use forward slashes and remove trailing slashes
  const normalizePathParts = (path: string) => {
    return path.replace(/\\/g, '/').replace(/\/$/, '').split('/');
  };

  const fromParts = normalizePathParts(from);
  const toParts = normalizePathParts(to);

  // Remove the filename from the fromParts to get just the directory
  fromParts.pop();

  // Find common parts
  let commonLength = 0;
  for (let i = 0; i < Math.min(fromParts.length, toParts.length); i++) {
    if (fromParts[i] !== toParts[i]) break;
    commonLength = i + 1;
  }

  // Build the relative path
  const upCount = fromParts.length - commonLength;
  const relativeParts = [];

  // Add "../" for each level we need to go up
  for (let i = 0; i < upCount; i++) {
    relativeParts.push('..');
  }

  // Add the remaining path parts from the target
  for (let i = commonLength; i < toParts.length; i++) {
    relativeParts.push(toParts[i]);
  }

  return relativeParts.join('/');
};
