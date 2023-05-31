import { save, open } from '@tauri-apps/api/dialog';
import { writeFile, readTextFile } from '@tauri-apps/api/fs';
import {
  NodeGraph,
  Project,
  deserializeGraph,
  deserializeProject,
  serializeGraph,
  serializeProject,
} from '@ironclad/nodai-core';

export async function saveGraphData(graphData: NodeGraph) {
  const filePath = await save({
    filters: [
      {
        name: 'Rivet Graph',
        extensions: ['rivet-graph'],
      },
    ],
    title: 'Save graph',
    defaultPath: `${graphData.metadata?.name ?? 'graph'}.rivet-graph`,
  });

  const data = serializeGraph(graphData) as string;

  if (filePath) {
    await writeFile({
      contents: data,
      path: filePath,
    });
  }
}

export async function saveProjectData(project: Project) {
  const filePath = await save({
    filters: [
      {
        name: 'Rivet Project',
        extensions: ['rivet-project'],
      },
    ],
    title: 'Save project',
    defaultPath: `${project.metadata?.title ?? 'project'}.rivet-project`,
  });

  const data = serializeProject(project) as string;

  if (filePath) {
    await writeFile({
      contents: data,
      path: filePath,
    });

    return filePath;
  }

  return undefined;
}

export async function saveProjectDataNoPrompt(project: Project, path: string) {
  const data = serializeProject(project) as string;

  await writeFile({
    contents: data,
    path: path,
  });
}

export async function loadGraphData(callback: (graphData: NodeGraph) => void) {
  const path = await open({
    filters: [
      {
        name: 'Rivet Graph',
        extensions: ['rivet-graph'],
      },
    ],
    multiple: false,
    directory: false,
    recursive: false,
    title: 'Open graph',
  });

  if (path) {
    const data = await readTextFile(path as string);
    const graphData = deserializeGraph(data);
    callback(graphData);
  }
}

export async function loadProjectData(callback: (data: { project: Project; path: string }) => void) {
  const path = await open({
    filters: [
      {
        name: 'Rivet Project',
        extensions: ['rivet-project'],
      },
    ],
    multiple: false,
    directory: false,
    recursive: false,
    title: 'Open graph',
  });

  if (path) {
    const data = await readTextFile(path as string);
    const projectData = deserializeProject(data);
    callback({ project: projectData, path: path as string });
  }
}

export async function openDirectory() {
  const path = await open({
    filters: [],
    multiple: false,
    directory: true,
    recursive: true,
    title: 'Choose Directory',
  });

  return path;
}

export async function openFile() {
  const path = await open({
    filters: [],
    multiple: false,
    directory: false,
    recursive: false,
    title: 'Choose File',
  });

  return path;
}
