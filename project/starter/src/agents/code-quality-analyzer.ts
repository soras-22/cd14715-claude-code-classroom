import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { CODE_QUALITY_ANALYZER_PROMPT } from '../prompts/code-quality-analyzer.prompt.js';

/**
 * Subagent responsible for code quality, security,
 * performance and maintainability analysis.
 */
export const codeQualityAnalyzer: AgentDefinition = {
  description:
    'Analyzes source code for security vulnerabilities, performance issues, maintainability problems, bug risks, and best-practice violations.',

  prompt: CODE_QUALITY_ANALYZER_PROMPT,

  model: 'inherit',

  tools: [
  'Read',
  'Grep',
  'Glob',
  'Skill'
  ]
};