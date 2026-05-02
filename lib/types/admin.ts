/**
 * Admin module type definitions
 * Centralized types for all admin-related features
 */

/**
 * User record with profile and wallet information
 */
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: string;
  balance?: string;
  isActive?: boolean;
  createdAt?: Date;
}

/**
 * Transaction record for billing module
 */
export interface TransactionRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string | null;
  userRole?: string;
  walletId: string;
  type: string;
  amount: string;
  status: string;
  description: string;
  transactionId?: string;
  receiptUrl?: string | null;
  date: Date;
  balanceAfter?: string;
}

/**
 * Pricing rule for pricing module
 */
export interface PricingRule {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  userImage: string | null;
  role?: string | null;
  campaign: string;
  action: string;
  unitPrice: string;
  currency: string;
  effectiveFrom: Date;
  note: string | null;
  createdAt: Date;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  userImage: string | null;
  channel: string;
  name: string;
  config: Record<string, unknown>;
  isDefault: boolean;
  updatedAt: Date | string;
}

/**
 * Queue job record
 */
export interface QueueJob {
  id: string;
  status: string;
  campaignId: string;
  createdAt: Date;
  updatedAt: Date;
  error?: string | null;
}

/**
 * User metrics for dashboard
 */
export interface UserMetrics {
  superadmins: number;
  admins: number;
  users: number;
}

/**
 * Billing metrics for dashboard
 */
export interface BillingMetrics {
  pending: number;
  approved: number;
  rejected: number;
}

/**
 * Generic database user (minimal)
 */
export interface DbUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: string | null;
}

/**
 * Admin action error with code and status
 */
export interface AdminError {
  message: string;
  code: string;
  statusCode: number;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pagination response metadata
 */
export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Paginated response generic
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
