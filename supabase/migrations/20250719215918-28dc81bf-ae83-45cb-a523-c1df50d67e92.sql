
-- Create a table to log organization context switches for audit purposes
CREATE TABLE public.organization_context_log (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    switched_from_org_id uuid NOT NULL,
    switched_to_org_id uuid NOT NULL,
    switched_at timestamp with time zone NOT NULL DEFAULT now(),
    session_id text,
    ip_address inet,
    user_agent text
);

-- Enable RLS on the context log table
ALTER TABLE public.organization_context_log ENABLE ROW LEVEL SECURITY;

-- Only super users can view context logs
CREATE POLICY "Super users can view context logs"
ON public.organization_context_log
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.user_id = auth.uid()
        AND up.role = 'super_user'
        AND up.is_active = true
    )
);

-- Create function to get current context info (considers organization switching)
CREATE OR REPLACE FUNCTION public.get_current_context_info()
RETURNS TABLE(
    user_role user_role,
    home_org_id uuid,
    current_org_id uuid,
    market_id uuid,
    is_active boolean,
    is_context_switched boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
    switched_org_id uuid;
BEGIN
    -- Check if there's a current organization context set in the session
    -- This would be set when a super user switches organization context
    BEGIN
        switched_org_id := current_setting('app.current_org_context', true)::uuid;
    EXCEPTION
        WHEN OTHERS THEN
            switched_org_id := NULL;
    END;
    
    RETURN QUERY
    SELECT 
        up.role,
        up.organization_id as home_org_id,
        COALESCE(switched_org_id, up.organization_id) as current_org_id,
        up.market_id,
        up.is_active,
        (switched_org_id IS NOT NULL AND switched_org_id != up.organization_id) as is_context_switched
    FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
    LIMIT 1;
END;
$$;

-- Create function to switch organization context (super users only)
CREATE OR REPLACE FUNCTION public.switch_organization_context(target_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_info record;
    target_org record;
BEGIN
    -- Get current user info
    SELECT role, organization_id, is_active
    INTO user_info
    FROM user_profiles
    WHERE user_id = auth.uid();
    
    -- Check if user exists and is a super user
    IF user_info IS NULL OR user_info.role != 'super_user' OR NOT user_info.is_active THEN
        RAISE EXCEPTION 'Unauthorized: Only active super users can switch organization context';
    END IF;
    
    -- Validate target organization exists and is active
    SELECT id, is_active
    INTO target_org
    FROM organizations
    WHERE id = target_org_id;
    
    IF target_org IS NULL THEN
        RAISE EXCEPTION 'Target organization not found';
    END IF;
    
    IF NOT target_org.is_active THEN
        RAISE EXCEPTION 'Cannot switch to inactive organization';
    END IF;
    
    -- Set the organization context for this session
    PERFORM set_config('app.current_org_context', target_org_id::text, false);
    
    -- Log the context switch
    INSERT INTO organization_context_log (
        user_id,
        switched_from_org_id,
        switched_to_org_id,
        session_id
    ) VALUES (
        auth.uid(),
        user_info.organization_id,
        target_org_id,
        current_setting('request.jwt.claims', true)::json->>'session_id'
    );
    
    RETURN true;
END;
$$;

-- Create function to reset organization context
CREATE OR REPLACE FUNCTION public.reset_organization_context()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_info record;
BEGIN
    -- Get current user info
    SELECT role, organization_id, is_active
    INTO user_info
    FROM user_profiles
    WHERE user_id = auth.uid();
    
    -- Check if user exists and is a super user
    IF user_info IS NULL OR user_info.role != 'super_user' OR NOT user_info.is_active THEN
        RAISE EXCEPTION 'Unauthorized: Only active super users can reset organization context';
    END IF;
    
    -- Reset the organization context
    PERFORM set_config('app.current_org_context', '', false);
    
    RETURN true;
END;
$$;

-- Update RLS policies to use context-aware function for super users
-- We'll need to update existing policies to check the context

-- Example: Update user_profiles policy to consider context switching
DROP POLICY IF EXISTS "org_members_can_view_profiles" ON public.user_profiles;
CREATE POLICY "org_members_can_view_profiles"
ON public.user_profiles
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
