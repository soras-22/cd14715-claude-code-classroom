import { describe, expect, it, vi } from 'vitest';

const { mockQuery } = vi.hoisted(() => ({
  mockQuery: vi.fn()
}));

vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: mockQuery
}));

import { CodeReviewOrchestrator } from '../src/orchestrator.js';

const mockReviewReport = {
  pullRequest: {
    owner: 'udacity',
    repo: 'cd14715-simple-todo-app',
    number: 1
  },
  fileReviews: [],
  summary: {
    totalFiles: 0,
    overallScore: 100,
    criticalIssues: 0,
    highPriorityTests: 0,
    refactoringOpportunities: 0
  },
  recommendations: [],
  metadata: {
    analyzedAt: '2026-11-16T11:00:00Z',
    duration: 1000,
    agentVersions: {
      'code-quality-analyzer': '1.0',
      'test-coverage-analyzer': '1.0',
      'refactoring-suggester': '1.0'
    }
  }
};

function createMockQueryResult(structuredOutput: unknown) {
  return (async function* () {
    yield {
      type: 'result',
      subtype: 'success',
      structured_output: structuredOutput
    };
  })();
}

describe('CodeReviewOrchestrator', () => {
  describe('Configuration', () => {
    it('should initialize with default options', () => {
      const orchestrator = new CodeReviewOrchestrator();

      expect(orchestrator).toBeInstanceOf(CodeReviewOrchestrator);
    });

    it('should accept custom rate limit configuration', () => {
      const orchestrator = new CodeReviewOrchestrator({
        rateLimits: {
          maxRequestsPerMinute: 10,
          maxTokensPerMinute: 20000,
          maxConcurrent: 2
        }
      });

      expect(orchestrator).toBeInstanceOf(CodeReviewOrchestrator);
    });
  });

  describe('reviewPullRequest', () => {
    it('should fetch PR files from GitHub MCP', async () => {
      mockQuery.mockReturnValue(
        createMockQueryResult(mockReviewReport)
      );

      const orchestrator = new CodeReviewOrchestrator();

      await orchestrator.reviewPullRequest(
        'udacity',
        'cd14715-simple-todo-app',
        1
      );

      expect(mockQuery).toHaveBeenCalledOnce();

      const queryConfig = mockQuery.mock.calls[0]?.[0];

      expect(queryConfig?.options?.allowedTools).toContain(
        'mcp__github__pull_request_read'
      );
    });

    it('should configure all 3 subagents', async () => {
      mockQuery.mockReturnValue(
        createMockQueryResult(mockReviewReport)
      );

      const orchestrator = new CodeReviewOrchestrator();

      await orchestrator.reviewPullRequest(
        'udacity',
        'cd14715-simple-todo-app',
        1
      );

      const queryConfig = mockQuery.mock.calls.at(-1)?.[0];

      expect(queryConfig?.options?.agents).toHaveProperty(
        'code-quality-analyzer'
      );

      expect(queryConfig?.options?.agents).toHaveProperty(
        'test-coverage-analyzer'
      );

      expect(queryConfig?.options?.agents).toHaveProperty(
        'refactoring-suggester'
      );

      expect(queryConfig?.options?.allowedTools).toContain('Task');
    });

    it('should aggregate results into ReviewReport', async () => {
      mockQuery.mockReturnValue(
        createMockQueryResult(mockReviewReport)
      );

      const orchestrator = new CodeReviewOrchestrator();

      const result = await orchestrator.reviewPullRequest(
        'udacity',
        'cd14715-simple-todo-app',
        1
      );

      expect(result).toEqual(mockReviewReport);

      expect(result.pullRequest).toEqual({
        owner: 'udacity',
        repo: 'cd14715-simple-todo-app',
        number: 1
      });

      expect(result.summary).toEqual(mockReviewReport.summary);
      expect(result.recommendations).toEqual([]);
      expect(result.fileReviews).toEqual([]);
    });

    it('should validate output with Zod schema', async () => {
      const invalidReport = {
        pullRequest: {
          owner: 'udacity',
          repo: 'cd14715-simple-todo-app',
          number: 'invalid'
        },
        fileReviews: [],
        summary: {},
        recommendations: [],
        metadata: {}
      };

      mockQuery.mockReturnValue(
        createMockQueryResult(invalidReport)
      );

      const orchestrator = new CodeReviewOrchestrator();

      await expect(
        orchestrator.reviewPullRequest(
          'udacity',
          'cd14715-simple-todo-app',
          1
        )
      ).rejects.toThrow('Structured output validation failed');
    });


  });


  describe('Integration', () => {
    // These tests require actual API keys and should be skipped in CI
    it.skip('should review a real small PR', async () => {
      // TODO: Test with a real public PR
      // NOTE: Only run manually with valid API keys
    });
  });
});
