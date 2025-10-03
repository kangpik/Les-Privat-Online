-- Add super admin support
CREATE TABLE IF NOT EXISTS public.super_admins (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    created_by uuid REFERENCES auth.users(id)
);

-- Add external_url and is_external columns to learning_materials if not exists
ALTER TABLE public.learning_materials 
ADD COLUMN IF NOT EXISTS external_url text,
ADD COLUMN IF NOT EXISTS is_external boolean DEFAULT false;

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.super_admins 
        WHERE user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get system statistics
CREATE OR REPLACE FUNCTION public.get_system_stats()
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    -- Only allow super admins to access this function
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Access denied. Super admin privileges required.';
    END IF;

    SELECT json_build_object(
        'total_tenants', (SELECT COUNT(*) FROM public.tenants),
        'active_tenants', (SELECT COUNT(*) FROM public.tenants WHERE is_active = true),
        'total_students', (SELECT COUNT(*) FROM public.students WHERE is_active = true),
        'total_payments', (SELECT COALESCE(SUM(amount), 0) FROM public.payments),
        'total_schedules', (SELECT COUNT(*) FROM public.schedules),
        'total_materials', (SELECT COUNT(*) FROM public.learning_materials)
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for super_admins table
alter publication supabase_realtime add table super_admins;

-- Insert a default super admin (you can change this email)
-- INSERT INTO auth.users (email, email_confirmed_at, created_at, updated_at)
-- VALUES ('superadmin@example.com', now(), now(), now())
-- ON CONFLICT (email) DO NOTHING;

-- INSERT INTO public.super_admins (user_id)
-- SELECT id FROM auth.users WHERE email = 'superadmin@example.com'
-- ON CONFLICT (user_id) DO NOTHING;