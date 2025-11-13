# Feature Flags Module

Build-time feature flag system for controlling feature availability across different environments.

## Quick Start

```typescript
import { isFeatureEnabled } from 'src/features';

// Check if a feature is enabled
if (isFeatureEnabled('auth.login')) {
  // Show login form
}
```

## API Reference

### `getEnvName(): EnvName`

Returns the current environment name (`'local'`, `'integration'`, or `'prod'`).

Reads from `ENV_NAME` environment variable, defaults to `'prod'` if not set.

```typescript
const env = getEnvName();
console.log(`Running in ${env} environment`);
```

### `isFeatureEnabled(key: string, fallback?: boolean): boolean`

Checks if a feature flag is enabled in the current environment.

**Parameters:**
- `key` - Feature flag key in dot-notation (e.g., `'auth.login'`)
- `fallback` - Value to return if flag is not defined (default: `false`)

**Returns:** `boolean` - Whether the feature is enabled

```typescript
// Basic usage
const loginEnabled = isFeatureEnabled('auth.login');

// With custom fallback
const experimentalFeature = isFeatureEnabled('experimental.newUI', true);
```

### `getActiveFlags(): FeaturesSchema`

Returns all active feature flags for the current environment.

Useful for debugging or displaying feature flag status.

```typescript
const allFlags = getActiveFlags();
console.log('Active features:', allFlags);
```

### `getAllFeatureKeys(): string[]`

Returns an array of all available feature flag keys in dot-notation.

```typescript
const keys = getAllFeatureKeys();
// ['auth.login', 'auth.signin', 'auth.resetPassword', ...]
```

## Usage Examples

### In Astro Pages

```astro
---
import { isFeatureEnabled } from 'src/features';
import LoginPage from '../components/auth/LoginPage';

const showLogin = isFeatureEnabled('auth.login');
---

{showLogin ? (
  <LoginPage client:load />
) : (
  <div>Login temporarily unavailable</div>
)}
```

### In API Endpoints

```typescript
import { isFeatureEnabled } from 'src/features';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  if (!isFeatureEnabled('auth.login')) {
    return new Response(
      JSON.stringify({ error: 'Feature disabled' }), 
      { status: 404 }
    );
  }
  
  // ... rest of login logic ...
};
```

### In React Components

```tsx
import { isFeatureEnabled } from 'src/features';

export const MobileNavigation = () => {
  if (!isFeatureEnabled('collections.mobileNavigation')) {
    return null;
  }
  
  return (
    <nav>
      {/* Mobile navigation UI */}
    </nav>
  );
};
```

## Available Feature Flags

### Auth Features (`auth.*`)

- `auth.login` - Enable login functionality
- `auth.signin` - Enable user registration
- `auth.resetPassword` - Enable password reset functionality

### Collections Features (`collections.*`)

- `collections.twoPane` - Enable two-pane layout for collections
- `collections.mobileNavigation` - Enable mobile navigation

## Environments

The system supports three environments:

- **`local`** - Local development (most permissive)
- **`integration`** - Integration/staging environment
- **`prod`** - Production environment (most restrictive)

Set the environment using the `ENV_NAME` environment variable:

```bash
# PowerShell
$env:ENV_NAME="local"
npm run dev

# Bash/Linux
ENV_NAME=local npm run dev
```

## Adding New Feature Flags

1. Update the `FeaturesSchema` interface in `src/features/index.ts`:

```typescript
export interface FeaturesSchema {
  // ... existing sections ...
  
  experimental?: {
    /** Enable new experimental UI */
    newUI?: boolean;
  };
}
```

2. Add values for all environments in `FEATURES_BY_ENV`:

```typescript
const FEATURES_BY_ENV: Record<EnvName, FeaturesSchema> = {
  local: {
    // ...
    experimental: {
      newUI: true,
    },
  },
  integration: {
    // ...
    experimental: {
      newUI: false,
    },
  },
  prod: {
    // ...
    experimental: {
      newUI: false,
    },
  },
};
```

3. Use the new flag:

```typescript
if (isFeatureEnabled('experimental.newUI')) {
  // Show new UI
}
```

## Design Principles

### Fail-Closed Policy

By default, undefined or missing flags return `false`. This ensures that new features are disabled by default unless explicitly enabled.

```typescript
// If 'nonexistent.flag' is not defined, returns false
isFeatureEnabled('nonexistent.flag'); // false

// Unless you provide a custom fallback
isFeatureEnabled('nonexistent.flag', true); // true
```

### Build-Time Only

This is a build-time system. Changes to `ENV_NAME` or feature flag configuration require a rebuild to take effect.

### Type Safety

All feature flags are type-checked at compile time. TypeScript will help you catch typos and invalid configurations.

## Future Enhancements

The module is designed to be extensible:

- **Percentage rollouts** - Enable features for a % of users
- **User-specific flags** - Target specific users or groups
- **Remote configuration** - Fetch flags from a remote service
- **Runtime flags** - Dynamic flags that can change without rebuild

The current `isFeatureEnabled` API is designed to remain stable even as these features are added.

## See Also

- Full documentation: `.ai/feature-flags.md`
- Project structure: `.cursor/rules/shared.mdc`

