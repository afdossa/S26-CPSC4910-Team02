import { User, UserRole, Product, SponsorOrganization, AboutData, AuditLog, PointTransaction, DriverApplication, PendingUser } from '../types';
import { getConfig, isTestMode } from './config';
import * as MySQL from './mysql';

/**
 * DATA FACADE
 * 
 * This service decides whether to use the LocalStorage Mock DB (Test Mode)
 * or the AWS MySQL API (Prod Mode) based on the configuration.
 * 
 * ALL interactions now return Promises to support the async nature of the MySQL connection.
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

// --- MOCK STORAGE HELPERS ---
const loadMock = <T>(key: string, seed: T): T => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : seed;
    } catch (e) { return seed; }
};
const persistMock = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

// --- MOCK SEED DATA (Kept for Test Mode) ---
const SEED_USERS: User[] = [
  { id: 'u1', username: 'driver1', role: UserRole.DRIVER, fullName: 'John Trucker', email: 'john.trucker@example.com', phoneNumber: '555-0101', address: '123 Haul St', sponsorId: 's1', pointsBalance: 5400, avatarUrl: 'https://picsum.photos/200/200?random=1' },
  { id: 'u2', username: 'sponsor1', role: UserRole.SPONSOR, fullName: 'Alice Logistics', email: 'alice@fastlane.com', sponsorId: 's1', avatarUrl: 'https://picsum.photos/200/200?random=2' },
  { id: 'u3', username: 'admin', role: UserRole.ADMIN, fullName: 'System Admin', email: 'admin@system.com', avatarUrl: 'https://picsum.photos/200/200?random=3' }
];
const SEED_SPONSORS: SponsorOrganization[] = [
  { id: 's1', name: 'FastLane Logistics', pointDollarRatio: 0.01, pointsFloor: 0 },
  { id: 's2', name: 'Global Freight', pointDollarRatio: 0.015, pointsFloor: 0 }
];
const SEED_CATALOG: Product[] = [
  { id: 'p1', name: 'Wireless Headset', description: 'Noise cancelling headset.', pricePoints: 5000, availability: true, imageUrl: 'https://picsum.photos/400/300?random=10' },
  { id: 'p2', name: 'Truck GPS', description: 'Advanced routing.', pricePoints: 15000, availability: true, imageUrl: 'https://picsum.photos/400/300?random=11' }
];

const SEED_APPLICATIONS: DriverApplication[] = [
    { id: 'app1', userId: 'u4', applicantName: 'David Drifter', email: 'david@road.com', sponsorId: 's1', date: '2026-02-01', status: 'PENDING', licenseNumber: 'CDL-998877', experienceYears: 5, reason: 'Looking for a safety-focused team.' },
    { id: 'app2', userId: 'u5', applicantName: 'Sarah Sprinter', email: 'sarah@mile.com', sponsorId: 's1', date: '2026-02-02', status: 'PENDING', licenseNumber: 'CDL-112233', experienceYears: 2, reason: 'Great benefits.' }
];

const SEED_AUDIT_LOGS: AuditLog[] = [
    { id: 'l1', date: '2026-01-20', action: 'Login', actor: 'admin', target: 'System', details: 'Admin login detected', category: 'LOGIN' },
    { id: 'l2', date: '2026-01-21', action: 'Point Adjustment', actor: 'sponsor1', target: 'driver1', details: 'Added 500 points', category: 'POINT_CHANGE' }
];

// --- PUBLIC EXPORTS FOR MOCK DATA ---
export const MOCK_USERS = SEED_USERS;
export const MOCK_CATALOG = SEED_CATALOG;
export const MOCK_SPONSORS = SEED_SPONSORS;
export const MOCK_APPLICATIONS = SEED_APPLICATIONS;
export const MOCK_AUDIT_LOGS = SEED_AUDIT_LOGS;

// --- PUBLIC API (FACADE) ---

const useMockDB = () => getConfig().useMockDB;

export const resetDatabase = () => {
    if (useMockDB()) {
        localStorage.clear();
        window.location.reload();
    } else {
        alert("Cannot reset Production MySQL Database from client.");
    }
};

// User Profiles
export const getUserProfile = async (uid: string): Promise<User | undefined> => {
    if (useMockDB()) {
        const users: User[] = loadMock(DB_KEYS.USERS, SEED_USERS);
        return users.find(u => u.id === uid);
    }
    return await MySQL.apiGetUserProfile(uid);
};

export const createProfile = async (uid: string, username: string, fullName: string, role: UserRole, additionalInfo?: { email: string, phone: string, address: string }) => {
    const newUser: User = {
        id: uid, username, fullName, role,
        email: additionalInfo?.email, phoneNumber: additionalInfo?.phone, address: additionalInfo?.address,
        avatarUrl: `https://picsum.photos/200/200?random=${Date.now()}`,
        pointsBalance: role === UserRole.DRIVER ? 0 : undefined
    };

    if (useMockDB()) {
        const users: User[] = loadMock(DB_KEYS.USERS, SEED_USERS);
        if (users.some(u => u.username === username)) return false;
        users.push(newUser);
        persistMock(DB_KEYS.USERS, users);
        _addMockLog('User Registered', 'system', username, `Role: ${role}`, 'USER_MGMT');
        return true;
    }
    
    return await MySQL.apiCreateProfile(newUser);
};

// We keep createUser for the Admin UI legacy mock function, but make it async
export const createUser = async (username: string, fullName: string, role: UserRole, password?: string, additionalInfo?: { email?: string, phone?: string }) => {
    if (useMockDB()) {
        const users: User[] = loadMock(DB_KEYS.USERS, SEED_USERS);
        const newUser: User = {
            id: `local_${Date.now()}`, username, fullName, role,
            email: additionalInfo?.email, phoneNumber: additionalInfo?.phone,
            avatarUrl: `https://picsum.photos/200/200?random=${Date.now()}`,
            pointsBalance: role === UserRole.DRIVER ? 0 : undefined
        };
        users.push(newUser);
        persistMock(DB_KEYS.USERS, users);
        return true;
    }
    // In production, we can't create users without Firebase Auth, so this might fail or call a cloud function
    return false;
};

// Update User Role (Admin Feature)
export const updateUserRole = async (userId: string, newRole: UserRole): Promise<boolean> => {
    if (useMockDB()) {
        const users: User[] = loadMock(DB_KEYS.USERS, SEED_USERS);
        const user = users.find(u => u.id === userId);
        if (user) {
            user.role = newRole;
            persistMock(DB_KEYS.USERS, users);
            _addMockLog('Role Update', 'admin', user.username, `Changed to ${newRole}`, 'USER_MGMT');
            return true;
        }
        return false;
    }
    return await MySQL.apiUpdateUserRole(userId, newRole);
};

// Data Getters (All Users)
export const getAllUsers = async (): Promise<User[]> => {
    if (useMockDB()) return loadMock(DB_KEYS.USERS, SEED_USERS);
    return await MySQL.apiGetAllUsers();
};

// Sponsors
export const getSponsors = async (): Promise<SponsorOrganization[]> => {
    if (useMockDB()) return loadMock(DB_KEYS.SPONSORS, SEED_SPONSORS);
    return await MySQL.apiGetSponsors();
};

export const getSponsor = (id: string): SponsorOrganization | undefined => {
    if (useMockDB()) {
        const sponsors: SponsorOrganization[] = loadMock(DB_KEYS.SPONSORS, SEED_SPONSORS);
        return sponsors.find(s => s.id === id);
    }
    return undefined;
};

export const addSponsor = async (name: string, ratio: number) => {
    if (useMockDB()) {
        const sponsors: SponsorOrganization[] = loadMock(DB_KEYS.SPONSORS, SEED_SPONSORS);
        sponsors.push({ id: `s${Date.now()}`, name, pointDollarRatio: ratio, pointsFloor: 0 });
        persistMock(DB_KEYS.SPONSORS, sponsors);
        return;
    }
    await MySQL.apiAddSponsor({ id: '', name, pointDollarRatio: ratio });
};

export const updateSponsorFloor = async (sponsorId: string, newFloor: number) => {
    if (useMockDB()) {
        const sponsors: SponsorOrganization[] = loadMock(DB_KEYS.SPONSORS, SEED_SPONSORS);
        const s = sponsors.find(x => x.id === sponsorId);
        if (s) {
            s.pointsFloor = newFloor;
            persistMock(DB_KEYS.SPONSORS, sponsors);
            return true;
        }
        return false;
    }
    return await MySQL.apiUpdateSponsorFloor(sponsorId, newFloor);
};

// Applications
export const submitApplication = async (userId: string, sponsorId: string, details: any) => {
    // 1. Get the current user details to populate the application
    const user = await getUserProfile(userId);
    
    // 2. Construct the full application object
    const newApp: DriverApplication = {
        id: `app${Date.now()}`, // will be overwritten in MySQL if needed, or used here
        userId, 
        sponsorId, 
        applicantName: user?.fullName || 'Unknown',
        email: user?.email || '', 
        date: new Date().toISOString().split('T')[0], 
        status: 'PENDING', 
        ...details
    };

    if (useMockDB()) {
        const apps: DriverApplication[] = loadMock(DB_KEYS.APPS, []);
        // Remove old pending for this user
        const cleanApps = apps.filter(a => !(a.userId === userId && a.status === 'PENDING'));
        cleanApps.push(newApp);
        persistMock(DB_KEYS.APPS, cleanApps);
        return true;
    }

    // Production (MySQL)
    return await MySQL.apiSubmitApplication(newApp);
};

export const getDriverApplication = async (userId: string): Promise<DriverApplication | undefined> => {
    if (useMockDB()) {
        const apps: DriverApplication[] = loadMock(DB_KEYS.APPS, []);
        return apps.find(a => a.userId === userId && a.status === 'PENDING');
    }
    const apps = await MySQL.apiGetDriverApplications();
    return apps.find(a => a.userId === userId && a.status === 'PENDING');
};

export const getAllApplications = async (): Promise<DriverApplication[]> => {
    if (useMockDB()) return loadMock(DB_KEYS.APPS, []);
    return await MySQL.apiGetDriverApplications();
};

export const processApplication = async (appId: string, approved: boolean) => {
    if (useMockDB()) {
        const apps: DriverApplication[] = loadMock(DB_KEYS.APPS, []);
        const app = apps.find(a => a.id === appId);
        if (!app) return false;
        app.status = approved ? 'APPROVED' : 'REJECTED';
        
        if (approved) {
            const users: User[] = loadMock(DB_KEYS.USERS, SEED_USERS);
            const user = users.find(u => u.id === app.userId);
            if (user) {
                user.sponsorId = app.sponsorId;
                if (user.pointsBalance === undefined) user.pointsBalance = 0;
                persistMock(DB_KEYS.USERS, users);
            }
        }
        persistMock(DB_KEYS.APPS, apps);
        return true;
    }
    return await MySQL.apiProcessApplication(appId, approved ? 'APPROVED' : 'REJECTED');
};

// Points
export const updateDriverPoints = async (driverId: string, amount: number, reason: string, sponsorName: string, sponsorId?: string) => {
    if (useMockDB()) {
        const users: User[] = loadMock(DB_KEYS.USERS, SEED_USERS);
        const user = users.find(u => u.id === driverId);
        const sponsors: SponsorOrganization[] = loadMock(DB_KEYS.SPONSORS, SEED_SPONSORS);
        const sponsor = sponsors.find(s => s.id === sponsorId);
        
        if (user && user.pointsBalance !== undefined) {
             if (amount < 0 && sponsor) {
                 if ((user.pointsBalance + amount) < (sponsor.pointsFloor || 0)) {
                     return { success: false, message: "Floor limit reached" };
                 }
             }
             user.pointsBalance += amount;
             
             const txs: PointTransaction[] = loadMock(DB_KEYS.TX, []);
             txs.unshift({ id: `t${Date.now()}`, date: new Date().toISOString().split('T')[0], amount, reason, sponsorName });
             
             persistMock(DB_KEYS.USERS, users);
             persistMock(DB_KEYS.TX, txs);
             return { success: true, message: "Updated Mock DB" };
        }
        return { success: false, message: "User not found" };
    }
    return await MySQL.apiUpdateDriverPoints(driverId, amount, reason, sponsorId || '');
};

export const getTransactions = async (): Promise<PointTransaction[]> => {
    if (useMockDB()) return loadMock(DB_KEYS.TX, [{ id: 't1', date: '2026-01-15', amount: 500, reason: 'Safe Driving Bonus', sponsorName: 'FastLane Logistics' }]);
    return await MySQL.apiGetTransactions();
};

export const getCatalog = async (): Promise<Product[]> => {
    if (useMockDB()) return loadMock(DB_KEYS.CATALOG, SEED_CATALOG);
    return await MySQL.apiGetCatalog();
};

export const MOCK_USERS_SYNC = SEED_USERS; // Legacy export for sync filters if absolutely needed, but better to use getAllUsers

// Helpers
const _addMockLog = (action: string, actor: string, target: string, details: string, category: AuditLog['category']) => {
    const logs: AuditLog[] = loadMock(DB_KEYS.LOGS, SEED_AUDIT_LOGS);
    logs.unshift({ id: `l${Date.now()}`, date: new Date().toISOString().split('T')[0], action, actor, target, details, category });
    persistMock(DB_KEYS.LOGS, logs);
};

export const getAuditLogs = async (): Promise<AuditLog[]> => {
    if (useMockDB()) return loadMock(DB_KEYS.LOGS, SEED_AUDIT_LOGS);
    return [];
}

export const MOCK_ABOUT_DATA: AboutData = {
  teamNumber: "Team-2",
  versionNumber: "Sprint-2 (AWS Integration)",
  releaseDate: "Spring 2026",
  productName: "Good (Truck) Driver Incentive Program",
  description: "A comprehensive platform incentivizing safe driving behaviors through sponsor-backed rewards. Deployed on AWS with MySQL and Redshift archiving."
};
