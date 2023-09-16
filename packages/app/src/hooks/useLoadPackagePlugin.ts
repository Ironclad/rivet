import { PackagePluginLoadSpec } from '../../../core/src/model/PluginLoadSpec';
import { appLocalDataDir, join } from '@tauri-apps/api/path';
import { readDir, exists, readTextFile, writeBinaryFile, createDir } from '@tauri-apps/api/fs';
import { ResponseType, fetch, getClient } from '@tauri-apps/api/http';
import { RivetPlugin } from '@ironclad/rivet-core';
import { invoke } from '@tauri-apps/api/tauri';
import * as Rivet from '@ironclad/rivet-core';

export function useLoadPackagePlugin() {
  return async (spec: PackagePluginLoadSpec): Promise<RivetPlugin> => {
    const localDataDir = await appLocalDataDir();

    const pluginDir = await join(localDataDir, `plugins/${spec.package}-${spec.tag}`);
    const pluginFilesPath = await join(pluginDir, 'package');

    let needsReinstall = false;

    try {
      if (await exists(pluginFilesPath)) {
        const packageJson = await join(pluginFilesPath, 'package.json');

        if (await exists(packageJson)) {
          console.log(`Checking for plugin updates: ${spec.package}@${spec.tag}`);
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

          if (version !== latestVersion) {
            needsReinstall = true;
          }
        }
      } else {
        needsReinstall = true;
      }
    } catch (err) {
      needsReinstall = true;
    }

    if (!(await exists(pluginFilesPath))) {
      console.log(`Plugin not found locally: ${spec.package}@${spec.tag}, downloading from NPM...`);

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

      console.log(`Downloading plugin tarball from NPM: ${tarball}`);

      const client = await getClient();
      const tarballData = await client.get<unknown>(tarball, {
        headers: {
          Accept: 'application/octet-stream',
        },
        responseType: ResponseType.Binary,
      });

      console.log(`Downloaded plugin tarball from NPM: ${tarball}`);

      const tarDestination = await join(pluginDir, 'package.tgz');
      const data = new Uint8Array(tarballData.data as number[]);

      await createDir(pluginDir, {
        recursive: true,
      });

      await writeBinaryFile(tarDestination, data);

      await invoke('extract_package_plugin_tarball', {
        path: tarDestination,
      });
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
      const pluginInitializer = (await import(`data:application/javascript;base64,${b64Contents}`)) as {
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
}
