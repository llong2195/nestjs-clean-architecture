module.exports = {
  // TypeScript files in src/ and test/
  '*.ts': [
    'eslint --fix', // Run ESLint with auto-fix
    'prettier --write', // Format with Prettier
  ],

  // JSON, YAML, Markdown files
  '*.{json,yaml,yml,md}': ['prettier --write'],
};
