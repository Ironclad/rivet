import { cloneDeep } from 'lodash-es';

// @ts-ignore
import { language } from 'monaco-editor/esm/vs/basic-languages/markdown/markdown';

const markdownPromptInterpolationLanguage = cloneDeep(language);

markdownPromptInterpolationLanguage.tokenizer.root.unshift([/\{\{[^{}]+\}\}/, 'prompt-replacement']);

export { markdownPromptInterpolationLanguage as language };
