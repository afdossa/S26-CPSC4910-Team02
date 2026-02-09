
import { User, UserRole, DriverApplication, SponsorOrganization, Product, PointTransaction, Notification } from '../types';
import { AWS_API_CONFIG, getConfig } from './config';

/**
 * AWS / MySQL SERVICE LAYER
 * 
 * This file normally connects to AWS Lambda/RDS.
 * 
 * FOR DEMO PURPOSES: 
 * We implement a "Pseudo-Remote" database here using a different LocalStorage key ('gdip_aws_prod_v1').
 * This allows "Production Mode" (Firebase Auth + Database) to function within this browser demo
 * without actually deploying the backend code to AWS.
 */

const PROD_DB_KEY = 'gdip_aws_prod_v1';

interface ProdDB {
    users: User[];
    sponsors: SponsorOrganization[];
    applications: DriverApplication[];
    products: Product[];
    transactions: PointTransaction[];
    notifications: Notification[];
}

const loadProdDB = (): ProdDB => {
    const stored = localStorage.getItem(PROD_DB_KEY);
    if (stored) return JSON.parse(stored);
    
    // Initial Seed for "Production" so it's not empty
    return {
        users: [],
        sponsors: [
            { 
                id: 's1', 
                name: 'FastLane Logistics', 
                pointDollarRatio: 0.01, 
                pointsFloor: 0,
                incentiveRules: ["100 pts: Clean roadside inspection"] 
            },
            { 
                id: 's2', 
                name: 'Global Freight', 
                pointDollarRatio: 0.015, 
                pointsFloor: 0,
                incentiveRules: []
            }
        ],
        applications: [],
        products: [
            { id: 'p1', name: 'Wireless Headset', description: 'Noise cancelling headset.', pricePoints: 5000, availability: true, imageUrl: 'https://picsum.photos/400/300?random=10', createdAt: '2025-01-01' },
            { id: 'p2', name: 'Truck GPS', description: 'Advanced routing system.', pricePoints: 15000, availability: true, imageUrl: 'https://picsum.photos/400/300?random=11', createdAt: '2025-01-15' }
        ],
        transactions: [],
        notifications: []
    };
};

const saveProdDB = (db: ProdDB) => {
    localStorage.setItem(PROD_DB_KEY, JSON.stringify(db));
};

const headers = {
    'Content-Type': 'application/json',
    'x-api-key': AWS_API_CONFIG.apiKey
};

// --- REDSHIFT ARCHIVING ---
export const triggerRedshiftArchive = async (): Promise<boolean> => {
    if (getConfig().useMockRedshift) {
        console.log("[Mock Redshift] Triggering simulated ETL job...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        return true;
    }

    try {
        console.log("[AWS] Triggering Real AWS Glue ETL job...");
        // In reality: await fetch(`${AWS_API_CONFIG.baseUrl}/system/archive`, { method: 'POST', headers });
        await new Promise(resolve => setTimeout(resolve, 2000)); 
        return true;
    } catch (e) {
        console.error("Archive failed", e);
        return false;
    }
};

// --- USER MANAGEMENT ---
export const apiGetUserProfile = async (uid: string): Promise<User | undefined> => {
    // Simulate Network Latency
    await new Promise(r => setTimeout(r, 300));
    
    const db = loadProdDB();
    return db.users.find(u => u.id === uid);
};

export const apiGetAllUsers = async (): Promise<User[]> => {
    await new Promise(r => setTimeout(r, 200));
    const db = loadProdDB();
    return db.users;
};

export const apiCreateProfile = async (user: User): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    const db = loadProdDB();
    
    // Check if duplicate ID exists
    if (db.users.some(u => u.id === user.id)) return false; 
    
    db.users.push(user);
    saveProdDB(db);
    return true;
};

export const apiUpdateUserRole = async (userId: string, newRole: UserRole): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 200));
    const db = loadProdDB();
    const user = db.users.find(u => u.id === userId);
    if (user) {
        user.role = newRole;
        saveProdDB(db);
        return true;
    }
    return false;
};

export const apiUpdateUserPreferences = async (userId: string, prefs: { alertsEnabled: boolean }) => {
    const db = loadProdDB();
    const user = db.users.find(u => u.id === userId);
    if (user) {
        user.preferences = { ...(user.preferences || { alertsEnabled: true }), ...prefs };
        saveProdDB(db);
        return true;
    }
    return false;
};

export const apiUpdateUserProfile = async (userId: string, updates: Partial<User>): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    const db = loadProdDB();
    const index = db.users.findIndex(u => u.id === userId);
    if (index !== -1) {
        db.users[index] = { ...db.users[index], ...updates };
        saveProdDB(db);
        return true;
    }
    return false;
};

// --- NOTIFICATIONS ---
export const apiGetNotifications = async (userId: string): Promise<Notification[]> => {
    await new Promise(r => setTimeout(r, 200));
    const db = loadProdDB();
    return (db.notifications || []).filter(n => n.userId === userId);
};

export const apiAddNotification = async (notif: Notification): Promise<boolean> => {
    const db = loadProdDB();
    if(!db.notifications) db.notifications = [];
    db.notifications.push(notif);
    saveProdDB(db);
    return true;
};

export const apiMarkNotificationAsRead = async (id: string): Promise<boolean> => {
    const db = loadProdDB();
    const n = db.notifications?.find(x => x.id === id);
    if (n) {
        n.isRead = true;
        saveProdDB(db);
        return true;
    }
    return false;
};

// --- SPONSORS ---
export const apiGetSponsors = async (): Promise<SponsorOrganization[]> => {
    await new Promise(r => setTimeout(r, 200));
    return loadProdDB().sponsors;
};

export const apiAddSponsor = async (sponsor: SponsorOrganization) => {
    const db = loadProdDB();
    sponsor.id = `s${Date.now()}`;
    db.sponsors.push(sponsor);
    saveProdDB(db);
};

export const apiUpdateSponsorFloor = async (id: string, floor: number) => {
    const db = loadProdDB();
    const s = db.sponsors.find(x => x.id === id);
    if (s) {
        s.pointsFloor = floor;
        saveProdDB(db);
        return true;
    }
    return false;
};

export const apiUpdateSponsorRules = async (id: string, rules: string[]) => {
    const db = loadProdDB();
    const s = db.sponsors.find(x => x.id === id);
    if (s) {
        s.incentiveRules = rules;
        saveProdDB(db);
        return true;
    }
    return false;
}

// --- CATALOG ---
export const apiGetCatalog = async (): Promise<Product[]> => {
    await new Promise(r => setTimeout(r, 200));
    return loadProdDB().products;
};

// --- APPLICATIONS ---
export const apiSubmitApplication = async (app: DriverApplication): Promise<boolean> => {
    const db = loadProdDB();
    // Remove existing pending for this user
    db.applications = db.applications.filter(a => !(a.userId === app.userId && a.status === 'PENDING'));
    app.id = `app${Date.now()}`;
    db.applications.push(app);
    saveProdDB(db);
    return true;
};

export const apiGetDriverApplications = async (): Promise<DriverApplication[]> => {
    return loadProdDB().applications;
};

export const apiProcessApplication = async (appId: string, status: string): Promise<boolean> => {
    const db = loadProdDB();
    const app = db.applications.find(a => a.id === appId);
    if (!app) return false;
    
    app.status = status as any;
    
    if (status === 'APPROVED') {
        const user = db.users.find(u => u.id === app.userId);
        if (user) {
            user.sponsorId = app.sponsorId;
            user.pointsBalance = 0;
        }
    }
    saveProdDB(db);
    return true;
};

// --- POINTS ---
export const apiUpdateDriverPoints = async (userId: string, amount: number, reason: string, sponsorId: string, type: 'MANUAL' | 'AUTOMATED' | 'PURCHASE' = 'MANUAL'): Promise<{success: boolean, message: string}> => {
    const db = loadProdDB();
    const user = db.users.find(u => u.id === userId);
    
    if (!user) return { success: false, message: "User not found" };
    
    // Check Floor
    const sponsor = db.sponsors.find(s => s.id === sponsorId);
    if (amount < 0) {
        const current = user.pointsBalance || 0;
        const floor = sponsor?.pointsFloor || 0;
        if (current + amount < floor) {
             return { success: false, message: `Cannot deduct points below floor (${floor}).` };
        }
    }

    user.pointsBalance = (user.pointsBalance || 0) + amount;
    
    db.transactions.unshift({
        id: `tx${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        amount,
        reason,
        sponsorName: sponsor?.name || 'Unknown',
        type: type
    });

    // Add persistent system notification for point change in production simulation
    if (user.preferences?.alertsEnabled !== false) {
        const notif: Notification = {
            id: `pn${Date.now()}`,
            userId,
            title: amount > 0 ? 'Points Awarded' : 'Points Deducted',
            message: `${Math.abs(amount).toLocaleString()} points have been ${amount > 0 ? 'added to' : 'removed from'} your account. Reason: ${reason}`,
            date: new Date().toISOString(),
            isRead: false,
            type: 'POINT_CHANGE',
            metadata: { amount, reason, sponsorName: sponsor?.name }
        };
        if(!db.notifications) db.notifications = [];
        db.notifications.push(notif);
    }

    saveProdDB(db);
    return { success: true, message: "Transaction committed" };
};

export const apiGetTransactions = async (): Promise<PointTransaction[]> => {
    return loadProdDB().transactions;
};
