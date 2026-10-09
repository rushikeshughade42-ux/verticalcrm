-- TradeFlow Database Schema (Supabase PostgreSQL 15+)
-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  owner_name TEXT,
  trade_type TEXT NOT NULL, -- 'Plumbing', 'Electrical', 'HVAC / Air Conditioning', 'Carpentry', 'Cleaning Services', 'Home Technology'
  google_review_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. QUOTE REFERENCE DATA (Pricing catalog / AI knowledge base)
CREATE TABLE IF NOT EXISTS public.quote_reference_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  base_labor_rate NUMERIC NOT NULL DEFAULT 0,
  material_costs JSONB DEFAULT '[]'::jsonb,
  notes_for_ai TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on Quote Reference Data
ALTER TABLE public.quote_reference_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own quote reference data" ON public.quote_reference_data
  FOR ALL USING (auth.uid() = profile_id);

-- 3. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_no TEXT NOT NULL,
  email TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on Customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own customers" ON public.customers
  FOR ALL USING (auth.uid() = profile_id);

-- 4. JOBS TABLE
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  title TEXT,
  problem TEXT NOT NULL,
  work_status TEXT NOT NULL DEFAULT 'Quoted', -- 'Quoted', 'Scheduled', 'Done'
  payment_status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'Paid'
  amount NUMERIC DEFAULT 0,
  date_of_work DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on Jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own jobs" ON public.jobs
  FOR ALL USING (auth.uid() = profile_id);

-- 5. QUOTES TABLE
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  public_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  is_accepted BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'Draft', -- 'Draft', 'Sent', 'Accepted'
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on Quotes
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage quotes for their jobs" ON public.quotes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = quotes.job_id
      AND jobs.profile_id = auth.uid()
    )
  );

-- Public read for tokenized customer quote links
CREATE POLICY "Public token access for quotes" ON public.quotes
  FOR SELECT USING (true);
CREATE POLICY "Public token acceptance update for quotes" ON public.quotes
  FOR UPDATE USING (true);

-- 6. INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_link TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on Invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage invoices for their jobs" ON public.invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = invoices.job_id
      AND jobs.profile_id = auth.uid()
    )
  );

-- Public read for customer invoice views
CREATE POLICY "Public read access for invoices" ON public.invoices
  FOR SELECT USING (true);

-- 7. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  review_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  rating INT2 CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  status TEXT DEFAULT 'Pending', -- 'Pending', 'Completed'
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view reviews for their jobs" ON public.reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = reviews.job_id
      AND jobs.profile_id = auth.uid()
    )
  );

-- Public submission policy for review links
CREATE POLICY "Public review token lookup and update" ON public.reviews
  FOR ALL USING (true);

-- AUTOMATIC PROFILE CREATION TRIGGER FOR SUPABASE AUTH
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, business_name, owner_name, trade_type, google_review_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'business_name', 'My Trade Business'),
    COALESCE(new.raw_user_meta_data->>'owner_name', 'Business Owner'),
    COALESCE(new.raw_user_meta_data->>'trade_type', 'Plumbing'),
    COALESCE(new.raw_user_meta_data->>'google_review_url', 'https://maps.google.com')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
