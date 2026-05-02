/**
 * Admin UI constants
 * Centralized constants for admin interface styling and behavior
 */

export const ADMIN_UI = {
  /**
   * Date and time formatting
   */
  DATE_FORMAT: "MMM d, yyyy",
  DATE_TIME_FORMAT: "MMM d, yyyy · HH:mm:ss",
  TIME_FORMAT: "HH:mm",

  /**
   * Currency and monetary display
   */
  CURRENCY: "MYR",

  /**
   * Icon sizes mapping
   */
  ICON_SIZES: {
    xs: 10,
    small: 12,
    medium: 14,
    large: 16,
    xl: 20,
    xxl: 24,
  } as const,

  /**
   * Column widths for data tables
   */
  COLUMN_WIDTHS: {
    index: "w-[60px]",
    checkbox: "w-[40px]",
    actions: "w-10",
    avatar: "w-[40px]",
    status: "w-[80px]",
    amount: "w-[100px]",
  } as const,

  /**
   * Pagination defaults
   */
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [5, 10, 20, 50],
  } as const,

  /**
   * Common spacing values
   */
  SPACING: {
    containerPadding: "p-2",
    containerMaxWidth: "max-w-7xl",
    containerMargin: "mx-auto",
    sectionGap: "space-y-6",
  } as const,

  /**
   * Animation durations (in milliseconds)
   */
  ANIMATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  } as const,

  /**
   * Timeout values (in milliseconds)
   */
  TIMEOUT: {
    TOAST: 3000,
    DEBOUNCE: 500,
    DEBOUNCE_SHORT: 250,
  } as const,
} as const;

/**
 * Admin container class - standard layout wrapper
 */
export const ADMIN_CONTAINER_CLASS = `${ADMIN_UI.SPACING.containerMaxWidth} ${ADMIN_UI.SPACING.containerMargin} ${ADMIN_UI.SPACING.sectionGap} ${ADMIN_UI.SPACING.containerPadding}`;

/**
 * Default pagination size
 */
export const DEFAULT_PAGE_SIZE = ADMIN_UI.PAGINATION.DEFAULT_PAGE_SIZE;

/**
 * AWS provider default configuration
 */
export const PROVIDER_DEFAULTS = {
  DEFAULT_AWS_REGION: "ap-southeast-1",
  SUPPORTED_REGIONS: ["ap-southeast-1", "ap-southeast-2", "us-east-1"],
} as const;

/**
 * Role color mapping for UI
 */
export const ROLE_COLORS = {
  SUPERADMIN: {
    bg: "bg-amber-500",
    text: "text-white",
    badge: "text-amber-600",
  },
  ADMIN: {
    bg: "bg-blue-600",
    text: "text-white",
    badge: "text-blue-600",
  },
  USER: {
    bg: "bg-slate-700",
    text: "text-white",
    badge: "text-slate-700",
  },
} as const;

/**
 * Status colors for transactions
 */
export const TRANSACTION_STATUS_COLORS = {
  APPROVED: "emerald",
  PENDING: "amber",
  REJECTED: "rose",
} as const;
