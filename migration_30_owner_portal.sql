-- Migration 30: Owner Portal Access

ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT gen_random_uuid();
CREATE INDEX IF NOT EXISTS idx_pets_share_token ON public.pets(share_token);
