-- PHASE 2: USER EXPERIENCE & FLOW FIXES

-- 2.1 Auto-create user profile trigger when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    org_id uuid;
    market_id uuid;
    org_data record;
BEGIN
    -- Try to get organization by email domain
    SELECT public.get_organization_by_email_domain(NEW.email) INTO org_id;
    
    -- Only create profile if we found a matching organization
    IF org_id IS NOT NULL THEN
        -- Get organization details and first market
        SELECT o.id, o.requires_approval, m.id as first_market_id
        INTO org_data
        FROM public.organizations o
        LEFT JOIN public.markets m ON m.organization_id = o.id AND m.is_active = true
        WHERE o.id = org_id
        LIMIT 1;
        
        -- Create user profile
        INSERT INTO public.user_profiles (
            user_id,
            email,
            first_name,
            last_name,
            role,
            organization_id,
            market_id,
            is_active,
            approval_status,
            approved_at
        ) VALUES (
            NEW.id,
            NEW.email,
            NEW.raw_user_meta_data ->> 'first_name',
            NEW.raw_user_meta_data ->> 'last_name',
            'representative',
            org_id,
            org_data.first_market_id,
            NOT COALESCE(org_data.requires_approval, true),
            CASE 
                WHEN COALESCE(org_data.requires_approval, true) THEN 'pending'
                ELSE 'approved'
            END,
            CASE 
                WHEN NOT COALESCE(org_data.requires_approval, true) THEN NOW()
                ELSE NULL
            END
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2.2 Create emergency admin functions for super users
CREATE OR REPLACE FUNCTION public.emergency_create_profile(
    target_user_id uuid,
    email_address text,
    first_name_param text,
    last_name_param text,
    role_param user_role DEFAULT 'representative',
    organization_id_param uuid DEFAULT NULL,
    market_id_param uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_user_info record;
    target_org_id uuid;
    target_market_id uuid;
    new_profile_id uuid;
BEGIN
    -- Check if current user is super user
    SELECT role, is_active INTO current_user_info
    FROM public.user_profiles 
    WHERE user_id = auth.uid();
    
    IF current_user_info IS NULL OR current_user_info.role != 'super_user' OR NOT current_user_info.is_active THEN
        RAISE EXCEPTION 'Unauthorized: Only active super users can create emergency profiles';
    END IF;
    
    -- Determine organization (use provided or auto-detect from email)
    IF organization_id_param IS NOT NULL THEN
        target_org_id := organization_id_param;
    ELSE
        SELECT public.get_organization_by_email_domain(email_address) INTO target_org_id;
        IF target_org_id IS NULL THEN
            RAISE EXCEPTION 'Cannot determine organization for email domain';
        END IF;
    END IF;
    
    -- Use provided market or get first available market for organization
    IF market_id_param IS NOT NULL THEN
        target_market_id := market_id_param;
    ELSE
        SELECT id INTO target_market_id
        FROM public.markets 
        WHERE organization_id = target_org_id AND is_active = true
        LIMIT 1;
    END IF;
    
    -- Check if profile already exists
    IF EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = target_user_id) THEN
        RAISE EXCEPTION 'Profile already exists for this user';
    END IF;
    
    -- Create profile
    INSERT INTO public.user_profiles (
        user_id,
        email,
        first_name,
        last_name,
        role,
        organization_id,
        market_id,
        is_active,
        approval_status,
        approved_at,
        created_by_user_id
    ) VALUES (
        target_user_id,
        email_address,
        first_name_param,
        last_name_param,
        role_param,
        target_org_id,
        target_market_id,
        true,
        'approved',
        NOW(),
        auth.uid()
    ) RETURNING id INTO new_profile_id;
    
    RETURN new_profile_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.emergency_fix_orphaned_users()
RETURNS TABLE(user_id uuid, email text, action_taken text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_user_info record;
    orphaned_user record;
    org_id uuid;
    market_id uuid;
BEGIN
    -- Check if current user is super user
    SELECT role, is_active INTO current_user_info
    FROM public.user_profiles 
    WHERE user_id = auth.uid();
    
    IF current_user_info IS NULL OR current_user_info.role != 'super_user' OR NOT current_user_info.is_active THEN
        RAISE EXCEPTION 'Unauthorized: Only active super users can fix orphaned users';
    END IF;
    
    -- Find users without profiles
    FOR orphaned_user IN
        SELECT au.id, au.email, au.raw_user_meta_data
        FROM auth.users au
        LEFT JOIN public.user_profiles up ON au.id = up.user_id
        WHERE up.id IS NULL AND au.email IS NOT NULL
    LOOP
        -- Try to determine organization from email
        SELECT public.get_organization_by_email_domain(orphaned_user.email) INTO org_id;
        
        IF org_id IS NOT NULL THEN
            -- Get first market for organization
            SELECT id INTO market_id
            FROM public.markets 
            WHERE organization_id = org_id AND is_active = true
            LIMIT 1;
            
            -- Create profile
            INSERT INTO public.user_profiles (
                user_id,
                email,
                first_name,
                last_name,
                role,
                organization_id,
                market_id,
                is_active,
                approval_status,
                approved_at,
                created_by_user_id
            ) VALUES (
                orphaned_user.id,
                orphaned_user.email,
                orphaned_user.raw_user_meta_data ->> 'first_name',
                orphaned_user.raw_user_meta_data ->> 'last_name',
                'representative',
                org_id,
                market_id,
                true,
                'approved',
                NOW(),
                auth.uid()
            );
            
            RETURN QUERY SELECT orphaned_user.id, orphaned_user.email, 'Profile created automatically'::text;
        ELSE
            RETURN QUERY SELECT orphaned_user.id, orphaned_user.email, 'No matching organization found'::text;
        END IF;
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.emergency_activate_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_user_info record;
BEGIN
    -- Check if current user is super user
    SELECT role, is_active INTO current_user_info
    FROM public.user_profiles 
    WHERE user_id = auth.uid();
    
    IF current_user_info IS NULL OR current_user_info.role != 'super_user' OR NOT current_user_info.is_active THEN
        RAISE EXCEPTION 'Unauthorized: Only active super users can activate users';
    END IF;
    
    -- Activate user
    UPDATE public.user_profiles 
    SET 
        is_active = true,
        approval_status = 'approved',
        approved_at = NOW(),
        approved_by_user_id = auth.uid()
    WHERE user_id = target_user_id;
    
    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.emergency_deactivate_user(target_user_id uuid, reason text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_user_info record;
BEGIN
    -- Check if current user is super user
    SELECT role, is_active INTO current_user_info
    FROM public.user_profiles 
    WHERE user_id = auth.uid();
    
    IF current_user_info IS NULL OR current_user_info.role != 'super_user' OR NOT current_user_info.is_active THEN
        RAISE EXCEPTION 'Unauthorized: Only active super users can deactivate users';
    END IF;
    
    -- Don't allow deactivating self
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot deactivate your own account';
    END IF;
    
    -- Deactivate user
    UPDATE public.user_profiles 
    SET 
        is_active = false,
        approval_status = 'rejected',
        rejection_reason = reason
    WHERE user_id = target_user_id;
    
    RETURN FOUND;
END;
$$;

-- 2.3 Create system health check function
CREATE OR REPLACE FUNCTION public.get_system_health()
RETURNS TABLE(
    total_users bigint,
    active_users bigint,
    pending_users bigint,
    orphaned_users bigint,
    total_organizations bigint,
    active_organizations bigint,
    total_markets bigint,
    active_markets bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_user_info record;
BEGIN
    -- Check if current user is super user
    SELECT role, is_active INTO current_user_info
    FROM public.user_profiles 
    WHERE user_id = auth.uid();
    
    IF current_user_info IS NULL OR current_user_info.role != 'super_user' OR NOT current_user_info.is_active THEN
        RAISE EXCEPTION 'Unauthorized: Only active super users can view system health';
    END IF;
    
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.user_profiles) as total_users,
        (SELECT COUNT(*) FROM public.user_profiles WHERE is_active = true) as active_users,
        (SELECT COUNT(*) FROM public.user_profiles WHERE approval_status = 'pending') as pending_users,
        (SELECT COUNT(*) FROM auth.users au LEFT JOIN public.user_profiles up ON au.id = up.user_id WHERE up.id IS NULL) as orphaned_users,
        (SELECT COUNT(*) FROM public.organizations) as total_organizations,
        (SELECT COUNT(*) FROM public.organizations WHERE is_active = true) as active_organizations,
        (SELECT COUNT(*) FROM public.markets) as total_markets,
        (SELECT COUNT(*) FROM public.markets WHERE is_active = true) as active_markets;
END;
$$;