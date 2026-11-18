import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { REFACTORING_SUGGESTER_PROMPT } from '../prompts/refactoring-suggester.prompt.js';

/**
 * Subagent responsible for identifying safe refactoring
 * and modernization opportunities.
 */
export const refactoringSuggester: AgentDefinition = {
  description:
    'Analyzes source code for safe refactoring, modernization, simplification, naming, extraction, and design-pattern improvements.',

  prompt: REFACTORING_SUGGESTER_PROMPT,

  model: 'inherit',

  tools: [
    'Read',
    'Grep',
    'Glob'
  ]
};