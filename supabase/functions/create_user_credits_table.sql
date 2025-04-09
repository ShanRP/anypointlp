
-- Create user credits table
CREATE TABLE IF NOT EXISTS public.apl_user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  credits_used INTEGER NOT NULL DEFAULT 0,
  credits_limit INTEGER NOT NULL DEFAULT 3,
  reset_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_pro BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.apl_user_credits ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view only their own credits
CREATE POLICY "Users can view their own credits" 
ON public.apl_user_credits 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy for users to update only their own credits (for pro users)
CREATE POLICY "Users can update their own credits"
ON public.apl_user_credits
FOR UPDATE
USING (auth.uid() = user_id);

-- Create a function to reset credits daily
CREATE OR REPLACE FUNCTION public.reset_user_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.apl_user_credits
  SET credits_used = 0,
      reset_date = NOW() + INTERVAL '1 day'
  WHERE reset_date <= NOW();
END;
$$;

-- Create a daily cron job to reset credits
SELECT cron.schedule(
  'reset-user-credits-daily',
  '0 0 * * *',  -- Run at midnight every day
  $$
    SELECT public.reset_user_credits();
  $$
);

-- Create a trigger to update timestamp on update
CREATE OR REPLACE FUNCTION public.update_user_credits_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_credits_timestamp
BEFORE UPDATE ON public.apl_user_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_user_credits_timestamp();
