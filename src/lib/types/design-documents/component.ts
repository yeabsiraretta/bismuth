/**
 * Component Document payload — UI component definitions with variants.
 */

/** Component property definition. */
export interface ComponentProp {
  name: string;
  type: 'enum' | 'string' | 'number' | 'boolean';
  values?: string[];
  default?: string | number | boolean;
  description?: string;
}

/** Component slot definition. */
export interface ComponentSlot {
  name: string;
  description?: string;
}

/** Component variant (visual state mapped to a canvas frame). */
export interface ComponentVariant {
  name: string;
  frame_id: string;
  overrides: Record<string, string>;
}

/** Code Connect mapping for component-to-code link. */
export interface CodeConnect {
  import: string;
  usage: string;
  path?: string;
}

/** Component document payload. */
export interface ComponentPayload {
  component_name: string;
  file_path: string;
  description: string;
  props: ComponentProp[];
  slots: ComponentSlot[];
  states: string[];
  token_bindings: Record<string, string>;
  variants: ComponentVariant[];
  code_connect: CodeConnect;
}
