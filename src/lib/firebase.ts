/**
 * Firebase Firestore Initialization and Synchronizer Core
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  writeBatch,
  onSnapshot,
  updateDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = (firebaseConfig as any).firestoreDatabaseId 
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);

// Collection names
export const Collections = {
  COMPANIES: 'companies',
  USERS: 'users',
  PROJECTS: 'projects',
  ESTIMATES: 'estimates',
  INVOICES: 'invoices',
  VENDORS: 'vendors',
  WORK_ORDERS: 'workorders',
  VENDOR_BILLS: 'vendorbills',
  ADVANCE_REQUESTS: 'advancerequests',
  PAYMENTS: 'payments',
  RECEIVABLE_COLLECTIONS: 'collections',
  MOTHER_LEDGERS: 'motherledgers',
  DETAIL_LEDGERS: 'detailledgers'
};

/**
 * Generic function to seed collection if empty
 */
export async function seedCollectionIfEmpty<T extends { id: string }>(
  collectionName: string, 
  defaultData: T[]
): Promise<void> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      console.log(`Seeding Firestore collection: ${collectionName} with ${defaultData.length} records...`);
      const batch = writeBatch(db);
      defaultData.forEach((item) => {
        const docRef = doc(db, collectionName, item.id);
        batch.set(docRef, item);
      });
      await batch.commit();
      console.log(`Successfully seeded ${collectionName}.`);
    } else {
      console.log(`Firestore collection ${collectionName} already has data. Skipping seeding.`);
    }
  } catch (error) {
    console.error(`Error seeding ${collectionName}:`, error);
  }
}

/**
 * Sync helper: listen to real-time changes
 */
export function subscribeToCollection<T>(
  collectionName: string,
  onUpdate: (data: T[]) => void
) {
  const colRef = collection(db, collectionName);
  return onSnapshot(colRef, (snapshot) => {
    const data: T[] = [];
    snapshot.forEach((doc) => {
      data.push(doc.data() as T);
    });
    onUpdate(data);
  }, (error) => {
    console.error(`Subscription error for ${collectionName}:`, error);
  });
}

/**
 * Save record to Firestore (Insert or Update)
 */
export async function saveRecordToFirestore<T extends { id: string }>(
  collectionName: string,
  record: T
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, record.id);
    await setDoc(docRef, record, { merge: true });
  } catch (error) {
    console.error(`Error saving record to ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Delete record from Firestore
 */
export async function deleteRecordFromFirestore(
  collectionName: string,
  id: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting record from ${collectionName}:`, error);
    throw error;
  }
}
