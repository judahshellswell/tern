// Shared by the browser upload helpers (lib/cv-upload.ts) and the server
// actions (app/account-actions.ts) — kept separate so the server never
// imports the client Storage SDK.
export function cvStoragePath(uid: string): string {
  return `cvs/${uid}/cv`;
}
