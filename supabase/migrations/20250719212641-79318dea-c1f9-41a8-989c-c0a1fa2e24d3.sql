
-- Force drop all existing policies and functions that cause recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Market admins can view profiles in their org/market" ON public.user_profiles;
DROP POLICY IF EXISTS "Super users can manage all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Market admins can manage profiles in their scope" ON public.user_profiles;
DROP POLICY IF EXISTS "Power users can manage org profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Market admins can manage market profiles" ON public.user_profiles;

-- Force drop the problematic function with CASCADE to remove all dependencies
DROP FUNCTION IF EXISTS public.user_has_role_or_higher(user_role) CASCADE;

-- Also drop the helper function we created earlier
DROP FUNCTION IF EXISTS public.get_user_role_and_org() CASCADE;

-- Create a simple, safe RLS policy structure for user_profiles
-- Policy 1: Users can always view and update their own profile (no recursion)
CREATE POLICY "users_own_profile" ON public.user_profiles
    FOR ALL 
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Policy 2: Allow reading profiles for users in the same organization (safe query)
CREATE POLICY "org_members_can_view_profiles" ON public.user_profiles
    FOR SELECT
    USING (
        organization_id IN (
            SELECT up.organization_id 
            FROM public.user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.is_active = true
        )
    );

-- Create new safe helper function that doesn't cause recursion
CREATE OR REPLACE FUNCTION public.get_current_user_info()
RETURNS TABLE(
    user_role public.user_role, 
    org_id uuid, 
    market_id uuid,
    is_active boolean
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT role, organization_id, market_id, is_active
    FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1;
$$;

-- Update all other table policies to use the new safe function
-- Organizations policies
DROP POLICY IF EXISTS "Super users can insert organizations" ON public.organizations;
DROP POLICY IF EXISTS "Super users can update organizations" ON public.organizations;

CREATE POLICY "super_users_manage_organizations" ON public.organizations
    FOR ALL 
    USING (
        (SELECT user_role FROM public.get_current_user_info()) = 'super_user'
    );

-- Markets policies  
DROP POLICY IF EXISTS "Power users can insert markets" ON public.markets;
DROP POLICY IF EXISTS "Power users can update markets" ON public.markets;

CREATE POLICY "power_users_manage_markets" ON public.markets
    FOR ALL
    USING (
        (SELECT user_role FROM public.get_current_user_info()) IN ('power_user', 'super_user')
        AND organization_id = (SELECT org_id FROM public.get_current_user_info())
    );

-- Channel segments policies
DROP POLICY IF EXISTS "Market admins can manage channel segments" ON public.channel_segments;

CREATE POLICY "market_admins_manage_segments" ON public.channel_segments
    FOR ALL
    USING (
        (SELECT user_role FROM public.get_current_user_info()) IN ('market_admin', 'power_user', 'super_user')
        AND organization_id = (SELECT org_id FROM public.get_current_user_info())
        AND (
            market_id = (SELECT market_id FROM public.get_current_user_info()) 
            OR (SELECT market_id FROM public.get_current_user_info()) IS NULL
        )
    );

-- Channels policies
DROP POLICY IF EXISTS "Market admins can manage channels" ON public.channels;

CREATE POLICY "market_admins_manage_channels" ON public.channels
    FOR ALL
    USING (
        (SELECT user_role FROM public.get_current_user_info()) IN ('market_admin', 'power_user', 'super_user')
        AND organization_id = (SELECT org_id FROM public.get_current_user_info())
        AND (
            market_id = (SELECT market_id FROM public.get_current_user_info()) 
            OR (SELECT market_id FROM public.get_current_user_info()) IS NULL
        )
    );

-- Outlets policies
DROP POLICY IF EXISTS "Market admins can manage outlets" ON public.outlets;

CREATE POLICY "market_admins_manage_outlets" ON public.outlets
    FOR ALL
    USING (
        (SELECT user_role FROM public.get_current_user_info()) IN ('market_admin', 'power_user', 'super_user')
        AND organization_id = (SELECT org_id FROM public.get_current_user_info())
    );

-- SKUs policies
DROP POLICY IF EXISTS "Market admins can manage SKUs" ON public.skus;

CREATE POLICY "market_admins_manage_skus" ON public.skus
    FOR ALL
    USING (
        (SELECT user_role FROM public.get_current_user_info()) IN ('market_admin', 'power_user', 'super_user')
        AND organization_id = (SELECT org_id FROM public.get_current_user_info())
        AND (
            market_id = (SELECT market_id FROM public.get_current_user_info()) 
            OR (SELECT market_id FROM public.get_current_user_info()) IS NULL
        )
    );

-- SKU Price Anchor policies
DROP POLICY IF EXISTS "Market admins can manage price anchors" ON public.sku_price_anchor;

CREATE POLICY "market_admins_manage_price_anchors" ON public.sku_price_anchor
    FOR ALL
    USING (
        (SELECT user_role FROM public.get_current_user_info()) IN ('market_admin', 'power_user', 'super_user')
        AND organization_id = (SELECT org_id FROM public.get_current_user_info())
        AND (
            market_id = (SELECT market_id FROM public.get_current_user_info()) 
            OR (SELECT market_id FROM public.get_current_user_info()) IS NULL
        )
    );

-- Price Capture Log policies
DROP POLICY IF EXISTS "Market admins can manage price captures" ON public.price_capture_log;

CREATE POLICY "market_admins_manage_price_captures" ON public.price_capture_log
    FOR ALL
    USING (
        (SELECT user_role FROM public.get_current_user_info()) IN ('market_admin', 'power_user', 'super_user')
        AND organization_id = (SELECT org_id FROM public.get_current_user_info())
        AND (
            market_id = (SELECT market_id FROM public.get_current_user_info()) 
            OR (SELECT market_id FROM public.get_current_user_info()) IS NULL
        )
    );
