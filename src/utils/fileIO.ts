import { NodeGraph } from '../model/NodeGraph';

export function saveGraphData(graphData: NodeGraph) {
  const blob = new Blob([JSON.stringify(graphData)], { type: 'application/json' });
  const anchor = document.createElement('a');
  anchor.download = 'graph-data.json';
  anchor.href = URL.createObjectURL(blob);
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

export function loadGraphData(callback: (graphData: NodeGraph) => void) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const graphData = JSON.parse(e.target?.result as string);
      callback(graphData);
    };
    reader.readAsText(file);
  };
  input.click();
}
