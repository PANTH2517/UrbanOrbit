// src/firebase.jsx
// File storage (issue photos, official documents) is Cloudinary, not Firebase
// Storage - new Firebase Storage buckets now require the Blaze billing plan
// even on a fresh project, which this app deliberately avoids. See
// docs/SECURITY.md and integrations/Core.jsx.
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(
    "Missing Firebase config. Copy .env.example to .env and fill in your Firebase project's values."
  );
}

const app = initializeApp(firebaseConfig);

// App Check cuts down on bot/abuse traffic hitting Firestore.
// Optional in dev: only initialized once a reCAPTCHA v3 site key is configured
// (Firebase console > App Check > register this web app).
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (recaptchaSiteKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(recaptchaSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

const db = getFirestore(app);
const auth = getAuth(app);

// Analytics only works in a real browser context (not SSR, not every embedded webview).
let analytics = null;
isAnalyticsSupported().then((supported) => {
  if (supported) analytics = getAnalytics(app);
});

export { app, db, auth, analytics };
