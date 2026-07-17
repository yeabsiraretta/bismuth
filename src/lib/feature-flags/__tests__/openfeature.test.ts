import { describe, expect, it } from 'vitest';

import {
  parseFeatureFlagConfig,
  resolveBooleanFlag,
  resolveRuntimeEnvironment,
} from '@/feature-flags/openfeature';

describe('feature flag environment resolution', () => {
  it('uses VITE_APP_ENV when provided', () => {
    expect(
      resolveRuntimeEnvironment({
        VITE_APP_ENV: 'staging',
        MODE: 'production',
        PROD: true,
      })
    ).toBe('staging');
  });

  it('falls back to MODE then PROD defaults', () => {
    expect(resolveRuntimeEnvironment({ MODE: 'development', PROD: true })).toBe('development');
    expect(resolveRuntimeEnvironment({ PROD: true })).toBe('production');
    expect(resolveRuntimeEnvironment({ PROD: false })).toBe('development');
  });
});

describe('feature flag parsing', () => {
  it('returns empty config when unset', () => {
    expect(parseFeatureFlagConfig(undefined)).toEqual({});
  });

  it('parses booleans and env maps', () => {
    const parsed = parseFeatureFlagConfig(
      JSON.stringify({
        mobile_editing: { development: true, production: false, default: true },
        service_worker: true,
      })
    );

    expect(parsed).toEqual({
      mobile_editing: { development: true, production: false, default: true },
      service_worker: true,
    });
  });

  it('throws on invalid JSON payload', () => {
    expect(() => parseFeatureFlagConfig('{bad-json')).toThrow('Invalid VITE_FEATURE_FLAGS JSON');
  });

  it('throws when a flag value is not boolean/object', () => {
    expect(() =>
      parseFeatureFlagConfig(
        JSON.stringify({
          broken_flag: 'on',
        })
      )
    ).toThrow('Invalid feature flag value for "broken_flag"');
  });

  it('throws when env-scoped value is not a boolean', () => {
    expect(() =>
      parseFeatureFlagConfig(
        JSON.stringify({
          broken_flag: { production: 'on' },
        })
      )
    ).toThrow('Invalid feature flag value for "broken_flag.production"');
  });
});

describe('feature flag evaluation', () => {
  const flags = {
    open_everywhere: true,
    disabled_everywhere: false,
    mobile_editing: {
      development: true,
      staging: false,
      default: true,
    },
  } as const;

  it('returns default-on when flag is not configured', () => {
    expect(resolveBooleanFlag(flags, 'unknown_feature', 'development')).toBe(true);
  });

  it('returns explicit global booleans', () => {
    expect(resolveBooleanFlag(flags, 'open_everywhere', 'production')).toBe(true);
    expect(resolveBooleanFlag(flags, 'disabled_everywhere', 'production')).toBe(false);
  });

  it('returns env value when configured for environment', () => {
    expect(resolveBooleanFlag(flags, 'mobile_editing', 'staging')).toBe(false);
    expect(resolveBooleanFlag(flags, 'mobile_editing', 'development')).toBe(true);
  });

  it('falls back to default variant when env is missing', () => {
    expect(resolveBooleanFlag(flags, 'mobile_editing', 'production')).toBe(true);
  });

  it('honors custom defaultValue when no configuration exists', () => {
    expect(resolveBooleanFlag(flags, 'unknown_feature', 'development', false)).toBe(false);
  });
});
