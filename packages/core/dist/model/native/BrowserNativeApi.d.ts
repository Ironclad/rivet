import { BaseDir } from './BaseDir';
import { NativeApi } from './NativeApi';
export declare class BrowserNativeApi implements NativeApi {
    readdir(_path: string, _baseDir: BaseDir): Promise<string[]>;
    readTextFile(_path: string, _baseDir: BaseDir): Promise<string>;
    readBinaryFile(_path: string, _baseDir: BaseDir): Promise<Blob>;
    writeTextFile(_path: string, _data: string, _baseDir?: BaseDir): Promise<void>;
}
