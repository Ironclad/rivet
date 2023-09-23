import { type ChartNode, type EditorDefinition } from '@ironclad/rivet-core';

export function getHelperMessage(editor: EditorDefinition<ChartNode>, data: ChartNode['data']) {
  return typeof editor.helperMessage === 'function'
    ? editor.helperMessage(data) || undefined
    : editor.helperMessage || undefined;
}
