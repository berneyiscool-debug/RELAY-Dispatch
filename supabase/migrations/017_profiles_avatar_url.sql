-- v1.3 Avatars: per-user profile photo.
-- Stored as a data-URL (base64) string so it syncs to every device the user
-- signs in on, instead of living only in that device's localStorage.
alter table profiles
  add column if not exists avatar_url text;
