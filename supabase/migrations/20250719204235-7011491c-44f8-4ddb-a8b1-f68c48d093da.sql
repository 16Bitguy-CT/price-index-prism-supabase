
-- First, drop the problematic function that causes infinite recursion
DROP FUNCTION IF EXISTS public.user_has_role_or_higher(user_role);

-- Drop all existing RLS policies on user_profiles to recreate them without recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Market admins can view profiles in their org/market" ON public.user_profiles;
DROP POLICY IF EXISTS "Super users can manage all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Market admins can manage profiles in their scope" ON public.user_profiles;

-- Create new RLS policies that don't cause recursion
-- Policy 1: Users can always view their own profile
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (user_id = auth.uid());

-- Policy 2: Super users can do everything (using direct role check)
CREATE POLICY "Super users can manage all profiles" ON public.user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'super_user' 
            AND up.is_active = true
        )
    );

-- Policy 3: Power users can view and manage profiles in their organization
CREATE POLICY "Power users can manage org profiles" ON public.user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role IN ('power_user', 'super_user')
            AND up.is_active = true
            AND up.organization_id = user_profiles.organization_id
        )
    );

-- Policy 4: Market admins can view and manage profiles in their market scope
CREATE POLICY "Market admins can manage market profiles" ON public.user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role IN ('market_admin', 'power_user', 'super_user')
            AND up.is_active = true
            AND up.organization_id = user_profiles.organization_id
            AND (up.market_id = user_profiles.market_id OR up.market_id IS NULL OR user_profiles.market_id IS NULL)
        )
    );

-- Now we need to update other tables that used the dropped function
-- Let's recreate a simpler helper function that doesn't query user_profiles
CREATE OR REPLACE FUNCTION public.get_user_role_and_org()
RETURNS TABLE(user_role public.user_role, org_id uuid, market_id uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT role, organization_id, market_id 
    FROM public.user_profiles 
    WHERE user_id = auth.uid() AND is_active = true;
$$;

-- Update RLS policies on other tables to use direct role comparisons instead of the function
-- Organizations table policies
DROP POLICY IF EXISTS "Super users can insert organizations" ON public.organizations;
DROP POLICY IF EXISTS "Super users can update organizations" ON public.organizations;

CREATE POLICY "Super users can insert organizations" ON public.organizations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'super_user' 
            AND is_active = true
        )
    );

CREATE POLICY "Super users can update organizations" ON public.organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'super_user' 
            AND is_active = true
        )
    );

-- Markets table policies
DROP POLICY IF EXISTS "Power users can insert markets" ON public.markets;
DROP POLICY IF EXISTS "Power users can update markets" ON public.markets;

CREATE POLICY "Power users can insert markets" ON public.markets
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.user_id = auth.uid() 
            AND up.role IN ('power_user', 'super_user')
            AND up.is_active = true
            AND up.organization_id = markets.organization_id
        )
    );

CREATE POLICY "Power users can update markets" ON public.markets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.user_id = auth.uid() 
            AND up.role IN ('power_user', 'super_user')
            AND up.is_active = true
            AND up.organization_id = markets.organization_id
        )
    );

-- Update all other table policies to avoid the dropped function
-- Channel segments
DROP POLICY IF EXISTS "Market admins can manage channel segments" ON public.channel_segments;
CREATE POLICY "Market admins can manage channel segments" ON public.channel_segments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role IN ('market_admin', 'power_user', 'super_user')
            AND up.is_active = true
            AND up.organization_id = channel_segments.organization_id
            AND (up.market_id = channel_segments.market_id OR up.market_id IS NULL)
        )
    );

-- Channels
DROP POLICY IF EXISTS "Market admins can manage channels" ON public.channels;
CREATE POLICY "Market admins can manage channels" ON public.channels
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role IN ('market_admin', 'power_user', 'super_user')
            AND up.is_active = true
            AND up.organization_id = channels.organization_id
            AND (up.market_id = channels.market_id OR up.market_id IS NULL)
        )
    );

-- Outlets
DROP POLICY IF EXISTS "Market admins can manage outlets" ON public.outlets;
CREATE POLICY "Market admins can manage outlets" ON public.outlets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.user_id = auth.uid() 
            AND up.role IN ('market_admin', 'power_user', 'super_user')
            AND up.is_active = true
            AND up.organization_id = outlets.organization_id
        )
    );

-- SKUs
DROP POLICY IF EXISTS "Market admins can manage SKUs" ON public.skus;
CREATE POLICY "Market admins can manage SKUs" ON public.skus
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role IN ('market_admin', 'power_user', 'super_user')
            AND up.is_active = true
            AND up.organization_id = skus.organization_id
            AND (up.market_id = skus.market_id OR up.market_id IS NULL)
        )
    );

-- SKU Price Anchor
DROP POLICY IF EXISTS "Market admins can manage price anchors" ON public.sku_price_anchor;
CREATE POLICY "Market admins can manage price anchors" ON public.sku_price_anchor
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role IN ('market_admin', 'power_user', 'super_user')
            AND up.is_active = true
            AND up.organization_id = sku_price_anchor.organization_id
            AND (up.market_id = sku_price_anchor.market_id OR up.market_id IS NULL)
        )
    );

-- Price Capture Log
DROP POLICY IF EXISTS "Market admins can manage price captures" ON public.price_capture_log;
CREATE POLICY "Market admins can manage price captures" ON public.price_capture_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role IN ('market_admin', 'power_user', 'super_user')
            AND up.is_active = true
            AND up.organization_id = price_capture_log.organization_id
            AND (up.market_id = price_capture_log.market_id OR up.market_id IS NULL)
        )
    );
