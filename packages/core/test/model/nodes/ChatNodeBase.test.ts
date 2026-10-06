import { it, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';
import { ChatNodeBase, type ChatNodeData } from '../../../src/model/nodes/ChatNodeBase.js';

/* eslint-disable @typescript-eslint/no-floating-promises */

describe('ChatNodeBase', () => {
  it('typechecks required tool choice configurations', () => {
    const configPath = fileURLToPath(new URL('../../../tsconfig.json', import.meta.url));
    const config = ts.readConfigFile(configPath, ts.sys.readFile);
    assert.equal(config.error, undefined);
    const { options } = ts.parseJsonConfigFileContent(config.config, ts.sys, dirname(configPath));
    const testPath = fileURLToPath(import.meta.url);
    const program = ts.createProgram([testPath], {
      ...options,
      noEmit: true,
      composite: false,
      rootDir: dirname(configPath),
    });
    const diagnostics = program.getSemanticDiagnostics(program.getSourceFile(testPath));
    assert.deepEqual(
      diagnostics.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')),
      [],
    );
  });

  it('accepts the required tool choice exposed by the editor', () => {
    const data: ChatNodeData = { ...ChatNodeBase.defaultData(), enableFunctionUse: true, toolChoice: 'required' };
    const editors = ChatNodeBase.getEditors();
    const toolChoice = editors
      .flatMap((editor) => (editor.type === 'group' ? editor.editors : [editor]))
      .find((editor) => editor.type === 'dropdown' && editor.dataKey === 'toolChoice');

    assert.ok(toolChoice?.type === 'dropdown');
    assert.ok(toolChoice.options.some((option) => option.value === data.toolChoice));
  });
});
