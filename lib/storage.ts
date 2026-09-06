import { StoredConversion } from './types';

const DB_NAME = 'photoConvert_DB';
const DB_VERSION = 1;
const STORE_NAME = 'conversions';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('mediaType', 'mediaType', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function saveConversion(item: StoredConversion): Promise<string> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(item);

    req.onsuccess = () => {
      resolve(item.id);
    };

    req.onerror = () => {
      reject(req.error);
    };
  });
}

export async function getAllConversions(): Promise<StoredConversion[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    const req = index.openCursor(null, 'prev');
    const items: StoredConversion[] = [];

    req.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        items.push(cursor.value);
        cursor.continue();
      } else {
        resolve(items);
      }
    };

    req.onerror = () => {
      reject(req.error);
    };
  });
}

export async function deleteConversion(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => {
      resolve();
    };

    req.onerror = () => {
      reject(req.error);
    };
  });
}

export async function clearAllConversions(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();

    req.onsuccess = () => {
      resolve();
    };

    req.onerror = () => {
      reject(req.error);
    };
  });
}

export { formatBytes, sanitizeFileName } from './utils';

/**
 * Fast O(1) count query using native IDBObjectStore.count().
 * Avoids loading multi-megabyte binary blobs into memory just to read item count.
 */
export async function getConversionCount(): Promise<number> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

export async function getStorageStats(cachedConversions?: StoredConversion[]): Promise<{ count: number; totalBytes: number; quotaBytes?: number }> {
  try {
    const conversions = cachedConversions || (await getAllConversions());
    const count = conversions.length;
    const totalBytes = conversions.reduce((acc, curr) => acc + (curr.convertedSize || 0), 0);

    let quotaBytes: number | undefined;
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      quotaBytes = estimate.usage;
    }

    return { count, totalBytes, quotaBytes };
  } catch {
    return { count: 0, totalBytes: 0 };
  }
}
