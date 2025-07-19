-- Add emergency setup policy for organizations
-- This allows any authenticated user to view organizations for emergency profile setup
-- The app layer already restricts this to @angleorange.com domains

CREATE POLICY "emergency_setup_view_organizations" 
ON public.organizations 
FOR SELECT 
TO authenticated 
USING (is_active = true);

-- Make this policy less restrictive than the existing one by giving it higher priority
-- The existing policy will still work for users with profiles