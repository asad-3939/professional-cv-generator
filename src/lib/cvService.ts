import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp, 
  addDoc, 
  increment 
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { CVData, DesignConfig, CVRecord } from "../types";
import { initialCVData, initialDesignConfig } from "../sampleData";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errMessage = error instanceof Error ? error.message : String(error);
  // Log full technical diagnostics to developer console only
  console.error(`Firestore ${operationType} failed at [${path}]:`, {
    error: errMessage,
    userId: auth.currentUser?.uid,
    operationType,
    path
  });
  
  throw new Error("We couldn't connect to the database. Please check your connection and try again.");
}

// Sync user profile document on Google Sign-In (Safe non-destructive update)
export async function syncUserProfile(user: { uid: string; email: string; displayName?: string | null; photoURL?: string | null }) {
  if (!user || !user.uid) return;
  const userRef = doc(db, "users", user.uid);
  try {
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        email: user.email || "",
        displayName: user.displayName || user.email?.split("@")[0] || "User",
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        downloadsCount: 0,
      });
    } else {
      // Update only mutable fields, preserving createdAt and downloadsCount
      const updates: Record<string, any> = {
        lastLoginAt: serverTimestamp(),
      };
      if (user.email) updates.email = user.email;
      if (user.displayName) updates.displayName = user.displayName;
      
      await setDoc(userRef, updates, { merge: true });
    }
  } catch (err) {
    console.error("Firestore user profile sync notice:", err);
  }
}


// Fetch all CVs for the authenticated user with limit constraint
export async function getUserCVs(uid: string, limitCount = 20): Promise<CVRecord[]> {
  const cvsRef = collection(db, "users", uid, "cvs");
  const q = query(cvsRef, orderBy("updatedAt", "desc"), limit(limitCount));
  try {
    const querySnapshot = await getDocs(q);
    const cvList: CVRecord[] = [];
    querySnapshot.forEach((docSnap) => {
      const d = docSnap.data();
      cvList.push({
        id: docSnap.id,
        title: d.title || d.data?.personal?.jobTitle || "My Resume",
        data: d.data || initialCVData,
        design: d.design || initialDesignConfig,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        isDefault: !!d.isDefault,
      });
    });
    return cvList;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `users/${uid}/cvs`);
  }
}

// Create a new CV in Firestore
export async function createCV(
  uid: string, 
  data: CVData, 
  design: DesignConfig, 
  title?: string,
  isDefault = false
): Promise<CVRecord> {
  const cvsRef = collection(db, "users", uid, "cvs");
  const fallbackTitle = title || data.personal.jobTitle?.trim() || "My Resume";
  
  try {
    const docRef = await addDoc(cvsRef, {
      title: fallbackTitle,
      data,
      design,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isDefault,
    });

    // Update active CV in user document
    await setDoc(doc(db, "users", uid), { activeCvId: docRef.id }, { merge: true });

    return {
      id: docRef.id,
      title: fallbackTitle,
      data,
      design,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${uid}/cvs`);
  }
}

// Update an existing CV in Firestore
export async function updateCV(
  uid: string, 
  cvId: string, 
  data: CVData, 
  design: DesignConfig, 
  title?: string
): Promise<void> {
  const cvRef = doc(db, "users", uid, "cvs", cvId);
  const updatePayload: any = {
    data,
    design,
    updatedAt: serverTimestamp(),
  };
  if (title) {
    updatePayload.title = title;
  }

  try {
    await updateDoc(cvRef, updatePayload);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/cvs/${cvId}`);
  }
}

// Rename an existing CV
export async function renameCV(uid: string, cvId: string, newTitle: string): Promise<void> {
  const cvRef = doc(db, "users", uid, "cvs", cvId);
  try {
    await updateDoc(cvRef, {
      title: newTitle.trim() || "My Resume",
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/cvs/${cvId}`);
  }
}

// Duplicate an existing CV
export async function duplicateCV(uid: string, sourceCV: CVRecord): Promise<CVRecord> {
  const cvsRef = collection(db, "users", uid, "cvs");
  const newTitle = `${sourceCV.title} (Copy)`;

  try {
    const docRef = await addDoc(cvsRef, {
      title: newTitle,
      data: sourceCV.data,
      design: sourceCV.design,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isDefault: false,
    });

    return {
      id: docRef.id,
      title: newTitle,
      data: sourceCV.data,
      design: sourceCV.design,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${uid}/cvs`);
  }
}

// Delete a CV from Firestore
export async function deleteCV(uid: string, cvId: string): Promise<void> {
  const cvRef = doc(db, "users", uid, "cvs", cvId);
  try {
    await deleteDoc(cvRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${uid}/cvs/${cvId}`);
  }
}

// Record an export snapshot
export async function recordExport(
  uid: string, 
  format: "pdf" | "png", 
  fileName: string, 
  cvData: CVData, 
  designConfig: DesignConfig
): Promise<void> {
  try {
    const historyRef = collection(db, "users", uid, "history");
    const userRef = doc(db, "users", uid);

    await Promise.all([
      addDoc(historyRef, {
        timestamp: new Date().toISOString(),
        format,
        fileName,
        cvData,
        designConfig,
      }),
      setDoc(userRef, {
        downloadsCount: increment(1),
      }, { merge: true }),
    ]);
  } catch (err) {
    console.warn("Background export logging notice:", err);
  }
}
