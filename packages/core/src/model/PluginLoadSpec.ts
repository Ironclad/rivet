export type BuiltInPluginLoadSpec = {
  type: 'built-in';
  id: string;
  name: string;
};

export type URIPluginLoadSpec = {
  type: 'uri';
  id: string;
  uri: string;
};

export type PluginLoadSpec = URIPluginLoadSpec | BuiltInPluginLoadSpec;
