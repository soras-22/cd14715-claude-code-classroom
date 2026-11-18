import * as dotenv from 'dotenv';
import { CodeReviewOrchestrator } from './orchestrator.js';
import { ReportGenerator } from './utils/report-generator.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { formatError } from './utils/error-handler.js';


// Load environment variables
dotenv.config();

/**
 * Main entry point for the Claude Multi-Agent Code Review System
 * Usage: npm run dev <owner> <repo> <pr-number>
 */
async function main() {
  const [owner, repo, prStr] = process.argv.slice(2);

  // TODO: Validate command line arguments
  // - Check if owner, repo, and prStr are provided
  // - Convert prStr to number and validate it's a valid integer
  // - Exit with error message if validation fails

  if (!owner || !repo || !prStr) {
    console.error('Usage: npm run dev -- <owner> <repo> <pr-number>');
    process.exit(1);
  }

  const prNumber = parseInt(prStr, 10);

  if (isNaN(prNumber) || prNumber <= 0) {
    console.error('PR number must be a positive integer');
    process.exit(1);
  }


  // TODO: Validate authentication (choose ONE method)
  // Students must have either:
  //   - ANTHROPIC_API_KEY environment variable, OR
  //   - AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY for Bedrock
  //
  // If using AWS Bedrock:
  //   - Verify AWS_REGION is set
  //   - Log: "🔐 Using AWS Bedrock authentication"
  // If using Anthropic API:
  //   - Log: "🔐 Using Anthropic API authentication"
  // If neither method is configured:
  //   - Exit with clear error message showing both options

  const hasAnthropicAPI = !!process.env.ANTHROPIC_API_KEY;

  const hasAWSCredentials = !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  );

  if (!hasAnthropicAPI && !hasAWSCredentials) {
   console.error('Authentication required. Set one of:');
   console.error('  - ANTHROPIC_API_KEY, or');
   console.error('  - AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY + AWS_REGION');
   process.exit(1);
  }

  if (hasAWSCredentials && !process.env.AWS_REGION) {
    console.error('AWS_REGION is required when using AWS Bedrock authentication');
    process.exit(1);
  }

  console.log(
    `Using ${hasAnthropicAPI ? 'Anthropic API' : 'AWS Bedrock'} authentication`
  );

  // TODO: Validate ANTHROPIC_MODEL environment variable
  // This is REQUIRED for both authentication methods
  // - For AWS Bedrock: us.anthropic.claude-sonnet-4-5-20250929-v1:0
  // - For Anthropic API: claude-sonnet-4-5-20250929
  // Exit with error if not set

const model = process.env.ANTHROPIC_MODEL;

  if (!model) {
    console.error('ANTHROPIC_MODEL is required.');
    console.error('Set ANTHROPIC_MODEL in your .env file.');
   console.error('For Anthropic API, use a valid Claude model identifier.');
   console.error('For AWS Bedrock, use the appropriate Bedrock model identifier.');
   process.exit(1);
  }

console.log(`Using model: ${model}`);

  console.log('start here', owner, repo, prStr)
  try {
    const orchestrator = new CodeReviewOrchestrator();

    console.log(`Reviewing ${owner}/${repo} PR #${prNumber}...`);

    const report = await orchestrator.reviewPullRequest(
      owner,
      repo,
      prNumber
    );

    console.log('Code review completed successfully');
    const reportGenerator = new ReportGenerator();

const reportsDir = join(process.cwd(), 'reports');
await mkdir(reportsDir, { recursive: true });

const baseName = `${owner}_${repo}_${prNumber}`;

const markdownPath = join(reportsDir, `${baseName}.md`);
const htmlPath = join(reportsDir, `${baseName}.html`);
const jsonPath = join(reportsDir, `${baseName}.json`);

await Promise.all([
  writeFile(
    markdownPath,
    reportGenerator.generateMarkdownReport(report),
    'utf8'
  ),
  writeFile(
    htmlPath,
    reportGenerator.generateHTMLReport(report),
    'utf8'
  ),
  writeFile(
    jsonPath,
    reportGenerator.generateJSONReport(report),
    'utf8'
  )
]);

console.log('Reports generated successfully:');
console.log(`  Markdown: ${markdownPath}`);
console.log(`  HTML: ${htmlPath}`);
console.log(`  JSON: ${jsonPath}`);
  } catch (error) {
  console.error(`Code review failed: ${formatError(error)}`);
  process.exitCode = 1;
  }
}

main();
