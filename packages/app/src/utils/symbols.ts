import { PortId } from '@ironclad/nodai-core';

export const ControlFlowExcluded = Symbol('ControlFlowExcluded');
export const ControlFlowExcludedPort = ControlFlowExcluded as unknown as PortId;

export const Warnings = Symbol('Warnings');
export const WarningsPort = Warnings as unknown as PortId;
