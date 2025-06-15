module.exports = {
  extends: 'airbnb-base',
  plugins: [
    'import',
  ],
  rules: {
    'max-len': ['error', { code: 140 }],
    quotes: ['error', 'single'],
    'no-plusplus': 'off',
  },
};
