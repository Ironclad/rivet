import { type BaseDir } from './BaseDir.js';
import { type NativeApi } from './NativeApi.js';

export class BrowserNativeApi implements NativeApi {
  readdir(_path: string, _baseDir: BaseDir): Promise<string[]> {
    throw new Error('Method not implemented.');
  }

  readTextFile(_path: string, _baseDir: BaseDir): Promise<string> {
    throw new Error('Method not implemented.');
  }

  readBinaryFile(_path: string, _baseDir: BaseDir): Promise<Blob> {
    throw new Error('Method not implemented.');
  }

  writeTextFile(_path: string, _data: string, _baseDir?: BaseDir): Promise<void> {
    throw new Error('Method not implemented.');
  }

  exec(command: string, args: string[], options?: { cwd?: string | undefined } | undefined): Promise<void> {
    throw new Error('Method not supported.');
  }
}
