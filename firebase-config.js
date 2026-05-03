// Firebase Configuration
// Load from environment variables for security
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Fallback validation
if (!firebaseConfig.apiKey) {
  console.error(
    'Firebase configuration is missing. Please ensure .env file is properly configured. ' +
    'Copy .env.example to .env and add your Firebase credentials.'
  );
}

export default firebaseConfig;
