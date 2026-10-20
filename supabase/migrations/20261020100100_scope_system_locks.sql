-- =====================================================================
-- RELAY - scope acquire_lock / release_lock to the caller's company
-- =====================================================================
-- Both are SECURITY DEFINER and executable by every signed-in user, and they
-- trusted two things the caller sends: p_user_id and a global p_lock_name.
-- The client (src/utils/maintenanceEngine.js) takes 'maintenance_engine'
-- for every tenant, so:
--   - any signed-in user of any company could hold 'maintenance_engine'
--     (re-taking it every 300 s) and stop every other company's
--     maintenance engine from running;
--   - one company's run also made every other company skip that window;
--   - passing someone else's p_user_id released their lock.
--
-- For a signed-in caller the lock is now stored under
-- '<company_id>:<lock_name>' and p_user_id must be the caller. Service-role
-- and SQL-editor callers (auth.uid() IS NULL) keep the raw lock name. The
-- client is unchanged: it already passes its own user id.

CREATE OR REPLACE FUNCTION public.acquire_lock(
    p_lock_name TEXT,
    p_user_id TEXT,
    p_timeout_seconds INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_locked BOOLEAN;
    v_timeout INTEGER := LEAST(GREATEST(COALESCE(p_timeout_seconds, 60), 1), 300);
    v_lock_name TEXT := p_lock_name;
    v_company UUID;
BEGIN
    IF auth.uid() IS NOT NULL THEN
        IF p_user_id IS DISTINCT FROM auth.uid()::text THEN
            RAISE EXCEPTION 'You can only take a lock for yourself.'
              USING ERRCODE = 'insufficient_privilege';
        END IF;
        v_company := public.get_user_company_id(auth.uid());
        IF v_company IS NULL THEN
            RAISE EXCEPTION 'No company is linked to your account yet.'
              USING ERRCODE = 'insufficient_privilege';
        END IF;
        v_lock_name := v_company::text || ':' || p_lock_name;
    END IF;

    INSERT INTO public.system_locks (lock_name, locked_at, locked_by, expires_at)
    VALUES (v_lock_name, NOW(), p_user_id, NOW() + (v_timeout || ' seconds')::INTERVAL)
    ON CONFLICT (lock_name) DO UPDATE
    SET locked_at = NOW(),
        locked_by = p_user_id,
        expires_at = NOW() + (v_timeout || ' seconds')::INTERVAL
    WHERE public.system_locks.locked_by IS NULL
       OR public.system_locks.expires_at < NOW();

    SELECT (locked_by = p_user_id) INTO v_locked
    FROM public.system_locks
    WHERE lock_name = v_lock_name;

    RETURN COALESCE(v_locked, FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION public.release_lock(
    p_lock_name TEXT,
    p_user_id TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_lock_name TEXT := p_lock_name;
BEGIN
    IF auth.uid() IS NOT NULL THEN
        IF p_user_id IS DISTINCT FROM auth.uid()::text THEN
            RAISE EXCEPTION 'You can only release your own lock.'
              USING ERRCODE = 'insufficient_privilege';
        END IF;
        v_lock_name := COALESCE(public.get_user_company_id(auth.uid())::text, '') || ':' || p_lock_name;
    END IF;

    UPDATE public.system_locks
    SET locked_at = NULL,
        locked_by = NULL,
        expires_at = NULL
    WHERE lock_name = v_lock_name
      AND locked_by = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.acquire_lock(text, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.acquire_lock(text, text, integer) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.release_lock(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.release_lock(text, text) TO authenticated, service_role;
