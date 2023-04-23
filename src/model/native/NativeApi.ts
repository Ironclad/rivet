import { BaseDir } from './BaseDir';

export interface NativeApi {
  readdir(path: string, baseDir: BaseDir): Promise<string[]>;

  readTextFile(path: string, baseDir: BaseDir): Promise<string>;

  readBinaryFile(path: string, baseDir: BaseDir): Promise<Blob>;

  writeTextFile(path: string, baseDir: BaseDir, data: string): Promise<void>;
}
