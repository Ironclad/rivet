import { readDir, BaseDirectory, readTextFile, readBinaryFile, writeFile } from '@tauri-apps/api/fs';
import { NativeApi } from './NativeApi';
import { BaseDir } from './BaseDir';

const baseDirToBaseDirectory: Record<BaseDir, BaseDirectory> = {
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

export class TauriNativeApi implements NativeApi {
  async readdir(path: string, baseDir: BaseDir): Promise<string[]> {
    const baseDirectory = baseDirToBaseDirectory[baseDir];
    const results = await readDir(path, { dir: baseDirectory, recursive: false });

    return results.map((result) => result.path);
  }

  async readTextFile(path: string, baseDir: BaseDir): Promise<string> {
    const baseDirectory = baseDirToBaseDirectory[baseDir];
    const result = await readTextFile(path, { dir: baseDirectory });
    return result;
  }

  async readBinaryFile(path: string, baseDir: BaseDir): Promise<Blob> {
    const baseDirectory = baseDirToBaseDirectory[baseDir];
    const result = await readBinaryFile(path, { dir: baseDirectory });
    return new Blob([result]);
  }

  async writeTextFile(path: string, baseDir: BaseDir, data: string): Promise<void> {
    const baseDirectory = baseDirToBaseDirectory[baseDir];
    await writeFile(path, data, { dir: baseDirectory });
  }
}
