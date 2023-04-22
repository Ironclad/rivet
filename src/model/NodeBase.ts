import { Opaque } from 'type-fest';
import { DataType } from './DataValue';

/** Unique in a NodeGraph. */
export type NodeId = Opaque<string, 'NodeId'>;

/** Unique within the inputs of a single node */
export type PortId = Opaque<string, 'PortId'>;

/** Base interface for a node in a NodeGraph. All nodes will have this data.*/
export interface NodeBase {
  /** The type of the node. See Nodes['type']. */
  type: string;

  /** The unique identifier of the node. Unique within a NodeGraph. */
  id: NodeId;

  /** The title of the node. Displayed in the graph. */
  title: string;

  /** A user description/notes for the node */
  description?: string;

  /** The visual data of the node, including its position. Visual data does not affect its processing. */
  visualData: {
    /** The x-coordinate of the node's position. */
    x: number;

    /** The y-coordinate of the node's position. */
    y: number;

    width?: number;

    /** The z-index, the last grabbed node is on top of all others. */
    zIndex?: number;
  };

  /** The data associated with the node. Typed when using `Nodes` or a subtype. */
  data: unknown;

  // /** Definitions for the input ports of the node. */
  // inputDefinitions: NodeInputDefinition[];

  // /** Definitions for the output ports of the node. */
  // outputDefinitions: NodeOutputDefinition[];
}

/** Base type for a typed node. */
export type ChartNode<Type extends string = string, Data = unknown> = NodeBase & {
  /** The type of the node. */
  type: Type;
  /** The data associated with the node. */
  data: Data;
};

/** Represents an input definition of a node. */
export type NodeInputDefinition = {
  /** The unique identifier of the input. Unique within a single node only. */
  id: PortId;

  /** The title of the input. Shows in the UI. */
  title: string;

  /** Whether the input is required. If it is required, there is no default value, and the node cannot process if this input is not connected. */
  required?: boolean;

  /** The data type of the input. */
  dataType: DataType;

  /** Other data associated with the input. Typed in subtypes. */
  data?: unknown;

  /** The default value of the input, if it is not connected to an output. */
  defaultValue?: unknown;
};

/** Represents an output definition of a node. */
export type NodeOutputDefinition = {
  /** The unique identifier of the output. Unique within a single node. */
  id: PortId;

  /** The title of the output. Shown in the UI. */
  title: string;

  /** The data type of the output. */
  dataType: DataType;

  /** The data associated with the output. */
  data?: unknown;

  /** The default value of the output. Some outputs just have a fixed value. */
  defaultValue?: unknown;
};

/** Represents a connection between two nodes. */
export type NodeConnection = {
  /** The unique identifier of the output node. */
  outputNodeId: NodeId;

  /** The unique identifier of the input node. */
  inputNodeId: NodeId;

  /** The unique identifier of the output. */
  outputId: PortId;

  /** The unique identifier of the input. */
  inputId: PortId;

  /** The data associated with the connection. */
  data?: unknown;
};
