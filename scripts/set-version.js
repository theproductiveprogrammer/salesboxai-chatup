#!/usr/bin/env node

/**
 * Version Set Script
 * Sets version numbers across Cargo.toml, tauri.conf.json, and web-app/package.json
 *
 * Usage:
 *   node scripts/set-version.js           # Show current versions
 *   node scripts/set-version.js 0.7.0     # Update all versions to 0.7.0
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// File paths (relative to project root)
const PROJECT_ROOT = path.resolve(__dirname, '..');
const FILES = {
  cargo: path.join(PROJECT_ROOT, 'src-tauri', 'Cargo.toml'),
  tauriConf: path.join(PROJECT_ROOT, 'src-tauri', 'tauri.conf.json'),
  webApp: path.join(PROJECT_ROOT, 'web-app', 'package.json'),
};

/**
 * Validates semver format (MAJOR.MINOR.PATCH)
 */
function isValidSemver(version) {
  const semverRegex = /^\d+\.\d+\.\d+$/;
  return semverRegex.test(version);
}

/**
 * Extract version from Cargo.toml
 */
function getCargoVersion() {
  const content = fs.readFileSync(FILES.cargo, 'utf8');
  const match = content.match(/^version\s*=\s*"([^"]+)"/m);
  return match ? match[1] : null;
}

/**
 * Extract version from tauri.conf.json
 */
function getTauriConfVersion() {
  const content = fs.readFileSync(FILES.tauriConf, 'utf8');
  const json = JSON.parse(content);
  return json.version || null;
}

/**
 * Extract version from web-app/package.json
 */
function getWebAppVersion() {
  const content = fs.readFileSync(FILES.webApp, 'utf8');
  const json = JSON.parse(content);
  return json.version || null;
}

/**
 * Get all current versions
 */
function getCurrentVersions() {
  return {
    cargo: getCargoVersion(),
    tauriConf: getTauriConfVersion(),
    webApp: getWebAppVersion(),
  };
}

/**
 * Check if all versions are in sync
 */
function areVersionsInSync(versions) {
  const { cargo, tauriConf, webApp } = versions;
  return cargo === tauriConf && tauriConf === webApp;
}

/**
 * Display current versions with color coding
 */
function displayVersions() {
  const versions = getCurrentVersions();
  const inSync = areVersionsInSync(versions);

  console.log(`\n${colors.bright}Current Versions:${colors.reset}`);
  console.log(`  ${colors.cyan}Cargo.toml:${colors.reset}           ${versions.cargo}`);
  console.log(`  ${colors.cyan}tauri.conf.json:${colors.reset}      ${versions.tauriConf}`);
  console.log(`  ${colors.cyan}web-app/package.json:${colors.reset} ${versions.webApp}`);

  if (inSync) {
    console.log(`\n${colors.green}✓ All versions are in sync${colors.reset}\n`);
  } else {
    console.log(`\n${colors.red}✗ Versions are out of sync${colors.reset}\n`);
  }
}

/**
 * Update version in Cargo.toml
 */
function updateCargoVersion(newVersion) {
  let content = fs.readFileSync(FILES.cargo, 'utf8');
  content = content.replace(
    /^(version\s*=\s*)"[^"]+"/m,
    `$1"${newVersion}"`
  );
  fs.writeFileSync(FILES.cargo, content, 'utf8');
}

/**
 * Update version in tauri.conf.json
 */
function updateTauriConfVersion(newVersion) {
  const content = fs.readFileSync(FILES.tauriConf, 'utf8');
  const json = JSON.parse(content);
  json.version = newVersion;
  // Preserve formatting with 2-space indentation
  fs.writeFileSync(FILES.tauriConf, JSON.stringify(json, null, 2) + '\n', 'utf8');
}

/**
 * Update version in web-app/package.json
 */
function updateWebAppVersion(newVersion) {
  const content = fs.readFileSync(FILES.webApp, 'utf8');
  const json = JSON.parse(content);
  json.version = newVersion;
  // Preserve formatting with 2-space indentation
  fs.writeFileSync(FILES.webApp, JSON.stringify(json, null, 2) + '\n', 'utf8');
}

/**
 * Update all versions
 */
function updateAllVersions(newVersion) {
  const oldVersions = getCurrentVersions();

  console.log(`\n${colors.bright}Updating versions to ${colors.yellow}${newVersion}${colors.reset}${colors.bright}...${colors.reset}\n`);

  // Show what will change
  console.log('Before:');
  console.log(`  ${colors.cyan}Cargo.toml:${colors.reset}           ${oldVersions.cargo}`);
  console.log(`  ${colors.cyan}tauri.conf.json:${colors.reset}      ${oldVersions.tauriConf}`);
  console.log(`  ${colors.cyan}web-app/package.json:${colors.reset} ${oldVersions.webApp}`);

  // Update all files
  updateCargoVersion(newVersion);
  updateTauriConfVersion(newVersion);
  updateWebAppVersion(newVersion);

  // Verify updates
  const newVersions = getCurrentVersions();

  console.log('\nAfter:');
  console.log(`  ${colors.cyan}Cargo.toml:${colors.reset}           ${newVersions.cargo}`);
  console.log(`  ${colors.cyan}tauri.conf.json:${colors.reset}      ${newVersions.tauriConf}`);
  console.log(`  ${colors.cyan}web-app/package.json:${colors.reset} ${newVersions.webApp}`);

  if (areVersionsInSync(newVersions)) {
    console.log(`\n${colors.green}✓ All versions updated successfully${colors.reset}\n`);
  } else {
    console.log(`\n${colors.red}✗ Error: Versions are still out of sync${colors.reset}\n`);
    process.exit(1);
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  // Check if files exist
  Object.entries(FILES).forEach(([name, filePath]) => {
    if (!fs.existsSync(filePath)) {
      console.error(`${colors.red}Error: File not found: ${filePath}${colors.reset}`);
      process.exit(1);
    }
  });

  if (args.length === 0) {
    // No arguments: show current versions
    displayVersions();
  } else if (args.length === 1) {
    // One argument: update version
    const newVersion = args[0];

    if (!isValidSemver(newVersion)) {
      console.error(`${colors.red}Error: Invalid version format "${newVersion}"${colors.reset}`);
      console.error(`Expected format: MAJOR.MINOR.PATCH (e.g., 0.7.0)`);
      process.exit(1);
    }

    updateAllVersions(newVersion);
  } else {
    // Too many arguments
    console.error(`${colors.red}Error: Too many arguments${colors.reset}`);
    console.error('\nUsage:');
    console.error('  node scripts/set-version.js           # Show current versions');
    console.error('  node scripts/set-version.js 0.7.0     # Update all versions to 0.7.0');
    process.exit(1);
  }
}

// Run main function
main();
