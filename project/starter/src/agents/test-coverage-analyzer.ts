import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { TEST_COVERAGE_ANALYZER_PROMPT } from '../prompts/test-coverage-analyzer.prompt.js';

/**
 * Subagent responsible for test coverage analysis
 * and identifying untested execution paths.
 */
export const testCoverageAnalyzer: AgentDefinition = {
  description:
    'Analyzes source code and related tests to identify missing test coverage, untested paths, branches, edge cases, and testing priorities.',

  prompt: TEST_COVERAGE_ANALYZER_PROMPT,

  model: 'inherit',

  tools: [
    'Read',
    'Grep',
    'Glob',
    'Skill'
  ]
};