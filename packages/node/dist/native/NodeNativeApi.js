"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeNativeApi = void 0;
const promises_1 = require("node:fs/promises");
// TODO baseDir is not used
class NodeNativeApi {
    async readdir(path, baseDir) {
        const results = await (0, promises_1.readdir)(path);
        return results;
    }
    async readTextFile(path, baseDir) {
        const result = await (0, promises_1.readFile)(path, { encoding: 'utf8' });
        return result;
    }
    async readBinaryFile(path, baseDir) {
        const result = await (0, promises_1.readFile)(path);
        return new Blob([result]);
    }
    async writeTextFile(path, data, baseDir) {
        await (0, promises_1.writeFile)(path, data, { encoding: 'utf8' });
    }
}
exports.NodeNativeApi = NodeNativeApi;
