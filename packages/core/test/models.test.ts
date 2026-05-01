import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { openaiModels, openAiModelOptions } from '../src/utils/openai.js';
import { anthropicModels, anthropicModelOptions } from '../src/plugins/anthropic/anthropic.js';
import {
  generativeAiGoogleModels,
  generativeAiOptions,
  googleModelsDeprecated,
} from '../src/plugins/google/google.js';

describe('OpenAI models', () => {
  it('every model has required fields with valid values', () => {
    for (const [id, model] of Object.entries(openaiModels)) {
      assert.ok(model.displayName, `${id} missing displayName`);
      assert.ok(typeof model.maxTokens === 'number' && model.maxTokens > 0, `${id} has invalid maxTokens`);
      assert.ok(typeof model.cost.prompt === 'number', `${id} has invalid prompt cost`);
      assert.ok(typeof model.cost.completion === 'number', `${id} has invalid completion cost`);
      assert.ok(model.cost.prompt >= 0, `${id} has negative prompt cost`);
      assert.ok(model.cost.completion >= 0, `${id} has negative completion cost`);
    }
  });

  it('has no duplicate model IDs', () => {
    const ids = Object.keys(openaiModels);
    const unique = new Set(ids);
    assert.strictEqual(ids.length, unique.size, 'Duplicate OpenAI model IDs found');
  });

  it('dropdown options have no duplicates', () => {
    const values = openAiModelOptions.map((o) => o.value);
    assert.strictEqual(values.length, new Set(values).size, 'Duplicate dropdown values');
  });

  it('legacy models are sorted to the bottom of dropdown', () => {
    const legacyStart = openAiModelOptions.findIndex((o) => o.legacy);
    if (legacyStart === -1) return; // no legacy models, nothing to check
    const allAfterLegacyStart = openAiModelOptions.slice(legacyStart);
    assert.ok(
      allAfterLegacyStart.every((o) => o.legacy),
      'Non-legacy model found after first legacy model in dropdown',
    );
  });

  it('prompt cost is not accidentally a subtraction (regression for 0.25-6 vs 0.25e-6)', () => {
    for (const [id, model] of Object.entries(openaiModels)) {
      if (id === 'local-model') continue;
      assert.ok(model.cost.prompt < 1, `${id} prompt cost ${model.cost.prompt} looks too high — possible math error`);
      assert.ok(
        model.cost.completion < 1,
        `${id} completion cost ${model.cost.completion} looks too high — possible math error`,
      );
    }
  });
});

describe('Anthropic models', () => {
  it('every model has required fields with valid values', () => {
    for (const [id, model] of Object.entries(anthropicModels)) {
      assert.ok(model.displayName, `${id} missing displayName`);
      assert.ok(typeof model.maxTokens === 'number' && model.maxTokens > 0, `${id} has invalid maxTokens`);
      assert.ok(typeof model.cost.prompt === 'number', `${id} has invalid prompt cost`);
      assert.ok(typeof model.cost.completion === 'number', `${id} has invalid completion cost`);
      assert.ok(model.cost.prompt >= 0, `${id} has negative prompt cost`);
      assert.ok(model.cost.completion >= 0, `${id} has negative completion cost`);
    }
  });

  it('has no duplicate model IDs', () => {
    const ids = Object.keys(anthropicModels);
    assert.strictEqual(ids.length, new Set(ids).size, 'Duplicate Anthropic model IDs found');
  });

  it('legacy models are sorted to the bottom of dropdown', () => {
    const legacyStart = anthropicModelOptions.findIndex((o) => o.legacy);
    if (legacyStart === -1) return;
    const allAfterLegacyStart = anthropicModelOptions.slice(legacyStart);
    assert.ok(
      allAfterLegacyStart.every((o) => o.legacy),
      'Non-legacy model found after first legacy model in dropdown',
    );
  });
});

describe('Google Gemini models', () => {
  it('every generative AI model has required fields with valid values', () => {
    for (const [id, model] of Object.entries(generativeAiGoogleModels)) {
      assert.ok(model.displayName, `${id} missing displayName`);
      assert.ok(typeof model.maxTokens === 'number' && model.maxTokens > 0, `${id} has invalid maxTokens`);
      assert.ok(typeof model.cost.prompt === 'number', `${id} has invalid prompt cost`);
      assert.ok(typeof model.cost.completion === 'number', `${id} has invalid completion cost`);
    }
  });

  it('deprecated models still have required fields', () => {
    for (const [id, model] of Object.entries(googleModelsDeprecated)) {
      assert.ok(model.displayName, `${id} missing displayName`);
      assert.ok(typeof model.maxTokens === 'number' && model.maxTokens > 0, `${id} has invalid maxTokens`);
    }
  });

  it('has no duplicate model IDs', () => {
    const ids = Object.keys(generativeAiGoogleModels);
    assert.strictEqual(ids.length, new Set(ids).size, 'Duplicate Google model IDs found');
  });

  it('legacy models are sorted to the bottom of dropdown', () => {
    const legacyStart = generativeAiOptions.findIndex((o) => o.legacy);
    if (legacyStart === -1) return;
    const allAfterLegacyStart = generativeAiOptions.slice(legacyStart);
    assert.ok(
      allAfterLegacyStart.every((o) => o.legacy),
      'Non-legacy model found after first legacy model in dropdown',
    );
  });
});
