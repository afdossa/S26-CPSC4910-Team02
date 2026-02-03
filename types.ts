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
  sponsorId?: string; // Links driver to a sponsor
  pointsBalance?: number; // Only for drivers
  preferences?: {
    alertsEnabled: boolean;
  };
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
  type?: 'MANUAL' | 'AUTOMATED' | 'PURCHASE'; 
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