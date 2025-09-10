CREATE TABLE IF NOT EXISTS lesson_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  content TEXT NOT NULL,
  lesson_date DATE NOT NULL,
  duration_minutes INTEGER DEFAULT 90,
  next_topic TEXT,
  homework TEXT,
  student_progress TEXT CHECK (student_progress IN ('excellent', 'good', 'average', 'needs_improvement')) DEFAULT 'good',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE lesson_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Tenant users can view their lesson notes" ON lesson_notes;
CREATE POLICY "Tenant users can view their lesson notes"
ON lesson_notes FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Tenant users can insert their lesson notes" ON lesson_notes;
CREATE POLICY "Tenant users can insert their lesson notes"
ON lesson_notes FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Tenant users can update their lesson notes" ON lesson_notes;
CREATE POLICY "Tenant users can update their lesson notes"
ON lesson_notes FOR UPDATE
USING (
  tenant_id IN (
    SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Tenant users can delete their lesson notes" ON lesson_notes;
CREATE POLICY "Tenant users can delete their lesson notes"
ON lesson_notes FOR DELETE
USING (
  tenant_id IN (
    SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lesson_notes_tenant_id ON lesson_notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_student_id ON lesson_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_lesson_date ON lesson_notes(lesson_date);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE lesson_notes;