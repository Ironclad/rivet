import { type PackagePluginLoadSpec } from '../../../core/src/model/PluginLoadSpec';
import { appLocalDataDir, join } from '@tauri-apps/api/path';
import {
  readDir,
  exists,
  readTextFile,
  writeBinaryFile,
  createDir,
  removeDir,
  writeTextFile,
} from '@tauri-apps/api/fs';
import { ResponseType, fetch, getClient } from '@tauri-apps/api/http';
import { type RivetPlugin } from '@ironclad/rivet-core';
import { invoke } from '@tauri-apps/api/tauri';
import * as Rivet from '@ironclad/rivet-core';
import semverGt from 'semver/functions/gt';
import { Command } from '@tauri-apps/api/shell';
import { useState } from 'react';

export function useLoadPackagePlugin(options: { onLog?: (message: string) => void } = {}) {
  const [packageInstallLog, setPackageInstallLog] = useState('');

  const log = (message: string) => {
    setPackageInstallLog((prev) => `${prev}${message}`);
    options.onLog?.(message);
  };

  const loadPackagePlugin = async (spec: PackagePluginLoadSpec): Promise<RivetPlugin> => {
    const localDataDir = await appLocalDataDir();

    const pluginDir = await join(localDataDir, `plugins/${spec.package}-${spec.tag}`);
    const pluginFilesPath = await join(pluginDir, 'package');

    let needsReinstall = false;

    try {
      if (await exists(pluginFilesPath)) {
        const packageJson = await join(pluginFilesPath, 'package.json');

        if (await exists(packageJson)) {
          log(`Checking for plugin updates: ${spec.package}@${spec.tag}\n`);
          const { version } = JSON.parse(await readTextFile(packageJson));

          const npmPackageData = await fetch<any>(`https://registry.npmjs.org/${spec.package}/${spec.tag}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          });

          if (npmPackageData.status === 404) {
            throw new Error(`Plugin not found on NPM: ${spec.package}@${spec.tag}`);
          }

          if (npmPackageData.status !== 200) {
            throw new Error(`Error loading plugin from NPM: ${spec.package}@${spec.tag}`);
          }

          const latestVersion = npmPackageData.data.version;

          if (semverGt(latestVersion, version)) {
            log(`Plugin update available: ${spec.package}@${spec.tag} -> ${latestVersion}\n`);
            needsReinstall = true;
          }

          if (!(await exists(await join(pluginFilesPath, 'node_modules')))) {
            needsReinstall = true;
          }
        }
      } else {
        needsReinstall = true;
      }
    } catch (err) {
      needsReinstall = true;
    }

    const completedInstallVersionFile = await join(pluginFilesPath, '.install_complete_version');
    if (await exists(completedInstallVersionFile)) {
      const version = await readTextFile(completedInstallVersionFile);
      if (version !== spec.tag) {
        needsReinstall = true;
      }
    } else {
      needsReinstall = true;
    }

    if (await exists(await join(pluginFilesPath, '.git'))) {
      needsReinstall = false;
      log(`Plugin is a git repository, skipping reinstall: ${spec.package}@${spec.tag}\n`);
    }

    if (needsReinstall) {
      if (await exists(pluginDir)) {
        log(`Removing existing plugin: ${spec.package}@${spec.tag}\n`);
        await removeDir(pluginDir, {
          recursive: true,
        });
      }

      log(`Plugin not found locally or needs reinstall: ${spec.package}@${spec.tag}, downloading from NPM...\n`);

      // Download from NPM and install to plugins directory
      const npmPackageData = await fetch<any>(`https://registry.npmjs.org/${spec.package}/${spec.tag}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (npmPackageData.status === 404) {
        throw new Error(`Plugin not found on NPM: ${spec.package}@${spec.tag}`);
      }

      if (npmPackageData.status !== 200) {
        throw new Error(`Error loading plugin from NPM: ${spec.package}@${spec.tag}`);
      }

      const tarball = npmPackageData.data.dist.tarball;

      log(`Downloading plugin tarball from NPM: ${tarball}\n`);

      const client = await getClient();
      const tarballData = await client.get<unknown>(tarball, {
        headers: {
          Accept: 'application/octet-stream',
        },
        responseType: ResponseType.Binary,
      });

      log(`Downloaded plugin tarball from NPM: ${tarball}\n`);

      const tarDestination = await join(pluginDir, 'package.tgz');
      const data = new Uint8Array(tarballData.data as number[]);

      await createDir(pluginDir, {
        recursive: true,
      });

      await writeBinaryFile(tarDestination, data);

      await invoke('extract_package_plugin_tarball', {
        path: tarDestination,
      });

      const packageJsonPath = await join(pluginFilesPath, 'package.json');

      if (await exists(packageJsonPath)) {
        const packageJsonContents = JSON.parse(await readTextFile(packageJsonPath));

        const installDisabled = packageJsonContents?.rivet?.skipInstall;
        if (!installDisabled) {
          log('Installing NPM dependencies...\n');

          const command = Command.sidecar('../sidecars/pnpm/pnpm', ['install', '--prod', '--ignore-scripts'], {
            cwd: pluginFilesPath,
          });

          command.stdout.on('data', (data) => {
            log(data + '\n');
          });

          command.stderr.on('data', (data) => {
            log(data + '\n');
          });

          const result = await command.execute();

          if (result.code !== 0) {
            throw new Error(`Error installing plugin dependencies: ${spec.package}@${spec.tag}: ${result.stderr}`);
          }

          log('Installed NPM dependencies\n');
        } else {
          log('Skipping NPM dependencies install\n');
        }
      }

      await writeTextFile(completedInstallVersionFile, spec.tag);
    }

    const files = await readDir(pluginFilesPath);

    const packageJson = files.find((file) => file.name === 'package.json');
    if (!packageJson) {
      throw new Error(`Plugin package.json not found: ${spec.package}@${spec.tag}`);
    }

    const packageJsonContents = JSON.parse(await readTextFile(`${pluginFilesPath}/${packageJson.name}`));

    const main = packageJsonContents.main;

    const mainContents = await readTextFile(`${pluginFilesPath}/${main}`);

    if (!mainContents) {
      throw new Error(`Plugin main file not found: ${spec.package}@${spec.tag}`);
    }

    const b64Contents = btoa(mainContents);

    try {
      const pluginInitializer = (await import(
        /* @vite-ignore */ `data:application/javascript;base64,${b64Contents}`
      )) as {
        default: Rivet.RivetPluginInitializer;
      };

      if (typeof pluginInitializer.default !== 'function') {
        throw new Error(`Plugin ${spec.package}@${spec.tag} is not a function`);
      }

      const initializedPlugin = pluginInitializer.default(Rivet);

      return initializedPlugin;
    } catch (e) {
      throw new Error(`Error loading plugin: ${spec.package}@${spec.tag}: ${Rivet.getError(e).message}`);
    }
  };

  return {
    loadPackagePlugin,
    packageInstallLog,
    setPackageInstallLog,
  };
}
