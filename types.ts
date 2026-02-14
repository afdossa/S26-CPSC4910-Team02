
export enum UserRole {
  DRIVER = 'DRIVER',
  SPONSOR = 'SPONSOR',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string; // Matches Firebase UID
  username: string;
  role: UserRole;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  avatarUrl?: string;
  bio?: string; // Personal description for profile
  sponsorId?: string; // Links driver to a sponsor
  pointsBalance?: number; // Only for drivers
  isActive?: boolean; // Track if account is banned/active (Admin level)
  isDropped?: boolean; // Track if driver was dropped by the sponsor (Sponsor level)
  preferences?: {
    alertsEnabled: boolean; // Point Change Alerts
    orderAlertsEnabled?: boolean; // Order Confirmation Alerts
  };
}

export interface GlobalSettings {
  minRedemptionPoints: number;
  isRegistrationEnabled: boolean;
  maintenanceMode: boolean;
  systemContactEmail: string;
  allowDriverPasswordResets: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  type: 'ORDER_CONFIRMATION' | 'POINT_CHANGE' | 'SYSTEM';
  metadata?: any; // For storing order details or specific point info
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
  metadata?: any; // Used for interactive elements like refund approvals
}

export interface PendingUser {
  id: string;
  username: string;
  role: UserRole;
  fullName: string;
  requestDate: string;
}

export interface SponsorOrganization {
  id: string;
  name: string;
  pointDollarRatio: number; // e.g., 0.01
  pointsFloor?: number; // Minimum points balance allowed for drivers
  incentiveRules?: string[]; // Rules visible to drivers
}

export interface Product {
  id: string;
  name: string;
  description: string;
  pricePoints: number;
  imageUrl: string;
  availability: boolean;
  createdAt?: string; // ISO Date string
}

export interface CartItem extends Product {
  quantity: number;
}

export interface AuditLog {
  id: string;
  date: string;
  action: string;
  actor: string;
  target: string;
  details: string;
  category: 'DRIVER_APP' | 'POINT_CHANGE' | 'LOGIN' | 'PASSWORD_CHANGE' | 'USER_MGMT' | 'SETTINGS';
}

export interface PointTransaction {
  id: string;
  date: string;
  amount: number;
  reason: string;
  sponsorName: string;
  driverName?: string; 
  driverId?: string; // Added to map back for refunds
  actorName?: string; 
  type?: 'MANUAL' | 'AUTOMATED' | 'PURCHASE';
  status?: 'COMPLETED' | 'REFUND_PENDING' | 'REFUNDED' | 'REFUND_REJECTED'; // Tracking refund state
  refundReason?: string;
}

export interface AboutData {
  teamNumber: string;
  versionNumber: string;
  releaseDate: string;
  productName: string;
  description: string;
}

export interface DriverApplication {
  id: string;
  userId: string;
  applicantName: string;
  email: string; // from user
  sponsorId: string;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  // Detailed info
  licenseNumber: string;
  experienceYears: number;
  reason: string;
}
