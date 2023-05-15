import { readdir } from 'fs/promises';

async function printFolderTree(path: string, prefix = '', isLast = true) {
  const files = await readdir(path, { withFileTypes: true });

  const corner = isLast ? '└─' : '├─';
  const stem = isLast ? '   ' : '│  ';

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const stemPrefix = prefix + stem;
    const stemIsLast = i === files.length - 1;

    if (file.isDirectory()) {
      await printFolderTree(`${path}/${file.name}`, stemPrefix, stemIsLast);
    }
  }
}

printFolderTree('src');
