import { BaseDir } from './BaseDir.js';
import { NativeApi } from './NativeApi.js';

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
}
