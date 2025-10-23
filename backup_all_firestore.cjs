// Emergency Firestore Backup Script
// Run with: node backup_all_firestore.js

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
initializeApp({
  credential: require('firebase-admin').credential.cert(
    require('./server/gcloud-credentials.json')
  )
});

const db = getFirestore();

// Collections to backup
const collections = [
  'abilities',
  'attribute_bonuses',
  'effects',
  'exception_overrides',
  'perks',
  'prompts',
  'raw_data_archive',
  'runeglass',
  'ukb_effects_v2',
  'ukb_schema_extensions',
  'ukb_sources_v2'
];

async function backupCollection(collectionName) {
  console.log(`\n📦 Backing up collection: ${collectionName}`);
  
  try {
    const snapshot = await db.collection(collectionName).get();
    const data = {};
    
    snapshot.forEach(doc => {
      data[doc.id] = doc.data();
    });
    
    const filename = `backup_${collectionName}_${Date.now()}.json`;
    const filepath = path.join(__dirname, 'backups', filename);
    
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(path.join(__dirname, 'backups'))) {
      fs.mkdirSync(path.join(__dirname, 'backups'));
    }
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    
    console.log(`✅ Saved ${snapshot.size} documents to ${filename}`);
    return { collectionName, count: snapshot.size, filepath };
    
  } catch (error) {
    console.error(`❌ Error backing up ${collectionName}:`, error.message);
    return { collectionName, count: 0, error: error.message };
  }
}

async function backupAll() {
  console.log('🚨 EMERGENCY FIRESTORE BACKUP STARTING 🚨\n');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Collections to backup: ${collections.length}\n`);
  
  const results = [];
  
  for (const collection of collections) {
    const result = await backupCollection(collection);
    results.push(result);
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('BACKUP SUMMARY');
  console.log('='.repeat(50));
  
  let totalDocs = 0;
  results.forEach(r => {
    const status = r.error ? '❌' : '✅';
    const count = r.error ? 'ERROR' : `${r.count} docs`;
    console.log(`${status} ${r.collectionName.padEnd(30)} ${count}`);
    totalDocs += r.count;
  });
  
  console.log('='.repeat(50));
  console.log(`Total documents backed up: ${totalDocs}`);
  console.log(`Backup location: ${path.join(__dirname, 'backups')}`);
  console.log('\n✅ BACKUP COMPLETE!\n');
  
  // Create manifest
  const manifest = {
    timestamp: new Date().toISOString(),
    totalCollections: collections.length,
    totalDocuments: totalDocs,
    collections: results
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'backups', `manifest_${Date.now()}.json`),
    JSON.stringify(manifest, null, 2)
  );
  
  process.exit(0);
}

backupAll().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
