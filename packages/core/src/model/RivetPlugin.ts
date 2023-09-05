import { ChartNode } from './NodeBase.js';
import { NodeDefinition } from './NodeImpl.js';

export type RivetPlugin = {
  id: string;

  name?: string;

  register?: (register: <T extends ChartNode>(definition: NodeDefinition<T>) => void) => void;

  /** The available configuration items and their specification, for configuring a plugin in the UI. */
  configSpec?: RivetPluginConfigSpecs;

  contextMenuGroups?: Array<{
    id: string;
    label: string;
  }>;
};

export type RivetPluginConfigSpecs = Record<string, PluginConfigurationSpec>;

export type PluginConfigurationSpecBase<T> = {
  /** The type of the config value, how it should show as an editor in the UI. */
  type: string;

  /** The default value of the config item if unset. */
  default?: T;

  /** A description to show in the UI for the config setting. */
  description?: string;

  /** The label of the setting in the UI. */
  label: string;
};

export type StringPluginConfigurationSpec = {
  type: 'string';
  default?: string;
  label: string;
  description?: string;
  pullEnvironmentVariable?: true | string;
  helperText?: string;
};

export type SecretPluginConfigurationSpec = {
  type: 'secret';
  default?: string;
  label: string;
  description?: string;
  pullEnvironmentVariable?: true | string;
  helperText?: string;
};

export type PluginConfigurationSpec =
  | StringPluginConfigurationSpec
  | SecretPluginConfigurationSpec
  | PluginConfigurationSpecBase<number>
  | PluginConfigurationSpecBase<boolean>;
