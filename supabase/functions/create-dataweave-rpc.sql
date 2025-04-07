
-- Create a stored procedure to insert dataweave history
CREATE OR REPLACE FUNCTION public.APL_insert_dataweave_history(
  user_id_input UUID,
  input_format_input TEXT,
  input_samples_input JSONB,
  output_samples_input JSONB,
  notes_input TEXT,
  generated_scripts_input JSONB
) RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.APL_dataweave_history(
    user_id, 
    input_format, 
    input_samples, 
    output_samples, 
    notes, 
    generated_script
  ) VALUES (
    user_id_input,
    input_format_input,
    input_samples_input,
    output_samples_input,
    notes_input,
    generated_scripts_input::TEXT
  ) RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to the function
GRANT EXECUTE ON FUNCTION public.APL_insert_dataweave_history TO authenticated;
GRANT EXECUTE ON FUNCTION public.APL_insert_dataweave_history TO anon;
