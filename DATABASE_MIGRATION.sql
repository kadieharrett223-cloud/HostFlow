-- Database migration for HostFlow waitlist management system
-- Add support for ready status and tracking no-show customers

-- 1. Ensure parties table has all required columns
-- If running manually in Supabase, execute:

-- ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS phone TEXT;
-- ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS ready_at TIMESTAMP WITH TIME ZONE;

-- Then update the status check constraint to include new statuses:
-- ALTER TABLE public.parties DROP CONSTRAINT IF EXISTS parties_status_check;
-- ALTER TABLE public.parties ADD CONSTRAINT parties_status_check 
--   CHECK (status IN ('waiting', 'ready', 'seated', 'no_show'));

-- 2. Create index for faster queries
-- CREATE INDEX IF NOT EXISTS parties_status_restaurant_idx ON public.parties(status, restaurant_slug);
-- CREATE INDEX IF NOT EXISTS parties_ready_at_idx ON public.parties(ready_at) WHERE status = 'ready';

-- Schema notes:
-- - phone: Customer phone number for SMS notifications
-- - ready_at: Timestamp when table was marked as ready (used for no-show detection after 5 mins)
-- - status: Now supports 'waiting', 'ready', 'seated', 'no_show'
