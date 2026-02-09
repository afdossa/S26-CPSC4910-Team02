import { auth as firebaseAuth } from './firebase';
import { 
    signInWithEmailAndPassword as fbSignIn, 
    createUserWithEmailAndPassword as fbCreateUser, 
    signOut as fbSignOut, 
    onAuthStateChanged as fbOnAuthStateChanged, 
    GoogleAuthProvider,
    signInWithPopup,
    User as FirebaseUser 
} from 'firebase/auth';
import { getConfig } from './config';
import { MOCK_USERS } from './mockData';

/**
 * AUTHENTICATION FACADE
 * Handles switching between Real Firebase Auth and Local Mock Auth
 * based on the admin configuration.
 */

// --- MOCK IMPLEMENTATION ---
// Simple observer pattern for mock auth state
let mockCurrentUser: { uid: string, email: string } | null = null;
const observers: ((user: any) => void)[] = [];

// Try to restore session from local storage for Mock Auth
const MOCK_SESSION_KEY = 'gdip_mock_session';
try {
    const saved = localStorage.getItem(MOCK_SESSION_KEY);
    if (saved) mockCurrentUser = JSON.parse(saved);
} catch {}

const notifyObservers = () => {
    observers.forEach(cb => cb(mockCurrentUser));
};

const mockSignIn = async (email: string, password: string) => {
    // 1. Check if email matches a known seed user
    const targetUser = MOCK_USERS.find(u => u.email === email);
    
    if (targetUser) {
        mockCurrentUser = { uid: targetUser.id, email: targetUser.email || email };
        localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(mockCurrentUser));
        notifyObservers();
        return { user: { uid: targetUser.id, email: targetUser.email } };
    }

    // 2. Allow "admin" generic login
    if (email === 'admin@system.com') {
        mockCurrentUser = { uid: 'u3', email };
        localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(mockCurrentUser));
        notifyObservers();
        return { user: { uid: 'u3', email: 'admin@system.com' } };
    }

    throw new Error("[Mock Auth] User not found. Try 'john.trucker@example.com' or 'alice@fastlane.com'");
};

const mockGoogleSignIn = async () => {
    // Simulate a Google User (New or Existing)
    const googleUser = {
        uid: `google_${Date.now()}`,
        email: `google_user_${Date.now()}@gmail.com`,
        displayName: "Google User"
    };
    
    // Check if we have a mock user for demo purposes that matches this "simulated" behavior
    // For simplicity in Mock mode, we just return a dynamic user
    mockCurrentUser = googleUser;
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(mockCurrentUser));
    notifyObservers();
    return { user: googleUser };
};

const mockCreateUser = async (email: string, password: string) => {
    const newUid = `u${Date.now()}`;
    mockCurrentUser = { uid: newUid, email };
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(mockCurrentUser));
    notifyObservers();
    return { user: { uid: newUid, email } };
};

const mockSignOut = async () => {
    mockCurrentUser = null;
    localStorage.removeItem(MOCK_SESSION_KEY);
    notifyObservers();
};

const mockOnAuthStateChanged = (callback: (user: any) => void) => {
    observers.push(callback);
    // CRITICAL FIX: Fire asynchronously to prevent main thread freeze / infinite loop
    // when switching modes in React effects.
    setTimeout(() => {
        callback(mockCurrentUser);
    }, 10);
    
    return () => {
        const idx = observers.indexOf(callback);
        if (idx > -1) observers.splice(idx, 1);
    };
};


// --- PUBLIC FACADE ---

export const authService = {
    signIn: async (email: string, pass: string) => {
        if (getConfig().useMockAuth) return mockSignIn(email, pass);
        return fbSignIn(firebaseAuth, email, pass);
    },

    signInWithGoogle: async () => {
        if (getConfig().useMockAuth) return mockGoogleSignIn();
        const provider = new GoogleAuthProvider();
        // Add scopes if needed, e.g., provider.addScope('profile');
        // This handles 2FA automatically via the Google Popup flow
        return signInWithPopup(firebaseAuth, provider);
    },

    signUp: async (email: string, pass: string) => {
        if (getConfig().useMockAuth) return mockCreateUser(email, pass);
        return fbCreateUser(firebaseAuth, email, pass);
    },

    logout: async () => {
        if (getConfig().useMockAuth) return mockSignOut();
        return fbSignOut(firebaseAuth);
    },

    onStateChange: (callback: (user: any) => void) => {
        if (getConfig().useMockAuth) return mockOnAuthStateChanged(callback);
        return fbOnAuthStateChanged(firebaseAuth, callback);
    }
};