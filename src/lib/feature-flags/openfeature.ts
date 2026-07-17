import {
  OpenFeature,
  type EvaluationContext,
  type JsonValue,
  type Logger,
  type Provider,
  type ResolutionDetails,
} from '@openfeature/web-sdk';

import { log } from '@/utils/log/logger';

export const FEATURE_FLAG_DOMAIN = 'bismuth';

type FeatureFlagByEnvironment = Record<string, boolean>;
export type FeatureFlagValue = boolean | FeatureFlagByEnvironment;
export type FeatureFlagConfig = Record<string, FeatureFlagValue>;

const featureFlagLog = log.child('feature-flags');

interface EnvLike {
  VITE_APP_ENV?: string;
  MODE?: string;
  PROD?: boolean;
  VITE_FEATURE_FLAGS?: string;
}

export function resolveRuntimeEnvironment(env: EnvLike): string {
  const explicit = env.VITE_APP_ENV?.trim();
  if (explicit) return explicit;

  const mode = env.MODE?.trim();
  if (mode) return mode;

  return env.PROD ? 'production' : 'development';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function validateFeatureFlagConfig(value: unknown): FeatureFlagConfig {
  if (!isRecord(value)) {
    throw new Error('VITE_FEATURE_FLAGS must be a JSON object keyed by feature flag names.');
  }

  const entries = Object.entries(value);
  const validated: FeatureFlagConfig = {};

  for (const [flagKey, flagValue] of entries) {
    if (typeof flagValue === 'boolean') {
      validated[flagKey] = flagValue;
      continue;
    }

    if (!isRecord(flagValue)) {
      throw new Error(
        `Invalid feature flag value for "${flagKey}". Expected boolean or object of booleans by environment.`
      );
    }

    const envMap: FeatureFlagByEnvironment = {};
    for (const [envKey, envValue] of Object.entries(flagValue)) {
      if (typeof envValue !== 'boolean') {
        throw new Error(
          `Invalid feature flag value for "${flagKey}.${envKey}". Expected boolean, got ${typeof envValue}.`
        );
      }
      envMap[envKey] = envValue;
    }

    validated[flagKey] = envMap;
  }

  return validated;
}

export function parseFeatureFlagConfig(raw: string | undefined): FeatureFlagConfig {
  if (!raw) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid VITE_FEATURE_FLAGS JSON: ${message}`);
  }

  return validateFeatureFlagConfig(parsed);
}

export function resolveBooleanFlag(
  flags: FeatureFlagConfig,
  flagKey: string,
  environment: string,
  defaultValue = true
): boolean {
  const configured = flags[flagKey];
  if (configured === undefined) return defaultValue;
  if (typeof configured === 'boolean') return configured;

  const envValue = configured[environment];
  if (typeof envValue === 'boolean') return envValue;

  const fallback = configured.default;
  if (typeof fallback === 'boolean') return fallback;

  return defaultValue;
}

class EnvironmentFeatureProvider implements Provider {
  readonly metadata = { name: 'Bismuth Environment Feature Provider' } as const;

  constructor(
    private readonly flags: FeatureFlagConfig,
    private readonly environment: string
  ) {}

  resolveBooleanEvaluation(
    flagKey: string,
    defaultValue: boolean,
    _context: EvaluationContext,
    _logger: Logger
  ): ResolutionDetails<boolean> {
    return {
      value: resolveBooleanFlag(this.flags, flagKey, this.environment, defaultValue),
    };
  }

  resolveStringEvaluation(
    _flagKey: string,
    defaultValue: string,
    _context: EvaluationContext,
    _logger: Logger
  ): ResolutionDetails<string> {
    return { value: defaultValue };
  }

  resolveNumberEvaluation(
    _flagKey: string,
    defaultValue: number,
    _context: EvaluationContext,
    _logger: Logger
  ): ResolutionDetails<number> {
    return { value: defaultValue };
  }

  resolveObjectEvaluation<T extends JsonValue>(
    _flagKey: string,
    defaultValue: T,
    _context: EvaluationContext,
    _logger: Logger
  ): ResolutionDetails<T> {
    return { value: defaultValue };
  }
}

let initialized = false;

export function initializeFeatureFlags(env: EnvLike = import.meta.env): void {
  if (initialized) return;

  const environment = resolveRuntimeEnvironment(env);
  const flags = parseFeatureFlagConfig(env.VITE_FEATURE_FLAGS);

  OpenFeature.setProvider(
    FEATURE_FLAG_DOMAIN,
    new EnvironmentFeatureProvider(flags, environment),
    { environment }
  );
  initialized = true;

  featureFlagLog.info('Feature flags initialized', {
    domain: FEATURE_FLAG_DOMAIN,
    environment,
    flagsConfigured: Object.keys(flags).length,
  });
}

export function isFeatureEnabled(flagKey: string, defaultValue = true): boolean {
  initializeFeatureFlags();
  const client = OpenFeature.getClient(FEATURE_FLAG_DOMAIN);
  return client.getBooleanValue(flagKey, defaultValue);
}
