// scripts/generateBunkers.cjs
// Usage: node scripts/generateBunkers.cjs

const fs = require('fs');
const path = require('path');

const TEMPLATE = `/**
 * Auto-generated Effect Bunker
 */
import { METADATA as templateMetadata, createEffectBunker as templateCreateEffectBunker } from '../templates/TEMPLATE_EffectBunker.js';
import { BUNKER_METADATA_SCHEMA, validateSchema } from '../../schema.js';
import { checkContext, checkSource, checkConditions } from '../bunkerUtils.js';

export const METADATA = __METADATA__;
validateSchema(METADATA, BUNKER_METADATA_SCHEMA);

export default templateCreateEffectBunker(METADATA);
`;

const prefabDir = path.join(__dirname, '../src/simulation/bunkers/prefabs');
const outDir = path.join(__dirname, '../src/simulation/bunkers/generated');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function loadBunkersFromPrefabs() {
  if (!fs.existsSync(prefabDir)) return [];
  const files = fs.readdirSync(prefabDir).filter(f => f.endsWith('.json'));
  return files.map(file => {
    const filePath = path.join(prefabDir, file);
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
      console.error(`Failed to parse prefab ${file}: ${err.message}`);
      return null;
    }
  }).filter(Boolean);
}

function loadBunkersFromBunkersJson() {
  const bunkersJsonPath = path.join(__dirname, '../bunkers.json');
  if (!fs.existsSync(bunkersJsonPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(bunkersJsonPath, 'utf8'));
  } catch (err) {
    console.error(`Failed to parse bunkers.json: ${err.message}`);
    return [];
  }
}

const prefabs = loadBunkersFromPrefabs();
const bunkers = prefabs.length > 0 ? prefabs : loadBunkersFromBunkersJson();

if (!Array.isArray(bunkers) || bunkers.length === 0) {
  console.log('No bunkers found in prefabs or bunkers.json. Nothing to generate.');
  process.exit(0);
}

bunkers.forEach(bunker => {
  // Normalization: synthesize UI-compatible fields from canonical fields so
  // prefab authors only need to provide a single canonical value.
  try {
    // ensure we don't mutate original source object on disk by cloning
    bunker = JSON.parse(JSON.stringify(bunker));
  } catch (err) {
    // fallback - proceed with original
  }

  // For PERK-type bunkers, require 'perk_bucket' as canonical field
  if (String(bunker.type || '').toUpperCase() === 'PERK' && !bunker.perk_bucket) {
    throw new Error(`Prefab ${bunker.id} is missing required field: perk_bucket`);
  }

  // Future normalization points could go here (e.g., mapping `event`->`eventType`)

  const meta = JSON.stringify(bunker, null, 2);
  const code = TEMPLATE.replace('__METADATA__', meta);
  const fileName = `${bunker.id}.js`;
  fs.writeFileSync(path.join(outDir, fileName), code);
  console.log(`Generated: ${fileName}`);
});
