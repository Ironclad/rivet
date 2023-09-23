import { readDir, BaseDirectory, readTextFile, readBinaryFile, writeFile, type FileEntry } from '@tauri-apps/api/fs';
import { type BaseDir, type NativeApi, type ReadDirOptions } from '@ironclad/rivet-core';

import { minimatch } from 'minimatch';

const baseDirToBaseDirectoryMap: Record<BaseDir, BaseDirectory> = {
  app: BaseDirectory.App,
  appCache: BaseDirectory.AppCache,
  appConfig: BaseDirectory.AppConfig,
  appData: BaseDirectory.AppData,
  appLocalData: BaseDirectory.AppLocalData,
  appLog: BaseDirectory.AppLog,
  audio: BaseDirectory.Audio,
  cache: BaseDirectory.Cache,
  config: BaseDirectory.Config,
  data: BaseDirectory.Data,
  desktop: BaseDirectory.Desktop,
  document: BaseDirectory.Document,
  download: BaseDirectory.Download,
  executable: BaseDirectory.Executable,
  font: BaseDirectory.Font,
  home: BaseDirectory.Home,
  localData: BaseDirectory.LocalData,
  log: BaseDirectory.Log,
  picture: BaseDirectory.Picture,
  public: BaseDirectory.Public,
  resource: BaseDirectory.Resource,
  runtime: BaseDirectory.Runtime,
  temp: BaseDirectory.Temp,
  template: BaseDirectory.Template,
  video: BaseDirectory.Video,
};
const baseDirToBaseDirectory = (baseDir?: string): BaseDirectory | undefined =>
  baseDir ? baseDirToBaseDirectoryMap[baseDir as BaseDir] : undefined;

export class TauriNativeApi implements NativeApi {
  async readdir(path: string, baseDir?: BaseDir, options: ReadDirOptions = {}): Promise<string[]> {
    const { recursive = false, includeDirectories = false, filterGlobs = [], relative = false, ignores = [] } = options;

    const baseDirectory = baseDirToBaseDirectory(baseDir);
    const results = await readDir(path, { dir: baseDirectory, recursive });

    const flattenResults: (r: FileEntry[]) => FileEntry[] = (r) =>
      r.flatMap((result) => (result.children ? [result, ...flattenResults(result.children)] : [result]));

    let filteredResults = flattenResults(results)
      .filter((result) => (includeDirectories ? true : result.children == null))
      .map((result) => result.path);

    if (filterGlobs.length > 0) {
      for (const glob of filterGlobs) {
        filteredResults = filteredResults.filter((result) => minimatch(result, glob, { dot: true }));
      }
    }

    if (ignores.length > 0) {
      for (const ignore of ignores) {
        filteredResults = filteredResults.filter((result) => !minimatch(result, ignore, { dot: true }));
      }
    }

    // TODO approximate, will fail on ironclad/ironclad for example
    filteredResults = filteredResults.map((result) =>
      relative ? result.slice(result.indexOf(path) + path.length + 1) : result,
    );

    return filteredResults;
  }

  async readTextFile(path: string, baseDir?: BaseDir): Promise<string> {
    const baseDirectory = baseDirToBaseDirectory(baseDir);
    const result = await readTextFile(path, { dir: baseDirectory });
    return result;
  }

  async readBinaryFile(path: string, baseDir?: BaseDir): Promise<Blob> {
    const baseDirectory = baseDirToBaseDirectory(baseDir);
    const result = await readBinaryFile(path, { dir: baseDirectory });
    return new Blob([result]);
  }

  async writeTextFile(path: string, data: string, baseDir?: BaseDir): Promise<void> {
    const baseDirectory = baseDirToBaseDirectory(baseDir);
    await writeFile(path, data, { dir: baseDirectory });
  }

  async exec(command: string, args: string[], options?: { cwd?: string | undefined } | undefined): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
