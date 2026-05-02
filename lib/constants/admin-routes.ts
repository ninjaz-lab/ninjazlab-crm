/**
 * Admin routes constants
 * Centralized admin navigation paths
 */

export const ADMIN_ROUTES = {
  /** Admin dashboard home */
  DASHBOARD: "/admin",

  /** Users management */
  USERS: "/admin/users",
  USER_DETAIL: (id: string) => `/admin/users/${id}`,

  /** Billing & transactions */
  BILLING: "/admin/billing",

  /** Pricing rules */
  PRICING: "/admin/pricing",

  /** Provider configuration */
  PROVIDERS: "/admin/providers",

  /** Queue management */
  QUEUE: "/admin/queue",

  /** System settings */
  SETTINGS: "/admin/settings",
} as const;

/**
 * Admin sub-routes for navigation
 */
export const ADMIN_SUB_ROUTES = {
  USERS: {
    PROFILE: "profile",
    WALLET: "wallet",
    MARKETING: "marketing",
    MODULES: "modules",
  },
  PRICING: {
    DEFAULTS: "defaults",
    OVERRIDES: "overrides",
  },
  PROVIDERS: {
    DEFAULTS: "defaults",
    OVERRIDES: "overrides",
  },
} as const;

/**
 * Get navigation items for admin sidebar
 */
export function getAdminNavItems() {
  return [
    {
      label: "Dashboard",
      href: ADMIN_ROUTES.DASHBOARD,
      icon: "DashboardCircleIcon",
    },
    {
      label: "Users",
      href: ADMIN_ROUTES.USERS,
      icon: "UserGroupIcon",
    },
    {
      label: "Billing",
      href: ADMIN_ROUTES.BILLING,
      icon: "CreditCardIcon",
    },
    {
      label: "Pricing",
      href: ADMIN_ROUTES.PRICING,
      icon: "PricingIcon",
    },
    {
      label: "Providers",
      href: ADMIN_ROUTES.PROVIDERS,
      icon: "PlugIcon",
    },
    {
      label: "Queue",
      href: ADMIN_ROUTES.QUEUE,
      icon: "QueueIcon",
    },
    {
      label: "Settings",
      href: ADMIN_ROUTES.SETTINGS,
      icon: "SettingsIcon",
    },
  ];
}
