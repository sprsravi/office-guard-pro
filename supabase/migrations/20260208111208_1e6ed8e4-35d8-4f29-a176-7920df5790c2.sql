
-- Departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read departments" ON public.departments
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert departments" ON public.departments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update departments" ON public.departments
  FOR UPDATE USING (true);

-- Visit purposes table
CREATE TABLE public.visit_purposes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.visit_purposes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read purposes" ON public.visit_purposes
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert purposes" ON public.visit_purposes
  FOR INSERT WITH CHECK (true);

-- Hosts table (employees who receive visitors)
CREATE TABLE public.hosts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  department TEXT,
  designation TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read hosts" ON public.hosts
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert hosts" ON public.hosts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update hosts" ON public.hosts
  FOR UPDATE USING (true);

-- Visitors table (main visitor log with all details inline)
CREATE TABLE public.visitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  purpose TEXT NOT NULL DEFAULT 'Business Meeting',
  host_name TEXT NOT NULL,
  host_department TEXT,
  badge_number TEXT,
  photo_url TEXT,
  id_proof_type TEXT,
  id_proof_number TEXT,
  vehicle_number TEXT,
  has_laptop BOOLEAN NOT NULL DEFAULT false,
  laptop_make TEXT,
  laptop_model TEXT,
  laptop_serial TEXT,
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  check_out_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'checked_in' CHECK (status IN ('checked_in', 'checked_out', 'pre_registered')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read visitors" ON public.visitors
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert visitors" ON public.visitors
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update visitors" ON public.visitors
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete visitors" ON public.visitors
  FOR DELETE USING (true);

-- Create indexes for performance
CREATE INDEX idx_visitors_status ON public.visitors(status);
CREATE INDEX idx_visitors_check_in_time ON public.visitors(check_in_time);
CREATE INDEX idx_visitors_status_date ON public.visitors(status, check_in_time);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_visitors_updated_at
  BEFORE UPDATE ON public.visitors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Settings table
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read settings" ON public.settings
  FOR SELECT USING (true);

CREATE POLICY "Allow public update settings" ON public.settings
  FOR UPDATE USING (true);

CREATE POLICY "Allow public insert settings" ON public.settings
  FOR INSERT WITH CHECK (true);
