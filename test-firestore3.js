import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  try {
    const snapshot = await getDocs(collection(db, `schools/diligent/userAccounts`));
    let accounts = [];
    snapshot.forEach(doc => accounts.push(doc.data()));
    console.log("Accounts in firestore:");
    accounts.forEach(a => console.log(`${a.email} -> phone: '${a.phone}', pass: '${a.password}'`));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
check();
