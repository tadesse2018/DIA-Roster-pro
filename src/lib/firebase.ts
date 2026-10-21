import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache, doc, writeBatch, collection, getDocs, setLogLevel, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence verbose connection warnings and debug info from Firestore
try {
  setLogLevel('error');
} catch (e) {
  console.warn("Failed to set Firestore log level:", e);
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    ignoreUndefinedProperties: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  }, firebaseConfig.firestoreDatabaseId || '(default)');
} catch (err) {
  console.warn("Failed to initialize Firestore with persistentLocalCache. Trying memoryLocalCache...", err);
  try {
    firestoreDb = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      ignoreUndefinedProperties: true,
      localCache: memoryLocalCache()
    }, firebaseConfig.firestoreDatabaseId || '(default)');
  } catch (err2) {
    console.error("Failed to initialize Firestore with memoryLocalCache:", err2);
    // If all else fails, use default initializeFirestore
    firestoreDb = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      ignoreUndefinedProperties: true
    }, firebaseConfig.firestoreDatabaseId || '(default)');
  }
}

export const db = firestoreDb;

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    // Firestore seamlessly operates with offline cache when disconnected
  }
}
testConnection();

// A helper function to initialize default data in Firestore if empty
export async function seedFirestoreIfEmpty(
  schoolWorkspaceId: string,
  initialData: {
    students: any[];
    grades: any[];
    teachers: any[];
    announcements: any[];
    classes: any[];
    studentExtraInfo: Record<string, any>;
    schoolConfig?: any;
  }
) {
  try {
    const studentsSnapshot = await getDocs(collection(db, 'schools', schoolWorkspaceId, 'students'));
    if (!studentsSnapshot.empty) {
      console.log(`Firestore already has data for school workspace [${schoolWorkspaceId}]. Skipping seed.`);
      return false;
    }

    console.log(`Firestore is empty for workspace [${schoolWorkspaceId}]. Seeding initial data...`);
    
    // Collect all operations into a single flat list to batch-write efficiently
    const operations: { ref: any; data: any }[] = [];

    // Seed students
    for (const student of initialData.students) {
      operations.push({
        ref: doc(db, 'schools', schoolWorkspaceId, 'students', student.id),
        data: student
      });
    }

    // Seed grades
    for (const grade of initialData.grades) {
      operations.push({
        ref: doc(db, 'schools', schoolWorkspaceId, 'grades', grade.id),
        data: grade
      });
    }

    // Seed teachers
    for (const teacher of initialData.teachers) {
      operations.push({
        ref: doc(db, 'schools', schoolWorkspaceId, 'teachers', teacher.id),
        data: teacher
      });
    }

    // Seed announcements
    for (const announcement of initialData.announcements) {
      operations.push({
        ref: doc(db, 'schools', schoolWorkspaceId, 'announcements', announcement.id),
        data: announcement
      });
    }

    // Seed classes
    for (const cls of initialData.classes) {
      operations.push({
        ref: doc(db, 'schools', schoolWorkspaceId, 'classes', cls.id),
        data: cls
      });
    }

    // Seed school config
    operations.push({
      ref: doc(db, 'schools', schoolWorkspaceId, 'config', 'school'),
      data: initialData.schoolConfig || {
        nameAmh: 'ስማርት ስኩል አፕ',
        nameEng: 'Smart School App',
        mottoAmh: 'ለክህሎትና ለውጤታማነት እንተጋለን!',
        mottoEng: 'Striving for Skills and Success!',
        phone: '0111223344',
        email: 'info@smartschool.edu.et',
        address: 'አዲስ አበባ፣ ኢትዮጵያ (Addis Ababa, Ethiopia)',
        logoType: 'graduation',
        themeColor: 'indigo',
        subjects: ['Mathematics', 'English', 'Amharic', 'Science', 'Social Studies'],
        evaluationMode: 'quarter',
        schoolLevel: 'primary'
      }
    });

    // Seed extra info
    for (const [studentId, info] of Object.entries(initialData.studentExtraInfo)) {
      operations.push({
        ref: doc(db, 'schools', schoolWorkspaceId, 'studentExtraInfo', studentId),
        data: info
      });
    }

    // Write operations in batches of 400 (well below Firestore's 500 limit) to make it lightning fast
    const chunkSize = 400;
    for (let i = 0; i < operations.length; i += chunkSize) {
      const chunk = operations.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const op of chunk) {
        batch.set(op.ref, op.data);
      }
      await batch.commit();
      console.log(`Committed seed chunk of ${chunk.length} items to workspace [${schoolWorkspaceId}]...`);
    }

    console.log(`Firestore seeding for workspace [${schoolWorkspaceId}] completed successfully.`);
    return true;
  } catch (error) {
    console.error(`Error seeding Firestore for workspace [${schoolWorkspaceId}]:`, error);
    return false;
  }
}
