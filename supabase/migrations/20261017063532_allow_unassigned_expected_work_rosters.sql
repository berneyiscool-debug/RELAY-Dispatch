ALTER TABLE public.expected_work_rosters
  DROP CONSTRAINT expected_work_rosters_technician_ids_check,
  ADD CONSTRAINT expected_work_rosters_technician_ids_array_check
    CHECK (jsonb_typeof(technician_ids) = 'array');