-- Migration 29: Communication Settings (WhatsApp & Email)

ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS communication_settings JSONB DEFAULT '{
  "wa_enabled": false,
  "wa_phone_number": "",
  "wa_phone_id": "",
  "wa_access_token": "",
  "email_enabled": true,
  "email_provider": "default",
  "smtp_settings": {
    "host": "",
    "port": 587,
    "user": "",
    "pass": ""
  }
}'::jsonb;
