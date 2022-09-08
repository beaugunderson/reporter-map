module.exports = {
  extends: ['airbnb-base', 'prettier'],

  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },

  plugins: ['prettier'],

  root: true,

  rules: {
    'prettier/prettier': 'error',

    'no-console': 'off',
    'no-continue': 'off',
    'no-plusplus': 'off',
  },
};
