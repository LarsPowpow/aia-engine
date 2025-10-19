// upsertPrefabToFirestore.js
// Usage: node scripts/upsertPrefabToFirestore.js path/to/prefab.json
// Upserts a prefab JSON to Firestore with canonical schema for mass production

const fs = require('fs');
const path = require('path');
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const prefabPath = process.argv[2];
if (!prefabPath || !fs.existsSync(prefabPath)) {
  console.error('Prefab JSON file not found:', prefabPath);
  process.exit(1);
}
const prefab = JSON.parse(fs.readFileSync(prefabPath, 'utf8'));

// Upsert to ukb_sources_v2 collection using prefab.id as document ID
async function upsertPrefab() {
  // Enforce canonical schema for perks
  if (String(prefab.type || '').toUpperCase() === 'PERK' && !prefab.perk_bucket) {
    throw new Error(`Prefab ${prefab.id} is missing required field: perk_bucket`);
  }
  const docRef = db.collection('ukb_sources_v2').doc(prefab.id);
  await docRef.set(prefab, { merge: true });
  console.log('Upserted prefab to Firestore:', prefab.id);
}

upsertPrefab().catch(err => {
  console.error('Upsert failed:', err);
  process.exit(1);
});
