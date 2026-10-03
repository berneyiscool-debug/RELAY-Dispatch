-- =====================================================================
-- PORTAL PASSCODE PERSISTENCE
-- =====================================================================
-- The customer and contractor portals ask for a 4-to-6 digit security PIN on
-- the first visit and store it as customers/contractors.portalPasscode.
-- No matching column ever existed, so denormalizeRecord() stripped the field
-- before every cloud write: the write "succeeded" without the PIN and the next
-- load saw a passcode-less record, making every visit look like a first visit.
-- Add the column the store has always been trying to write. Idempotent.

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS portal_passcode text;

ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS portal_passcode text;
