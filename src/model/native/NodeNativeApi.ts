import { BaseDir } from './BaseDir';
import { NativeApi } from './NativeApi';
import { readdir, readFile, writeFile } from 'node:fs/promises';

// TODO baseDir is not used
export class NodeNativeApi implements NativeApi {
  async readdir(path: string, baseDir: BaseDir): Promise<string[]> {
    const results = await readdir(path);
    return results;
  }

  async readTextFile(path: string, baseDir: BaseDir): Promise<string> {
    const result = await readFile(path, { encoding: 'utf8' });
    return result;
  }

  async readBinaryFile(path: string, baseDir: BaseDir): Promise<Blob> {
    const result = await readFile(path);
    return new Blob([result]);
  }

  async writeTextFile(path: string, baseDir: BaseDir, data: string): Promise<void> {
    await writeFile(path, data, { encoding: 'utf8' });
  }
}
