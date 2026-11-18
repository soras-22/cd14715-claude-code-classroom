import {
  ReviewReportSchema,
  ReviewReportJSONSchema,
  type ReviewReport
} from './types/report-types.js';
import { RateLimiter } from './utils/rate-limiter.js';
import type { RateLimiterConfig } from './utils/rate-limiter.js';

import { query } from '@anthropic-ai/claude-agent-sdk';

import {
  codeQualityAnalyzer,
  testCoverageAnalyzer,
  refactoringSuggester
} from './agents/index.js';

import { buildOrchestratorPrompt } from './prompts/index.js';

import { mcpServersConfig } from './config/mcp.config.js';


/**
 * Orchestrator configuration options
 */

export interface OrchestratorOptions {
  rateLimits?: Partial<RateLimiterConfig>;
}

/**
 * Main Code Review Orchestrator
 * Coordinates subagents to analyze pull requests and generate comprehensive reports
 */
export class CodeReviewOrchestrator {

  private readonly rateLimiter: RateLimiter;

  constructor(options: OrchestratorOptions = {}) {
    this.rateLimiter = new RateLimiter(options.rateLimits);
  }

  getRateLimitStatus(): ReturnType<RateLimiter['getStatus']> {
    return this.rateLimiter.getStatus();
  }

  async reviewPullRequest(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<ReviewReport> {
    await this.rateLimiter.acquire(10000);

    try {
      const result = query({
        prompt: buildOrchestratorPrompt(owner, repo, prNumber),
        options: {
          agents: {
            'code-quality-analyzer': codeQualityAnalyzer,
            'test-coverage-analyzer': testCoverageAnalyzer,
            'refactoring-suggester': refactoringSuggester
          },

          allowedTools: [
            'Task',
            'mcp__github__pull_request_read'
          ],

          mcpServers: mcpServersConfig,

          model: process.env.ANTHROPIC_MODEL,

          maxTurns: 30,

          permissionMode: 'bypassPermissions',

          outputFormat: {
            type: 'json_schema',
            schema: ReviewReportJSONSchema
          }
        }
      });

      // Result processing comes next.

      let structuredOutput: unknown;

      for await (const message of result) {

        if (
          message.type === 'result' &&
          message.subtype === 'success' &&
          message.structured_output
        ) {
          structuredOutput = message.structured_output;
        }
      }


      if (!structuredOutput) {
        throw new Error('Claude Agent SDK returned no structured output');
      }

      const validation = ReviewReportSchema.safeParse(structuredOutput);

      if (!validation.success) {
        throw new Error(
          `Structured output validation failed: ${validation.error.message}`
        );
      }

      return validation.data;

    } finally {
      this.rateLimiter.release();
    }
  }
}
