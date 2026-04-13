import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function checkData() {
  console.log("Checking data...");
  try {
    const publicSnap = await getDoc(doc(db, 'public', 'config'));
    console.log("Public config:", publicSnap.exists() ? publicSnap.data() : "Not found");
    
    const uids = ['1WoIhiXuQOdJ6e6X8RhCm1um8eb2', 'JT8wmPCChMSTyUihnM5D29KRywV2'];
    
    for (const uid of uids) {
      console.log(`\nChecking UID: ${uid}`);
      
      const appDataSnap = await getDoc(doc(db, 'app_data', uid));
      console.log(`app_data/${uid} exists:`, appDataSnap.exists());
      
      const filesSnap = await getDocs(collection(db, `users/${uid}/files`));
      console.log(`users/${uid}/files count:`, filesSnap.size);
      
      const dictSnap = await getDocs(collection(db, `users/${uid}/nameDictionary`));
      console.log(`users/${uid}/nameDictionary count:`, dictSnap.size);
    }
    
    process.exit(0);
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
}

checkData();
