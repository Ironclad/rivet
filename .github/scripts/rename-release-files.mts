import { Octokit } from '@octokit/rest';

// Renames the release files to remove the version number from the file name,
// so that we have permalinks to the latest version of the files.

const { GITHUB_TOKEN, GITHUB_RELEASE_ID } = process.env;

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const owner = 'ironclad';
const repo = 'rivet';

if (GITHUB_TOKEN == null || GITHUB_RELEASE_ID == null) {
  throw new Error('GITHUB_TOKEN and GITHUB_RELEASE_ID must be set');
}

const { data: assets } = await octokit.repos.listReleaseAssets({
  owner,
  repo,
  release_id: parseInt(GITHUB_RELEASE_ID!, 10),
});

for (const asset of assets) {
  const file = asset.name;

  if (/[Rr]ivet_.*_(universal\.dmg|amd64\.AppImage|amd64\.deb|x64-setup.exe)$/.test(file)) {
    console.log(`Downloading ${file}...`);

    const assetResponse = await octokit.repos.getReleaseAsset({
      owner,
      repo,
      asset_id: asset.id,
      headers: {
        accept: 'application/octet-stream',
      },
    });
    const assetData = assetResponse.data as Buffer;

    let newFileName = file.replace(/_.*/, '') + '.' + file.split('.').pop();

    if (newFileName === 'Rivet.exe') {
      // good enough
      newFileName = 'Rivet-Setup.exe';
    }

    console.log(`Renamed ${file} to ${newFileName}`);

    const existingWithName = assets.find((a) => a.name === newFileName);
    if (existingWithName) {
      console.log(`Deleting existing asset ${newFileName}...`);
      await octokit.repos.deleteReleaseAsset({
        owner,
        repo,
        asset_id: existingWithName.id,
      });
    }

    try {
      console.log(`Uploading ${newFileName}...`);
      await octokit.repos.uploadReleaseAsset({
        owner,
        repo,
        release_id: parseInt(GITHUB_RELEASE_ID!, 10),
        headers: {
          'content-length': assetData.length,
          'content-type': 'application/octet-stream',
        },
        name: newFileName,
        data: assetData as unknown as string,
      });
    } catch (err) {
      console.error(`Failed to upload asset ${newFileName}: ${err.message}`);
    }
  }
}
