// Firebase is temporarily disabled to resolve service errors.
// These mocks prevent the app from crashing on import.

export const db = null as any;
export const auth = null as any;

console.warn("Smart English: Running in local-only mode. Firebase is disabled.");
