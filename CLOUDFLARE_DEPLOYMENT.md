# Cloudflare Pages Deployment Guide

This document explains how to deploy the Discord-Wannabe application to Cloudflare Pages.

## Prerequisites

1. A Cloudflare account with Pages enabled
2. A Cloudflare Pages project created (named `discord-wannabe`)
3. GitHub repository connected to Cloudflare

## Required GitHub Secrets

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

### Cloudflare Credentials
- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token with Pages permissions
  - Create at: https://dash.cloudflare.com/profile/api-tokens
  - Required permissions: Account > Cloudflare Pages > Edit
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
  - Find at: https://dash.cloudflare.com/ (in the URL or account settings)

### Supabase Environment Variables
- `PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key

## Cloudflare Pages Environment Variables

In your Cloudflare Pages project settings, add the following environment variables:

### Production Environment
1. Go to Cloudflare Dashboard → Pages → Your Project → Settings → Environment Variables
2. Add these variables for "Production":
   - `PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (keep secret!)
   - Any other environment variables your application needs

## Deployment Process

### Automatic Deployment
When you push to the `master` branch, GitHub Actions will automatically:
1. Run linting checks
2. Run unit tests
3. Build the application for Cloudflare
4. Deploy to Cloudflare Pages

### Manual Deployment
To deploy manually:
```bash
# Install dependencies
npm ci

# Build for Cloudflare
npm run build:cloudflare

# Deploy using Wrangler CLI (install first if needed)
npx wrangler pages deploy dist --project-name=discord-wannabe
```

## Project Configuration

### Astro Configuration
The `astro.config.mjs` file automatically detects the build environment:
- When `CLOUDFLARE=true`, uses `@astrojs/cloudflare` adapter
- Otherwise, uses `@astrojs/node` adapter for local development

### Build Scripts
- `npm run build` - Standard build (uses Node adapter)
- `npm run build:cloudflare` - Build for Cloudflare Pages deployment

## Workflow Details

The deployment workflow (`.github/workflows/master.yml`) consists of four jobs:

1. **lint** - Runs ESLint to check code quality
2. **test** - Runs unit tests
3. **build** - Builds the application with Cloudflare adapter
4. **deploy** - Deploys the build artifacts to Cloudflare Pages

## Troubleshooting

### Build Failures
- Check that all environment variables are set correctly
- Verify Node.js version matches `.nvmrc` (22.14.0)
- Review build logs in GitHub Actions

### Deployment Failures
- Verify Cloudflare API token has correct permissions
- Check that project name matches in Cloudflare Pages
- Ensure account ID is correct

### Runtime Issues
- Verify environment variables are set in Cloudflare Pages settings
- Check Cloudflare Functions logs in the dashboard
- Ensure Supabase credentials are valid and have proper permissions

## Important Notes

1. **Adapter Selection**: The application uses different adapters for development (Node) and production (Cloudflare). This is controlled by the `CLOUDFLARE` environment variable.

2. **Build Output**: Cloudflare Pages expects the build output in the `dist/` directory with a specific structure for Functions.

3. **Environment Variables**: Build-time variables (those starting with `PUBLIC_`) are embedded in the build. Server-side variables must be set in Cloudflare Pages settings.

4. **Database Connections**: Ensure your Supabase instance allows connections from Cloudflare's IP ranges.

5. **Password Hashing**: The application uses Web Crypto API (PBKDF2) instead of bcrypt for password hashing, as bcrypt relies on Node.js native bindings that are not available in Cloudflare Workers. This change only affects room passwords; user authentication still uses Supabase Auth.

6. **KV Namespace**: Before deploying, you must create a KV namespace in Cloudflare Dashboard:
   - Go to Workers & Pages → KV
   - Create a new namespace named "discord-wannabe-sessions" (or your preferred name)
   - Update `wrangler.toml` with the actual namespace ID
   - Create a separate namespace for preview/staging if needed

7. **Image Service**: Sharp image optimization is disabled for Cloudflare builds. Images are served as-is. For optimized images, consider using Cloudflare Images or pre-optimize images before deployment.

## Support

For issues related to:
- **Cloudflare Pages**: https://developers.cloudflare.com/pages/
- **Astro Cloudflare Adapter**: https://docs.astro.build/en/guides/integrations-guide/cloudflare/
- **Supabase**: https://supabase.com/docs

