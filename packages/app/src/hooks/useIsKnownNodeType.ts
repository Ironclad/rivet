import { useDependsOnPlugins } from './useDependsOnPlugins';
import { useNodeTypes } from './useNodeTypes';

export function useIsKnownNodeType(type: string) {
  useDependsOnPlugins();
  const nodeTypes = useNodeTypes();
  return type in nodeTypes;
}
