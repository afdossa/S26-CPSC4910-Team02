export enum UserRole {
  DRIVER = 'DRIVER',
  SPONSOR = 'SPONSOR',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  username: string;
  password?: string; // Added for mock authentication
  role: UserRole;
  fullName: string;
  avatarUrl?: string;
  sponsorId?: string; // Links driver to a sponsor
  pointsBalance?: number; // Only for drivers
}

export interface PendingUser {
  id: string;
  username: string;
  role: UserRole;
  fullName: string;
  password?: string; // In real app, this is hashed
  requestDate: string;
}

export interface SponsorOrganization {
  id: string;
  name: string;
  pointDollarRatio: number; // e.g., 0.01
}

export interface Product {
  id: string;
  name: string;
  description: string;
  pricePoints: number;
  imageUrl: string;
  availability: boolean;
}

export interface AuditLog {
  id: string;
  date: string;
  action: string;
  actor: string;
  target: string;
  details: string;
  category: 'DRIVER_APP' | 'POINT_CHANGE' | 'LOGIN' | 'PASSWORD_CHANGE' | 'USER_MGMT';
}

export interface PointTransaction {
  id: string;
  date: string;
  amount: number;
  reason: string;
  sponsorName: string;
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
  applicantName: string;
  email: string;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}