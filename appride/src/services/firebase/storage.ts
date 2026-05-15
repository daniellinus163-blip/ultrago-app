import * as FileSystem from 'expo-file-system/legacy';

import { getFirebaseAuth } from './auth';
import { resolveStorageBucket } from './env';

const STORAGE_HOST = 'firebasestorage.googleapis.com';

type StorageObjectResponse = {
  name?: string;
  downloadTokens?: string;
};

function encodeObjectPath(objectPath: string): string {
  return encodeURIComponent(objectPath);
}

function buildFirebaseDownloadUrl(bucket: string, objectName: string, downloadToken: string): string {
  return `https://${STORAGE_HOST}/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(objectName)}?alt=media&token=${downloadToken}`;
}

function parseApiError(status: number, body: string): Error {
  let message = body;
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    message = parsed.error?.message ?? body;
  } catch {
    /* use raw body */
  }

  if (status === 404) {
    return new Error(
      'Firebase Storage bucket not found. In Firebase Console → Storage, click Get started to create the default bucket, then try again.',
    );
  }
  if (status === 401 || status === 403) {
    return new Error(
      `Storage permission denied (${status}). Update Storage rules to allow authenticated writes to users/{userId}/. ${message}`,
    );
  }
  return new Error(`Photo upload failed (HTTP ${status}): ${message}`);
}

function shouldUseFirestorePhotoFallback(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const msg = error.message.toLowerCase();
  return (
    msg.includes('404') ||
    msg.includes('not found') ||
    msg.includes('bucket not found') ||
    msg.includes('storage is not set up') ||
    msg.includes('storage bucket not found')
  );
}

/** Copy content:// URIs to file:// so native upload can read the file. */
async function ensureFileUri(localUri: string): Promise<string> {
  if (localUri.startsWith('file://')) {
    return localUri;
  }
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) {
    throw new Error('Device cache is unavailable. Try again.');
  }
  const dest = `${cacheDir}profile_upload_${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: localUri, to: dest });
  return dest;
}

async function getFileByteSize(fileUri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(fileUri);
  if (!info.exists || typeof info.size !== 'number' || info.size <= 0) {
    throw new Error('Could not read the selected photo. Try choosing it again.');
  }
  return info.size;
}

/** Step 1 — start resumable session (JSON only, no Blob). */
async function startResumableUploadSession(params: {
  bucket: string;
  objectPath: string;
  contentType: string;
  size: number;
  idToken: string;
}): Promise<string> {
  const url =
    `https://${STORAGE_HOST}/v0/b/${encodeURIComponent(params.bucket)}/o` +
    `?name=${encodeObjectPath(params.objectPath)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.idToken}`,
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(params.size),
      'X-Goog-Upload-Header-Content-Type': params.contentType,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      name: params.objectPath,
      contentType: params.contentType,
      size: params.size,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw parseApiError(response.status, body);
  }

  const uploadUrl = response.headers.get('x-goog-upload-url') ?? response.headers.get('X-Goog-Upload-URL');
  if (!uploadUrl) {
    throw new Error('Storage did not return an upload URL. Check that Firebase Storage is enabled for this project.');
  }
  return uploadUrl;
}

/** Step 2 — send file bytes via RN XMLHttpRequest (native file body, no JS Blob). */
function uploadFileToResumableSession(params: {
  uploadUrl: string;
  fileUri: string;
  contentType: string;
  idToken: string;
}): Promise<StorageObjectResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as StorageObjectResponse);
        } catch {
          reject(new Error('Photo upload failed: invalid response from Storage.'));
        }
        return;
      }
      reject(parseApiError(xhr.status, xhr.responseText ?? ''));
    };
    xhr.onerror = () => reject(new Error('Network error while uploading photo. Check your connection.'));
    xhr.ontimeout = () => reject(new Error('Photo upload timed out. Try again on a stable connection.'));
    xhr.open('POST', params.uploadUrl);
    xhr.setRequestHeader('Authorization', `Bearer ${params.idToken}`);
    xhr.setRequestHeader('X-Goog-Upload-Command', 'upload, finalize');
    xhr.setRequestHeader('X-Goog-Upload-Offset', '0');
    xhr.setRequestHeader('Content-Type', params.contentType);
    xhr.send({
      uri: params.fileUri,
      type: params.contentType,
      name: 'profile.jpg',
    } as unknown as Document);
  });
}

/** Fallback when Storage bucket/API is unavailable — inline data URL for Image components. */
async function buildProfilePhotoDataUrl(fileUri: string, contentType: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  if (!base64) {
    throw new Error('Could not read the selected photo for upload.');
  }
  const maxBase64Len = 900_000;
  if (base64.length > maxBase64Len) {
    throw new Error('Photo is too large. Choose a smaller image or crop it tighter.');
  }
  return `data:${contentType};base64,${base64}`;
}

async function uploadViaFirebaseStorageResumable(
  uid: string,
  fileUri: string,
  contentType: string,
): Promise<string> {
  const bucket = resolveStorageBucket();
  if (!bucket) {
    throw new Error(
      'Firebase Storage bucket is missing. Set EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET in .env (e.g. my-project.firebasestorage.app), then restart Expo.',
    );
  }

  const user = getFirebaseAuth().currentUser;
  if (!user) {
    throw new Error('You must be signed in to upload a profile photo.');
  }

  const size = await getFileByteSize(fileUri);
  const idToken = await user.getIdToken();
  const objectPath = `users/${uid}/profile_${Date.now()}.jpg`;

  const uploadUrl = await startResumableUploadSession({
    bucket,
    objectPath,
    contentType,
    size,
    idToken,
  });

  const result = await uploadFileToResumableSession({
    uploadUrl,
    fileUri,
    contentType,
    idToken,
  });

  const objectName = result.name ?? objectPath;
  const downloadToken = result.downloadTokens?.split(',')[0]?.trim();
  if (!downloadToken) {
    throw new Error('Upload finished but no download link was returned. Check Firebase Storage rules.');
  }

  return buildFirebaseDownloadUrl(bucket, objectName, downloadToken);
}

/**
 * Upload profile photo for React Native (Expo Go).
 * Uses Firebase resumable upload + native XHR file body (no ArrayBuffer / JS Blob).
 * Falls back to an inline data URL if the Storage bucket is not provisioned (HTTP 404).
 */
export async function uploadUserProfilePhotoFromUri(
  uid: string,
  localUri: string,
  contentType = 'image/jpeg',
): Promise<string> {
  const fileUri = await ensureFileUri(localUri);
  try {
    return await uploadViaFirebaseStorageResumable(uid, fileUri, contentType);
  } catch (primaryError) {
    if (!shouldUseFirestorePhotoFallback(primaryError)) {
      if (
        primaryError instanceof Error &&
        primaryError.message.includes("Creating blobs from 'ArrayBuffer'")
      ) {
        throw new Error(
          'Photo upload failed due to a React Native limitation. Restart with npm run start:clear, then try again.',
        );
      }
      throw primaryError;
    }
    return buildProfilePhotoDataUrl(fileUri, contentType);
  }
}
