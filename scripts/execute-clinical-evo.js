
const { Client } = require('pg');

// Use DATABASE_URL from environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ ERROR: DATABASE_URL not found in environment.");
    process.exit(1);
}

async function runMigration() {
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected to Supabase DB. Applying Clinical Evolution Migration...");

        const sql = `
-- 1. ADD FIELDS TO PETS (Anamnesis & Color)
ALTER TABLE public.pets 
ADD COLUMN IF NOT EXISTS last_deworming_date DATE,
ADD COLUMN IF NOT EXISTS last_deworming_product TEXT,
ADD COLUMN IF NOT EXISTS vaccines_history TEXT,
ADD COLUMN IF NOT EXISTS previous_illnesses TEXT,
ADD COLUMN IF NOT EXISTS previous_treatments TEXT,
ADD COLUMN IF NOT EXISTS evolution_notes TEXT,
ADD COLUMN IF NOT EXISTS nutrition TEXT,
ADD COLUMN IF NOT EXISTS last_heat DATE,
ADD COLUMN IF NOT EXISTS last_birth_date DATE;

-- 2. FIX TYPO AND ADD PHYSICAL EXAM TO MEDICAL_RECORDS
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medical_records' AND column_name='termperature_c') THEN
    ALTER TABLE public.medical_records RENAME COLUMN termperature_c TO temperature_c;
  END IF;
END $$;

ALTER TABLE public.medical_records
ADD COLUMN IF NOT EXISTS respiratory_rate NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS heart_rate NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS pulse TEXT,
ADD COLUMN IF NOT EXISTS tllc TEXT,
ADD COLUMN IF NOT EXISTS lymph_nodes TEXT,
ADD COLUMN IF NOT EXISTS mucosas TEXT,
ADD COLUMN IF NOT EXISTS attitude TEXT,
ADD COLUMN IF NOT EXISTS body_condition TEXT,
ADD COLUMN IF NOT EXISTS hydration_status TEXT,
ADD COLUMN IF NOT EXISTS integumentary_system TEXT,
ADD COLUMN IF NOT EXISTS eyes_system TEXT,
ADD COLUMN IF NOT EXISTS ears_system TEXT,
ADD COLUMN IF NOT EXISTS nose_system TEXT,
ADD COLUMN IF NOT EXISTS digestive_system TEXT,
ADD COLUMN IF NOT EXISTS respiratory_system TEXT,
ADD COLUMN IF NOT EXISTS nervous_system TEXT,
ADD COLUMN IF NOT EXISTS musculoskeletal_system TEXT,
ADD COLUMN IF NOT EXISTS cardiovascular_system TEXT,
ADD COLUMN IF NOT EXISTS genitourinary_system TEXT;

-- 3. NEW MODULE: AGENDA (Appointments)
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Vet
    
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'missed')),
    reason TEXT,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Manage appointments in my clinic" ON public.appointments;
CREATE POLICY "Manage appointments in my clinic" ON public.appointments
    FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()));

-- 4. NEW MODULE: HOSPITALIZATION
CREATE TABLE IF NOT EXISTS public.hospitalizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
    
    entry_date TIMESTAMPTZ DEFAULT NOW(),
    exit_date TIMESTAMPTZ,
    status TEXT DEFAULT 'hospitalized' CHECK (status IN ('hospitalized', 'discharged')),
    reason TEXT,
    treatment_plan TEXT,
    initial_notes TEXT,
    total_cost NUMERIC(12,2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hospital Rounds (Daily Progress)
CREATE TABLE IF NOT EXISTS public.hospital_rounds (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    hospitalization_id UUID REFERENCES public.hospitalizations(id) ON DELETE CASCADE NOT NULL,
    vet_id UUID REFERENCES public.users(id),
    
    round_date TIMESTAMPTZ DEFAULT NOW(),
    evolution TEXT,
    treatment_applied TEXT,
    vitals JSONB DEFAULT '{}'::JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Hospitalization
ALTER TABLE public.hospitalizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Manage hospitalizations in my clinic" ON public.hospitalizations;
CREATE POLICY "Manage hospitalizations in my clinic" ON public.hospitalizations
    FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()));

ALTER TABLE public.hospital_rounds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Manage hospital rounds in my clinic" ON public.hospital_rounds;
CREATE POLICY "Manage hospital rounds in my clinic" ON public.hospital_rounds
    FOR ALL USING (hospitalization_id IN (SELECT id FROM public.hospitalizations WHERE clinic_id IN (SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid())));

-- 5. NEW MODULE: TREATMENT PROTOCOLS (Templates)
CREATE TABLE IF NOT EXISTS public.treatment_protocols (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    items JSONB DEFAULT '[]'::JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.treatment_protocols ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Manage protocols in my clinic" ON public.treatment_protocols;
CREATE POLICY "Manage protocols in my clinic" ON public.treatment_protocols
    FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid()));

-- 6. SEED EXAMPLE PROTOCOLS
INSERT INTO public.treatment_protocols (clinic_id, name, description, items)
SELECT id, 'Protocolo Gastroenteritis', 'Plan estándar para cuadros de vómito y diarrea.', '[{"action": "Ayuno 12h", "note": "Solo agua en pequeñas cantidades"}, {"action": "Dieta blanda", "note": "Pollo hervido con arroz tras el ayuno"}]'::jsonb
FROM public.clinics LIMIT 1;

INSERT INTO public.treatment_protocols (clinic_id, name, description, items)
SELECT id, 'Protocolo Vacunación Anual', 'Esquema de refuerzo para perros adultos.', '[{"action": "Séxtuple (DHPPL)", "note": "Refuerzo anual"}, {"action": "Antirrábica", "note": "Ley obligatoria"}]'::jsonb
FROM public.clinics LIMIT 1;
        `;

        await client.query(sql);
        console.log("Migration successful! ✅");

    } catch (err) {
        console.error("Migration failed ❌:", err);
    } finally {
        await client.end();
    }
}

runMigration();
