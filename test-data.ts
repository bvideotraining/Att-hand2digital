import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function updateConfig() {
  console.log("Updating config...");
  try {
    await setDoc(doc(db, 'public', 'config'), { ownerId: 'itQ96nDqNlSJULtfBsigfXBOQSr2' }, { merge: true });
    console.log("Updated successfully.");
    process.exit(0);
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
}

updateConfig();
