
-- Add approval workflow fields to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN approved_by_user_id UUID REFERENCES public.user_profiles(id),
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN rejection_reason TEXT;

-- Add email domain validation to organizations table
ALTER TABLE public.organizations 
ADD COLUMN allowed_email_domains JSONB DEFAULT '[]'::jsonb,
ADD COLUMN requires_approval BOOLEAN DEFAULT true;

-- Update existing user profiles to be approved (so current users aren't locked out)
UPDATE public.user_profiles 
SET approval_status = 'approved', 
    approved_at = now() 
WHERE approval_status = 'pending';

-- Create index for faster domain lookups
CREATE INDEX idx_organizations_allowed_domains ON public.organizations USING GIN (allowed_email_domains);

-- Create function to check if email domain is allowed for an organization
CREATE OR REPLACE FUNCTION public.is_email_domain_allowed(email_address TEXT, org_id UUID)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to find organization by email domain
CREATE OR REPLACE FUNCTION public.get_organization_by_email_domain(email_address TEXT)
RETURNS UUID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update default data for Angle Orange organization
UPDATE public.organizations 
SET allowed_email_domains = '["angleorange.com", "*.angleorange.com"]'::jsonb,
    requires_approval = false
WHERE name = 'Angle Orange';
