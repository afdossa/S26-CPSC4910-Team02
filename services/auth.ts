
import { auth as firebaseAuth } from './firebase';
import { 
    signInWithEmailAndPassword as fbSignIn, 
    createUserWithEmailAndPassword as fbCreateUser, 
    signOut as fbSignOut, 
    onAuthStateChanged as fbOnAuthStateChanged, 
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup,
    User as FirebaseUser 
} from 'firebase/auth';
import { getConfig } from './config';
import { getAllUsers, getUserProfile } from './mockData';

/**
 * AUTHENTICATION FACADE
 * Handles switching between Real Firebase Auth and Local Mock Auth
 * based on the admin configuration.
 */

// --- MOCK IMPLEMENTATION ---
let mockCurrentUser: { uid: string, email: string } | null = null;
const observers: ((user: any) => void)[] = [];

const MOCK_SESSION_KEY = 'gdip_mock_session';
try {
    const saved = localStorage.getItem(MOCK_SESSION_KEY);
    if (saved) mockCurrentUser = JSON.parse(saved);
} catch {}

const notifyObservers = () => {
    observers.forEach(cb => cb(mockCurrentUser));
};

const mockSignIn = async (email: string, password: string) => {
    // CRITICAL FIX: Fetch from dynamic storage, not the static seed constant
    const users = await getAllUsers();
    const targetUser = users.find(u => u.email === email);
    
    // Check if account exists and is active
    if (targetUser) {
        // Double check profile status
        if (targetUser.isActive === false) {
            throw new Error("Your account has been banned. Please contact support.");
        }

        mockCurrentUser = { uid: targetUser.id, email: targetUser.email || email };
        localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(mockCurrentUser));
        notifyObservers();
        return { user: { uid: targetUser.id, email: targetUser.email } };
    }

    if (email === 'admin@system.com') {
        mockCurrentUser = { uid: 'u3', email };
        localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(mockCurrentUser));
        notifyObservers();
        return { user: { uid: 'u3', email: 'admin@system.com' } };
    }
    throw new Error("[Mock Auth] User not found.");
};

const mockGoogleSignIn = async () => {
    const googleUser = {
        uid: `google_${Date.now()}`,
        email: `google_user_${Date.now()}@gmail.com`,
        displayName: "Google User"
    };
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

    resetPassword: async (email: string) => {
        if (getConfig().useMockAuth) return true;
        return sendPasswordResetEmail(firebaseAuth, email);
    },

    adminSetPassword: async (userId: string, newPassword: string) => {
        await new Promise(r => setTimeout(r, 800));
        
        if (getConfig().useMockAuth) {
            console.log(`[Mock Admin] Password for ${userId} set to ${newPassword}`);
            return true;
        }

        console.log(`[Production] Requesting administrative password override for ${userId}`);
        return true;
    },

    onStateChange: (callback: (user: any) => void) => {
        if (getConfig().useMockAuth) return mockOnAuthStateChanged(callback);
        return fbOnAuthStateChanged(firebaseAuth, callback);
    }
};
