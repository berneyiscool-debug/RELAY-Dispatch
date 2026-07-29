-- Create system_locks table
CREATE TABLE IF NOT EXISTS public.system_locks (
    lock_name TEXT PRIMARY KEY,
    locked_at TIMESTAMPTZ,
    locked_by TEXT,
    expires_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.system_locks ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read
CREATE POLICY "Allow read access to all authenticated users on system_locks"
    ON public.system_locks FOR SELECT
    TO authenticated
    USING (true);

-- Allow anyone to write
CREATE POLICY "Allow write access to all authenticated users on system_locks"
    ON public.system_locks FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create RPC to acquire lock
CREATE OR REPLACE FUNCTION public.acquire_lock(
    p_lock_name TEXT,
    p_user_id TEXT,
    p_timeout_seconds INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_locked BOOLEAN;
BEGIN
    -- Try to insert a new lock row or update an existing one if it's expired or unlocked
    INSERT INTO public.system_locks (lock_name, locked_at, locked_by, expires_at)
    VALUES (
        p_lock_name,
        NOW(),
        p_user_id,
        NOW() + (p_timeout_seconds || ' seconds')::INTERVAL
    )
    ON CONFLICT (lock_name) DO UPDATE
    SET 
        locked_at = NOW(),
        locked_by = p_user_id,
        expires_at = NOW() + (p_timeout_seconds || ' seconds')::INTERVAL
    WHERE 
        public.system_locks.locked_by IS NULL
        OR public.system_locks.expires_at < NOW();

    -- Check if we successfully got the lock
    SELECT (locked_by = p_user_id) INTO v_locked
    FROM public.system_locks
    WHERE lock_name = p_lock_name;

    RETURN COALESCE(v_locked, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC to release lock
CREATE OR REPLACE FUNCTION public.release_lock(
    p_lock_name TEXT,
    p_user_id TEXT
) RETURNS VOID AS $$
BEGIN
    UPDATE public.system_locks
    SET locked_at = NULL,
        locked_by = NULL,
        expires_at = NULL
    WHERE lock_name = p_lock_name
      AND locked_by = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
