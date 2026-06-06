/**
 * Theme Document payload — dark/light mode mappings and brand presets.
 */

/** Theme document payload. */
export interface ThemePayload {
  theme_name: string;
  extends: string;
  attribute: string;
  overrides: Record<string, Record<string, string>>;
  css_output_path: string;
}
