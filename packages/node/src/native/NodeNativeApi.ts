import { opendir, readdir, readFile, writeFile } from 'node:fs/promises';
import { lstatSync } from 'node:fs';
import { join, relative } from 'node:path';
import { type BaseDir, type NativeApi, type ReadDirOptions } from '@ironclad/rivet-core';
import { minimatch } from 'minimatch';

async function* walk(dir: string): AsyncGenerator<string> {
  for await (const d of await opendir(dir)) {
    const entry = join(dir, d.name);
    if (d.isDirectory()) yield* walk(entry);
    else if (d.isFile()) yield entry;
  }
}

export class NodeNativeApi implements NativeApi {
  async readdir(path: string, baseDir?: BaseDir, options: ReadDirOptions = {}): Promise<string[]> {
    const {
      recursive = false,
      includeDirectories = false,
      filterGlobs = [],
      relative: isRelative = false,
      ignores = [],
    } = options;

    let results: string[] = [];
    if (recursive) {
      for await (const entry of walk(path)) {
        results.push(entry);
      }
    } else {
      const dirents = await readdir(path, { withFileTypes: true });
      results = dirents.map((dirent) => join(path, dirent.name));
    }

    if (!includeDirectories) {
      results = results.filter((result) => lstatSync(result).isFile());
    }

    if (filterGlobs.length > 0) {
      for (const glob of filterGlobs) {
        results = results.filter((result) => minimatch(result, glob, { dot: true }));
      }
    }

    if (ignores.length > 0) {
      for (const ignore of ignores) {
        results = results.filter((result) => !minimatch(result, ignore, { dot: true }));
      }
    }

    if (isRelative) {
      results = results.map((result) => relative(path, result));
    }

    return results;
  }

  async readTextFile(path: string, baseDir?: BaseDir): Promise<string> {
    const result = await readFile(path, 'utf-8');
    return result;
  }

  async readBinaryFile(path: string, baseDir?: BaseDir): Promise<Blob> {
    const result = await readFile(path);

    return new Blob([result]);
  }

  async writeTextFile(path: string, data: string, baseDir?: BaseDir): Promise<void> {
    await writeFile(path, data, 'utf-8');
  }

  exec(command: string, args: string[], options?: { cwd?: string | undefined } | undefined): Promise<void> {
    throw new Error('Not Implemented');
  }
}
