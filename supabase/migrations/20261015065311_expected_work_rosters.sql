-- Expected-work templates provide recurring attendance and hours expectations
-- without creating synthetic job blocks in the schedule.
CREATE TABLE public.expected_work_rosters (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(trim(name)) > 0),
  start_date date NOT NULL,
  repeat_every_weeks integer NOT NULL CHECK (repeat_every_weeks BETWEEN 1 AND 52),
  week_patterns jsonb NOT NULL CHECK (
    jsonb_typeof(week_patterns) = 'array'
    AND jsonb_array_length(week_patterns) = repeat_every_weeks
  ),
  default_start_time time NOT NULL DEFAULT '08:00',
  default_end_time time NOT NULL DEFAULT '16:00',
  week_shift_times jsonb CHECK (
    week_shift_times IS NULL OR (
      jsonb_typeof(week_shift_times) = 'array'
      AND jsonb_array_length(week_shift_times) = repeat_every_weeks
    )
  ),
  shift_hours numeric NOT NULL CHECK (
    shift_hours > 0
    AND shift_hours <= 24
  ),
  technician_ids jsonb NOT NULL CHECK (
    jsonb_typeof(technician_ids) = 'array'
    AND jsonb_array_length(technician_ids) > 0
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (EXTRACT(ISODOW FROM start_date) = 1),
  UNIQUE (id, company_id)
);

CREATE INDEX expected_work_rosters_company_start_idx
  ON public.expected_work_rosters (company_id, start_date);

ALTER TABLE public.expected_work_rosters ENABLE ROW LEVEL SECURITY;
CREATE POLICY expected_work_rosters_tenant_policy
  ON public.expected_work_rosters
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expected_work_rosters TO authenticated;

CREATE TABLE public.expected_work_roster_dismissals (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  roster_id text NOT NULL,
  technician_id text NOT NULL,
  date date NOT NULL,
  reason text NOT NULL CHECK (length(trim(reason)) > 0),
  dismissed_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (roster_id, technician_id, date),
  FOREIGN KEY (roster_id, company_id)
    REFERENCES public.expected_work_rosters(id, company_id)
    ON DELETE CASCADE
);

CREATE INDEX expected_work_roster_dismissals_company_date_idx
  ON public.expected_work_roster_dismissals (company_id, date);

ALTER TABLE public.expected_work_roster_dismissals ENABLE ROW LEVEL SECURITY;
CREATE POLICY expected_work_roster_dismissals_tenant_policy
  ON public.expected_work_roster_dismissals
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expected_work_roster_dismissals TO authenticated;