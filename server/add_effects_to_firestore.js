// Usage: node server/add_effects_to_firestore.js
// This script adds effects from effects_to_add.json to Firestore using service account credentials.

const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

// TODO: Replace with your service account key file path
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const effectsRaw = fs.readFileSync(__dirname + '/effects_to_add.json', 'utf8');
const effects = effectsRaw.split(/\n(?=\{)/).map(JSON.parse);

(async () => {
  for (const effect of effects) {
    await db.collection('effects').doc(effect.effect_id).set(effect, { merge: true });
    console.log(`Added effect: ${effect.effect_id}`);
  }
  console.log('All effects added to Firestore.');
})();
