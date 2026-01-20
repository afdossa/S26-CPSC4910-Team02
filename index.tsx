import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// ALERT ADDED PER REQUEST: 
// Use the displayed hostname in Firebase Console -> Authentication -> Settings -> Authorized Domains
// to resolve the 'auth/unauthorized-domain' error.
setTimeout(() => {
    alert(`FIREBASE CONFIGURATION:\n\nPlease add this domain to "Authorized Domains" in your Firebase Console to enable Google Sign-In:\n\n${window.location.hostname}`);
}, 500);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);