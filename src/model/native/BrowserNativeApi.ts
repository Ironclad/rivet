import { BaseDir, NativeApi } from './NativeApi';

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
  writeTextFile(_path: string, _baseDir: BaseDir, _data: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
