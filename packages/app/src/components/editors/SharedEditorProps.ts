import { type ChartNode } from '@ironclad/rivet-core';
import { type NodeChanged } from '../NodeEditor';

export type SharedEditorProps = {
  node: ChartNode;
  onChange: NodeChanged;
  isReadonly: boolean;
  isDisabled: boolean;
  onClose?: () => void;
};
