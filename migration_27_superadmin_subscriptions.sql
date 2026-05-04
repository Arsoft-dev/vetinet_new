-- Migration 27: Super Admin and Subscriptions

-- 1. Add is_superadmin to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_superadmin boolean DEFAULT false;

-- 2. Add subscription fields to clinics table
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'Básico';
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active'; -- 'active', 'suspended'
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS subscription_end_date timestamp with time zone;

-- Optional: Create an initial superadmin (You can run this manually replacing the email with your actual email)
UPDATE public.users SET is_superadmin = true WHERE email = 'abrahanruiz1@gmail.com';