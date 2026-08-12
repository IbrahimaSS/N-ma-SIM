/**
 * Stockage temporaire sécurisé des fichiers KYC via IndexedDB.
 *
 * Utilisé pour conserver les fichiers (recto, verso, selfie) entre les pages
 * du parcours borne, sans les exposer dans sessionStorage ou localStorage.
 *
 * Les fichiers doivent être nettoyés à la fin du parcours ou après abandon.
 */

import type { KycReponse, KycStorageKey } from "@/types/kyc";

const DB_NAME = "nma_kyc_db";
const DB_VERSION = 1;
const STORE_FILES = "kyc_files";
const STORE_RESULT = "kyc_results";

/** Ouvre (ou crée) la base IndexedDB */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        db.createObjectStore(STORE_FILES);
      }
      if (!db.objectStoreNames.contains(STORE_RESULT)) {
        db.createObjectStore(STORE_RESULT);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ─────────────────────────────────────────────
// Fichiers images KYC (recto, verso, selfie)
// ─────────────────────────────────────────────

/**
 * Sauvegarde un fichier image dans IndexedDB.
 * @param key   - "kyc_recto" | "kyc_verso" | "kyc_selfie"
 * @param file  - Le fichier à stocker
 */
export async function saveKycImage(
  key: Extract<KycStorageKey, "kyc_recto" | "kyc_verso" | "kyc_selfie">,
  file: File | Blob
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FILES, "readwrite");
    const store = tx.objectStore(STORE_FILES);
    const req = store.put(file, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Récupère un fichier image depuis IndexedDB.
 * @param key - Clé du fichier
 * @returns   - Le Blob stocké ou null si absent
 */
export async function getKycImage(
  key: Extract<KycStorageKey, "kyc_recto" | "kyc_verso" | "kyc_selfie">
): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FILES, "readonly");
    const store = tx.objectStore(STORE_FILES);
    const req = store.get(key);
    req.onsuccess = () => resolve((req.result as Blob) ?? null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Supprime un fichier image de IndexedDB.
 * @param key - Clé du fichier à supprimer
 */
export async function deleteKycImage(
  key: Extract<KycStorageKey, "kyc_recto" | "kyc_verso" | "kyc_selfie">
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FILES, "readwrite");
    const store = tx.objectStore(STORE_FILES);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Supprime tous les fichiers KYC (recto, verso, selfie).
 * À appeler à la fin du parcours ou en cas d'abandon.
 */
export async function clearKycImages(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FILES, "readwrite");
    const store = tx.objectStore(STORE_FILES);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ─────────────────────────────────────────────
// Résultat KYC
// ─────────────────────────────────────────────

/**
 * Sauvegarde le résultat de l'analyse KYC dans IndexedDB.
 * @param result - Réponse complète de l'API IA
 */
export async function saveKycResult(result: KycReponse): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_RESULT, "readwrite");
    const store = tx.objectStore(STORE_RESULT);
    const req = store.put(result, "kyc_result");
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Récupère le résultat de l'analyse KYC depuis IndexedDB.
 * @returns - KycReponse ou null si aucun résultat stocké
 */
export async function getKycResult(): Promise<KycReponse | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_RESULT, "readonly");
    const store = tx.objectStore(STORE_RESULT);
    const req = store.get("kyc_result");
    req.onsuccess = () => resolve((req.result as KycReponse) ?? null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Supprime le résultat KYC de IndexedDB.
 */
export async function clearKycResult(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_RESULT, "readwrite");
    const store = tx.objectStore(STORE_RESULT);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Nettoie l'intégralité du stockage KYC (images + résultat).
 * À appeler lors du retour à l'accueil ou d'un abandon de parcours.
 */
export async function clearAllKycData(): Promise<void> {
  await Promise.all([clearKycImages(), clearKycResult()]);
}
