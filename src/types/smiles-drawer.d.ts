/**
 * Type declarations for smiles-drawer library.
 * @see https://github.com/reymond-group/smilesDrawer
 */
declare module 'smiles-drawer' {
  export class SmiDrawer {
    constructor(options?: Record<string, unknown>);
    draw(
      tree: unknown,
      target: HTMLCanvasElement | SVGElement,
      theme?: string,
      isInDark?: boolean
    ): void;
  }
  export function parse(
    smiles: string,
    successCallback: (tree: unknown) => void,
    errorCallback: (error: unknown) => void
  ): void;
}
