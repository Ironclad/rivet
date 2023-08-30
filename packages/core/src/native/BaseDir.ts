export const baseDirs = {
  appCache: 'appCache',
  appConfig: 'appConfig',
  appData: 'appData',
  appLocalData: 'appLocalData',
  appLog: 'appLog',
  audio: 'audio',
  cache: 'cache',
  config: 'config',
  data: 'data',
  desktop: 'desktop',
  document: 'document',
  download: 'download',
  executable: 'executable',
  font: 'font',
  home: 'home',
  localData: 'localData',
  picture: 'picture',
  public: 'public',
  resource: 'resource',
  runtime: 'runtime',
  temp: 'temp',
  template: 'template',
  video: 'video',
} as const;

export type BaseDir = (typeof baseDirs)[keyof typeof baseDirs];

export function assertBaseDir(baseDir: string): asserts baseDir is BaseDir {
  if (!(baseDir in baseDirs)) {
    throw new Error(`Invalid base directory: ${baseDir}`);
  }
}
