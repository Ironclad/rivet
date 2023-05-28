import { ChartNode, NodeConnection } from './NodeBase';
import { Opaque } from 'type-fest';
export type GraphId = Opaque<string, 'GraphId'>;
export interface NodeGraph {
    metadata?: {
        id?: GraphId;
        name?: string;
        description?: string;
    };
    nodes: ChartNode[];
    connections: NodeConnection[];
}
export declare function emptyNodeGraph(): NodeGraph;
