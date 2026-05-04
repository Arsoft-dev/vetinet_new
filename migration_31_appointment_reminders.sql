-- Migration 31: Appointment Reminders Tracking
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE;

-- Index to quickly find appointments that need reminders
CREATE INDEX IF NOT EXISTS idx_appointments_reminder_check 
ON public.appointments (start_time, reminder_sent) 
WHERE status = 'scheduled' AND reminder_sent = false;
