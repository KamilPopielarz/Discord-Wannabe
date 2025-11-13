/**
 * Feature Flags Usage Examples
 * 
 * This file contains practical examples of how to use feature flags
 * in different parts of the application.
 * 
 * @see README.md for full documentation
 */

import { isFeatureEnabled, getActiveFlags, getEnvName } from './index';

// ============================================================================
// Example 1: Simple Feature Check
// ============================================================================

export function shouldShowLoginPage(): boolean {
  return isFeatureEnabled('auth.login');
}

// ============================================================================
// Example 2: Multiple Feature Checks
// ============================================================================

export interface AuthFeatures {
  canLogin: boolean;
  canRegister: boolean;
  canResetPassword: boolean;
}

export function getAuthFeatures(): AuthFeatures {
  return {
    canLogin: isFeatureEnabled('auth.login'),
    canRegister: isFeatureEnabled('auth.signin'),
    canResetPassword: isFeatureEnabled('auth.resetPassword'),
  };
}

// ============================================================================
// Example 3: Conditional Logic with Feature Flags
// ============================================================================

export function getAvailableAuthMethods(): string[] {
  const methods: string[] = [];
  
  if (isFeatureEnabled('auth.login')) {
    methods.push('login');
  }
  
  if (isFeatureEnabled('auth.signin')) {
    methods.push('register');
  }
  
  if (isFeatureEnabled('auth.resetPassword')) {
    methods.push('password-reset');
  }
  
  return methods;
}

// ============================================================================
// Example 4: Feature Flag with Fallback
// ============================================================================

export function isExperimentalFeatureEnabled(): boolean {
  // For experimental features, we might want to enable them by default
  // in development but disable in production
  return isFeatureEnabled('experimental.feature', getEnvName() === 'local');
}

// ============================================================================
// Example 5: Debugging Helper
// ============================================================================

export function logFeatureStatus(): void {
  const env = getEnvName();
  const flags = getActiveFlags();
  
  console.log(`Environment: ${env}`);
  console.log('Feature Flags:', JSON.stringify(flags, null, 2));
}

// ============================================================================
// Example 6: Feature-Gated Function
// ============================================================================

export function resetPassword(email: string): Promise<void> {
  if (!isFeatureEnabled('auth.resetPassword')) {
    throw new Error('Password reset feature is disabled');
  }
  
  // Actual password reset logic would go here
  return Promise.resolve();
}

// ============================================================================
// Example 7: UI Component Configuration
// ============================================================================

export interface UIConfig {
  useTwoPane: boolean;
  showMobileNav: boolean;
  layout: 'single' | 'two-pane';
}

export function getUIConfig(): UIConfig {
  const useTwoPane = isFeatureEnabled('collections.twoPane');
  
  return {
    useTwoPane,
    showMobileNav: isFeatureEnabled('collections.mobileNavigation'),
    layout: useTwoPane ? 'two-pane' : 'single',
  };
}

// ============================================================================
// Example 8: API Endpoint Guard
// ============================================================================

export function validateFeatureAccess(feature: string): { 
  allowed: boolean; 
  error?: string 
} {
  const enabled = isFeatureEnabled(feature);
  
  return {
    allowed: enabled,
    error: enabled ? undefined : `Feature '${feature}' is not available`,
  };
}

// Usage in API endpoint:
// const { allowed, error } = validateFeatureAccess('auth.login');
// if (!allowed) {
//   return new Response(JSON.stringify({ error }), { status: 404 });
// }

