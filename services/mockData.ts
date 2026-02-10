
import { User, UserRole, Product, SponsorOrganization, AboutData, AuditLog, PointTransaction, DriverApplication, PendingUser, Notification, GlobalSettings } from '../types';
import { getConfig, isTestMode } from './config';
import * as MySQL from './mysql';

/**
 * DATA FACADE
 * 
 * This service decides whether to use the LocalStorage Mock DB (Test Mode)
 * or the AWS MySQL API (Prod Mode) based on the configuration.
 */

const DB_KEYS = {
    USERS: 'gdip_db_users_v1',
    PENDING: 'gdip_db_pending_v1',
    SPONSORS: 'gdip_db_sponsors_v1',
    CATALOG: 'gdip_db_catalog_v1',
    LOGS: 'gdip_db_logs_v1',
    TX: 'gdip_db_tx_v1',
    APPS: 'gdip_db_apps_v1',
    NOTIFICATIONS: 'gdip_db_notifications_v1',
    SETTINGS: 'gdip_db_global_settings_v1'
};

// --- MOCK STORAGE HELPERS ---
const loadMock = <T>(key: string, seed: T): T => {
    try {
        const stored = localStorage.getItem(key);
        // CRITICAL: Always return a new object/array to prevent reference sharing with the SEED constants
        return stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(seed));
    } catch (e) { 
        return JSON.parse(JSON.stringify(seed)); 
    }
};
const persistMock = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

// --- MOCK SEED DATA ---
const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
    minRedemptionPoints: 500,
    isRegistrationEnabled: true,
    maintenanceMode: false,
    systemContactEmail: 'support@drivewell.com',
    allowDriverPasswordResets: true
};

const SEED_USERS: User[] = [
  { id: 'u1', username: 'driver1', role: UserRole.DRIVER, fullName: 'John Trucker', email: 'john.trucker@example.com', phoneNumber: '555-0101', address: '123 Haul St', bio: 'Veteran driver with over 15 years on the open road. Always prioritizing safety and fuel efficiency.', sponsorId: 's1', pointsBalance: 5400, avatarUrl: 'https://picsum.photos/200/200?random=1', isActive: true, preferences: { alertsEnabled: true } },
  { id: 'u2', username: 'sponsor1', role: UserRole.SPONSOR, fullName: 'Alice Logistics', email: 'alice@fastlane.com', sponsorId: 's1', bio: 'Logistics coordinator at FastLane. Dedicated to supporting our driver fleet.', avatarUrl: 'https://picsum.photos/200/200?random=2', isActive: true, preferences: { alertsEnabled: true } },
  { id: 'u3', username: 'admin', role: UserRole.ADMIN, fullName: 'System Admin', email: 'admin@system.com', bio: 'Platform administrator for the Good Driver Incentive Program.', avatarUrl: 'https://picsum.photos/200/200?random=3', isActive: true, preferences: { alertsEnabled: true } },
  { id: 'u4', username: 'driver2', role: UserRole.DRIVER, fullName: 'Sarah Swift', email: 'sarah@express.com', sponsorId: 's1', pointsBalance: 3200, avatarUrl: 'https://picsum.photos/200/200?random=4', isActive: true, preferences: { alertsEnabled: true } }
];
const SEED_SPONSORS: SponsorOrganization[] = [
  { 
      id: 's1', 
      name: 'FastLane Logistics', 
      pointDollarRatio: 0.01, 
      pointsFloor: 0,
      incentiveRules: [
          "100 pts: Clean roadside inspection",
          "500 pts: 10,000 miles accident-free",
          "50 pts: On-time delivery streak (5 loads)"
      ]
  },
  { 
      id: 's2', 
      name: 'Global Freight', 
      pointDollarRatio: 0.015, 
      pointsFloor: 0,
      incentiveRules: [
          "1000 pts: Employee of the month",
          "200 pts: Passing quarterly safety quiz"
      ]
  }
];
const SEED_CATALOG: Product[] = [
  { id: 'p1', name: 'Wireless Headset', description: 'Noise cancelling headset.', pricePoints: 5000, availability: true, imageUrl: 'https://picsum.photos/400/300?random=10', createdAt: '2025-01-01' },
  { id: 'p2', name: 'Truck GPS', description: 'Advanced routing.', pricePoints: 15000, availability: true, imageUrl: 'https://picsum.photos/400/300?random=11', createdAt: '2025-01-15' }
];

const SEED_APPLICATIONS: DriverApplication[] = [
    { id: 'app1', userId: 'u4', applicantName: 'David Drifter', email: 'david@road.com', sponsorId: 's1', date: '2026-02-01', status: 'PENDING', licenseNumber: 'CDL-998877', experienceYears: 5, reason: 'Looking for a safety-focused team.' },
    { id: 'app2', userId: 'u5', applicantName: 'Sarah Sprinter', email: 'sarah@mile.com', sponsorId: 's1', date: '2026-02-02', status: 'PENDING', licenseNumber: 'CDL-112233', experienceYears: 2, reason: 'Great benefits.' }
];

const SEED_AUDIT_LOGS: AuditLog[] = [
    { id: 'l1', date: '2026-01-20', action: 'Login', actor: 'admin', target: 'System', details: 'Admin login detected', category: 'LOGIN' },
    { id: 'l2', date: '2026-01-21', action: 'Point Adjustment', actor: 'sponsor1', target: 'driver1', details: 'Added 500 points', category: 'POINT_CHANGE' }
];

const SEED_TX: PointTransaction[] = [
    { id: 't1', date: '2026-01-15', amount: 500, reason: 'Safe Driving Bonus', sponsorName: 'FastLane Logistics', driverName: 'John Trucker', type: 'MANUAL' },
    { id: 't2', date: '2026-01-18', amount: 200, reason: 'On-time Delivery', sponsorName: 'FastLane Logistics', driverName: 'John Trucker', type: 'MANUAL' },
    { id: 't3', date: '2026-01-22', amount: 100, reason: 'Clean Inspection', sponsorName: 'FastLane Logistics', driverName: 'Sarah Swift', type: 'MANUAL' },
    { id: 't4', date: '2026-01-25', amount: -5000, reason: 'Purchase: Wireless Headset', sponsorName: 'FastLane Logistics', driverName: 'John Trucker', type: 'PURCHASE' }
];

// --- PUBLIC EXPORTS ---
export const MOCK_USERS = SEED_USERS;
export const MOCK_CATALOG = SEED_CATALOG;
export const MOCK_SPONSORS = SEED_SPONSORS;
export const MOCK_APPLICATIONS = SEED_APPLICATIONS;
export const MOCK_AUDIT_LOGS = SEED_AUDIT_LOGS;

const useMockDB = () => getConfig().useMockDB;

export const resetDatabase = () => {
    if (useMockDB()) {
        localStorage.clear();
        window.dispatchEvent(new Event('config-change'));
    }
};

// Global Settings
export const getGlobalSettings = async (): Promise<GlobalSettings> => {
    if (useMockDB()) {
        return loadMock(DB_KEYS.SETTINGS, DEFAULT_GLOBAL_SETTINGS);
    }
    // Production call would happen here
    return DEFAULT_GLOBAL_SETTINGS;
};

export const updateGlobalSettings = async (settings: GlobalSettings): Promise<boolean> => {
    if (useMockDB()) {
        persistMock(DB_KEYS.SETTINGS, settings);
        await addAuditLog('System Settings Updated', 'admin', 'Global Config', 'Updated system-wide administrative settings', 'SETTINGS');
        return true;
    }
    return true;
};

// User Profiles
export const getUserProfile = async (uid: string): Promise<User | undefined> => {
    if (useMockDB()) {
        const users: User[] = loadMock(DB_KEYS.USERS, SEED_USERS);
        return users.find(u => u.id === uid);
    }
    return await MySQL.apiGetUserProfile(uid);
};

export const updateUserPreferences = async (userId: string, prefs: { alertsEnabled: boolean }) => {
    if (useMockDB()) {
        const users: User[] = loadMock(DB_KEYS.USERS, SEED_USERS);
        const user = users.find(u => u.id === userId);
        if (user) {
            user.preferences = { ...(user.preferences || { alertsEnabled: true }), ...prefs };
            persistMock(DB_KEYS.USERS, users);
            return true;
        }
        return false;
    }
    return await MySQL.apiUpdateUserPreferences(userId, prefs);
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
    if (useMockDB()) {
        const users: User[] = loadMock(DB_KEYS.USERS, SEED_USERS);
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            persistMock(DB_KEYS.USERS, users);
            await addAuditLog('Profile Updated', users[index].username, 'Self', 'Updated personal details', 'USER_MGMT');
            return true;
        }
        return false;
    }
    return await MySQL.apiUpdateUserProfile(userId, updates);
};

export const banUser = async (userId: string, active: boolean) => {
    if (useMockDB()) {
        const users: User[] = loadMock(DB_KEYS.USERS, SEED_USERS);
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users[userIndex].isActive = active;
            persistMock(DB_KEYS.USERS, users);
            // Record in audit log
            await addAuditLog(
                active ? 'User Unbanned' : 'User Banned', 
                'admin', 
                users[userIndex].username, 
                `Administrative account status changed to ${active ? 'Active' : 'Banned'}`, 
                'USER_MGMT'
            );
            return true;
        }
        return false;
    }
    return await MySQL.apiBanUser(userId, active);
};

export const deleteUser = async (userId: string) => {
    if (useMockDB()) {
        const usersBefore: User[] = loadMock(DB_KEYS.USERS, SEED_USERS);
        const userToDelete = usersBefore.find(u => u.id === userId);
        if (userToDelete) {
            const usersAfter = usersBefore.filter(u => u.id !== userId);
            persistMock(DB_KEYS.USERS, usersAfter);
            // Record in audit log
            await addAuditLog(
                'User Deleted', 
                'admin', 
                userToDelete.username, 
                'Account permanently removed from system by administrator', 
                'USER_MGMT'
            );
            return true;
        }
        return false;
    }
    return await MySQL.apiDeleteUser(userId);
};

export const createProfile = async (uid: string, username: string, fullName: string, role: UserRole, additionalInfo?: { email: string, phone: string, address: string }) => {
    const newUser: User = {
        id: uid, username, fullName, role,
        email: additionalInfo?.email, phoneNumber: additionalInfo?.phone, address: additionalInfo?.address,
        avatarUrl: `https://picsum.photos/200/200?random=${Date.now()}`,
        pointsBalance: role === UserRole.DRIVER ? 0 : undefined,
        isActive: true,
        preferences: { alertsEnabled: true }
    };

    if (useMockDB()) {
        const users: User[] = loadMock(DB_KEYS.USERS, SEED_USERS);
        if (users.some(u => u.username === username)) return false;
        users.push(newUser);
        persistMock(DB_KEYS.USERS, users);
        await addAuditLog('User Registered', 'system', username, `New account created with role: ${role}`, 'USER_MGMT');
        return true;
    }
    
    return await MySQL.apiCreateProfile(newUser);
};

// Notifications
export const getNotifications = async (userId: string): Promise<Notification[]> => {
    if (useMockDB()) {
        const all: Notification[] = loadMock(DB_KEYS.NOTIFICATIONS, []);
        return all.filter(n => n.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return await MySQL.apiGetNotifications(userId);
};

export const addNotification = async (userId: string, title: string, message: string, type: Notification['type'], metadata?: any) => {
    const newNotif: Notification = {
        id: `n${Date.now()}`,
        userId,
        title,
        message,
        date: new Date().toISOString(),
        isRead: false,
        type,
        metadata
    };

    if (useMockDB()) {
        const all: Notification[] = loadMock(DB_KEYS.NOTIFICATIONS, []);
        all.push(newNotif);
        persistMock(DB_KEYS.NOTIFICATIONS, all);
        window.dispatchEvent(new Event('notification-added'));
        return true;
    }
    return await MySQL.apiAddNotification(newNotif);
};

export const markNotificationAsRead = async (id: string) => {
    if (useMockDB()) {
        const all: Notification[] = loadMock(DB_KEYS.NOTIFICATIONS, []);
        const n = all.find(x => x.id === id);
        if (n) {
            n.isRead = true;
            persistMock(DB_KEYS.NOTIFICATIONS, all);
            window.dispatchEvent(new Event('notification-added')); // Refresh UI
            return true;
        }
        return false;
    }
    return await MySQL.apiMarkNotificationAsRead(id);
};

export const createUser = async (username: string, fullName: string, role: UserRole, password?: string, additionalInfo?: { email?: string, phone?: string }) => {
    if (useMockDB()) {
        const users: User[] = loadMock(DB_KEYS.USERS, SEED_USERS);
        const newUser: User = {
            id: `local_${Date.now()}`, username, fullName, role,
            email: additionalInfo?.email, phoneNumber: additionalInfo?.phone,
            avatarUrl: `https://picsum.photos/200/200?random=${Date.now()}`,
            pointsBalance: role === UserRole.DRIVER ? 0 : undefined,
            isActive: true,
            preferences: { alertsEnabled: true }
        };
        users.push(newUser);
        persistMock(DB_KEYS.USERS, users);
        await addAuditLog('User Created', 'admin', username, `Admin created user with role: ${role}`, 'USER_MGMT');
        return true;
    }
    return false;
};

export const updateUserRole = async (userId: string, newRole: UserRole): Promise<boolean> => {
    if (useMockDB()) {
        const users: User[] = loadMock(DB_KEYS.USERS, SEED_USERS);
        const user = users.find(u => u.id === userId);
        if (user) {
            user.role = newRole;
            persistMock(DB_KEYS.USERS, users);
            await addAuditLog('Role Update', 'admin', user.username, `Changed to ${newRole}`, 'USER_MGMT');
            return true;
        }
        return false;
    }
    return await MySQL.apiUpdateUserRole(userId, newRole);
};

export const getAllUsers = async (): Promise<User[]> => {
    if (useMockDB()) return loadMock(DB_KEYS.USERS, SEED_USERS);
    return await MySQL.apiGetAllUsers();
};

export const getDriversBySponsor = async (sponsorId: string): Promise<User[]> => {
    const all = await getAllUsers();
    return all.filter(u => u.role === UserRole.DRIVER && u.sponsorId === sponsorId);
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
        sponsors.push({ id: `s${Date.now()}`, name, pointDollarRatio: ratio, pointsFloor: 0, incentiveRules: [] });
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

export const updateSponsorRules = async (sponsorId: string, rules: string[]) => {
    if (useMockDB()) {
        const sponsors: SponsorOrganization[] = loadMock(DB_KEYS.SPONSORS, SEED_SPONSORS);
        const s = sponsors.find(x => x.id === sponsorId);
        if (s) {
            s.incentiveRules = rules;
            persistMock(DB_KEYS.SPONSORS, sponsors);
            return true;
        }
        return false;
    }
    return await MySQL.apiUpdateSponsorRules(sponsorId, rules);
}

// Applications
export const submitApplication = async (userId: string, sponsorId: string, details: any) => {
    const user = await getUserProfile(userId);
    const newApp: DriverApplication = {
        id: `app${Date.now()}`,
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
        const cleanApps = apps.filter(a => !(a.userId === userId && a.status === 'PENDING'));
        cleanApps.push(newApp);
        persistMock(DB_KEYS.APPS, cleanApps);
        return true;
    }

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
export const updateDriverPoints = async (driverId: string, amount: number, reason: string, sponsorName: string, sponsorId?: string, type: 'MANUAL' | 'AUTOMATED' | 'PURCHASE' = 'MANUAL') => {
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
             
             const txs: PointTransaction[] = loadMock(DB_KEYS.TX, SEED_TX);
             txs.unshift({ 
                 id: `t${Date.now()}`, 
                 date: new Date().toISOString().split('T')[0], 
                 amount, 
                 reason, 
                 sponsorName, 
                 driverName: user.fullName, // Capture real name for reporting
                 type: type 
             });
             
             if (user.preferences?.alertsEnabled !== false) {
                 await addNotification(
                     driverId,
                     amount > 0 ? 'Points Awarded' : 'Points Deducted',
                     `${Math.abs(amount).toLocaleString()} points have been ${amount > 0 ? 'added to' : 'removed from'} your account. Reason: ${reason}`,
                     'POINT_CHANGE',
                     { amount, reason, sponsorName, type }
                 );
             }

             persistMock(DB_KEYS.USERS, users);
             persistMock(DB_KEYS.TX, txs);
             return { success: true, message: "Updated Mock DB" };
        }
        return { success: false, message: "User not found" };
    }
    return await MySQL.apiUpdateDriverPoints(driverId, amount, reason, sponsorId || '', type);
};

export const getTransactions = async (): Promise<PointTransaction[]> => {
    if (useMockDB()) return loadMock(DB_KEYS.TX, SEED_TX);
    return await MySQL.apiGetTransactions();
};

export const getCatalog = async (): Promise<Product[]> => {
    if (useMockDB()) return loadMock(DB_KEYS.CATALOG, SEED_CATALOG);
    return await MySQL.apiGetCatalog();
};

export const addProduct = async (product: Partial<Product>) => {
    if(useMockDB()) {
        const products = loadMock(DB_KEYS.CATALOG, SEED_CATALOG);
        products.push({
            id: `p${Date.now()}`,
            name: product.name || 'New Product',
            description: product.description || '',
            pricePoints: product.pricePoints || 0,
            availability: product.availability ?? true,
            imageUrl: product.imageUrl || 'https://via.placeholder.com/150',
            createdAt: new Date().toISOString()
        });
        persistMock(DB_KEYS.CATALOG, products);
    }
}

export const deleteProduct = async (id: string) => {
    if(useMockDB()) {
        let products = loadMock(DB_KEYS.CATALOG, SEED_CATALOG);
        products = products.filter(p => p.id !== id);
        persistMock(DB_KEYS.CATALOG, products);
    }
}

// Helpers
export const addAuditLog = async (action: string, actor: string, target: string, details: string, category: AuditLog['category']) => {
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
