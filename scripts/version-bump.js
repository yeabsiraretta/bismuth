#!/usr/bin/env node

/**
 * Automatic version bumping script for Bismuth
 * 
 * Versioning Strategy:
 * - Z (patch): Incremented on every commit
 * - Y (minor): Incremented on every push
 * - X (major): Incremented on release (manual)
 * 
 * Usage:
 *   node scripts/version-bump.js commit  # Bump patch (0.0.1 -> 0.0.2)
 *   node scripts/version-bump.js push    # Bump minor (0.0.2 -> 0.1.0)
 *   node scripts/version-bump.js release # Bump major (0.1.0 -> 1.0.0)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const bumpType = process.argv[2] || 'commit';

function readVersion(file) {
  const content = fs.readFileSync(file, 'utf-8');
  const match = content.match(/"version":\s*"(\d+\.\d+\.\d+)"/);
  return match ? match[1] : null;
}

function writeVersion(file, newVersion) {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(
    /"version":\s*"(\d+\.\d+\.\d+)"/,
    `"version": "${newVersion}"`
  );
  fs.writeFileSync(file, content, 'utf-8');
}

function writeCargoVersion(file, newVersion) {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(
    /^version\s*=\s*"(\d+\.\d+\.\d+)"/m,
    `version = "${newVersion}"`
  );
  fs.writeFileSync(file, content, 'utf-8');
}

function updateChangelog(newVersion) {
  const changelogPath = path.join(rootDir, 'CHANGELOG.md');
  let content = fs.readFileSync(changelogPath, 'utf-8');
  
  const date = new Date().toISOString().split('T')[0];
  
  // Replace [Unreleased] with versioned entry
  content = content.replace(
    /## \[Unreleased\]/,
    `## [Unreleased]\n\n## [${newVersion}] - ${date}`
  );
  
  fs.writeFileSync(changelogPath, content, 'utf-8');
}

function bumpVersion(currentVersion, type) {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  switch (type) {
    case 'commit':
      return `${major}.${minor}.${patch + 1}`;
    case 'push':
      return `${major}.${minor + 1}.0`;
    case 'release':
      return `${major + 1}.0.0`;
    default:
      throw new Error(`Unknown bump type: ${type}`);
  }
}

function main() {
  const packageJsonPath = path.join(rootDir, 'package.json');
  const cargoTomlPath = path.join(rootDir, 'src-tauri', 'Cargo.toml');
  
  // Read current version from package.json
  const currentVersion = readVersion(packageJsonPath);
  
  if (!currentVersion) {
    console.error('❌ Could not find version in package.json');
    process.exit(1);
  }
  
  // Calculate new version
  const newVersion = bumpVersion(currentVersion, bumpType);
  
  console.log(`📦 Bumping version: ${currentVersion} → ${newVersion} (${bumpType})`);
  
  // Update package.json
  writeVersion(packageJsonPath, newVersion);
  console.log(`✅ Updated package.json`);
  
  // Update Cargo.toml
  writeCargoVersion(cargoTomlPath, newVersion);
  console.log(`✅ Updated Cargo.toml`);
  
  // Update CHANGELOG.md (only on push or release)
  if (bumpType === 'push' || bumpType === 'release') {
    updateChangelog(newVersion);
    console.log(`✅ Updated CHANGELOG.md`);
  }
  
  console.log(`\n✨ Version bumped to ${newVersion}`);
  console.log(`\n💡 Next steps:`);
  console.log(`   git add package.json src-tauri/Cargo.toml CHANGELOG.md`);
  console.log(`   git commit -m "chore: bump version to ${newVersion}"`);
}

main();
