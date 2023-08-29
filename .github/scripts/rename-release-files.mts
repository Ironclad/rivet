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
  const url = asset.browser_download_url;

  if (/[Rr]ivet_.*_(universal\.dmg|amd64\.AppImage|amd64\.deb)$/.test(file)) {
    const response = await fetch(url);
    const blob = await response.blob();

    const newFileName = file.replace(/_.*/, '') + '.' + file.split('.').pop();

    console.log(`Renamed ${file} to ${newFileName}`);

    try {
      await octokit.repos.uploadReleaseAsset({
        owner,
        repo,
        release_id: parseInt(GITHUB_RELEASE_ID!, 10),
        headers: {
          'content-length': blob.length,
          'content-type': 'application/octet-stream',
        },
        name: newFileName,
        data: Buffer.from(await blob.arrayBuffer()) as unknown as string,
      });
    } catch (err) {
      console.error(`Failed to upload asset ${newFileName}: ${err.message}`);
    }
  }
}
