import { it, describe } from 'node:test';
import { strict as assert } from 'node:assert';

import {
  GovernanceNodeImpl,
  type GovernanceNode,
  PortId,
} from '../../../src/plugins/governance/nodes/GovernanceNode.js';

type GovernanceData = GovernanceNode['data'];

const createData = (data: Partial<GovernanceData>): GovernanceData => ({
  ...GovernanceNodeImpl.create().data,
  ...data,
});

const run = (data: Partial<GovernanceData>, text: string) =>
  GovernanceNodeImpl.process(createData(data), {
    ['text' as PortId]: { type: 'string', value: text },
  });

const SSN_TEXT = 'My SSN is 123-45-6789, email john@acme.com';
const CC_TEXT = 'My card is 4111 1111 1111 1111';
const CLEAN_TEXT = 'nothing sensitive here';

describe('GovernanceNode', () => {
  it('creates with expected defaults', () => {
    const node = GovernanceNodeImpl.create();
    assert.strictEqual(node.type, 'governancePIIScan');
    assert.strictEqual(node.data.mode, 'observe');
    assert.strictEqual(node.data.piiAction, 'detect');
  });

  it('redacts SSN and email in enforce mode', async () => {
    const { output, decision } = await run({ mode: 'enforce', piiCategories: ['SSN', 'Email'], piiAction: 'redact' }, SSN_TEXT);
    assert.strictEqual((output.value as string).includes('123-45-6789'), false);
    assert.strictEqual((output.value as string).includes('[REDACTED'), true);
    assert.strictEqual(decision.value ? decision.value.action : undefined, 'REDACT');
    assert.ok((decision.value!.findings as unknown[]).length > 0);
  });

  it('redacts credit card numbers (regression: tealtiger detectTypes keys are camelCase)', async () => {
    const { output, decision } = await run({ mode: 'enforce', piiCategories: ['CreditCard'], piiAction: 'redact' }, CC_TEXT);
    assert.strictEqual(output.value, 'My card is [REDACTED_CREDITCARD]');
    const findings = decision.value!.findings as Array<{ type: string; value: string }>;
    assert.ok(findings.some((f) => f.type === 'creditCard' && f.value === '4111 1111 1111 1111'));
  });
  it('normalizes free-text categories: "creditCard" (as typed in the UI stringList) still detects', async () => {
    // Regression: the UI PII Categories editor is a free-text string list; the
    // user typing 'creditCard' (lowercase) must map to detectType 'creditCard',
    // not be silently dropped (which let card numbers sail through).
    const { output, decision } = await run({ mode: 'enforce', piiCategories: ['creditCard' as never], piiAction: 'redact' }, CC_TEXT);
    assert.strictEqual(output.value, 'My card is [REDACTED_CREDITCARD]');
    assert.deepStrictEqual(decision.value!.detect_types, ['creditCard']);
    const findings = decision.value!.findings as Array<{ type: string }>;
    assert.ok(findings.some((f) => f.type === 'creditCard'));
  });

  it('normalizes casing/separator variants ("Credit Card", "credit_card", "api key")', async () => {
    for (const cats of [['Credit Card'], ['credit_card'], ['Credit-Card']] as never[]) {
      const { output, decision } = await run({ mode: 'enforce', piiCategories: cats, piiAction: 'redact' }, CC_TEXT);
      assert.strictEqual((output.value as string).includes('[REDACTED_CREDITCARD]'), true, `"${cats[0]}" must still redact`);
      assert.deepStrictEqual(decision.value!.unknown_categories, []);
    }
    for (const cats of [['api key'], ['API-Key'], ['APIKEY']] as never[]) {
      // outputAuthZ disabled: with it on, enforce + API key blocks (empty output) by design
      const { output, decision } = await run({ mode: 'enforce', piiCategories: cats, piiAction: 'redact', outputAuthZ: false }, 'use key sk-proj-abcdefghijklmnopqrstuvwx');
      assert.strictEqual((output.value as string).includes('[REDACTED_OPENAI_API_KEY]'), true, `"${cats[0]}" must still redact`);
      assert.deepStrictEqual(decision.value!.unknown_categories, []);
    }
  });

  it('surfaces unknown categories in the decision instead of silently dropping them', async () => {
    const { decision } = await run(
      { mode: 'enforce', piiCategories: ['SSN', 'banana' as never], piiAction: 'detect' },
      SSN_TEXT,
    );
    assert.deepStrictEqual(decision.value!.unknown_categories, ['banana']);
    assert.deepStrictEqual(decision.value!.detect_types, ['ssn']);
    assert.ok((decision.value!.findings as unknown[]).length > 0, 'known categories must keep working');
  });

  it('renders exactly one toggle editor for Output Authorization (no use-input toggle pair)', () => {
    // Regression: the editor once declared useInputToggleDataKey: 'outputAuthZ',
    // which made Rivet render a second "use an input port" switch next to the
    // real one — both bound to the same dataKey, so clicking either flipped both.
    const editors = GovernanceNodeImpl.getEditors(GovernanceNodeImpl.create().data);
    const toggleEditors = editors.filter((e) => e.type === 'toggle');
    assert.strictEqual(toggleEditors.length, 1, 'must have exactly one toggle editor');
    assert.strictEqual(
      'useInputToggleDataKey' in toggleEditors[0],
      false,
      'toggle editor must not declare useInputToggleDataKey (causes the switch pair)',
    );
  });

  it('detect action reports findings but passes text through', async () => {
    const { output, decision } = await run({ mode: 'enforce', piiCategories: ['SSN'], piiAction: 'detect' }, SSN_TEXT);
    assert.strictEqual(output.value, SSN_TEXT);
    assert.strictEqual(decision.value!.action, 'ALLOW');
    assert.ok((decision.value!.findings as unknown[]).length > 0);
  });

  it('block action empties output and sets blocked', async () => {
    const { output, blocked, decision } = await run({ mode: 'enforce', piiCategories: ['SSN'], piiAction: 'block' }, SSN_TEXT);
    assert.strictEqual(output.value, '');
    assert.strictEqual(blocked.value, true);
    assert.strictEqual(decision.value!.action, 'DENY');
  });

  it('observe mode fails open: never transforms or blocks, but still reports', async () => {
    const { output, blocked, decision } = await run({ mode: 'observe', piiCategories: ['SSN'], piiAction: 'block' }, SSN_TEXT);
    assert.strictEqual(output.value, SSN_TEXT);
    assert.strictEqual(blocked.value, false);
    assert.strictEqual(decision.value!.action, 'ALLOW');
    assert.strictEqual(decision.value!.mode, 'observe');
  });

  it('redacts locally-detected API keys (not covered by tealtiger)', async () => {
    const { output, decision } = await run(
      { mode: 'enforce', piiCategories: ['APIKey'], piiAction: 'redact' },
      'use key sk-proj-abcdefghijklmnopqrstuvwx',
    );
    assert.strictEqual((output.value as string).includes('sk-proj-abcdefghijklmnopqrstuvwx'), false);
    assert.ok((decision.value!.findings as Array<{ type: string }>).some((f) => f.type === 'APIKey'));
  });

  it('redacts multiple provider API key formats and reports every match', async () => {
    const text = 'aws AKIAIOSFODNN7EXAMPLE and github ghp_abcdefghijklmnopqrstuvwxyz0123456789 and sk-ant-api03-abcdefghijklmnopqrstuvwx';
    const { output, decision } = await run({ mode: 'enforce', piiCategories: ['APIKey'], piiAction: 'redact', outputAuthZ: false }, text);
    const out = output.value as string;
    assert.strictEqual(out.includes('AKIAIOSFODNN7EXAMPLE'), false);
    assert.strictEqual(out.includes('ghp_abcdefghijklmnopqrstuvwxyz0123456789'), false);
    assert.strictEqual(out.includes('sk-ant-api03'), false);
    assert.strictEqual(out.includes('REDACTED_AWS_API_KEY'), true);
    assert.strictEqual(out.includes('REDACTED_GITHUB_API_KEY'), true);
    assert.strictEqual(out.includes('REDACTED_ANTHROPIC_API_KEY'), true);
    const findings = decision.value!.findings as Array<{ type: string }>;
    assert.strictEqual(findings.filter((f) => f.type === 'APIKey').length, 3);
  });

  it('does NOT flag long non-secret tokens (length-only false positives)', async () => {
    const text = 'the internationalization token and digest a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0 must pass through';
    const { output, blocked, decision } = await run(
      { mode: 'enforce', piiCategories: ['APIKey'], piiAction: 'redact', outputAuthZ: true },
      text,
    );
    assert.strictEqual(output.value, text);
    assert.strictEqual(blocked.value, false);
    assert.strictEqual((decision.value!.findings as unknown[]).length, 0);
    assert.strictEqual(decision.value!.action, 'ALLOW');
  });

  it('monitor mode records findings but never transforms or blocks (PII block action)', async () => {
    const { output, blocked, decision } = await run({ mode: 'monitor', piiCategories: ['SSN'], piiAction: 'block' }, SSN_TEXT);
    assert.strictEqual(output.value, SSN_TEXT);
    assert.strictEqual(blocked.value, false);
    assert.strictEqual(decision.value!.mode, 'monitor');
    assert.ok((decision.value!.findings as unknown[]).length > 0, 'monitor must still report findings');
    assert.strictEqual(decision.value!.action, 'ALLOW');
  });

  it('monitor mode does not block on Output AuthZ API keys (records but allows)', async () => {
    const text = 'use key sk-proj-abcdefghijklmnopqrstuvwx';
    const { output, blocked, decision } = await run(
      { mode: 'monitor', piiCategories: ['APIKey'], piiAction: 'detect', outputAuthZ: true },
      text,
    );
    assert.strictEqual(output.value, text);
    assert.strictEqual(blocked.value, false);
    assert.ok((decision.value!.findings as Array<{ type: string }>).some((f) => f.type === 'APIKey'));
    assert.strictEqual(decision.value!.action, 'ALLOW');
  });

  it('reports meaningful per-type risk scores (email=30, not a hardcoded 90)', async () => {
    const { decision } = await run({ mode: 'enforce', piiCategories: ['Email'], piiAction: 'detect' }, 'contact me at john@acme.com');
    const findings = decision.value!.findings as Array<{ riskScore: number }>;
    assert.ok(findings.length > 0);
    assert.strictEqual(decision.value!.risk_score, 30);
  });

  it('generates unique correlation_ids across runs', async () => {
    const a = await run({ mode: 'enforce', piiCategories: ['Email'], piiAction: 'detect' }, 'a@b.co');
    const b = await run({ mode: 'enforce', piiCategories: ['Email'], piiAction: 'detect' }, 'a@b.co');
    const idA = (a.decision.value as { correlation_id: string }).correlation_id;
    const idB = (b.decision.value as { correlation_id: string }).correlation_id;
    assert.notStrictEqual(idA, idB);
    assert.match(idA, /^gov-/);
  });

  it('allows clean text through with zero findings', async () => {
    const { output, blocked, decision } = await run({ mode: 'enforce', piiCategories: ['SSN', 'CreditCard'], piiAction: 'redact' }, CLEAN_TEXT);
    assert.strictEqual(output.value, CLEAN_TEXT);
    assert.strictEqual(blocked.value, false);
    assert.strictEqual(decision.value!.action, 'ALLOW');
    assert.strictEqual(decision.value!.risk_score, 0);
  });
});
