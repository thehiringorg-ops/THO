
// --- MOCK FIRESTORE IMPLEMENTATION ---
// This replaces the real Firebase SDK to allow the app to run 
// completely client-side without network errors.

const STORAGE_PREFIX = 'tho_mock_db_';

// --- Event System for Real-time Updates ---
const listeners: { [key: string]: Function[] } = {};

const notifyListeners = (collectionName: string) => {
  const data = getCollectionData(collectionName);
  // Notify collection listeners
  if (listeners[collectionName]) {
    const snapshot = {
      docs: data.map(item => ({
        id: item.id,
        data: () => item,
        exists: () => true
      })),
      empty: data.length === 0
    };
    listeners[collectionName].forEach(cb => cb(snapshot));
  }
  
  // Notify document listeners
  // This is a simplified approach: check if any specific doc listeners need updating
  Object.keys(listeners).forEach(key => {
      if (key.startsWith(`${collectionName}/`)) {
          const docId = key.split('/')[1];
          const item = data.find(d => d.id === docId);
          const docSnapshot = {
              id: docId,
              exists: () => !!item,
              data: () => item || undefined
          };
          listeners[key].forEach(cb => cb(docSnapshot));
      }
  });
};

// --- Storage Helpers ---
const getCollectionData = (collectionName: string): any[] => {
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + collectionName);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

const saveCollectionData = (collectionName: string, data: any[]) => {
  localStorage.setItem(STORAGE_PREFIX + collectionName, JSON.stringify(data));
  notifyListeners(collectionName);
};

// --- Mock SDK Exports ---

export const db = { type: 'mock' };

export const collection = (db: any, name: string) => {
  return { type: 'collection', name };
};

export const doc = (db: any, colName: string, id?: string) => {
  if (db?.type === 'collection') {
      return { type: 'doc', collection: db.name, id: colName };
  }
  return { type: 'doc', collection: colName, id: id || `new_${Date.now()}` };
};

// Query is a pass-through in this simple mock
export const query = (colRef: any, ...args: any[]) => colRef;
export const orderBy = (field: string, dir: string) => ({ type: 'orderBy', field, dir });

export const onSnapshot = (ref: any, callback: (snap: any) => void) => {
  const key = ref.type === 'collection' ? ref.name : `${ref.collection}/${ref.id}`;
  
  if (!listeners[key]) listeners[key] = [];
  listeners[key].push(callback);

  // Initial callback
  if (ref.type === 'collection') {
      const data = getCollectionData(ref.name);
      callback({
          docs: data.map(item => ({
              id: item.id,
              data: () => item,
              exists: () => true
          })),
          empty: data.length === 0
      });
  } else {
      const data = getCollectionData(ref.collection);
      const item = data.find(d => d.id === ref.id);
      callback({
          id: ref.id,
          exists: () => !!item,
          data: () => item || undefined
      });
  }

  // Unsubscribe
  return () => {
      if (listeners[key]) {
          listeners[key] = listeners[key].filter(cb => cb !== callback);
      }
  };
};

export const getDocs = async (ref: any) => {
    const data = getCollectionData(ref.name);
    return {
        docs: data.map(item => ({
            id: item.id,
            data: () => item
        })),
        empty: data.length === 0
    };
};

export const setDoc = async (ref: any, data: any) => {
    const colData = getCollectionData(ref.collection);
    const index = colData.findIndex(d => d.id === ref.id);
    const safeData = JSON.parse(JSON.stringify(data)); // Deep copy to remove undefined
    
    if (index >= 0) {
        colData[index] = { ...safeData, id: ref.id };
    } else {
        colData.push({ ...safeData, id: ref.id });
    }
    saveCollectionData(ref.collection, colData);
};

export const updateDoc = async (ref: any, data: any) => {
    const colData = getCollectionData(ref.collection);
    const index = colData.findIndex(d => d.id === ref.id);
    
    if (index >= 0) {
        colData[index] = { ...colData[index], ...data };
        saveCollectionData(ref.collection, colData);
    }
};

export const deleteDoc = async (ref: any) => {
    const colData = getCollectionData(ref.collection);
    const newData = colData.filter(d => d.id !== ref.id);
    saveCollectionData(ref.collection, newData);
};
