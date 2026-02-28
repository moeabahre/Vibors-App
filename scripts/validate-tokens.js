/**
 * Validate tokens JSON structure before building
 * Reads from single tokens/tokens.json (Tokens Studio free plan export)
 */

const fs = require('fs');
const path = require('path');

const tokensFile = path.join(__dirname, '../tokens/tokens.json');
let errors = 0;
let warnings = 0;

const REQUIRED_COLLECTIONS = [
  '01 - Primitives',
  '02 - Semantic',
  '03 - Components',
  '03 - Spacing',
  '04 - Typography',
  '05 - Platform',
  '06 - Radius',
  '07 - Grid',
  '08 - Layout',
  '09 - Stroke',
  '10 - Opacity',
  '11 - Motion & Effects',
];

function loadTokens() {
  if (!fs.existsSync(tokensFile)) {
    console.error('❌  tokens/tokens.json not found. Push from Tokens Studio first.');
    process.exit(1);
  }
  try {
    const raw = JSON.parse(fs.readFileSync(tokensFile, 'utf-8'));
    const sets = {};
    Object.entries(raw).forEach(([k, v]) => { if (!k.startsWith('$')) sets[k] = v; });
    return sets;
  } catch (e) {
    console.error(`❌  Invalid JSON: ${e.message}`);
    process.exit(1);
  }
}

function countTokens(obj) {
  return Object.values(obj).reduce((a, v) => {
    if (v && typeof v === 'object') return a + ('value' in v ? 1 : countTokens(v));
    return a;
  }, 0);
}

function checkCollections(sets) {
  console.log('\n📋  Checking collections...');
  REQUIRED_COLLECTIONS.forEach((name) => {
    if (sets[name]) {
      console.log(`  ✅  "${name}"  (${countTokens(sets[name])} tokens)`);
    } else {
      console.warn(`  ⚠️   "${name}" — not found`);
      warnings++;
    }
  });
}

function checkEmpty(sets) {
  console.log('\n🔍  Checking for empty values...');
  let count = 0;
  function scan(obj, p) {
    Object.entries(obj).forEach(([k, v]) => {
      const fp = p ? `${p}.${k}` : k;
      if (v && typeof v === 'object') {
        if ('value' in v) { if (!v.value && v.value !== 0) { console.warn(`  ⚠️   Empty: ${fp}`); count++; warnings++; } }
        else scan(v, fp);
      }
    });
  }
  Object.entries(sets).forEach(([n, t]) => scan(t, n));
  if (!count) console.log('  ✅  No empty values found');
}

function checkAliases(sets) {
  let n = 0;
  function scan(obj) { Object.values(obj).forEach(v => { if (v && typeof v === 'object') { if ('value' in v) { if (String(v.value).startsWith('{')) n++; } else scan(v); } }); }
  Object.values(sets).forEach(scan);
  console.log(`\n🔗  ${n} alias references found`);
}

console.log('🔍  Validating Vibors Design Tokens...');
const sets = loadTokens();
checkCollections(sets);
checkEmpty(sets);
checkAliases(sets);

const total = Object.values(sets).reduce((a, s) => a + countTokens(s), 0);
console.log(`\n📊  ${Object.keys(sets).length} collections · ${total} tokens · ${errors} errors · ${warnings} warnings`);

if (errors > 0) { console.error('\n❌  Failed'); process.exit(1); }
else if (warnings > 0) console.warn('\n⚠️   Passed with warnings');
else console.log('\n✅  All good!');
