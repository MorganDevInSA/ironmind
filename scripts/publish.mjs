#!/usr/bin/env node

/**
 * IRONMIND Publish Script
 *
 * One-command deployment: checks build locally, pushes to GitHub, prints live URL.
 *
 * Flow:
 * 1. Abort if working tree is dirty
 * 2. Show current branch + commit
 * 3. Run npm run ci (lint + typecheck + build)
 * 4. Push to GitHub (current branch)
 * 5. Print production URL if main, preview dashboard URL otherwise
 *
 * Vercel's GitHub integration auto-deploys:
 * - main → production (https://ironmind-morgans-projects-bc4d5795.vercel.app)
 * - other branches → preview (visible in Vercel dashboard)
 */

import { spawnSync, execSync } from 'child_process';
import { exit } from 'process';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

function logStep(step, msg) {
  log(`\n${colors.bright}[${step}]${colors.reset} ${msg}`);
}

function abort(msg, exitCode = 1) {
  log(`\n${colors.red}✗ Aborted: ${msg}${colors.reset}`, colors.red);
  exit(exitCode);
}

// Step 1: Check working tree
logStep('1/5', 'Checking git status...');
const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
if (gitStatus.trim()) {
  log(`\nYou have uncommitted changes:\n${gitStatus}`, colors.yellow);
  abort('Commit or stash changes before publishing');
}
log('✓ Working tree clean', colors.green);

// Get current branch and commit
const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
const commit = execSync('git log -1 --oneline', { encoding: 'utf8' }).trim();
log(`\nBranch: ${colors.cyan}${branch}${colors.reset}`);
log(`Commit: ${colors.cyan}${commit}${colors.reset}`);

// Step 2: Run CI chain
logStep('2/5', 'Running CI checks (lint + typecheck + build)...');
const ciResult = spawnSync('npm', ['run', 'ci'], {
  stdio: 'inherit',
  shell: true,
});

if (ciResult.status !== 0) {
  abort('CI checks failed. Fix errors above before publishing.');
}
log('\n✓ All CI checks passed', colors.green);

// Step 3: Push to GitHub
logStep('3/5', `Pushing ${branch} to GitHub...`);
const pushResult = spawnSync('git', ['push', 'origin', 'HEAD'], {
  stdio: 'inherit',
  shell: true,
});

if (pushResult.status !== 0) {
  abort('Git push failed. Check network and permissions.');
}
log(`✓ Pushed to origin/${branch}`, colors.green);

// Step 4: Report deployment status
logStep('4/5', 'Deployment triggered');

if (branch === 'main') {
  log(
    `\n${colors.bright}${colors.green}🚀 Production deployment starting${colors.reset}\n`,
    colors.green,
  );
  log('Live URL (updates in ~60s):', colors.cyan);
  log('  https://ironmind-morgans-projects-bc4d5795.vercel.app\n');
  log('Watch deployment:', colors.cyan);
  log('  https://vercel.com/morgans-projects-bc4d5795/ironmind/deployments\n');
} else {
  log(
    `\n${colors.bright}${colors.yellow}📦 Preview deployment starting${colors.reset}\n`,
    colors.yellow,
  );
  log(`Branch: ${branch}`, colors.cyan);
  log('Preview will appear here in ~60s:', colors.cyan);
  log('  https://vercel.com/morgans-projects-bc4d5795/ironmind/deployments\n');
  log(
    `${colors.yellow}Note: This is a preview. Merge to main to deploy to production.${colors.reset}\n`,
  );
}

logStep('5/5', 'Done');
log(`\n${colors.green}✓ Published successfully${colors.reset}\n`, colors.green);
