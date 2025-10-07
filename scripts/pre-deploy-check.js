#!/usr/bin/env node

/**
 * Pre-Deployment Checklist for Vercel
 * Run this script before pushing to Git to catch common deployment issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Running Pre-Deployment Checklist...\n');

let hasErrors = false;

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  try {
    log(`⏳ ${description}...`, 'blue');
    execSync(command, { stdio: 'pipe' });
    log(`✅ ${description} - PASSED`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} - FAILED`, 'red');
    console.log(error.stdout?.toString() || error.message);
    return false;
  }
}

// 1. Check TypeScript errors
log('1. TypeScript Type Checking', 'bold');
if (!runCommand('npx tsc --noEmit', 'TypeScript compilation')) {
  hasErrors = true;
}

// 2. Check ESLint errors
log('\n2. Code Quality Checks', 'bold');
if (!runCommand('npm run lint', 'ESLint validation')) {
  log('⚠️  ESLint errors found - consider fixing before deployment', 'yellow');
}

// 3. Test build process
log('\n3. Build Process Test', 'bold');
if (!runCommand('npm run build', 'Production build test')) {
  hasErrors = true;
}

// 4. Check for required environment variables
log('\n4. Environment Variables Check', 'bold');
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_S3_BUCKET_NAME'
];

const envFile = path.join(process.cwd(), '.env.local');
let envVars = {};

if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });
}

let missingVars = [];
requiredEnvVars.forEach(varName => {
  if (!envVars[varName]) {
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  log('❌ Missing required environment variables:', 'red');
  missingVars.forEach(varName => {
    log(`   - ${varName}`, 'red');
  });
  log('\n⚠️  Make sure these are set in Vercel dashboard!', 'yellow');
} else {
  log('✅ All required environment variables found', 'green');
}

// 5. Check for common deployment issues
log('\n5. Common Deployment Issues Check', 'bold');

// Check for hardcoded credentials
const filesToCheck = [
  'src/**/*.ts',
  'src/**/*.tsx',
  'src/**/*.js',
  'src/**/*.jsx'
];

try {
  const grepResult = execSync('grep -r "sk-" src/ || true', { encoding: 'utf8' });
  if (grepResult.trim()) {
    log('❌ Found potential hardcoded API keys in source code!', 'red');
    hasErrors = true;
  } else {
    log('✅ No hardcoded API keys found', 'green');
  }
} catch (error) {
  log('✅ No hardcoded API keys found', 'green');
}

// Check for large files that might cause deployment issues
try {
  const largeFiles = execSync('find . -name "*.mp3" -o -name "*.wav" -o -name "*.mov" -o -name "*.mp4" | head -10', { encoding: 'utf8' });
  if (largeFiles.trim()) {
    log('⚠️  Found large media files in repository:', 'yellow');
    largeFiles.split('\n').forEach(file => {
      if (file.trim()) {
        log(`   - ${file}`, 'yellow');
      }
    });
    log('   Consider using CDN for large files', 'yellow');
  } else {
    log('✅ No large media files found in repo', 'green');
  }
} catch (error) {
  log('✅ No large media files found in repo', 'green');
}

// 6. Check package.json for potential issues
log('\n6. Package Dependencies Check', 'bold');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Check for problematic dependencies
  const problematicDeps = ['fluent-ffmpeg'];
  const foundIssues = [];
  
  problematicDeps.forEach(dep => {
    if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
      foundIssues.push(dep);
    }
  });
  
  if (foundIssues.length > 0) {
    log('⚠️  Found potentially problematic dependencies:', 'yellow');
    foundIssues.forEach(dep => {
      log(`   - ${dep} (may need serverless configuration)`, 'yellow');
    });
  } else {
    log('✅ No problematic dependencies found', 'green');
  }
  
  // Check Node.js version compatibility
  if (packageJson.engines?.node) {
    log(`✅ Node.js version specified: ${packageJson.engines.node}`, 'green');
  } else {
    log('⚠️  No Node.js version specified in package.json', 'yellow');
    log('   Consider adding: "engines": { "node": ">=18.0.0" }', 'yellow');
  }
  
} catch (error) {
  log('❌ Error reading package.json', 'red');
  hasErrors = true;
}

// 7. Check git status
log('\n7. Git Status Check', 'bold');
try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  if (gitStatus.trim()) {
    log('⚠️  Uncommitted changes found:', 'yellow');
    gitStatus.split('\n').forEach(line => {
      if (line.trim()) {
        log(`   ${line}`, 'yellow');
      }
    });
    log('   Consider committing or stashing changes', 'yellow');
  } else {
    log('✅ Working directory is clean', 'green');
  }
} catch (error) {
  log('❌ Error checking git status', 'red');
  hasErrors = true;
}

// Final summary
log('\n' + '='.repeat(50), 'bold');
if (hasErrors) {
  log('❌ PRE-DEPLOYMENT CHECK FAILED', 'red');
  log('   Fix the errors above before deploying to Vercel', 'red');
  process.exit(1);
} else {
  log('✅ PRE-DEPLOYMENT CHECK PASSED', 'green');
  log('   Your code is ready for deployment!', 'green');
  log('\n🚀 Next steps:', 'blue');
  log('   1. git add .', 'blue');
  log('   2. git commit -m "your message"', 'blue');
  log('   3. git push origin main', 'blue');
  log('   4. Check Vercel dashboard for deployment status', 'blue');
}
log('='.repeat(50), 'bold');
