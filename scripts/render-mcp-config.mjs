#!/usr/bin/env node

import console from 'node:console';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import appConfigPolicy from '../mcp/app-config-policy.json' with { type: 'json' };

function parsePort(rawValue, fallback) {
  const value = rawValue?.trim();
  if (!value) return fallback;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid BISMUTH_MCP_PORT=${JSON.stringify(rawValue)}; expected integer 1-65535.`);
  }
  return port;
}

function normalizePath(rawValue, fallback) {
  const value = rawValue?.trim();
  if (!value) return fallback;
  if (!value.startsWith('/')) {
    throw new Error(`Invalid BISMUTH_MCP_PATH=${JSON.stringify(rawValue)}; expected value starting with "/".`);
  }
  return value;
}

function normalizeProtocol(rawValue, fallback) {
  const value = rawValue?.trim();
  if (!value) return fallback;
  if (value !== 'http' && value !== 'https') {
    throw new Error(
      `Invalid BISMUTH_MCP_PROTOCOL=${JSON.stringify(rawValue)}; expected "http" or "https".`
    );
  }
  return value;
}

function validateAbsoluteUrl(rawValue) {
  const value = rawValue?.trim();
  if (!value) return null;
  const parsed = new URL(value);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Invalid BISMUTH_MCP_URL=${JSON.stringify(rawValue)}; expected http(s) URL.`);
  }
  if (!parsed.hostname) {
    throw new Error(`Invalid BISMUTH_MCP_URL=${JSON.stringify(rawValue)}; hostname is required.`);
  }
  return parsed.toString();
}

function resolveMcpUrl() {
  const explicitUrl = validateAbsoluteUrl(process.env.BISMUTH_MCP_URL);
  if (explicitUrl) return explicitUrl;

  const protocol = normalizeProtocol(process.env.BISMUTH_MCP_PROTOCOL, appConfigPolicy.defaults.protocol);
  const host = process.env.BISMUTH_MCP_HOST?.trim() || appConfigPolicy.defaults.host;
  const port = parsePort(process.env.BISMUTH_MCP_PORT, appConfigPolicy.defaults.port);
  const path = normalizePath(process.env.BISMUTH_MCP_PATH, appConfigPolicy.defaults.path);
  return `${protocol}://${host}:${port}${path}`;
}

async function main() {
  const outputPathArg = process.argv[2]?.trim() || appConfigPolicy.write_target;
  const outputPath = resolve(process.cwd(), outputPathArg);
  const url = resolveMcpUrl();
  const config = {
    $schema: 'https://modelcontextprotocol.io/schemas/config.json',
    mcpServers: {
      [appConfigPolicy.server_name]: {
        url,
        description: 'Bismuth MCP endpoint generated from mcp/app-config-policy.json',
      },
    },
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  console.log(`Wrote MCP config to ${outputPath}`);
  console.log(`Resolved URL: ${url}`);
}

await main();
