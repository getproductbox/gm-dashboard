-- Karaoke Booth Holds - resource reservation with expiration
-- This migration adds a holds table and conflict validation to support
-- temporary reservation of karaoke booth time slots during checkout.

-- Enable required extensions (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS btree_gist; -- useful for exclusion constraints if added later

-- Holds table to reserve booth time slots temporarily
CREATE TABLE IF NOT EXISTS public.karaoke_booth_holds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Resource and placement
    booth_id UUID NOT NULL REFERENCES public.karaoke_booths(id) ON DELETE CASCADE,
    venue TEXT NOT NULL CHECK (venue IN ('manor', 'hippie')),
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    -- Client/session association (widget/browser session or server cart id)
    session_id TEXT NOT NULL,
    customer_email TEXT,

    -- Lifecycle
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','released','consumed','expired')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
    booking_id UUID REFERENCES public.bookings(id),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_kbh_booth_date ON public.karaoke_booth_holds(booth_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_kbh_status_expires ON public.karaoke_booth_holds(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_kbh_session ON public.karaoke_booth_holds(session_id);

-- Updated_at trigger (reuses existing function public.handle_updated_at)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'handle_karaoke_booth_holds_updated_at'
  ) THEN
    CREATE TRIGGER handle_karaoke_booth_holds_updated_at
      BEFORE UPDATE ON public.karaoke_booth_holds
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END$$;

-- Enable RLS and allow authenticated users to read/write (staff portal) and service role to bypass
ALTER TABLE public.karaoke_booth_holds ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'karaoke_booth_holds' AND policyname = 'Authenticated users full access'
  ) THEN
    CREATE POLICY "Authenticated users full access" ON public.karaoke_booth_holds
      FOR ALL USING (auth.uid() IS NOT NULL)
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END$$;

-- Validate no overlapping active, non-expired holds and no conflict with bookings
CREATE OR REPLACE FUNCTION public.validate_karaoke_hold_conflict()
RETURNS TRIGGER AS $$
DECLARE
  _now TIMESTAMP WITH TIME ZONE := now();
BEGIN
  -- Normalize basic invariants
  IF NEW.end_time <= NEW.start_time THEN
    RAISE EXCEPTION 'end_time must be after start_time';
  END IF;

  -- Only enforce when the hold is active and not already expired
  IF NEW.status = 'active' AND NEW.expires_at > _now THEN
    -- Conflict with existing active, non-expired holds on same booth/date
    IF EXISTS (
      SELECT 1 FROM public.karaoke_booth_holds h
      WHERE h.booth_id = NEW.booth_id
        AND h.booking_date = NEW.booking_date
        AND h.status = 'active'
        AND h.expires_at > _now
        AND h.id IS DISTINCT FROM NEW.id
        AND (NEW.start_time < h.end_time AND NEW.end_time > h.start_time)
    ) THEN
      RAISE EXCEPTION 'Another active hold exists for this booth and time range';
    END IF;

    -- Conflict with existing bookings (anything not cancelled)
    IF EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.karaoke_booth_id = NEW.booth_id
        AND b.booking_date = NEW.booking_date
        AND b.status != 'cancelled'
        AND (NEW.start_time < b.end_time AND NEW.end_time > b.start_time)
    ) THEN
      RAISE EXCEPTION 'An existing booking conflicts with this booth and time range';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'validate_karaoke_hold_conflict_trigger'
  ) THEN
    CREATE TRIGGER validate_karaoke_hold_conflict_trigger
      BEFORE INSERT OR UPDATE ON public.karaoke_booth_holds
      FOR EACH ROW
      EXECUTE FUNCTION public.validate_karaoke_hold_conflict();
  END IF;
END$$;

-- Optional helper: mark expired holds (no-op transactional helper)
-- Note: operational cleanup can be done by job scheduler; logic here is informational only
CREATE OR REPLACE FUNCTION public.karaoke_expire_due_holds()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.karaoke_booth_holds
  SET status = 'expired'
  WHERE status = 'active' AND expires_at <= now();

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;


