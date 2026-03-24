import admin from 'firebase-admin';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

admin.initializeApp({
  projectId: firebaseConfig.projectId
});

const db = admin.firestore();
db.settings({ databaseId: firebaseConfig.firestoreDatabaseId });

async function test() {
  try {
    const docRef = db.collection('test').doc('test');
    await docRef.set({ test: 'test' });
    console.log('Success!');
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
