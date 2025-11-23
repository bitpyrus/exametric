import { storage } from './firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function uploadAudioBlob(blob: Blob, path: string) {
  const ref = storageRef(storage, path);
  const snapshot = await uploadBytes(ref, blob);
  const url = await getDownloadURL(snapshot.ref);
  return { url, path: snapshot.ref.fullPath };
}

