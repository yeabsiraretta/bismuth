declare module 'abcjs' {
  export interface AbcVisualParams {
    responsive?: string;
    staffwidth?: number;
    scale?: number;
    paddingtop?: number;
    paddingbottom?: number;
    paddingleft?: number;
    paddingright?: number;
    tablature?: Array<{ instrument: string }>;
    swing?: number;
    [key: string]: unknown;
  }

  export function renderAbc(
    target: string | HTMLElement,
    abcString: string,
    params?: AbcVisualParams
  ): object[];
}
