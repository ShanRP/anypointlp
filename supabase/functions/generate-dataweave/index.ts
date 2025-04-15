
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client with the Service Role Key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      inputFormat,
      inputSamples,
      outputSamples,
      notes,
      existingScript,
      filePath
    } = await req.json();
    
    if (!inputFormat || !inputSamples || !outputSamples) {
      return new Response(
        JSON.stringify({ error: 'Input format, input samples, and output samples are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Generating DataWeave script for ${inputFormat} transformation`);

    const dwScript = await generateDataWeaveScript(
      inputFormat,
      inputSamples,
      outputSamples,
      notes,
      existingScript,
      filePath
    );

    return new Response(
      JSON.stringify({ script: dwScript }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error generating DataWeave script:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function generateDataWeaveScript(
  inputFormat: string,
  inputSamples: any[],
  outputSamples: any[],
  notes?: string,
  existingScript?: string,
  filePath?: string
): Promise<string> {
  try {
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const inputSample = inputSamples[0]?.value || '';
    const outputSample = outputSamples[0]?.value || '';

    let promptContent = '';
    
    if (existingScript) {
      promptContent = `Please optimize or fix the following DataWeave script:
      
${existingScript}

Given this input:
${inputSample}

The expected output should be:
${outputSample}

${notes ? `Additional notes: ${notes}` : ''}

File path: ${filePath || 'Not provided'}`;
    } else {
      promptContent = `Create a DataWeave script that transforms from ${inputFormat} to JSON.

Input example:
${inputSample}

Output example:
${outputSample}

${notes ? `Additional notes: ${notes}` : ''}

Please provide a complete, well-documented DataWeave script including input/output type definitions.`;
    }

    const systemPrompt = `You are a DataWeave expert. Create efficient, well-documented DataWeave scripts for MuleSoft integrations. 
Follow these guidelines:
1. Include proper header with input/output type declarations
2. Use clear variable names and add comments for complex logic
3. Prefer DataWeave's built-in functions where appropriate
4. Keep the code clean and maintainable
5. Document edge cases and assumptions`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: promptContent }
        ],
        temperature: 0.2
      })
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', responseData);
      throw new Error(`OpenAI API error: ${responseData.error?.message || 'Unknown error'}`);
    }

    let dwScript = responseData.choices[0].message.content.trim();
    
    // Clean up code block markers if present
    if (dwScript.startsWith('```dataweave') || dwScript.startsWith('```dw')) {
      dwScript = dwScript.replace(/^```(dataweave|dw)\n/, '').replace(/```$/, '');
    } else if (dwScript.startsWith('```')) {
      dwScript = dwScript.replace(/^```\n/, '').replace(/```$/, '');
    }
    
    return dwScript;
  } catch (error) {
    console.error('Error in generateDataWeaveScript:', error);
    throw error;
  }
}
