import { ChartNode, NodeImplConstructor, NodeDefinition, NodeImpl } from '..';
export declare class NodeRegistration<NodeTypes extends string = never, Nodes extends ChartNode = never, Impls extends {
    [P in NodeTypes]: NodeImplConstructor<Extract<Nodes, {
        type: P;
    }>>;
} = never> {
    #private;
    NodesType: Nodes;
    NodeTypesType: NodeTypes;
    register<T extends ChartNode>(definition: NodeDefinition<T>): NodeRegistration<NodeTypes | T['type'], Nodes | T, {
        [P in NodeTypes | T['type']]: NodeImplConstructor<Extract<Nodes | T, {
            type: P;
        }>>;
    }>;
    create<T extends NodeTypes>(type: T): Extract<Nodes, {
        type: T;
    }>;
    createImpl<T extends Nodes>(node: T): NodeImpl<T>;
    getDisplayName<T extends NodeTypes>(type: T): string;
}
