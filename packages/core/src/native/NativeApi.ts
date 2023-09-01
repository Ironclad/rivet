import { BaseDir } from './BaseDir.js';

export type ReadDirOptions = {
  recursive?: boolean;
  includeDirectories?: boolean;
  filterGlobs?: string[];
  relative?: boolean;
  ignores?: string[];
};

export interface NativeApi {
  readdir(path: string, baseDir?: BaseDir, options?: ReadDirOptions): Promise<string[]>;

  readTextFile(path: string, baseDir?: BaseDir): Promise<string>;

  readBinaryFile(path: string, baseDir?: BaseDir): Promise<Blob>;

  writeTextFile(path: string, data: string, baseDir?: BaseDir): Promise<void>;
}

export class DummyNativeApi implements NativeApi {
  readdir(path: string, baseDir?: BaseDir | undefined, options?: ReadDirOptions | undefined): Promise<string[]> {
    throw new Error('Method not implemented.');
  }
  readTextFile(path: string, baseDir?: BaseDir | undefined): Promise<string> {
    throw new Error('Method not implemented.');
  }
  readBinaryFile(path: string, baseDir?: BaseDir | undefined): Promise<Blob> {
    throw new Error('Method not implemented.');
  }
  writeTextFile(path: string, data: string, baseDir?: BaseDir | undefined): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
