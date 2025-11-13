/**
 * Feature Flags Module
 * 
 * Build-time only feature flag system for controlling feature availability
 * across different environments (local, integration, prod).
 * 
 * @see .ai/feature-flags.md for full documentation
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Available environment names
 */
export type EnvName = 'local' | 'integration' | 'prod';

/**
 * Feature flags schema
 * 
 * Organized by feature domain with hierarchical structure using dot-notation.
 * All flags are optional booleans to support fail-closed policy (undefined = false).
 */
export interface FeaturesSchema {
  /**
   * Authentication related features
   */
  auth?: {
    /** Enable login functionality */
    login?: boolean;
    /** Enable user registration (sign in) */
    signin?: boolean;
    /** Enable password reset functionality */
    resetPassword?: boolean;
  };

  /**
   * Collections/UI features
   */
  collections?: {
    /** Enable two-pane layout for collections */
    twoPane?: boolean;
    /** Enable mobile navigation */
    mobileNavigation?: boolean;
  };
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Feature flags configuration per environment
 * 
 * Add new environments or flags here. Follows fail-closed policy:
 * explicitly set flags to true to enable them.
 */
const FEATURES_BY_ENV: Record<EnvName, FeaturesSchema> = {
  local: {
    auth: {
      login: true,
      signin: true,
      resetPassword: true,
    },
    collections: {
      twoPane: true,
      mobileNavigation: true,
    },
  },

  integration: {
    auth: {
      login: true,
      signin: true,
      resetPassword: true,
    },
    collections: {
      twoPane: true,
      mobileNavigation: true,
    },
  },

  prod: {
    auth: {
      login: true,
      signin: true,
      resetPassword: true,
    },
    collections: {
      twoPane: false,
      mobileNavigation: true,
    },
  },
};

// ============================================================================
// API
// ============================================================================

/**
 * Get the current environment name
 * 
 * Reads from ENV_NAME environment variable (process.env or import.meta.env).
 * Falls back to 'prod' for safety (fail-closed).
 * 
 * @returns Current environment name
 */
export function getEnvName(): EnvName {
  // Try both Node.js (process.env) and Vite/Astro (import.meta.env) sources
  const envName = 
    (typeof process !== 'undefined' && process.env?.ENV_NAME) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.ENV_NAME);

  if (envName === 'local' || envName === 'integration' || envName === 'prod') {
    return envName;
  }

  // Default to prod for safety (most restrictive)
  return 'prod';
}

/**
 * Check if a feature is enabled in the current environment
 * 
 * Uses dot-notation to access nested flags (e.g., 'auth.login', 'collections.twoPane').
 * Follows fail-closed policy: returns false for undefined flags unless a fallback is provided.
 * 
 * @param key - Feature flag key in dot-notation (e.g., 'auth.login')
 * @param fallback - Value to return if flag is not defined (default: false)
 * @returns Whether the feature is enabled
 * 
 * @example
 * ```ts
 * // Check if login is enabled
 * if (isFeatureEnabled('auth.login')) {
 *   // Show login form
 * }
 * 
 * // With custom fallback
 * const showExperimentalFeature = isFeatureEnabled('experimental.newUI', true);
 * ```
 */
export function isFeatureEnabled(key: string, fallback = false): boolean {
  const env = getEnvName();
  const features = FEATURES_BY_ENV[env];

  // Split key by dots and traverse the object
  const parts = key.split('.');
  let current: any = features;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      // Key path not found, return fallback
      return fallback;
    }
  }

  // If we found a value, return it as boolean (handle undefined)
  return current === true;
}

/**
 * Get all active feature flags for the current environment
 * 
 * Useful for debugging or displaying feature flag status.
 * 
 * @returns Complete feature flags object for current environment
 * 
 * @example
 * ```ts
 * // Debug: log all active flags
 * console.log('Active features:', getActiveFlags());
 * ```
 */
export function getActiveFlags(): FeaturesSchema {
  const env = getEnvName();
  return FEATURES_BY_ENV[env];
}

// ============================================================================
// Utilities (optional, for development/debugging)
// ============================================================================

/**
 * Get all available feature flag keys in dot-notation
 * 
 * @internal For debugging and documentation purposes
 */
export function getAllFeatureKeys(): string[] {
  const keys: string[] = [];
  
  function traverse(obj: any, prefix = '') {
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        traverse(value, fullKey);
      } else {
        keys.push(fullKey);
      }
    }
  }
  
  // Use local config as template (has all possible keys)
  traverse(FEATURES_BY_ENV.local);
  return keys;
}

