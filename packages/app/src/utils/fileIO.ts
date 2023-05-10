import { save, open } from '@tauri-apps/api/dialog';
import { writeFile, readTextFile } from '@tauri-apps/api/fs';
import { NodeGraph, Project } from '@ironclad/nodai-core';

export async function saveGraphData(graphData: NodeGraph) {
  const filePath = await save({
    filters: [
      {
        name: 'JSON',
        extensions: ['json'],
      },
    ],
    title: 'Save graph',
    defaultPath: `${graphData.metadata?.name ?? 'graph'}.json`,
  });

  const data = JSON.stringify(graphData, null, 2);

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
        name: 'JSON',
        extensions: ['json'],
      },
    ],
    title: 'Save project',
    defaultPath: `${project.metadata?.title ?? 'project'}.json`,
  });

  const data = JSON.stringify(project, null, 2);

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
  const data = JSON.stringify(project, null, 2);

  await writeFile({
    contents: data,
    path: path,
  });
}

export async function loadGraphData(callback: (graphData: NodeGraph) => void) {
  const path = await open({
    filters: [
      {
        name: 'JSON',
        extensions: ['json'],
      },
    ],
    multiple: false,
    directory: false,
    recursive: false,
    title: 'Open graph',
  });

  if (path) {
    const data = await readTextFile(path as string);
    const graphData = JSON.parse(data);
    callback(graphData);
  }
}

export async function loadProjectData(callback: (data: { project: Project; path: string }) => void) {
  const path = await open({
    filters: [
      {
        name: 'JSON',
        extensions: ['json'],
      },
    ],
    multiple: false,
    directory: false,
    recursive: false,
    title: 'Open graph',
  });

  if (path) {
    const data = await readTextFile(path as string);
    const projectData = JSON.parse(data) as Project;
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
