"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeNativeApi = void 0;
const promises_1 = require("node:fs/promises");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const minimatch_1 = require("minimatch");
async function* walk(dir) {
    for await (const d of await (0, promises_1.opendir)(dir)) {
        const entry = (0, node_path_1.join)(dir, d.name);
        if (d.isDirectory())
            yield* walk(entry);
        else if (d.isFile())
            yield entry;
    }
}
class NodeNativeApi {
    async readdir(path, baseDir, options = {}) {
        const { recursive = false, includeDirectories = false, filterGlobs = [], relative: isRelative = false, ignores = [], } = options;
        let results = [];
        if (recursive) {
            for await (const entry of walk(path)) {
                results.push(entry);
            }
        }
        else {
            const dirents = await (0, promises_1.readdir)(path, { withFileTypes: true });
            results = dirents.map((dirent) => (0, node_path_1.join)(path, dirent.name));
        }
        if (!includeDirectories) {
            results = results.filter((result) => (0, node_fs_1.lstatSync)(result).isFile());
        }
        if (filterGlobs.length > 0) {
            for (const glob of filterGlobs) {
                results = results.filter((result) => (0, minimatch_1.minimatch)(result, glob, { dot: true }));
            }
        }
        if (ignores.length > 0) {
            for (const ignore of ignores) {
                results = results.filter((result) => !(0, minimatch_1.minimatch)(result, ignore, { dot: true }));
            }
        }
        if (isRelative) {
            results = results.map((result) => (0, node_path_1.relative)(path, result));
        }
        return results;
    }
    async readTextFile(path, baseDir) {
        const result = await (0, promises_1.readFile)(path, 'utf-8');
        return result;
    }
    async readBinaryFile(path, baseDir) {
        const result = await (0, promises_1.readFile)(path);
        return new Blob([result]);
    }
    async writeTextFile(path, data, baseDir) {
        await (0, promises_1.writeFile)(path, data, 'utf-8');
    }
}
exports.NodeNativeApi = NodeNativeApi;
