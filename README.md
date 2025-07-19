# Price Index Management System

A multi-tenant price index management application built with React, TypeScript, Tailwind CSS, and Supabase. This system enables organizations to track and manage product pricing across different markets, channels, and outlets with role-based access control.

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Database & Row Level Security](#database--row-level-security)
- [Authentication](#authentication)
- [Code Structure](#code-structure)
- [Forms & Validation](#forms--validation)
- [Development Guide](#development-guide)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Project Overview

### What This App Does

The Price Index Management System is a comprehensive solution for organizations to:

- **Manage Multi-Tenant Organizations**: Support multiple organizations with isolated data
- **Track Product Pricing**: Monitor SKU prices across different markets and channels
- **Role-Based Access Control**: Four-tier user hierarchy (Super User → Power User → Market Admin → Representative)
- **Market Management**: Handle different geographical markets with local currencies
- **Channel & Outlet Tracking**: Organize sales channels and individual outlet locations
- **Price Capture Logging**: Record and analyze price data over time
- **Anchor SKU Management**: Define reference products for price indexing

### Key Features

- **Multi-tenancy**: Complete data isolation between organizations
- **Hierarchical User Roles**: Granular permissions based on user roles
- **Market-Specific Data**: Currency and country-specific product management
- **Real-time Price Tracking**: Log and monitor price changes across outlets
- **Secure Authentication**: Supabase Auth with automatic profile creation
- **Responsive Design**: Mobile-first UI with Tailwind CSS
- **Type Safety**: Full TypeScript implementation with Zod validation

## Architecture

### System Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Client  │────│   Supabase API   │────│   PostgreSQL    │
│                 │    │                  │    │                 │
│ • Components    │    │ • Authentication │    │ • RLS Policies  │
│ • Contexts      │    │ • Real-time      │    │ • Triggers      │
│ • Routing       │    │ • Row Level Sec. │    │ • Functions     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Technology Stack

| Component | Technology | Rationale |
|-----------|------------|----------|
| **Frontend** | React 18 + Vite | Fast development, modern React features |
| **Language** | TypeScript | Type safety, better developer experience |
| **Styling** | Tailwind CSS + shadcn/ui | Consistent design system, rapid development |
| **Backend** | Supabase | Real-time capabilities, built-in auth, RLS |
| **Database** | PostgreSQL | Advanced features, JSON support, triggers |
| **State Management** | React Context + React Query | Simple auth state, server state caching |
| **Form Handling** | React Hook Form + Zod | Type-safe validation, great DX |

### Data Flow

1. **Authentication**: User logs in via Supabase Auth
2. **Profile Creation**: Trigger automatically creates user_profile
3. **RLS Enforcement**: All queries filtered by user's organization/market
4. **Real-time Updates**: Supabase subscriptions for live data
5. **Type Safety**: Zod schemas ensure data integrity

## Getting Started

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm/yarn**: Latest version
- **Supabase Account**: For backend services
- **Git**: For version control

### Local Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd price-index-management
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Variables**
   
   The Supabase client is pre-configured in `src/integrations/supabase/client.ts`:
   ```typescript
   const SUPABASE_URL = "https://eenvuubwwlckbpdprbex.supabase.co";
   const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
   ```

4. **Database Setup**
   
   The database schema is managed through Supabase migrations in `supabase/migrations/`. The initial migration creates:
   - All required tables with proper relationships
   - Row Level Security policies
   - Database functions and triggers
   - Proper indexes for performance

5. **Seed Test Data**
   ```sql
   -- Insert test organization
   INSERT INTO organizations (name, slug, brand_name) 
   VALUES ('Angle Orange', 'angle-orange', 'Angle Orange Brand');
   
   -- Insert test market
   INSERT INTO markets (organization_id, name, country, currency)
   VALUES (
     (SELECT id FROM organizations WHERE slug = 'angle-orange'),
     'United States', 'USA', 'USD'
   );
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   Visit `http://localhost:5173` to see the application.

### First User Setup

1. Navigate to `/auth/signup`
2. Create an account (will be assigned super_user role initially)
3. Complete profile setup
4. Access the dashboard at `/`

## Database & Row Level Security

### Database Schema

#### Core Tables

**organizations** - Multi-tenant isolation
```sql
id              uuid PRIMARY KEY
name            text NOT NULL
slug            text UNIQUE NOT NULL
brand_name      text
primary_color   text
logo_url        text
is_active       boolean DEFAULT true
```

**markets** - Geographic/currency segments
```sql
id               uuid PRIMARY KEY
organization_id  uuid REFERENCES organizations
name            text NOT NULL
country         text NOT NULL
currency        text NOT NULL
is_active       boolean DEFAULT true
```

**user_profiles** - Extended user information
```sql
id               uuid PRIMARY KEY
user_id          uuid UNIQUE REFERENCES auth.users
organization_id  uuid REFERENCES organizations
market_id        uuid REFERENCES markets (nullable)
first_name       text
last_name        text  
email           text
role            user_role NOT NULL DEFAULT 'representative'
is_active       boolean DEFAULT true
```

**skus** - Product catalog
```sql
id                  uuid PRIMARY KEY
organization_id     uuid REFERENCES organizations
market_id          uuid REFERENCES markets
brand_name         text NOT NULL
product_name       text NOT NULL
barcode           text
volume_ml         integer
category          text
target_price_index numeric(5,2)
is_active         boolean DEFAULT true
```

### User Role Hierarchy

```
super_user (Level 4)
├── Full system access
├── Manage organizations
└── Manage all users

power_user (Level 3)  
├── Manage markets within org
├── View all org data
└── Manage market admins

market_admin (Level 2)
├── Manage SKUs, channels, outlets
├── View market-specific data
└── Manage representatives

representative (Level 1)
├── Capture price data
├── View assigned market data
└── Basic operations only
```

### Row Level Security Policies

#### Key RLS Patterns

**Organization Isolation**
```sql
-- Users can only see data from their organization
CREATE POLICY "org_isolation" ON skus FOR SELECT USING (
  organization_id IN (
    SELECT organization_id FROM user_profiles 
    WHERE user_id = auth.uid() AND is_active = true
  )
);
```

**Role-Based Access**
```sql
-- Market admins can manage SKUs in their scope
CREATE POLICY "market_admin_sku_management" ON skus FOR ALL USING (
  user_has_role_or_higher('market_admin'::user_role) AND
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.organization_id = skus.organization_id
    AND (up.market_id = skus.market_id OR up.market_id IS NULL)
  )
);
```

#### Helper Functions

**user_has_role_or_higher(required_role)**
```sql
-- Checks if current user has required role or higher
SELECT EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE user_id = auth.uid() AND is_active = true
  AND (
    (role = 'super_user') OR
    (role = 'power_user' AND required_role IN ('power_user', 'market_admin', 'representative')) OR
    (role = 'market_admin' AND required_role IN ('market_admin', 'representative')) OR
    (role = 'representative' AND required_role = 'representative')
  )
);
```

### Common Queries

**Get Current User Profile**
```sql
SELECT * FROM user_profiles 
WHERE user_id = auth.uid();
```

**Get Organization SKUs (Auto-filtered by RLS)**
```sql
SELECT s.*, o.name as org_name, m.name as market_name
FROM skus s
JOIN organizations o ON o.id = s.organization_id  
JOIN markets m ON m.id = s.market_id
WHERE s.is_active = true;
```

## Authentication

### Supabase Auth Integration

The authentication system uses Supabase Auth with automatic user profile creation:

#### Auth Context (`src/contexts/AuthContext.tsx`)

```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (data: LoginFormData) => Promise<void>;
  signup: (data: SignupFormData) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
```

#### Key Features

**Session Persistence**
- Automatic token refresh
- localStorage-based session storage
- Proper session restoration on app restart

**Profile Creation**
- Automatic profile creation on signup
- Organization assignment (defaults to 'Angle Orange' for development)
- Role assignment (defaults to 'super_user' for initial setup)

**Error Handling**
- Comprehensive error messages
- Toast notifications for user feedback
- Graceful fallbacks for auth failures

#### Protected Routes

```typescript
// src/components/layout/ProtectedRoute.tsx
<ProtectedRoute requiredRole="market_admin">
  <AdminPanel />
</ProtectedRoute>
```

**Route Protection Features:**
- Authentication requirement
- Role-based access control
- Account activation status check
- Automatic redirects for unauthorized access

### Session Management

**Initialization Pattern**
```typescript
useEffect(() => {
  // Set up auth listener first
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
    }
  );

  // Then check existing session
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setUser(session?.user ?? null);
    if (session?.user) {
      fetchUserProfile(session.user.id);
    }
  });

  return () => subscription.unsubscribe();
}, []);
```

## Code Structure

### Folder Organization

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication forms
│   ├── layout/         # Layout components
│   └── ui/             # shadcn/ui components
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state
├── hooks/              # Custom hooks
│   └── use-toast.ts    # Toast notifications
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client & types
├── lib/                # Utility functions
│   ├── utils.ts        # General utilities
│   └── validations.ts  # Zod schemas
├── pages/              # Route components
│   ├── auth/           # Auth pages
│   ├── Index.tsx       # Dashboard
│   └── Profile.tsx     # User profile
├── types/              # TypeScript type definitions
│   └── auth.ts         # Auth-related types
└── App.tsx             # Main application component
```

### Key Components

#### AuthContext Provider
- Manages authentication state
- Handles user profile fetching
- Provides auth methods (login, signup, logout)
- Error handling and loading states

#### ProtectedRoute
- Route-level access control
- Role hierarchy enforcement
- Loading states during auth checks
- Redirect logic for unauthorized users

#### AppLayout
- Main application shell
- Header with user menu
- Navigation structure
- Responsive design

### Custom Hooks

**useAuth**
```typescript
const { user, userProfile, login, logout, loading } = useAuth();
```

**useToast** (from shadcn/ui)
```typescript
const { toast } = useToast();
toast({
  title: "Success",
  description: "Operation completed successfully.",
});
```

### Utility Functions

**Form Validation (`src/lib/validations.ts`)**
```typescript
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
```

## Forms & Validation

### Zod Schema Pattern

All forms use Zod for validation and TypeScript type generation:

```typescript
// Define schema
const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
});

// Infer TypeScript type
export type SignupFormData = z.infer<typeof signupSchema>;
```

### React Hook Form Integration

```typescript
const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting },
} = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
});

const onSubmit = async (data: LoginFormData) => {
  try {
    await login(data);
    navigate('/');
  } catch (error) {
    // Error handled in AuthContext
  }
};
```

### Adding New Form Fields

1. **Update Zod Schema**
   ```typescript
   const profileSchema = z.object({
     // ... existing fields
     phone: z.string().optional(),
   });
   ```

2. **Update TypeScript Types**
   ```typescript
   export type ProfileFormData = z.infer<typeof profileSchema>;
   ```

3. **Add Form Field**
   ```tsx
   <Input
     {...register('phone')}
     placeholder="Phone number"
   />
   {errors.phone && (
     <p className="text-destructive">{errors.phone.message}</p>
   )}
   ```

## Development Guide

### Adding New Features

#### 1. Database Changes

**Create Migration**
```sql
-- Add new table
CREATE TABLE public.new_feature (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.new_feature ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view org features" ON public.new_feature
FOR SELECT USING (
  organization_id IN (
    SELECT organization_id FROM user_profiles 
    WHERE user_id = auth.uid() AND is_active = true
  )
);
```

#### 2. Update TypeScript Types

The Supabase types are auto-generated. After migration:
1. Types will be automatically updated in `src/integrations/supabase/types.ts`
2. Create custom interfaces if needed in `src/types/`

#### 3. Create API Functions

```typescript
// src/lib/api/new-feature.ts
export const getFeatures = async () => {
  const { data, error } = await supabase
    .from('new_feature')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
};
```

#### 4. Add React Query Integration

```typescript
// Custom hook
export const useFeatures = () => {
  return useQuery({
    queryKey: ['features'],
    queryFn: getFeatures,
  });
};
```

### Testing RLS Policies

#### 1. Supabase SQL Editor

Test policies directly in Supabase:

```sql
-- Set role context (simulate user)
SELECT auth.jwt();
SET ROLE authenticated;
SET request.jwt.claim.sub TO '<user-uuid>';

-- Test query
SELECT * FROM skus; -- Should only return user's org data
```

#### 2. Application Testing

Create test users with different roles:

```typescript
// Test user creation utility
const createTestUser = async (role: 'super_user' | 'market_admin', orgId: string) => {
  const { data: authData } = await supabase.auth.signUp({
    email: `test-${role}@example.com`,
    password: 'TestPassword123',
  });
  
  if (authData.user) {
    await supabase.from('user_profiles').insert({
      user_id: authData.user.id,
      role,
      organization_id: orgId,
      is_active: true,
    });
  }
};
```

### Debugging Tips

#### 1. RLS Issues

**Check current user context:**
```sql
SELECT auth.uid(), auth.role();
SELECT * FROM user_profiles WHERE user_id = auth.uid();
```

**Test policies in isolation:**
```sql
-- Disable other policies temporarily
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

#### 2. TypeScript Issues

**Common fixes:**
- Ensure Zod schemas match database columns
- Use `z.infer<>` for type generation
- Check import paths for type definitions

#### 3. Authentication Issues

**Debug auth state:**
```typescript
console.log('User:', user);
console.log('Session:', session); 
console.log('Profile:', userProfile);
```

**Check Supabase Auth settings:**
- Site URL configuration
- Email confirmation settings
- Redirect URLs

### Performance Optimization

#### 1. Database Queries

**Use proper indexes:**
```sql
CREATE INDEX idx_skus_org_market ON skus(organization_id, market_id);
CREATE INDEX idx_price_capture_date ON price_capture_log(captured_at);
```

**Optimize joins:**
```typescript
// Good: Single query with joins
const { data } = await supabase
  .from('skus')
  .select(`
    *,
    organizations(name),
    markets(name, currency)
  `);

// Avoid: Multiple separate queries
```

#### 2. React Query Caching

**Set appropriate stale times:**
```typescript
const { data } = useQuery({
  queryKey: ['skus', orgId],
  queryFn: fetchSkus,
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

## Deployment

### Build Process

1. **Install Dependencies**
   ```bash
   npm ci
   ```

2. **Build Application**
   ```bash
   npm run build
   ```

3. **Preview Build** (optional)
   ```bash
   npm run preview
   ```

### Database Migrations

#### Development to Production

1. **Test migrations locally:**
   ```bash
   # If using Supabase CLI
   supabase db reset
   supabase db migrate up
   ```

2. **Apply to production:**
   - Use Supabase Dashboard SQL editor
   - Apply migrations in order
   - Test with sample data

#### Migration Best Practices

**Safe Migration Pattern:**
```sql
-- 1. Add new column (nullable first)
ALTER TABLE skus ADD COLUMN new_field TEXT;

-- 2. Populate data (separate transaction)
UPDATE skus SET new_field = 'default_value' WHERE new_field IS NULL;

-- 3. Add constraint (if needed)
ALTER TABLE skus ALTER COLUMN new_field SET NOT NULL;
```

### Environment Configuration

#### Production Settings

1. **Supabase Settings:**
   - Set proper Site URL
   - Configure redirect URLs
   - Enable appropriate auth providers
   - Set up proper CORS settings

2. **RLS Verification:**
   - Test all user roles
   - Verify data isolation
   - Check policy performance

### CI/CD Recommendations

#### GitHub Actions Example

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      # Deploy step depends on hosting platform
```

#### Database Migration Strategy

1. **Backward Compatible Changes:** Deploy immediately
2. **Breaking Changes:** 
   - Deploy migration first
   - Update application code
   - Clean up deprecated code

## Troubleshooting

### Common Errors

#### 1. "new row violates row-level security policy"

**Cause:** Missing required fields for RLS policy

**Solution:**
```typescript
// Ensure organization_id is set
const { error } = await supabase
  .from('skus')
  .insert({
    ...skuData,
    organization_id: user.userProfile.organization_id, // Required!
  });
```

#### 2. "infinite recursion detected in policy"

**Cause:** RLS policy references same table

**Solution:** Use security definer function:
```sql
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id FROM user_profiles WHERE user_id = auth.uid();
$$;

-- Use in policy
CREATE POLICY "org_access" ON skus FOR SELECT 
USING (organization_id = get_user_org_id());
```

#### 3. TypeScript Errors with Supabase Types

**Cause:** Generated types don't match usage

**Solution:**
```typescript
// Create custom interface for complex queries
interface SKUWithRelations {
  id: string;
  name: string;
  organizations: {
    name: string;
  };
}

const { data } = await supabase
  .from('skus')
  .select('id, name, organizations(name)')
  .returns<SKUWithRelations[]>();
```

#### 4. Authentication Redirect Issues

**Cause:** Incorrect URL configuration

**Solution:**
1. Check Supabase Auth settings
2. Verify Site URL matches deployment URL
3. Add all redirect URLs (localhost, preview, production)

#### 5. RLS Lockout (Cannot Access Data)

**Cause:** User profile missing or inactive

**Solution:**
```sql
-- Check user profile
SELECT * FROM auth.users WHERE email = 'user@example.com';
SELECT * FROM user_profiles WHERE user_id = '<user-id>';

-- Fix inactive profile
UPDATE user_profiles 
SET is_active = true 
WHERE user_id = '<user-id>';

-- Create missing profile
INSERT INTO user_profiles (user_id, organization_id, role, is_active)
VALUES ('<user-id>', '<org-id>', 'super_user', true);
```

### Admin Account Recovery

If locked out of admin access:

1. **Direct Database Access** (Supabase Dashboard):
   ```sql
   -- Find user ID
   SELECT id, email FROM auth.users WHERE email = 'admin@example.com';
   
   -- Update role to super_user
   UPDATE user_profiles 
   SET role = 'super_user', is_active = true 
   WHERE user_id = '<user-id>';
   ```

2. **Create Emergency Admin:**
   ```sql
   -- Create new super user profile
   INSERT INTO user_profiles (user_id, organization_id, role, is_active)
   VALUES (
     '<existing-user-id>',
     (SELECT id FROM organizations LIMIT 1),
     'super_user',
     true
   );
   ```

### Debug Checklist

When encountering issues:

- [ ] Check browser console for errors
- [ ] Verify network requests in DevTools
- [ ] Test authentication state
- [ ] Validate RLS policies with SQL
- [ ] Check Supabase logs
- [ ] Verify environment configuration
- [ ] Test with different user roles
- [ ] Review recent code changes

### Performance Issues

#### Slow Queries

1. **Enable Query Performance Insights** in Supabase
2. **Add missing indexes:**
   ```sql
   EXPLAIN ANALYZE SELECT * FROM skus WHERE organization_id = 'uuid';
   -- If seq scan, add index
   CREATE INDEX idx_skus_org ON skus(organization_id);
   ```

3. **Optimize RLS policies:**
   ```sql
   -- Good: Uses index
   organization_id = (SELECT organization_id FROM user_profiles WHERE user_id = auth.uid())
   
   -- Better: Use function with proper indexing
   organization_id = get_user_org_id()
   ```

---

## Support

For additional help:
- Check Supabase documentation
- Review React Query documentation  
- Consult Tailwind CSS documentation
- Use TypeScript handbook for type issues

---

**Last Updated:** January 2025
**Version:** 1.0.0
