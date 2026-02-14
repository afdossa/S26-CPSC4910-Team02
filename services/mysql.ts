
import { User, UserRole, DriverApplication, SponsorOrganization, Product, PointTransaction, Notification, CartItem, Message } from '../types';
import { AWS_API_CONFIG, getConfig } from './config';

/**
 * AWS / MySQL SERVICE LAYER
 */

const PROD_DB_KEY = 'gdip_aws_prod_v1';

interface ProdDB {
    users: User[];
    sponsors: SponsorOrganization[];
    applications: DriverApplication[];
    products: Product[];
    transactions: PointTransaction[];
    notifications: Notification[];
    messages: Message[];
}

const loadProdDB = (): ProdDB => {
    const stored = localStorage.getItem(PROD_DB_KEY);
    if (stored) return JSON.parse(stored);
    return {
        users: [],
        sponsors: [
            { id: 's1', name: 'FastLane Logistics', pointDollarRatio: 0.01, pointsFloor: 0, incentiveRules: ["100 pts: Clean inspection"] },
            { id: 's2', name: 'Global Freight', pointDollarRatio: 0.015, pointsFloor: 0, incentiveRules: [] }
        ],
        applications: [],
        products: [
            { id: 'p1', name: 'Wireless Headset', description: 'Noise cancelling.', pricePoints: 5000, availability: true, imageUrl: 'https://picsum.photos/400/300?random=10', createdAt: '2025-01-01' },
            { id: 'p2', name: 'Truck GPS', description: 'Advanced routing.', pricePoints: 15000, availability: true, imageUrl: 'https://picsum.photos/400/300?random=11', createdAt: '2025-01-15' }
        ],
        transactions: [],
        notifications: [],
        messages: []
    };
};

const saveProdDB = (db: ProdDB) => {
    localStorage.setItem(PROD_DB_KEY, JSON.stringify(db));
};

// --- REDSHIFT ARCHIVING ---
export const triggerRedshiftArchive = async (): Promise<boolean> => {
    if (getConfig().useMockRedshift) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return true;
    }
    await new Promise(resolve => setTimeout(resolve, 2000)); 
    return true;
};

// --- USER MANAGEMENT ---
export const apiGetUserProfile = async (uid: string): Promise<User | undefined> => {
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

export const apiBanUser = async (userId: string, active: boolean): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 200));
    const db = loadProdDB();
    const user = db.users.find(u => u.id === userId);
    if (user) {
        user.isActive = active;
        saveProdDB(db);
        return true;
    }
    return false;
};

export const apiDeleteUser = async (userId: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 200));
    const db = loadProdDB();
    const index = db.users.findIndex(u => u.id === userId);
    if (index !== -1) {
        db.users.splice(index, 1);
        saveProdDB(db);
        return true;
    }
    return false;
};

export const apiUpdateUserPreferences = async (userId: string, prefs: Partial<User['preferences']>) => {
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

export const apiValidateCartAvailability = async (cart: CartItem[]): Promise<{ valid: boolean, unavailableItems: string[] }> => {
    await new Promise(r => setTimeout(r, 200));
    const db = loadProdDB();
    const unavailable: string[] = [];
    for (const item of cart) {
        const product = db.products.find(p => p.id === item.id);
        if (!product || !product.availability) unavailable.push(item.name);
    }
    return { valid: unavailable.length === 0, unavailableItems: unavailable };
};

// --- APPLICATIONS ---
export const apiSubmitApplication = async (app: DriverApplication): Promise<boolean> => {
    const db = loadProdDB();
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
    const user = db.users.find(u => u.id === app.userId);
    if (status === 'APPROVED' && user) {
        user.sponsorId = app.sponsorId;
        user.pointsBalance = 0;
    }
    saveProdDB(db);
    return true;
};

// --- POINTS ---
export const apiUpdateDriverPoints = async (userId: string, amount: number, reason: string, sponsorId: string, type: 'MANUAL' | 'AUTOMATED' | 'PURCHASE' = 'MANUAL', actorName?: string): Promise<{success: boolean, message: string}> => {
    const db = loadProdDB();
    const user = db.users.find(u => u.id === userId);
    if (!user) return { success: false, message: "User not found" };
    const sponsor = db.sponsors.find(s => s.id === sponsorId);
    if (amount < 0) {
        const current = user.pointsBalance || 0;
        const floor = sponsor?.pointsFloor || 0;
        if (current + amount < floor) return { success: false, message: `Deduction below floor (${floor}).` };
    }
    user.pointsBalance = (user.pointsBalance || 0) + amount;
    db.transactions.unshift({ id: `tx${Date.now()}`, date: new Date().toISOString().split('T')[0], amount, reason, sponsorName: sponsor?.name || 'Unknown', driverId: userId, actorName: actorName, type: type, status: 'COMPLETED' });
    saveProdDB(db);
    return { success: true, message: "Committed" };
};

export const apiGetTransactions = async (): Promise<PointTransaction[]> => {
    return loadProdDB().transactions;
};

// --- REFUNDS ---
export const apiRequestRefund = async (driverId: string, transactionId: string, reason: string): Promise<boolean> => {
    const db = loadProdDB();
    const tx = db.transactions.find(t => t.id === transactionId);
    if (!tx) return false;
    tx.status = 'REFUND_PENDING';
    tx.refundReason = reason;
    saveProdDB(db);
    return true;
};

export const apiHandleRefund = async (transactionId: string, approved: boolean, actorName: string): Promise<boolean> => {
    const db = loadProdDB();
    const tx = db.transactions.find(t => t.id === transactionId);
    if (!tx || tx.status !== 'REFUND_PENDING') return false;
    if (approved) {
        tx.status = 'REFUNDED';
        const user = db.users.find(u => u.id === tx.driverId);
        if (user && user.pointsBalance !== undefined) {
            user.pointsBalance += Math.abs(tx.amount);
        }
    } else {
        tx.status = 'REFUND_REJECTED';
    }
    saveProdDB(db);
    return true;
};

// --- MESSAGES ---
export const apiGetMessages = async (userId: string, otherId: string): Promise<Message[]> => {
    const db = loadProdDB();
    return (db.messages || []).filter(m => (m.senderId === userId && m.receiverId === otherId) || (m.senderId === otherId && m.receiverId === userId)).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

export const apiSendMessage = async (msg: Message): Promise<boolean> => {
    const db = loadProdDB();
    if (!db.messages) db.messages = [];
    db.messages.push(msg);
    saveProdDB(db);
    return true;
};
