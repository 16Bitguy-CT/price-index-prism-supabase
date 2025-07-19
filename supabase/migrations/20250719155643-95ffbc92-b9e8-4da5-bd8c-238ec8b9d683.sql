-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('representative', 'market_admin', 'power_user', 'super_user');

-- Create organizations table
CREATE TABLE public.organizations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    brand_name TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    logo_url TEXT,
    primary_domain TEXT,
    third_party_domain TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create markets table
CREATE TABLE public.markets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    currency TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create channel_segments table
CREATE TABLE public.channel_segments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
    segment_type TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create channels table
CREATE TABLE public.channels (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
    segment_id UUID NOT NULL REFERENCES public.channel_segments(id) ON DELETE CASCADE,
    channel_type TEXT NOT NULL,
    description TEXT,
    price_index_multiplier NUMERIC(5,2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create outlets table
CREATE TABLE public.outlets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    outlet_name TEXT NOT NULL,
    address TEXT,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create skus table
CREATE TABLE public.skus (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    barcode TEXT,
    product_name TEXT NOT NULL,
    volume_ml INTEGER,
    category TEXT,
    pack_format TEXT,
    anchor_sku_id UUID REFERENCES public.skus(id) ON DELETE SET NULL,
    channel_segment TEXT,
    target_price_index NUMERIC(5,2),
    min_price_index NUMERIC(5,2),
    max_price_index NUMERIC(5,2),
    target_shelf_share NUMERIC(5,2),
    shelf_position TEXT,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sku_price_anchor table
CREATE TABLE public.sku_price_anchor (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
    channel_segment TEXT NOT NULL,
    anchor_sku_id UUID NOT NULL REFERENCES public.skus(id) ON DELETE CASCADE,
    anchor_brand TEXT NOT NULL,
    anchor_product_name TEXT NOT NULL,
    anchor_volume_ml INTEGER,
    anchor_pack_format TEXT,
    created_by_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create price_capture_log table
CREATE TABLE public.price_capture_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sku_id UUID NOT NULL REFERENCES public.skus(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
    is_anchor BOOLEAN NOT NULL DEFAULT false,
    captured_price NUMERIC(10,2) NOT NULL,
    captured_volume_ml INTEGER,
    captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE public.user_profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    market_id UUID REFERENCES public.markets(id) ON DELETE SET NULL,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    role public.user_role NOT NULL DEFAULT 'representative',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_markets_organization_id ON public.markets(organization_id);
CREATE INDEX idx_channel_segments_organization_market ON public.channel_segments(organization_id, market_id);
CREATE INDEX idx_channels_organization_market ON public.channels(organization_id, market_id);
CREATE INDEX idx_outlets_organization_channel ON public.outlets(organization_id, channel_id);
CREATE INDEX idx_skus_organization_market ON public.skus(organization_id, market_id);
CREATE INDEX idx_skus_barcode ON public.skus(barcode);
CREATE INDEX idx_price_capture_log_sku_org_market ON public.price_capture_log(sku_id, organization_id, market_id);
CREATE INDEX idx_price_capture_log_captured_at ON public.price_capture_log(captured_at);
CREATE INDEX idx_user_profiles_organization_market ON public.user_profiles(organization_id, market_id);
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_markets_updated_at BEFORE UPDATE ON public.markets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_channel_segments_updated_at BEFORE UPDATE ON public.channel_segments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON public.channels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_outlets_updated_at BEFORE UPDATE ON public.outlets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_skus_updated_at BEFORE UPDATE ON public.skus FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sku_price_anchor_updated_at BEFORE UPDATE ON public.sku_price_anchor FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_price_capture_log_updated_at BEFORE UPDATE ON public.price_capture_log FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper function to get current user profile
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS public.user_profiles
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT * FROM public.user_profiles WHERE user_id = auth.uid();
$$;

-- Helper function to check if user has role or higher
CREATE OR REPLACE FUNCTION public.user_has_role_or_higher(required_role public.user_role)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() 
        AND is_active = true
        AND (
            (role = 'super_user') OR
            (role = 'power_user' AND required_role IN ('power_user', 'market_admin', 'representative')) OR
            (role = 'market_admin' AND required_role IN ('market_admin', 'representative')) OR
            (role = 'representative' AND required_role = 'representative')
        )
    );
$$;

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sku_price_anchor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_capture_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for organizations
CREATE POLICY "Users can view their organization" ON public.organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM public.user_profiles WHERE user_id = auth.uid() AND is_active = true)
    );

CREATE POLICY "Super users can insert organizations" ON public.organizations
    FOR INSERT WITH CHECK (public.user_has_role_or_higher('super_user'::public.user_role));

CREATE POLICY "Super users can update organizations" ON public.organizations
    FOR UPDATE USING (public.user_has_role_or_higher('super_user'::public.user_role));

-- RLS policies for markets
CREATE POLICY "Users can view markets in their organization" ON public.markets
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM public.user_profiles WHERE user_id = auth.uid() AND is_active = true)
    );

CREATE POLICY "Power users can insert markets" ON public.markets
    FOR INSERT WITH CHECK (
        public.user_has_role_or_higher('power_user'::public.user_role) AND
        organization_id IN (SELECT organization_id FROM public.user_profiles WHERE user_id = auth.uid() AND is_active = true)
    );

CREATE POLICY "Power users can update markets" ON public.markets
    FOR UPDATE USING (
        public.user_has_role_or_higher('power_user'::public.user_role) AND
        organization_id IN (SELECT organization_id FROM public.user_profiles WHERE user_id = auth.uid() AND is_active = true)
    );

-- RLS policies for channel_segments
CREATE POLICY "Users can view channel segments in their org/market" ON public.channel_segments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.is_active = true
            AND up.organization_id = channel_segments.organization_id
            AND (up.market_id = channel_segments.market_id OR up.market_id IS NULL)
        )
    );

CREATE POLICY "Market admins can manage channel segments" ON public.channel_segments
    FOR ALL USING (
        public.user_has_role_or_higher('market_admin'::public.user_role) AND
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.is_active = true
            AND up.organization_id = channel_segments.organization_id
            AND (up.market_id = channel_segments.market_id OR up.market_id IS NULL)
        )
    );

-- RLS policies for channels
CREATE POLICY "Users can view channels in their org/market" ON public.channels
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.is_active = true
            AND up.organization_id = channels.organization_id
            AND (up.market_id = channels.market_id OR up.market_id IS NULL)
        )
    );

CREATE POLICY "Market admins can manage channels" ON public.channels
    FOR ALL USING (
        public.user_has_role_or_higher('market_admin'::public.user_role) AND
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.is_active = true
            AND up.organization_id = channels.organization_id
            AND (up.market_id = channels.market_id OR up.market_id IS NULL)
        )
    );

-- RLS policies for outlets
CREATE POLICY "Users can view outlets in their org" ON public.outlets
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM public.user_profiles WHERE user_id = auth.uid() AND is_active = true)
    );

CREATE POLICY "Market admins can manage outlets" ON public.outlets
    FOR ALL USING (
        public.user_has_role_or_higher('market_admin'::public.user_role) AND
        organization_id IN (SELECT organization_id FROM public.user_profiles WHERE user_id = auth.uid() AND is_active = true)
    );

-- RLS policies for skus
CREATE POLICY "Users can view SKUs in their org/market" ON public.skus
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.is_active = true
            AND up.organization_id = skus.organization_id
            AND (up.market_id = skus.market_id OR up.market_id IS NULL)
        )
    );

CREATE POLICY "Market admins can manage SKUs" ON public.skus
    FOR ALL USING (
        public.user_has_role_or_higher('market_admin'::public.user_role) AND
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.is_active = true
            AND up.organization_id = skus.organization_id
            AND (up.market_id = skus.market_id OR up.market_id IS NULL)
        )
    );

-- RLS policies for sku_price_anchor
CREATE POLICY "Users can view price anchors in their org/market" ON public.sku_price_anchor
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.is_active = true
            AND up.organization_id = sku_price_anchor.organization_id
            AND (up.market_id = sku_price_anchor.market_id OR up.market_id IS NULL)
        )
    );

CREATE POLICY "Market admins can manage price anchors" ON public.sku_price_anchor
    FOR ALL USING (
        public.user_has_role_or_higher('market_admin'::public.user_role) AND
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.is_active = true
            AND up.organization_id = sku_price_anchor.organization_id
            AND (up.market_id = sku_price_anchor.market_id OR up.market_id IS NULL)
        )
    );

-- RLS policies for price_capture_log
CREATE POLICY "Users can view price captures in their org/market" ON public.price_capture_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.is_active = true
            AND up.organization_id = price_capture_log.organization_id
            AND (up.market_id = price_capture_log.market_id OR up.market_id IS NULL)
        )
    );

CREATE POLICY "Representatives can insert price captures" ON public.price_capture_log
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.is_active = true
            AND up.organization_id = price_capture_log.organization_id
            AND (up.market_id = price_capture_log.market_id OR up.market_id IS NULL)
        )
    );

CREATE POLICY "Market admins can manage price captures" ON public.price_capture_log
    FOR ALL USING (
        public.user_has_role_or_higher('market_admin'::public.user_role) AND
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.is_active = true
            AND up.organization_id = price_capture_log.organization_id
            AND (up.market_id = price_capture_log.market_id OR up.market_id IS NULL)
        )
    );

-- RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Market admins can view profiles in their org/market" ON public.user_profiles
    FOR SELECT USING (
        public.user_has_role_or_higher('market_admin'::public.user_role) AND
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.is_active = true
            AND up.organization_id = user_profiles.organization_id
            AND (up.market_id = user_profiles.market_id OR up.market_id IS NULL OR user_profiles.market_id IS NULL)
        )
    );

CREATE POLICY "Super users can manage all profiles" ON public.user_profiles
    FOR ALL USING (public.user_has_role_or_higher('super_user'::public.user_role));

CREATE POLICY "Market admins can manage profiles in their scope" ON public.user_profiles
    FOR ALL USING (
        public.user_has_role_or_higher('market_admin'::public.user_role) AND
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.is_active = true
            AND up.organization_id = user_profiles.organization_id
            AND (up.market_id = user_profiles.market_id OR up.market_id IS NULL OR user_profiles.market_id IS NULL)
        )
    );