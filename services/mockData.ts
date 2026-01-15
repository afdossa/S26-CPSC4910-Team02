import { User, UserRole, Product, SponsorOrganization, AboutData, AuditLog, PointTransaction, DriverApplication, PendingUser } from '../types';

/**
 * DATABASE MOCK SERVICE
 * 
 * This service implements a persistence layer using LocalStorage to simulate a database.
 * This allows for data retention and testing of account creation/management as requested.
 * In a production deployment, this file would be replaced by an API client connecting to a real SQL database.
 */

const DB_KEYS = {
    USERS: 'gdip_db_users_v1',
    PENDING: 'gdip_db_pending_v1',
    SPONSORS: 'gdip_db_sponsors_v1',
    CATALOG: 'gdip_db_catalog_v1',
    LOGS: 'gdip_db_logs_v1',
    TX: 'gdip_db_tx_v1',
    APPS: 'gdip_db_apps_v1'
};

// --- SEED DATA ---
const SEED_USERS: User[] = [
  {
    id: 'u1',
    username: 'driver1',
    password: 'password',
    role: UserRole.DRIVER,
    fullName: 'John Trucker',
    sponsorId: 's1',
    pointsBalance: 5400,
    avatarUrl: 'https://picsum.photos/200/200?random=1'
  },
  {
    id: 'u2',
    username: 'sponsor1',
    password: 'password',
    role: UserRole.SPONSOR,
    fullName: 'Alice Logistics',
    sponsorId: 's1',
    avatarUrl: 'https://picsum.photos/200/200?random=2'
  },
  {
    id: 'u3',
    username: 'admin', // Requested Admin Account
    password: 'test',  // Requested Password
    role: UserRole.ADMIN,
    fullName: 'System Admin',
    avatarUrl: 'https://picsum.photos/200/200?random=3'
  }
];

const SEED_SPONSORS: SponsorOrganization[] = [
  { id: 's1', name: 'FastLane Logistics', pointDollarRatio: 0.01 },
  { id: 's2', name: 'Global Freight', pointDollarRatio: 0.015 }
];

const SEED_CATALOG: Product[] = [
  {
    id: 'p1',
    name: 'Wireless Headset',
    description: 'Noise cancelling headset perfect for long hauls.',
    pricePoints: 5000,
    availability: true,
    imageUrl: 'https://picsum.photos/400/300?random=10'
  },
  {
    id: 'p2',
    name: 'Truck GPS System',
    description: 'Advanced routing with traffic updates.',
    pricePoints: 15000,
    availability: true,
    imageUrl: 'https://picsum.photos/400/300?random=11'
  },
  {
    id: 'p3',
    name: 'Ergonomic Seat Cushion',
    description: 'Memory foam cushion for driving comfort.',
    pricePoints: 2500,
    availability: true,
    imageUrl: 'https://picsum.photos/400/300?random=12'
  },
  {
    id: 'p4',
    name: 'Digital Tire Gauge',
    description: 'Precision digital tire pressure gauge.',
    pricePoints: 1200,
    availability: false,
    imageUrl: 'https://picsum.photos/400/300?random=13'
  },
  {
    id: 'p5',
    name: 'Cooler Box 12V',
    description: 'Electric cooler to keep food fresh.',
    pricePoints: 8000,
    availability: true,
    imageUrl: 'https://picsum.photos/400/300?random=14'
  }
];

// --- STORAGE HELPERS ---

const load = <T>(key: string, seed: T): T => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : seed;
    } catch (e) {
        console.error("Failed to load DB", e);
        return seed;
    }
};

const persist = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const resetDatabase = () => {
    localStorage.clear();
    window.location.reload();
};

// --- STATE INITIALIZATION ---
// We export these mutable arrays so the existing app structure (imports) continues to work.
// However, any modification to these arrays is handled by the helper functions below which enforce persistence.

export const MOCK_USERS: User[] = load(DB_KEYS.USERS, SEED_USERS);
export const MOCK_PENDING_USERS: PendingUser[] = load(DB_KEYS.PENDING, []);
export const MOCK_SPONSORS: SponsorOrganization[] = load(DB_KEYS.SPONSORS, SEED_SPONSORS);
export const MOCK_CATALOG: Product[] = load(DB_KEYS.CATALOG, SEED_CATALOG);

export const MOCK_AUDIT_LOGS: AuditLog[] = load(DB_KEYS.LOGS, [
  { id: 'l1', date: '2026-02-01', action: 'Login Success', actor: 'driver1', target: 'System', details: 'Standard login', category: 'LOGIN' },
]);

export const MOCK_TRANSACTIONS: PointTransaction[] = load(DB_KEYS.TX, [
  { id: 't1', date: '2026-01-15', amount: 500, reason: 'Safe Driving Bonus', sponsorName: 'FastLane Logistics' },
]);

export const MOCK_APPLICATIONS: DriverApplication[] = load(DB_KEYS.APPS, [
    { id: 'a1', applicantName: 'Michael Knight', email: 'm.knight@foundation.org', date: '2026-02-10', status: 'PENDING' },
]);


// --- ACTIONS ---

export const registerUser = (username: string, fullName: string, role: UserRole, password?: string) => {
    if (MOCK_USERS.some(u => u.username === username) || MOCK_PENDING_USERS.some(u => u.username === username)) {
        return false;
    }

    MOCK_PENDING_USERS.push({
        id: `pu${Date.now()}`,
        username,
        fullName,
        role,
        password: password || 'password', // Default if not provided
        requestDate: new Date().toISOString().split('T')[0]
    });
    persist(DB_KEYS.PENDING, MOCK_PENDING_USERS);
    return true;
};

export const createUser = (username: string, fullName: string, role: UserRole, password?: string) => {
    if (MOCK_USERS.some(u => u.username === username) || MOCK_PENDING_USERS.some(u => u.username === username)) {
        return false;
    }

    const newUser: User = {
        id: `u${Date.now()}`,
        username,
        fullName,
        role,
        password: password || 'password',
        avatarUrl: `https://picsum.photos/200/200?random=${Date.now()}`,
        pointsBalance: role === UserRole.DRIVER ? 0 : undefined
    };
    
    MOCK_USERS.push(newUser);
    persist(DB_KEYS.USERS, MOCK_USERS);

    addLog('User Created', 'admin', newUser.username, `Direct creation. Role: ${role}`, 'USER_MGMT');
    return true;
};

export const approveUser = (id: string) => {
    const index = MOCK_PENDING_USERS.findIndex(u => u.id === id);
    if (index !== -1) {
        const pending = MOCK_PENDING_USERS[index];
        const newUser: User = {
            id: `u${Date.now()}`,
            username: pending.username,
            fullName: pending.fullName,
            role: pending.role,
            password: pending.password,
            avatarUrl: `https://picsum.photos/200/200?random=${Date.now()}`,
            pointsBalance: pending.role === UserRole.DRIVER ? 0 : undefined
        };
        MOCK_USERS.push(newUser);
        MOCK_PENDING_USERS.splice(index, 1);
        
        persist(DB_KEYS.USERS, MOCK_USERS);
        persist(DB_KEYS.PENDING, MOCK_PENDING_USERS);
        
        addLog('Account Approved', 'admin', newUser.username, `Role: ${newUser.role}`, 'USER_MGMT');
        return true;
    }
    return false;
};

export const rejectUser = (id: string) => {
    const index = MOCK_PENDING_USERS.findIndex(u => u.id === id);
    if (index !== -1) {
        MOCK_PENDING_USERS.splice(index, 1);
        persist(DB_KEYS.PENDING, MOCK_PENDING_USERS);
        return true;
    }
    return false;
};

export const updateDriverPoints = (driverId: string, amount: number, reason: string, sponsorName: string) => {
    const user = MOCK_USERS.find(u => u.id === driverId);
    if (user && user.pointsBalance !== undefined) {
        user.pointsBalance += amount;
        
        const tx: PointTransaction = {
            id: `t${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            amount: amount,
            reason: reason,
            sponsorName: sponsorName
        };
        MOCK_TRANSACTIONS.unshift(tx);
        
        persist(DB_KEYS.USERS, MOCK_USERS);
        persist(DB_KEYS.TX, MOCK_TRANSACTIONS);

        addLog(amount > 0 ? 'Points Added' : 'Points Deducted', 'sponsor', user.username, `${reason} (${amount} pts)`, 'POINT_CHANGE');
        return true;
    }
    return false;
};

export const addSponsor = (name: string, ratio: number) => {
    MOCK_SPONSORS.push({
        id: `s${Date.now()}`,
        name,
        pointDollarRatio: ratio
    });
    persist(DB_KEYS.SPONSORS, MOCK_SPONSORS);
};

// Internal Helper for logging
const addLog = (action: string, actor: string, target: string, details: string, category: AuditLog['category']) => {
    MOCK_AUDIT_LOGS.unshift({
        id: `l${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        action,
        actor,
        target,
        details,
        category
    });
    persist(DB_KEYS.LOGS, MOCK_AUDIT_LOGS);
};

// Static Data
export const MOCK_ABOUT_DATA: AboutData = {
  teamNumber: "Team-6",
  versionNumber: "Sprint-2 (Persisted)",
  releaseDate: "Spring 2026",
  productName: "Good (Truck) Driver Incentive Program",
  description: "A comprehensive platform incentivizing safe driving behaviors through sponsor-backed rewards."
};