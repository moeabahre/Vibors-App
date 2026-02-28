/**
 * Vibors Design Tokens
 * Style Dictionary Configuration
 *
 * Transforms Figma tokens → Web (CSS + Tailwind) + iOS (Swift) + Android (XML)
 *
 * Token Collections:
 *   01-primitives   → raw values (colors, sizes)
 *   02-semantic     → Light / Dark modes
 *   03-components   → component-level tokens
 *   03-spacing      → responsive spacing (xs→xl)
 *   04-typography   → responsive type scale
 *   05-platform     → iOS / Android / Web overrides
 *   06-radius       → per-platform radius
 *   07-grid         → breakpoint grid config
 *   08-layout       → layout constants
 *   09-stroke       → border widths
 *   10-opacity      → opacity scale
 *   11-motion       → duration + easing
 */

const StyleDictionary = require('style-dictionary');
const { registerTransforms } = require('@tokens-studio/sd-transforms');

// Register Tokens Studio transforms (handles aliases, math, composite tokens)
registerTransforms(StyleDictionary);

// ─────────────────────────────────────────────
// Custom Transforms
// ─────────────────────────────────────────────

// Convert px floats → rem for web
StyleDictionary.registerTransform({
  name: 'size/pxToRem',
  type: 'value',
  matcher: (token) =>
    ['spacing', 'fontSize', 'lineHeight', 'borderRadius', 'sizing'].includes(
      token.attributes.category
    ),
  transformer: (token) => {
    const val = parseFloat(token.value);
    return isNaN(val) ? token.value : `${(val / 16).toFixed(4).replace(/\.?0+$/, '')}rem`;
  },
});

// Duration: ms → seconds for Swift/Android
StyleDictionary.registerTransform({
  name: 'time/msToSeconds',
  type: 'value',
  matcher: (token) => token.attributes.category === 'duration',
  transformer: (token) => {
    const val = parseFloat(token.value);
    return isNaN(val) ? token.value : `${(val / 1000).toFixed(2)}s`;
  },
});

// Color: hex → Swift Color(red:green:blue:)
StyleDictionary.registerTransform({
  name: 'color/swift',
  type: 'value',
  matcher: (token) => token.attributes.category === 'color',
  transformer: (token) => {
    const hex = token.value.replace('#', '');
    const r = (parseInt(hex.slice(0, 2), 16) / 255).toFixed(3);
    const g = (parseInt(hex.slice(2, 4), 16) / 255).toFixed(3);
    const b = (parseInt(hex.slice(4, 6), 16) / 255).toFixed(3);
    const a = hex.length === 8 ? (parseInt(hex.slice(6, 8), 16) / 255).toFixed(3) : '1.000';
    return `Color(red: ${r}, green: ${g}, blue: ${b}, opacity: ${a})`;
  },
});

// Name: camelCase for Swift
StyleDictionary.registerTransform({
  name: 'name/swift/camelCase',
  type: 'name',
  transformer: (token) =>
    token.path
      .join('-')
      .replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase()),
});

// Name: snake_case for Android
StyleDictionary.registerTransform({
  name: 'name/android/snakeCase',
  type: 'name',
  transformer: (token) =>
    token.path.join('_').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase(),
});

// ─────────────────────────────────────────────
// Transform Groups
// ─────────────────────────────────────────────

StyleDictionary.registerTransformGroup({
  name: 'vibors/web',
  transforms: [
    'ts/resolveMath',
    'ts/color/modifiers',
    'ts/opacity',
    'ts/size/px',
    'attribute/cti',
    'name/cti/kebab',
    'size/pxToRem',
    'color/css',
  ],
});

StyleDictionary.registerTransformGroup({
  name: 'vibors/ios',
  transforms: [
    'ts/resolveMath',
    'ts/color/modifiers',
    'ts/opacity',
    'attribute/cti',
    'name/swift/camelCase',
    'color/swift',
    'time/msToSeconds',
  ],
});

StyleDictionary.registerTransformGroup({
  name: 'vibors/android',
  transforms: [
    'ts/resolveMath',
    'ts/color/modifiers',
    'ts/opacity',
    'ts/size/px',
    'attribute/cti',
    'name/android/snakeCase',
    'color/hex8android',
  ],
});

// ─────────────────────────────────────────────
// Platform Configs
// ─────────────────────────────────────────────

module.exports = {
  source: ['tokens/tokens.json'],

  platforms: {
    // ── WEB ──────────────────────────────────
    'web/css': {
      transformGroup: 'vibors/web',
      prefix: 'vbr',
      buildPath: 'build/web/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: {
            outputReferences: true,
            selector: ':root',
          },
        },
        {
          destination: 'tokens.dark.css',
          format: 'css/variables',
          filter: (token) => token.filePath.includes('semantic') || token.filePath.includes('components'),
          options: {
            outputReferences: true,
            selector: '[data-theme="dark"]',
          },
        },
      ],
    },

    'web/js': {
      transformGroup: 'vibors/web',
      buildPath: 'build/web/',
      files: [
        {
          destination: 'tokens.js',
          format: 'javascript/es6',
        },
        {
          destination: 'tokens.d.ts',
          format: 'typescript/es6-declarations',
        },
      ],
    },

    'web/json': {
      transformGroup: 'vibors/web',
      buildPath: 'build/web/',
      files: [
        {
          destination: 'tokens.json',
          format: 'json/nested',
        },
      ],
    },

    // ── iOS ──────────────────────────────────
    'ios/swift': {
      transformGroup: 'vibors/ios',
      buildPath: 'build/ios/',
      files: [
        {
          destination: 'ViborsTokens+Colors.swift',
          format: 'ios-swift/class.swift',
          filter: (token) => token.attributes.category === 'color',
          options: {
            className: 'ViborsColors',
            accessControl: 'public',
          },
        },
        {
          destination: 'ViborsTokens+Spacing.swift',
          format: 'ios-swift/class.swift',
          filter: (token) =>
            ['spacing', 'sizing'].includes(token.attributes.category),
          options: {
            className: 'ViborsSpacing',
            accessControl: 'public',
          },
        },
        {
          destination: 'ViborsTokens+Typography.swift',
          format: 'ios-swift/class.swift',
          filter: (token) =>
            ['fontSize', 'fontWeight', 'lineHeight', 'fontFamily'].includes(
              token.attributes.category
            ),
          options: {
            className: 'ViborsTypography',
            accessControl: 'public',
          },
        },
        {
          destination: 'ViborsTokens+Radius.swift',
          format: 'ios-swift/class.swift',
          filter: (token) => token.attributes.category === 'borderRadius',
          options: {
            className: 'ViborsRadius',
            accessControl: 'public',
          },
        },
        {
          destination: 'ViborsTokens+Motion.swift',
          format: 'ios-swift/class.swift',
          filter: (token) =>
            ['duration', 'easing'].includes(token.attributes.category),
          options: {
            className: 'ViborsMotion',
            accessControl: 'public',
          },
        },
      ],
    },

    // ── ANDROID ──────────────────────────────
    'android/xml': {
      transformGroup: 'vibors/android',
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
          filter: (token) =>
            ['spacing', 'sizing', 'borderRadius'].includes(
              token.attributes.category
            ),
        },
        {
          destination: 'res/values/vibors_strings.xml',
          format: 'android/strings',
          filter: (token) =>
            ['fontFamily', 'easing'].includes(token.attributes.category),
        },
      ],
    },

    'android/compose': {
      transformGroup: 'vibors/android',
      buildPath: 'build/android/',
      files: [
        {
          destination: 'ViborsTokens.kt',
          format: 'android/compose',
          options: {
            packageName: 'com.vibors.design.tokens',
            objectName: 'ViborsTokens',
          },
        },
      ],
    },
  },
};
