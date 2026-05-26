#!/usr/bin/env node

/**
 * Custom version updater for Cargo.toml
 * Used by standard-version to update Rust package version
 */

const fs = require('fs');

module.exports.readVersion = function (contents) {
  // Extract version from Cargo.toml
  const match = contents.match(/^version\s*=\s*"([^"]+)"/m);
  return match ? match[1] : null;
};

module.exports.writeVersion = function (contents, version) {
  // Replace version in Cargo.toml
  return contents.replace(
    /^version\s*=\s*"[^"]+"/m,
    `version = "${version}"`
  );
};
