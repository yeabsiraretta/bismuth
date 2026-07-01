/**
 * Ambient module declarations for optional dependencies that may not be installed.
 * This prevents TypeScript errors on dynamic imports while keeping the codebase
 * type-safe through local interface definitions at each usage site.
 */

declare module 'hyperformula' {
  export const HyperFormula: {
    buildEmpty(options: { licenseKey: string }): unknown;
    version: string;
  };
}
