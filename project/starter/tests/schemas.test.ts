import { describe, expect, it } from 'vitest';

import {
    CodeQualityResultSchema,
    TestCoverageResultSchema,
    RefactoringSuggestionSchema,
    CodeQualityResultJSONSchema,
    TestCoverageResultJSONSchema,
    RefactoringSuggestionJSONSchema
} from '../src/types/analysis-results.js';

import {
    ReviewReportSchema,
    ReviewReportJSONSchema
} from '../src/types/report-types.js';

describe('CodeQualityResultSchema', () => {
    it('should accept valid code quality data', () => {
        const validData = {
            file: 'src/example.ts',
            issues: [
                {
                    line: 10,
                    severity: 'high',
                    category: 'security',
                    description: 'Potential security vulnerability',
                    suggestion: 'Validate and sanitize the input'
                }
            ],
            overallScore: 85,
            summary: 'Code quality is generally good with one security issue.'
        };

        expect(() => CodeQualityResultSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid code quality data', () => {
        const invalidData = {
            file: 'src/example.ts',
            issues: [
                {
                    line: 'ten',
                    severity: 'urgent',
                    category: 'security',
                    description: 'Invalid test issue'
                }
            ],
            overallScore: 150,
            summary: 'Invalid result'
        };

        expect(() => CodeQualityResultSchema.parse(invalidData)).toThrow();
    });

    it('should accept boundary scores and empty issues', () => {
        const scoreZero = {
            file: 'src/example.ts',
            issues: [],
            overallScore: 0,
            summary: 'Minimum score'
        };

        const scoreOneHundred = {
            file: 'src/example.ts',
            issues: [],
            overallScore: 100,
            summary: 'Maximum score'
        };

        expect(() => CodeQualityResultSchema.parse(scoreZero)).not.toThrow();
        expect(() => CodeQualityResultSchema.parse(scoreOneHundred)).not.toThrow();
    });
});

describe('TestCoverageResultSchema', () => {
    it('should accept valid test coverage data', () => {
        const validData = {
            file: 'src/example.ts',
            hasTests: true,
            testFiles: ['tests/example.test.ts'],
            untestedPaths: [
                {
                    type: 'branch',
                    location: 'src/example.ts:25',
                    priority: 'high',
                    reasoning: 'Error handling branch is not tested',
                    suggestedTest: 'Add a test that verifies the error path'
                }
            ],
            coverageEstimate: 75,
            summary: 'Most main paths are tested, but an important branch is missing.'
        };

        expect(() => TestCoverageResultSchema.parse(validData)).not.toThrow();
    });
    it('should reject invalid test coverage data', () => {
        const invalidData = {
            file: 'src/example.ts',
            hasTests: 'yes',
            testFiles: [],
            untestedPaths: [
                {
                    type: 'method',
                    location: 'src/example.ts:25',
                    priority: 'urgent',
                    reasoning: 'Missing coverage'
                }
            ],
            coverageEstimate: 120,
            summary: 'Invalid coverage result'
        };

        expect(() => TestCoverageResultSchema.parse(invalidData)).toThrow();
    });
    it('should accept boundary coverage and empty arrays', () => {
        const zeroCoverage = {
            file: 'src/example.ts',
            hasTests: false,
            testFiles: [],
            untestedPaths: [],
            coverageEstimate: 0,
            summary: 'No test coverage'
        };

        const fullCoverage = {
            file: 'src/example.ts',
            hasTests: true,
            testFiles: ['tests/example.test.ts'],
            untestedPaths: [],
            coverageEstimate: 100,
            summary: 'Full test coverage'
        };

        expect(() => TestCoverageResultSchema.parse(zeroCoverage)).not.toThrow();
        expect(() => TestCoverageResultSchema.parse(fullCoverage)).not.toThrow();
    });
});

describe('RefactoringSuggestionSchema', () => {
    it('should accept valid refactoring data', () => {
        const validData = {
            file: 'src/example.ts',
            suggestions: [
                {
                    type: 'extract-function',
                    location: 'src/example.ts:20-35',
                    impact: 'medium',
                    description: 'Extract complex logic into a separate function',
                    before: 'function process() { /* complex logic */ }',
                    after: 'function process() { validateInput(); }',
                    benefits: 'Improves readability, maintainability, and testability'
                }
            ],
            summary: 'One useful refactoring opportunity was identified.'
        };

        expect(() =>
            RefactoringSuggestionSchema.parse(validData)
        ).not.toThrow();
    });
    it('should reject invalid refactoring data', () => {
        const invalidData = {
            file: 'src/example.ts',
            suggestions: [
                {
                    type: 'rewrite-everything',
                    location: 'src/example.ts:20',
                    impact: 'critical',
                    description: 'Invalid refactoring suggestion',
                    before: 'old code',
                    after: 'new code'
                }
            ],
            summary: 'Invalid refactoring result'
        };

        expect(() => RefactoringSuggestionSchema.parse(invalidData)).toThrow();
    });
    it('should accept empty suggestions array', () => {
        const validData = {
            file: 'src/example.ts',
            suggestions: [],
            summary: 'No refactoring opportunities identified.'
        };

        expect(() => RefactoringSuggestionSchema.parse(validData)).not.toThrow();
    });
});

describe('ReviewReportSchema', () => {
    it('should accept a valid review report', () => {
        const validReport = {
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
                duration: 1500,
                agentVersions: {
                    'code-quality-analyzer': '1.0',
                    'test-coverage-analyzer': '1.0',
                    'refactoring-suggester': '1.0'
                }
            }
        };

        expect(() => ReviewReportSchema.parse(validReport)).not.toThrow();
    });
    it('should reject an invalid review report', () => {
        const invalidReport = {
            pullRequest: {
                owner: 'udacity',
                repo: 'cd14715-simple-todo-app',
                number: 'one'
            },
            fileReviews: [],
            summary: {
                totalFiles: 0,
                overallScore: 100
            },
            recommendations: [],
            metadata: {
                analyzedAt: '2026-11-16T11:00:00Z',
                duration: '1500'
            }
        };

        expect(() => ReviewReportSchema.parse(invalidReport)).toThrow();
    });
});

describe('JSON Schema exports', () => {
    it('should export valid JSON schemas', () => {
        expect(CodeQualityResultJSONSchema).toBeDefined();
        expect(TestCoverageResultJSONSchema).toBeDefined();
        expect(RefactoringSuggestionJSONSchema).toBeDefined();
        expect(ReviewReportJSONSchema).toBeDefined();

        expect(typeof CodeQualityResultJSONSchema).toBe('object');
        expect(typeof TestCoverageResultJSONSchema).toBe('object');
        expect(typeof RefactoringSuggestionJSONSchema).toBe('object');
        expect(typeof ReviewReportJSONSchema).toBe('object');
    });

    it('should include required properties', () => {
        expect(CodeQualityResultJSONSchema).toHaveProperty('properties');
        expect(TestCoverageResultJSONSchema).toHaveProperty('properties');
        expect(RefactoringSuggestionJSONSchema).toHaveProperty('properties');
        expect(ReviewReportJSONSchema).toHaveProperty('properties');
    });
});