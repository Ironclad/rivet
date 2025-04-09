import { opendir, readdir, readFile, writeFile } from 'node:fs/promises';
import { lstatSync } from 'node:fs';
import { join, relative as pathRelative } from 'node:path';
import { type BaseDir, type NativeApi, type ReadDirOptions } from '@ironclad/rivet-core';
import { minimatch } from 'minimatch';
import { homedir } from 'os';

async function getAppConfigDir(): Promise<string> {
  const home = homedir();
  if (process.platform === 'darwin') {
    return join(home, 'Library', 'Application Support', 'com.ironcladapp.rivet');
  } else if (process.platform === 'win32') {
    return join(home, 'AppData', 'Roaming', 'com.ironcladapp.rivet');
  } else {
    return join(home, '.config', 'com.ironcladapp.rivet');
  }
}

async function getAppDataDir(): Promise<string> {
  const home = homedir();
  if (process.platform === 'darwin') {
    return join(home, 'Library', 'Application Support', 'com.ironcladapp.rivet');
  } else if (process.platform === 'win32') {
    return join(home, 'AppData', 'Local', 'com.ironcladapp.rivet');
  } else {
    return join(home, '.local', 'share', 'com.ironcladapp.rivet');
  }
}

async function getAppCacheDir(): Promise<string> {
  const home = homedir();
  if (process.platform === 'darwin') {
    return join(home, 'Library', 'Caches', 'com.ironcladapp.rivet');
  } else if (process.platform === 'win32') {
    return join(home, 'AppData', 'Local', 'com.ironcladapp.rivet', 'Cache');
  } else {
    return join(home, '.cache', 'com.ironcladapp.rivet');
  }
}

async function getAppLogDir(): Promise<string> {
  const home = homedir();
  if (process.platform === 'darwin') {
    return join(home, 'Library', 'Logs', 'com.ironcladapp.rivet');
  } else if (process.platform === 'win32') {
    return join(home, 'AppData', 'Local', 'com.ironcladapp.rivet', 'Logs');
  } else {
    return join(home, '.local', 'state', 'com.ironcladapp.rivet', 'logs');
  }
}

async function resolveBaseDir(baseDir?: BaseDir, path?: string): Promise<string> {
  if (!baseDir || !path) {
    return path ?? '';
  }

  switch (baseDir) {
    case 'appConfig':
      return join(await getAppConfigDir(), path);
    case 'appData':
      return join(await getAppDataDir(), path);
    case 'appCache':
      return join(await getAppCacheDir(), path);
    case 'appLog':
      return join(await getAppLogDir(), path);
    case 'home':
      return join(homedir(), path);
    // Add other cases as needed
    default:
      throw new Error(`Unsupported base directory: ${baseDir}`);
  }
}

async function* walk(dir: string): AsyncGenerator<string> {
  for await (const d of await opendir(dir)) {
    const entry = join(dir, d.name);
    if (d.isDirectory()) yield* walk(entry);
    else if (d.isFile()) yield entry;
  }
}

export class NodeNativeApi implements NativeApi {
  async readdir(path: string, _baseDir?: BaseDir, options: ReadDirOptions = {}): Promise<string[]> {
    const { recursive = false, includeDirectories = false, filterGlobs = [], relative = false, ignores = [] } = options;

    const resolvedPath = await resolveBaseDir(_baseDir, path);

    let results: string[] = [];
    if (recursive) {
      for await (const entry of walk(resolvedPath)) {
        results.push(entry);
      }
    } else {
      const dirents = await readdir(resolvedPath, { withFileTypes: true });
      results = dirents.map((dirent) => join(resolvedPath, dirent.name));
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

    if (relative) {
      results = results.map((result) => pathRelative(resolvedPath, result));
    }

    return results;
  }

  async readTextFile(path: string, baseDir?: BaseDir): Promise<string> {
    const resolvedPath = await resolveBaseDir(baseDir, path);
    const result = await readFile(resolvedPath, 'utf-8');
    return result;
  }

  async readBinaryFile(path: string, baseDir?: BaseDir): Promise<Blob> {
    const resolvedPath = await resolveBaseDir(baseDir, path);
    const result = await readFile(resolvedPath);
    return new Blob([result]);
  }

  async writeTextFile(path: string, data: string, baseDir?: BaseDir): Promise<void> {
    const resolvedPath = await resolveBaseDir(baseDir, path);
    await writeFile(resolvedPath, data, 'utf-8');
  }

  async exec(command: string, args: string[], options?: { cwd?: string }): Promise<void> {
    throw new Error(`Method not implemented. ${command} ${args} ${options}`);
  }

  async resolveBaseDir(baseDir?: BaseDir, path?: string): Promise<string> {
    return resolveBaseDir(baseDir, path);
  }
}
