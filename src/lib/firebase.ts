import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  collection,
  getDocs,
  writeBatch,
  addDoc,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AuditLogEntry } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

const googleProvider = new GoogleAuthProvider();
// Force selecting account
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Types for backup structure
export interface BackupData {
  courses: any[];
  students: any[];
  teachers: any[];
  sessions: any[];
  groups?: any[];
  rooms?: any[];
  themes?: any[];
  objectives?: any[];
  receipts?: any[];
  isClosed?: boolean;
  yearReport?: string;
  updatedAt: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Removes undefined fields from objects before saving to Firestore, preventing validation errors
 */
const sanitizeForFirestore = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  const clean: any = Array.isArray(obj) ? [] : {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      clean[key] = sanitizeForFirestore(val);
    }
  }
  return clean;
};

/**
 * Saves all school data to Firestore under the user's document
 */
export const saveUserDataToCloud = async (userId: string, data: Omit<BackupData, 'updatedAt'>, academicYear?: string) => {
  const path = academicYear ? `users/${userId}/years/${academicYear}` : `users/${userId}`;
  try {
    const userDocRef = academicYear
      ? doc(db, 'users', userId, 'years', academicYear)
      : doc(db, 'users', userId);
    const payload: BackupData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    const cleanPayload = sanitizeForFirestore(payload);
    await setDoc(userDocRef, cleanPayload);
    return cleanPayload;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

/**
 * Retrieves school data from Firestore for a specific user
 */
export const getUserDataFromCloud = async (userId: string, academicYear?: string): Promise<BackupData | null> => {
  const path = academicYear ? `users/${userId}/years/${academicYear}` : `users/${userId}`;
  try {
    const userDocRef = academicYear
      ? doc(db, 'users', userId, 'years', academicYear)
      : doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as BackupData;
    }
    return null;
  } catch (error: any) {
    console.error('Error fetching user data from cloud:', error);
    if (error.code === 'unavailable' || error.message?.includes('offline')) {
      return null;
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
};

/**
 * Retrieves user profile from Firestore
 */
export const getUserProfile = async (userId: string) => {
  const path = `userProfiles/${userId}`;
  try {
    const userDocRef = doc(db, 'userProfiles', userId); // Separate collection for profiles
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    if (error.code === 'unavailable' || error.message?.includes('offline')) {
      return null;
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
};

/**
 * Retrieves all user profiles from Firestore
 */
export const getAllUserProfiles = async () => {
  const path = 'userProfiles';
  try {
    const profilesCollectionRef = collection(db, 'userProfiles');
    const querySnapshot = await getDocs(profilesCollectionRef);
    return querySnapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() }));
  } catch (error: any) {
    console.error('Error fetching all user profiles:', error);
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

/**
 * Updates user profile role in Firestore
 */
export const updateUserProfileRole = async (userId: string, role: string) => {
  const path = `userProfiles/${userId}`;
  try {
    const userDocRef = doc(db, 'userProfiles', userId);
    await setDoc(userDocRef, { role }, { merge: true });
  } catch (error: any) {
    console.error('Error updating user profile role:', error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

/**
 * Updates user profile in Firestore
 */
export const updateUserProfile = async (userId: string, data: any) => {
  const path = `userProfiles/${userId}`;
  try {
    const userDocRef = doc(db, 'userProfiles', userId);
    const cleanData = sanitizeForFirestore(data);
    await setDoc(userDocRef, cleanData, { merge: true });
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

/**
 * Deletes user profile in Firestore
 */
export const deleteUserProfile = async (userId: string) => {
  const path = `userProfiles/${userId}`;
  try {
    const { deleteDoc } = await import('firebase/firestore');
    const userDocRef = doc(db, 'userProfiles', userId);
    await deleteDoc(userDocRef);
  } catch (error: any) {
    console.error('Error deleting user profile:', error);
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const addAuditLogEntry = async (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
  const path = 'auditLogs';
  try {
    const logsCollectionRef = collection(db, 'auditLogs');
    const payload: Omit<AuditLogEntry, 'id'> = {
      ...entry,
      timestamp: new Date().toISOString()
    };
    const cleanPayload = sanitizeForFirestore(payload);
    await addDoc(logsCollectionRef, cleanPayload);
  } catch (error) {
    console.error('Error adding audit log:', error);
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const getAuditLogs = async (limitCount = 50): Promise<AuditLogEntry[]> => {
  const path = 'auditLogs';
  try {
    const logsCollectionRef = collection(db, 'auditLogs');
    const q = query(logsCollectionRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLogEntry));
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    handleFirestoreError(error, OperationType.LIST, path);
  }
};
