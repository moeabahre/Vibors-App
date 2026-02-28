const StyleDictionary = require('style-dictionary');
const { registerTransforms } = require('@tokens-studio/sd-transforms');

registerTransforms(StyleDictionary);

// Custom parser: flatten Tokens Studio collection wrappers
StyleDictionary.registerParser({
  pattern: /tokens\.json$/,
  parse: ({ contents }) => {
    const raw = JSON.parse(contents);
    const flat = {};
    Object.entries(raw).forEach(([key, val]) => {
      if (!key.startsWith('$') && typeof val === 'object') {
        Object.assign(flat, val);
      }
    });
    return flat;
  },
});

module.exports = {
  source: ['tokens/tokens.json'],

  platforms: {
    web: {
      transformGroup: 'tokens-studio',
      prefix: 'vbr',
      buildPath: 'build/web/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: { outputReferences: false },
        },
        {
          destination: 'tokens.json',
          format: 'json/nested',
        },
      ],
    },
    ios: {
      transformGroup: 'tokens-studio',
      buildPath: 'build/ios/',
      files: [
        {
          destination: 'ViborsTokens.swift',
          format: 'ios-swift/class.swift',
          options: { className: 'ViborsTokens', accessControl: 'public' },
        },
      ],
    },
    android: {
      transformGroup: 'tokens-studio',
      buildPath: 'build/android/',
      files: [
        {
          destination: 'res/values/vibors_colors.xml',
          format: 'android/colors',
          filter: (token) => token.attributes.category === 'color',
        },
        {
          destination: 'res/values/vibors_dimens.xml',
          format: 'android/dimens',
          filter: (token) => token.type === 'dimension',
        },
      ],
    },
  },
};
