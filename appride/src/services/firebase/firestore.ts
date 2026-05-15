import { getFirestore } from 'firebase/firestore';

import { getFirebaseApp } from './app';

/** Firestore is the real-time database for rides, drivers, and profiles. */
export function getDb() {
  return getFirestore(getFirebaseApp());
}
