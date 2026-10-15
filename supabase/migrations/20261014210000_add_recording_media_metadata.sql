ALTER TABLE public.recordings
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS source_platform TEXT;
