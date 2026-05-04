-- Migration 28: System Announcements

CREATE TABLE IF NOT EXISTS public.system_announcements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    message text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid REFERENCES public.users(id)
);

-- RLS policies
ALTER TABLE public.system_announcements ENABLE ROW LEVEL SECURITY;

-- Anyone can read active announcements
CREATE POLICY "Anyone can view active announcements"
    ON public.system_announcements FOR SELECT
    USING (is_active = true);

-- Only superadmins can manage announcements
CREATE POLICY "Superadmins can manage announcements"
    ON public.system_announcements FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.is_superadmin = true
        )
    );
