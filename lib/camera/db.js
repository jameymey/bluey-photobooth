import { openDB } from "idb";

const DB_NAME = "photobooth-db";
const STORE_NAME = "photos";

export async function savePhotosToDB(photos) {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
  await db.put(STORE_NAME, photos, "photobooth-photos");
}

export async function getPhotosFromDB() {
  const db = await openDB(DB_NAME, 1);
  return await db.get(STORE_NAME, "photobooth-photos");
}

export async function deletePhotosFromDB() {
  const db = await openDB(DB_NAME, 1);
  await db.delete(STORE_NAME, "photobooth-photos");
}
