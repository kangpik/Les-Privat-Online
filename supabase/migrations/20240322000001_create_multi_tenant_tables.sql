CREATE TABLE IF NOT EXISTS public.tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    domain text UNIQUE,
    owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    settings jsonb DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.students (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    name text NOT NULL,
    email text,
    phone text,
    grade text,
    subject text,
    avatar_url text,
    parent_name text,
    parent_phone text,
    address text,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.schedules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
    subject text NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    location text,
    meeting_type text DEFAULT 'offline',
    meeting_url text,
    status text DEFAULT 'scheduled',
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
    amount decimal(10,2) NOT NULL,
    payment_date date NOT NULL,
    due_date date,
    status text DEFAULT 'pending',
    payment_method text,
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.learning_materials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    file_url text,
    file_type text,
    file_size bigint,
    subject text,
    grade_level text,
    tags text[],
    is_public boolean DEFAULT false,
    download_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.tenant_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    role text DEFAULT 'teacher',
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(tenant_id, user_id)
);

alter publication supabase_realtime add table tenants;
alter publication supabase_realtime add table students;
alter publication supabase_realtime add table schedules;
alter publication supabase_realtime add table payments;
alter publication supabase_realtime add table learning_materials;
alter publication supabase_realtime add table tenant_users;

CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid AS $$
DECLARE
    tenant_uuid uuid;
BEGIN
    SELECT tenant_id INTO tenant_uuid
    FROM public.tenant_users
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1;
    
    RETURN tenant_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.create_tenant_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_tenant_id uuid;
BEGIN
    INSERT INTO public.tenants (name, owner_id)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email) || '''s Tutoring', NEW.id)
    RETURNING id INTO new_tenant_id;
    
    INSERT INTO public.tenant_users (tenant_id, user_id, role)
    VALUES (new_tenant_id, NEW.id, 'owner');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_tenant ON auth.users;
CREATE TRIGGER on_auth_user_created_tenant
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.create_tenant_for_new_user();