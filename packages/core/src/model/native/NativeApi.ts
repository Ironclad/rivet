import { BaseDir } from './BaseDir';

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
