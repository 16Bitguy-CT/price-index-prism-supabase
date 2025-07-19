
-- Create admin audit log table
CREATE TABLE public.admin_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('create_user', 'update_user', 'activate_user', 'deactivate_user', 'change_role', 'delete_user', 'bulk_operation')),
  details JSONB NOT NULL DEFAULT '{}',
  reason TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only super users can view audit logs
CREATE POLICY "Super users can view audit logs" ON public.admin_audit_log
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() 
        AND up.role = 'super_user' 
        AND up.is_active = true
    )
  );

-- Admin users can insert audit logs (system function)
CREATE POLICY "Admin users can insert audit logs" ON public.admin_audit_log
  FOR INSERT 
  WITH CHECK (
    admin_user_id IN (
      SELECT user_id FROM public.user_profiles 
      WHERE user_id = auth.uid() 
        AND role IN ('super_user', 'power_user', 'market_admin')
        AND is_active = true
    )
  );

-- Create trigger to automatically set admin_user_id
CREATE OR REPLACE FUNCTION public.set_admin_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the current user's profile ID
  SELECT user_id INTO NEW.admin_user_id
  FROM public.user_profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  -- Set IP address if available
  BEGIN
    NEW.ip_address := inet(current_setting('request.headers')::json->>'x-forwarded-for');
  EXCEPTION
    WHEN OTHERS THEN
      NEW.ip_address := NULL;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_admin_user_id_trigger
  BEFORE INSERT ON public.admin_audit_log
  FOR EACH ROW EXECUTE FUNCTION public.set_admin_user_id();

-- Add updated_at trigger
CREATE TRIGGER update_admin_audit_log_updated_at
  BEFORE UPDATE ON public.admin_audit_log
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_audit_log_admin_user ON public.admin_audit_log(admin_user_id);
CREATE INDEX idx_admin_audit_log_target_user ON public.admin_audit_log(target_user_id);
CREATE INDEX idx_admin_audit_log_action ON public.admin_audit_log(action);
