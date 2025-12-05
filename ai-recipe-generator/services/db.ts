
import { Recipe } from '../types';

const DB_NAME = 'AiRecipeDB';
const DB_VERSION = 1;
const STORE_NAME = 'recipes';

let db: IDBDatabase;

export const initDB = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (db) {
        return resolve(true);
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Error opening DB');
      reject(false);
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(true);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'title' });
      }
    };
  });
};

export const saveRecipe = (recipe: Recipe): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
        reject('DB not initialized');
        return;
    }
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(recipe);

    request.onsuccess = () => resolve();
    request.onerror = () => {
        console.error('Error saving recipe:', request.error);
        reject(request.error);
    };
  });
};

export const getAllRecipes = (): Promise<Recipe[]> => {
  return new Promise((resolve, reject) => {
    if (!db) {
        reject('DB not initialized');
        return;
    }
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
        console.error('Error getting all recipes:', request.error);
        reject(request.error);
    };
  });
};

export const deleteRecipe = (title: string): Promise<void> => {
    return new Promise((resolve, reject) => {
    if (!db) {
        reject('DB not initialized');
        return;
    }
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(title);

    request.onsuccess = () => resolve();
    request.onerror = () => {
        console.error('Error deleting recipe:', request.error);
        reject(request.error);
    };
  });
};
