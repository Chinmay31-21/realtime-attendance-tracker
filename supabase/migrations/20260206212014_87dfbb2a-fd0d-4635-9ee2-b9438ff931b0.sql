-- Create enum for room numbers
CREATE TYPE room_type AS ENUM ('008', '002', '103', '105');

-- Create admin profiles table
CREATE TABLE public.admin_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sessions table for TPO sessions
CREATE TABLE public.tpo_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_code TEXT NOT NULL UNIQUE,
  network_token TEXT NOT NULL,
  session_name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance records table
CREATE TABLE public.attendance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.tpo_sessions(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  uid TEXT NOT NULL,
  branch TEXT NOT NULL,
  division TEXT NOT NULL,
  batch TEXT NOT NULL,
  room room_type NOT NULL,
  device_fingerprint TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, device_fingerprint)
);

-- Enable RLS
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tpo_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Admin profiles policies
CREATE POLICY "Admins can view their own profile" 
ON public.admin_profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update their own profile" 
ON public.admin_profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert their own profile" 
ON public.admin_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- TPO sessions policies
CREATE POLICY "Admins can view their own sessions" 
ON public.tpo_sessions FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Admins can create sessions" 
ON public.tpo_sessions FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update their own sessions" 
ON public.tpo_sessions FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Admins can delete their own sessions" 
ON public.tpo_sessions FOR DELETE 
USING (auth.uid() = created_by);

-- Anyone can view active sessions (for student verification)
CREATE POLICY "Anyone can view active sessions for verification" 
ON public.tpo_sessions FOR SELECT 
USING (is_active = true);

-- Attendance records policies
CREATE POLICY "Admins can view attendance for their sessions" 
ON public.attendance_records FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tpo_sessions 
    WHERE id = session_id AND created_by = auth.uid()
  )
);

-- Anyone can insert attendance (students marking attendance)
CREATE POLICY "Anyone can record attendance" 
ON public.attendance_records FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tpo_sessions 
    WHERE id = session_id AND is_active = true AND expires_at > now()
  )
);

-- Create index for faster lookups
CREATE INDEX idx_sessions_code ON public.tpo_sessions(session_code);
CREATE INDEX idx_sessions_active ON public.tpo_sessions(is_active, expires_at);
CREATE INDEX idx_attendance_session ON public.attendance_records(session_id);
CREATE INDEX idx_attendance_fingerprint ON public.attendance_records(session_id, device_fingerprint);