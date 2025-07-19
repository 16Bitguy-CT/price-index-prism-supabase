
-- PHASE 1: CRITICAL SECURITY FIXES

-- 1.1 Enable RLS on Critical Tables (CRITICAL - tables are currently unprotected)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 1.2 Fix Database Functions Security (Add secure search paths)
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS user_profiles
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT * FROM public.user_profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_info()
RETURNS TABLE(user_role user_role, org_id uuid, market_id uuid, is_active boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT role, organization_id, market_id, is_active
    FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_current_context_info()
RETURNS TABLE(user_role user_role, home_org_id uuid, current_org_id uuid, market_id uuid, is_active boolean, is_context_switched boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    switched_org_id uuid;
BEGIN
    -- Check if there's a current organization context set in the session
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

CREATE OR REPLACE FUNCTION public.switch_organization_context(target_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    user_info record;
    target_org record;
BEGIN
    -- Get current user info
    SELECT role, organization_id, is_active
    INTO user_info
    FROM public.user_profiles
    WHERE user_id = auth.uid();
    
    -- Check if user exists and is a super user
    IF user_info IS NULL OR user_info.role != 'super_user' OR NOT user_info.is_active THEN
        RAISE EXCEPTION 'Unauthorized: Only active super users can switch organization context';
    END IF;
    
    -- Validate target organization exists and is active
    SELECT id, is_active
    INTO target_org
    FROM public.organizations
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
    INSERT INTO public.organization_context_log (
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

CREATE OR REPLACE FUNCTION public.reset_organization_context()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER  
SET search_path = ''
AS $$
DECLARE
    user_info record;
BEGIN
    -- Get current user info
    SELECT role, organization_id, is_active
    INTO user_info
    FROM public.user_profiles
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

CREATE OR REPLACE FUNCTION public.is_email_domain_allowed(email_address text, org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  domain TEXT;
  allowed_domains JSONB;
BEGIN
  -- Extract domain from email
  domain := lower(split_part(email_address, '@', 2));
  
  -- Get allowed domains for organization
  SELECT allowed_email_domains INTO allowed_domains 
  FROM public.organizations 
  WHERE id = org_id;
  
  -- Check if domain is in allowed list
  RETURN allowed_domains ? domain OR allowed_domains ? ('*.' || domain);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_organization_by_email_domain(email_address text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  domain TEXT;
  org_id UUID;
BEGIN
  -- Extract domain from email
  domain := lower(split_part(email_address, '@', 2));
  
  -- Find organization that allows this domain
  SELECT id INTO org_id
  FROM public.organizations 
  WHERE allowed_email_domains ? domain 
     OR allowed_email_domains ? ('*.' || domain)
  LIMIT 1;
  
  RETURN org_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- 1.3 Add Missing Foreign Key Constraints
-- Add user_id foreign key constraint to user_profiles
ALTER TABLE public.user_profiles 
ADD CONSTRAINT fk_user_profiles_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add organization_id foreign key constraint to user_profiles  
ALTER TABLE public.user_profiles
ADD CONSTRAINT fk_user_profiles_organization_id
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add market_id foreign key constraint to user_profiles
ALTER TABLE public.user_profiles
ADD CONSTRAINT fk_user_profiles_market_id  
FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE SET NULL;

-- Add approved_by_user_id foreign key constraint to user_profiles
ALTER TABLE public.user_profiles
ADD CONSTRAINT fk_user_profiles_approved_by_user_id
FOREIGN KEY (approved_by_user_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- Add organization_id foreign key constraint to markets
ALTER TABLE public.markets
ADD CONSTRAINT fk_markets_organization_id
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add foreign key constraints to channel_segments
ALTER TABLE public.channel_segments
ADD CONSTRAINT fk_channel_segments_organization_id
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.channel_segments  
ADD CONSTRAINT fk_channel_segments_market_id
FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;

-- Add foreign key constraints to channels
ALTER TABLE public.channels
ADD CONSTRAINT fk_channels_organization_id  
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.channels
ADD CONSTRAINT fk_channels_market_id
FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;

ALTER TABLE public.channels
ADD CONSTRAINT fk_channels_segment_id
FOREIGN KEY (segment_id) REFERENCES public.channel_segments(id) ON DELETE CASCADE;

-- Add foreign key constraints to outlets
ALTER TABLE public.outlets
ADD CONSTRAINT fk_outlets_organization_id
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.outlets
ADD CONSTRAINT fk_outlets_channel_id  
FOREIGN KEY (channel_id) REFERENCES public.channels(id) ON DELETE CASCADE;

-- Add foreign key constraints to skus
ALTER TABLE public.skus
ADD CONSTRAINT fk_skus_organization_id
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.skus
ADD CONSTRAINT fk_skus_market_id
FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;

ALTER TABLE public.skus
ADD CONSTRAINT fk_skus_anchor_sku_id
FOREIGN KEY (anchor_sku_id) REFERENCES public.skus(id) ON DELETE SET NULL;

-- Add foreign key constraints to sku_price_anchor
ALTER TABLE public.sku_price_anchor
ADD CONSTRAINT fk_sku_price_anchor_organization_id
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.sku_price_anchor
ADD CONSTRAINT fk_sku_price_anchor_market_id
FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;

ALTER TABLE public.sku_price_anchor
ADD CONSTRAINT fk_sku_price_anchor_anchor_sku_id
FOREIGN KEY (anchor_sku_id) REFERENCES public.skus(id) ON DELETE CASCADE;

-- Add foreign key constraints to price_capture_log  
ALTER TABLE public.price_capture_log
ADD CONSTRAINT fk_price_capture_log_sku_id
FOREIGN KEY (sku_id) REFERENCES public.skus(id) ON DELETE CASCADE;

ALTER TABLE public.price_capture_log
ADD CONSTRAINT fk_price_capture_log_organization_id
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.price_capture_log
ADD CONSTRAINT fk_price_capture_log_market_id
FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;

ALTER TABLE public.price_capture_log
ADD CONSTRAINT fk_price_capture_log_channel_id
FOREIGN KEY (channel_id) REFERENCES public.channels(id) ON DELETE CASCADE;

ALTER TABLE public.price_capture_log
ADD CONSTRAINT fk_price_capture_log_outlet_id
FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;

-- Add foreign key constraints to organization_context_log
ALTER TABLE public.organization_context_log
ADD CONSTRAINT fk_organization_context_log_user_id
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.organization_context_log
ADD CONSTRAINT fk_organization_context_log_switched_from_org_id
FOREIGN KEY (switched_from_org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.organization_context_log
ADD CONSTRAINT fk_organization_context_log_switched_to_org_id  
FOREIGN KEY (switched_to_org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add indexes for better performance with new foreign keys
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_organization_id ON public.user_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_market_id ON public.user_profiles(market_id);
CREATE INDEX IF NOT EXISTS idx_markets_organization_id ON public.markets(organization_id);
CREATE INDEX IF NOT EXISTS idx_channels_segment_id ON public.channels(segment_id);
CREATE INDEX IF NOT EXISTS idx_outlets_channel_id ON public.outlets(channel_id);
CREATE INDEX IF NOT EXISTS idx_skus_anchor_sku_id ON public.skus(anchor_sku_id);
