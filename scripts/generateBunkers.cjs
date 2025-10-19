// scripts/generateBunkers.js
// Usage: node scripts/generateBunkers.js

const fs = require('fs');
const path = require('path');

const TEMPLATE = `/**
 * Auto-generated Effect Bunker
 */
import { METADATA as templateMetadata, createEffectBunker as templateCreateEffectBunker } from '../../src/simulation/bunkers/templates/TEMPLATE_EffectBunker.js';
import { BUNKER_METADATA_SCHEMA, validateSchema } from '../../schema.js';
import { checkContext, checkSource, checkConditions } from '../../src/simulation/bunkers/bunkerUtils.js';

export const METADATA = __METADATA__;
validateSchema(METADATA, BUNKER_METADATA_SCHEMA);

export default templateCreateEffectBunker(METADATA);
`;

const bunkers = JSON.parse(fs.readFileSync(path.join(__dirname, '../bunkers.json'), 'utf8'));
const outDir = path.join(__dirname, '../src/simulation/bunkers/generated');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

bunkers.forEach(bunker => {
  const meta = JSON.stringify(bunker, null, 2);
  const code = TEMPLATE.replace('__METADATA__', meta);
  const fileName = `${bunker.id}.js`;
  fs.writeFileSync(path.join(outDir, fileName), code);
  console.log(`Generated: ${fileName}`);
});
