import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Configuration updated based on user input
// NOTE: These keys are public identifiers for your Firebase project.
// Security is handled via Firebase Console "Authorized Domains" and Security Rules.
const firebaseConfig = {
  apiKey: "AIzaSyBGJbcnEcAcUU4TJL4S6vU-YpCOyYVQBDE",
  authDomain: "project-3703627267316473601.firebaseapp.com",
  projectId: "project-3703627267316473601",
  storageBucket: "project-3703627267316473601.firebasestorage.app",
  messagingSenderId: "340259614533",
  appId: "1:340259614533:web:b8f39b17125fe01536d82c",
  measurementId: "G-NK8TFW1ZTS"
};

// Initialize Firebase (Modular SDK)
const app = initializeApp(firebaseConfig);

// Export Auth instance for use in auth.ts service
export const auth = getAuth(app);

// Initialize Analytics (optional, but good for tracking)
// We wrap this in a check because some environments (like strict blocking or non-browser envs)
// might not support analytics, which could cause a crash.
let analytics;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch((err) => {
  console.warn("Firebase Analytics not supported in this environment:", err);
});

export { analytics };