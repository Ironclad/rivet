import type * as RivetTypes from './exports.js';
export * from './exports.js';

export const Rivet: typeof RivetTypes = undefined!;

export type RivetPluginInitializer = (rivet: typeof Rivet) => RivetTypes.RivetPlugin;
