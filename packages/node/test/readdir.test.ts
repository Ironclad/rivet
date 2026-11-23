import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { matchesGlob } from '../src/native/NodeNativeApi.js';

describe('readdir glob matching on Windows paths', () => {
  it('matches filterGlobs and ignores against backslash-separated paths', () => {
    const winFiles = [
      'C:\\project\\app\\index.php',
      'C:\\project\\vendor\\lib\\foo.php',
      'C:\\project\\README.md',
    ];

    const filtered = winFiles
      .filter((f) => matchesGlob(f, '**/app/**/*.php'))
      .filter((f) => !matchesGlob(f, '**/vendor/**/*'));

    assert.deepEqual(filtered, ['C:\\project\\app\\index.php']);
  });

  it('excludes vendor files when filtering **/*.php on Windows paths', () => {
    const winFiles = [
      'C:\\project\\app\\index.php',
      'C:\\project\\vendor\\pkg\\helper.php',
    ];

    const filtered = winFiles
      .filter((f) => matchesGlob(f, '**/*.php'))
      .filter((f) => !matchesGlob(f, '**/vendor/**/*'));

    assert.deepEqual(filtered, ['C:\\project\\app\\index.php']);
  });
});
