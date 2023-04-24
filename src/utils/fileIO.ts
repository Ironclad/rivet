import { NodeGraph } from '../model/NodeGraph';
import { save, open } from '@tauri-apps/api/dialog';
import { writeFile, readTextFile } from '@tauri-apps/api/fs';

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

  const data = JSON.stringify(graphData);

  if (filePath) {
    await writeFile({
      contents: data,
      path: filePath,
    });
  }
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
