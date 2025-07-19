
-- Update markets RLS policy to be context-aware for super users
DROP POLICY IF EXISTS "Users can view markets in their organization" ON public.markets;
CREATE POLICY "Users can view markets in their organization"
ON public.markets
FOR SELECT
USING (
    organization_id IN (
        SELECT 
            CASE 
                WHEN up.role = 'super_user' THEN 
                    (SELECT current_org_id FROM get_current_context_info())
                ELSE 
                    up.organization_id
            END
        FROM user_profiles up
        WHERE up.user_id = auth.uid() AND up.is_active = true
    )
);

-- Update channels RLS policy to be context-aware for super users
DROP POLICY IF EXISTS "Users can view channels in their org/market" ON public.channels;
CREATE POLICY "Users can view channels in their org/market"
ON public.channels
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM get_current_context_info() ctx, user_profiles up
        WHERE up.user_id = auth.uid() 
        AND up.is_active = true
        AND (
            (up.role = 'super_user' AND channels.organization_id = ctx.current_org_id)
            OR 
            (up.role != 'super_user' AND channels.organization_id = up.organization_id AND (channels.market_id = up.market_id OR up.market_id IS NULL))
        )
    )
);

-- Update channel_segments RLS policy to be context-aware for super users
DROP POLICY IF EXISTS "Users can view channel segments in their org/market" ON public.channel_segments;
CREATE POLICY "Users can view channel segments in their org/market"
ON public.channel_segments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM get_current_context_info() ctx, user_profiles up
        WHERE up.user_id = auth.uid() 
        AND up.is_active = true
        AND (
            (up.role = 'super_user' AND channel_segments.organization_id = ctx.current_org_id)
            OR 
            (up.role != 'super_user' AND channel_segments.organization_id = up.organization_id AND (channel_segments.market_id = up.market_id OR up.market_id IS NULL))
        )
    )
);

-- Update outlets RLS policy to be context-aware for super users
DROP POLICY IF EXISTS "Users can view outlets in their org" ON public.outlets;
CREATE POLICY "Users can view outlets in their org"
ON public.outlets
FOR SELECT
USING (
    organization_id IN (
        SELECT 
            CASE 
                WHEN up.role = 'super_user' THEN 
                    (SELECT current_org_id FROM get_current_context_info())
                ELSE 
                    up.organization_id
            END
        FROM user_profiles up
        WHERE up.user_id = auth.uid() AND up.is_active = true
    )
);

-- Update organizations RLS policy to allow super users to view all organizations
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
CREATE POLICY "Users can view their organization"
ON public.organizations
FOR SELECT
USING (
    id IN (
        SELECT 
            CASE 
                WHEN up.role = 'super_user' THEN organizations.id
                ELSE up.organization_id
            END
        FROM user_profiles up
        WHERE up.user_id = auth.uid() AND up.is_active = true
    )
);
