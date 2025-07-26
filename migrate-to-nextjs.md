# Migration Guide: CRA → Next.js + Vite

## Overview
This guide helps you migrate from Create React App (CRA) to Next.js with Vite for testing.

## Benefits of Migration

### Next.js Benefits
- ✅ **shadcn/ui Support**: Full compatibility with shadcn components
- ✅ **Better Performance**: Automatic code splitting, image optimization
- ✅ **SEO Friendly**: Server-side rendering capabilities
- ✅ **Modern Architecture**: App Router, middleware, API routes
- ✅ **Better DX**: Hot reload, fast builds, better error messages

### Vite Testing Benefits
- ✅ **Faster Tests**: Vite is significantly faster than Jest
- ✅ **Better ESM Support**: Native ES modules
- ✅ **Modern Tooling**: Built on modern web standards
- ✅ **UI Testing**: Built-in test UI with `vitest --ui`

## Migration Steps

### 1. Install Dependencies
```bash
# Remove CRA dependencies
npm uninstall react-scripts @testing-library/jest-dom @types/jest

# Install Next.js and Vite
npm install next@latest
npm install -D @vitejs/plugin-react vite vitest @vitest/ui jsdom @types/jsdom @svgr/webpack eslint eslint-config-next
```

### 2. Update Configuration Files
- ✅ `next.config.js` - Created
- ✅ `tsconfig.json` - Updated for Next.js
- ✅ `vitest.config.ts` - Created for Vite testing
- ✅ `package.json` - Updated scripts and dependencies

### 3. Create Next.js App Structure
- ✅ `src/app/layout.tsx` - Root layout
- ✅ `src/app/page.tsx` - Main page

### 4. Update Import Paths
Replace relative imports with absolute paths:
```typescript
// Before (CRA)
import { Button } from '../ui/Button'

// After (Next.js)
import { Button } from '@/components/ui/Button'
```

### 5. Update Test Files
Replace Jest syntax with Vitest:
```typescript
// Before (Jest)
import { jest } from '@jest/globals'
jest.mock('../store/noteStore')

// After (Vitest)
import { vi } from 'vitest'
vi.mock('../store/noteStore')
```

### 6. Update Environment Variables
```bash
# Before (CRA)
REACT_APP_API_URL=http://localhost:3000

# After (Next.js)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## File Structure Changes

### Before (CRA)
```
src/
├── App.tsx
├── index.tsx
├── index.css
└── components/
```

### After (Next.js)
```
src/
├── app/
│   ├── layout.tsx
│   └── page.tsx
├── components/
└── lib/
```

## Testing Migration

### Before (Jest)
```bash
npm test
npm test -- --coverage
```

### After (Vite)
```bash
npm run test
npm run test:coverage
npm run test:ui  # Interactive UI
```

## Common Issues & Solutions

### 1. Router Issues
**Problem**: CRA uses React Router, Next.js has built-in routing
**Solution**: Replace React Router with Next.js App Router

### 2. Environment Variables
**Problem**: CRA uses `REACT_APP_` prefix
**Solution**: Use `NEXT_PUBLIC_` prefix for client-side variables

### 3. Static Assets
**Problem**: CRA serves from `/public`, Next.js from `/public`
**Solution**: Move assets to `/public` directory

### 4. CSS Modules
**Problem**: CRA and Next.js handle CSS differently
**Solution**: Update import syntax if needed

## Performance Improvements

### Build Time
- **CRA**: ~30-60 seconds
- **Next.js**: ~10-20 seconds

### Test Time
- **Jest**: ~30-60 seconds
- **Vite**: ~5-15 seconds

### Bundle Size
- **CRA**: Larger bundles
- **Next.js**: Automatic code splitting

## Next Steps

1. **Install Dependencies**: Run the npm install commands
2. **Test Migration**: Run tests to ensure everything works
3. **Update Imports**: Gradually update import paths
4. **Optimize**: Use Next.js features like Image component, API routes
5. **Deploy**: Deploy to Vercel or other Next.js-compatible platforms

## Rollback Plan

If issues arise, you can rollback by:
1. Reverting `package.json` changes
2. Removing Next.js config files
3. Restoring original CRA setup

## Support

- [Next.js Documentation](https://nextjs.org/docs)
- [Vite Documentation](https://vitejs.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [shadcn/ui Documentation](https://ui.shadcn.com/) 