import { BaseDir, NativeApi, ReadDirOptions } from '@ironclad/rivet-core';
export declare class NodeNativeApi implements NativeApi {
    readdir(path: string, baseDir?: BaseDir, options?: ReadDirOptions): Promise<string[]>;
    readTextFile(path: string, baseDir?: BaseDir): Promise<string>;
    readBinaryFile(path: string, baseDir?: BaseDir): Promise<Blob>;
    writeTextFile(path: string, data: string, baseDir?: BaseDir): Promise<void>;
}
