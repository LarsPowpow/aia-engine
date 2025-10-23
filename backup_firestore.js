// Emergency Firestore backup script
const admin = require('firebase-admin');
const fs = require('fs');

// Initialize with your service account
const serviceAccount = require('./server/gcloud-credentials.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function backupFirestore() {
  console.log('🚨 EMERGENCY BACKUP STARTING...');
  const backup = {};
  
  // Get all collections
  const collections = await db.listCollections();
  
  for (const collectionRef of collections) {
    console.log(`Backing up collection: ${collectionRef.id}`);
    const snapshot = await collectionRef.get();
    
    backup[collectionRef.id] = {};
    snapshot.docs.forEach(doc => {
      backup[collectionRef.id][doc.id] = doc.data();
    });
  }
  
  // Save to JSON file
  const filename = `firestore-backup-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(backup, null, 2));
  
  console.log(`✅ Backup complete: ${filename}`);
  console.log(`📊 Collections backed up: ${Object.keys(backup).length}`);
  console.log(`💾 File size: ${(fs.statSync(filename).size / 1024 / 1024).toFixed(2)} MB`);
  
  process.exit(0);
}

backupFirestore().catch(err => {
  console.error('❌ Backup failed:', err);
  process.exit(1);
});
