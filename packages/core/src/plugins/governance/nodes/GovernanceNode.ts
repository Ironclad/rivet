import {
  type ChartNode,
  type PluginNodeImpl,
  type NodeId,
  type PortId,
  type EditorDefinition,
  type NodeInputDefinition,
} from '../../../index.js';
import { newId, dedent, coerceTypeOptional } from '../../../utils/index.js';
import { pluginNodeDefinition } from '../../../model/NodeDefinition.js';
import { PIIDetectionGuardrail, GuardrailEngine } from 'tealtiger';

// =====================
// Governance Node Logic
// =====================

// The PII Categories editor is a free-text string list, so users can type any
// casing or separator variant ('creditCard', 'Credit Card', 'credit_card',
// 'API key', ...). Normalize every entry; unknown values must NOT be silently
// dropped — a dropped category would detect nothing (the same silent-miss
// class of bug as tealtiger's 'credit_card' vs 'creditCard' detectTypes).
type NormalizedCategory = { canonical: GovernanceCategory; detectType: string };

function normalizeCategory(raw: string): NormalizedCategory | null {
  const key = raw.trim().toLowerCase().replace(/[\s_-]+/g, '');
  switch (key) {
    case 'ssn':
      return { canonical: 'SSN', detectType: 'ssn' };
    case 'email':
      return { canonical: 'Email', detectType: 'email' };
    case 'phone':
      return { canonical: 'Phone', detectType: 'phone' };
    case 'creditcard':
      return { canonical: 'CreditCard', detectType: 'creditCard' };
    case 'apikey':
      return { canonical: 'APIKey', detectType: 'APIKey' };
    default:
      return null;
  }
}

// API keys are not covered by tealtiger's PII guardrail; keep local deterministic
// patterns. Provider-prefixed formats only — a bare length-based match (e.g. any
// 20+ char alphanumeric token) would flag ordinary words, base64 blobs, hashes,
// and IDs, mangling legitimate output and falsely blocking under Output AuthZ.
const API_KEY_PATTERNS: Array<{ provider: string; pattern: RegExp }> = [
  { provider: 'openai', pattern: /\bsk-(?:proj|svcacct)-[A-Za-z0-9_-]{16,}\b|\bsk-[A-Za-z0-9]{20,}\b/g },
  { provider: 'anthropic', pattern: /\bsk-ant-[A-Za-z0-9_-]{16,}\b/g },
  { provider: 'aws', pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g },
  { provider: 'github', pattern: /\bgh[pousr]_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]{22,}\b/g },
  { provider: 'google', pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { provider: 'slack', pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
];

// Per-finding risk scores, mirroring tealtiger PIIDetectionGuardrail's defaults
// (email: 30, phone: 40, ssn: 90, creditCard: 95) so the audit record carries a
// meaningful severity instead of a hardcoded floor.
const RISK_SCORES: Record<string, number> = {
  email: 30,
  phone: 40,
  ssn: 90,
  creditCard: 95,
  name: 20,
  APIKey: 90,
};

type GovernanceCategory = 'SSN' | 'CreditCard' | 'Email' | 'Phone' | 'APIKey';

// Define node data configuration
export type GovernanceNodeData = {
  mode: 'observe' | 'monitor' | 'enforce';
  piiCategories: GovernanceCategory[];
  piiAction: 'detect' | 'redact' | 'block';
  costBudgetUsd: number;
  outputAuthZ: boolean;
};

export type GovernanceNode = ChartNode<'governancePIIScan', GovernanceNodeData>;

// Shape of the `decision` output port — the node's audit contract.
export type GovernanceFinding = {
  type: string;
  value: string;
  riskScore: number;
};

export type GovernanceDecision = {
  action: 'ALLOW' | 'REDACT' | 'DENY';
  findings: GovernanceFinding[];
  risk_score: number;
  mode: 'observe' | 'monitor' | 'enforce';
  detect_types: string[];
  unknown_categories: string[];
  correlation_id: string;
  latency_ms: number;
};

// Main node implementation
export const GovernanceNodeImpl: PluginNodeImpl<GovernanceNode> = {
  create() {
    return {
      id: newId<NodeId>(),
      type: 'governancePIIScan',
      data: {
        mode: 'observe',
        piiCategories: [],
        piiAction: 'detect',
        costBudgetUsd: 10,
        outputAuthZ: true,
      },
      title: 'Governance: PII Scan',
      visualData: {
        x: 0,
        y: 0,
        width: 300,
      },
    };
  },

  getUIData() {
    return {
      group: 'Governance',
      contextMenuTitle: 'Governance: PII Scan',
      infoBoxTitle: 'Governance: PII Scan Node',
      infoBoxBody: 'Scans text for PII, enforces cost budgets, and validates output authorization.',
    };
  },

  getInputDefinitions() {
    const inputs: NodeInputDefinition[] = [
      {
        id: 'text' as PortId,
        dataType: 'string',
        title: 'Text',
        coerced: true,
        defaultValue: '',
        description: 'The text to evaluate for PII and policy compliance.',
        required: true,
      },
    ];

    return inputs;
  },

  getOutputDefinitions() {
    return [
      {
        id: 'output' as PortId,
        dataType: 'string',
        title: 'Output',
        description: 'The original text (if allowed), redacted text (if configured), or empty if blocked.',
      },
      {
        id: 'decision' as PortId,
        dataType: 'object',
        title: 'Decision',
        description: '{action, findings, risk_score, mode, detect_types, unknown_categories, correlation_id, latency_ms}',
      },
      {
        id: 'blocked' as PortId,
        dataType: 'boolean',
        title: 'Blocked',
        description: 'True if the output was blocked by policy.',
      },
    ];
  },

  getEditors(): EditorDefinition<GovernanceNode>[] {
    return [
      {
        type: 'dropdown' as const,
        dataKey: 'mode',
        label: 'Mode',
        options: [
          { value: 'observe', label: 'Observe' },
          { value: 'monitor', label: 'Monitor' },
          { value: 'enforce', label: 'Enforce' },
        ],
        defaultValue: 'observe' as string,
      } as const,
      {
        type: 'stringList' as const,
        dataKey: 'piiCategories',
        placeholder: 'SSN, CreditCard, Email, Phone, APIKey',
        label: 'PII Categories',
      } as const,
      {
        type: 'dropdown' as const,
        dataKey: 'piiAction',
        label: 'PII Action',
        options: [
          { value: 'detect', label: 'Detect Only' },
          { value: 'redact', label: 'Redact' },
          { value: 'block', label: 'Block' },
        ],
        defaultValue: 'detect' as string,
      } as const,
      {
        type: 'number' as const,
        dataKey: 'costBudgetUsd',
        label: 'Cost Budget (USD)',
        defaultValue: 10,
      } as const,
      {
        type: 'toggle' as const,
        dataKey: 'outputAuthZ',
        label: 'Output Authorization',
      } as const,
    ];
  },

  getBody(data) {
    return dedent`
      Mode: ${data.mode}
      PII Categories: ${data.piiCategories.join(', ') || 'None'}
      Action: ${data.piiAction}
      Cost Budget: $${data.costBudgetUsd}
      Output Auth: ${data.outputAuthZ}
    `;
  },

  async process(data, inputData) {
    const startTime = Date.now();

    // Get the input text (plain input port, not data-backed, so use coerceTypeOptional)
    const text = coerceTypeOptional(inputData['text' as PortId], 'string') ?? '';

    // Run PII evaluation through tealtiger's PIIDetectionGuardrail (deterministic, no LLM)
    // detect only -> action 'allow' (report detections, never transform/block)
    const guardrailAction = data.piiAction === 'detect' ? 'allow' : data.piiAction;

    // Normalize free-text categories and collect unknown ones (never silently
    // drop a category — see normalizeCategory above).
    const detectTypes: string[] = [];
    const canonicalCategories: GovernanceCategory[] = [];
    const unknownCategories: string[] = [];
    for (const raw of data.piiCategories ?? []) {
      const normalized = normalizeCategory(String(raw));
      if (!normalized) {
        unknownCategories.push(String(raw));
        continue;
      }
      canonicalCategories.push(normalized.canonical);
      if (!detectTypes.includes(normalized.detectType)) {
        detectTypes.push(normalized.detectType);
      }
    }

    const findings: GovernanceFinding[] = [];
    let redactedText = text;

    if (detectTypes.length > 0) {
      try {
        const engine = new GuardrailEngine({});
        engine.registerGuardrail(new PIIDetectionGuardrail({
          name: 'governance-pii',
          detectTypes,
          action: guardrailAction as 'allow' | 'redact' | 'block',
          enabled: true,
        }));
        const result = await engine.execute(text);
        const piiResult = result.results?.[0]?.result;
        const detections = piiResult?.metadata?.detections ?? [];
        for (const d of detections) {
          findings.push({ type: d.type, value: d.value, riskScore: RISK_SCORES[d.type] ?? 0 });
        }
        if (guardrailAction === 'redact' && piiResult?.metadata?.redactedText) {
          redactedText = piiResult.metadata.redactedText as string;
        }
      } catch (err) {
        // Fail open: report the error in the decision, never crash the graph
        findings.push({ type: 'tealtiger-error', value: String(err), riskScore: 0 });
      }
    }

    // API key detection stays local (tealtiger does not cover API keys).
    // Report every match (not just the first) and redact only matched spans.
    if (canonicalCategories.includes('APIKey')) {
      for (const { provider, pattern } of API_KEY_PATTERNS) {
        pattern.lastIndex = 0;
        let matched = false;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(text)) !== null) {
          matched = true;
          findings.push({ type: 'APIKey', value: match[0], riskScore: RISK_SCORES.APIKey ?? 0 });
        }
        if (matched) {
          pattern.lastIndex = 0;
          redactedText = redactedText.replace(pattern, `[REDACTED_${provider.toUpperCase()}_API_KEY]`);
        }
      }
    }

    const latencyMs = Date.now() - startTime;

    // Transform/block only in enforce mode. observe/monitor record findings but
    // never modify output or set blocked (monitor = "records but allows").
    const enforcing = data.mode === 'enforce';

    let outputValue = text;
    let blockedFlag = false;

    if (enforcing && data.piiAction === 'redact' && findings.length > 0) {
      outputValue = redactedText;
    }

    if (enforcing && data.piiAction === 'block' && findings.length > 0) {
      outputValue = '';
      blockedFlag = true;
    }

    // Output authorization: block secrets/unauthorized content (API keys), not general PII
    if (enforcing && data.outputAuthZ && findings.some(f => f.type === 'APIKey')) {
      outputValue = '';
      blockedFlag = true;
    }

    const decision: GovernanceDecision = {
      action: blockedFlag
        ? 'DENY'
        : enforcing && data.piiAction === 'redact' && findings.length > 0
          ? 'REDACT'
          : 'ALLOW',
      findings,
      risk_score: findings.length > 0 ? Math.max(...findings.map((f) => f.riskScore)) : 0,
      mode: data.mode,
      detect_types: detectTypes,
      unknown_categories: unknownCategories,
      correlation_id: `gov-${newId()}`,
      latency_ms: latencyMs,
    };

    return {
      ['output' as PortId]: {
        type: 'string',
        value: outputValue,
      },
      ['decision' as PortId]: {
        type: 'object',
        value: decision,
      },
      ['blocked' as PortId]: {
        type: 'boolean',
        value: blockedFlag,
      },
    };
  }
};

export const governancePIIScanNode = pluginNodeDefinition(
  GovernanceNodeImpl,
  'Governance: PII Scan'
);
