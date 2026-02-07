-- Add latitude and longitude columns to track where students submit attendance from
ALTER TABLE public.attendance_records 
ADD COLUMN latitude DOUBLE PRECISION,
ADD COLUMN longitude DOUBLE PRECISION;

-- Add comment explaining the columns
COMMENT ON COLUMN public.attendance_records.latitude IS 'GPS latitude of student location when marking attendance';
COMMENT ON COLUMN public.attendance_records.longitude IS 'GPS longitude of student location when marking attendance';
