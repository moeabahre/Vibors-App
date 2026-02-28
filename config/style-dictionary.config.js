const StyleDictionary = require('style-dictionary');
const { registerTransforms, preprocessTokens } = require('@tokens-studio/sd-transforms');

registerTransforms(StyleDictionary);

// Flatten Tokens Studio single-file format
StyleDictionary.registerPreprocessor({
  name: 'tokens-studio/flatten',
  preprocessor: (dictionary) => {
    const flat = {};
    Object.entries(dictionary).forEach(([, tokens]) => {
      if (typeof tokens === 'object' && !tokens.value) {
        Object.assign(flat, tokens);
      }
    });
    return flat;
  },
});

module.exports = {
  source: ['tokens/tokens.json'],
  preprocessors: ['tokens-studio/flatten'],

  platforms: {
    web: {
      transformGroup: 'tokens-studio',
      prefix: 'vbr',
      buildPath: 'build/web/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: { outputReferences: true },
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
