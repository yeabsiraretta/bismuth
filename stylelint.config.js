export default {
  extends: ['stylelint-config-standard'],
  rules: {
    'color-no-invalid-hex': true,
    'declaration-property-value-disallowed-list': {
      '/^color/': ['/^#[0-9a-fA-F]/', '/^rgb\\(/', '/^hsl\\(/'],
      '/^background$/': ['/^#[0-9a-fA-F]/', '/^rgb\\(/', '/^hsl\\(/'],
      '/^background-color/': ['/^#[0-9a-fA-F]/', '/^rgb\\(/', '/^hsl\\(/'],
      '/^border-color/': ['/^#[0-9a-fA-F]/', '/^rgb\\(/', '/^hsl\\(/'],
    },
    'color-named': ['never', { ignore: ['inside-function'] }],
  },
  ignoreFiles: [
    'node_modules/**',
    'dist/**',
    'src/__mocks__/**',
    'src-tauri/**',
  ],
};
