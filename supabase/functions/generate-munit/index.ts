
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
      flow_implementation,
      flow_description,
      runtime,
      number_of_scenarios
    } = await req.json();
    
    if (!flow_implementation) {
      return new Response(
        JSON.stringify({ error: 'Flow implementation is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Generating MUnit tests for flow with runtime: ${runtime || '4.4'}`);

    const munitContent = await generateMunitTests(
      flow_implementation,
      flow_description || '',
      runtime || '4.4',
      number_of_scenarios || 3
    );

    return new Response(
      JSON.stringify({ munit_content: munitContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error generating MUnit tests:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function generateMunitTests(
  flowImplementation: string,
  flowDescription: string,
  runtime: string,
  numberOfScenarios: number
): Promise<string> {
  try {
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const systemPrompt = `You are a MuleSoft MUnit testing expert. Create comprehensive tests for Mule flows.
Follow these guidelines:
1. Generate valid MUnit XML for Mule ${runtime}
2. Include a variety of test scenarios covering happy paths and error cases
3. Use clear test names that describe what is being tested
4. Include proper assertions for each test
5. Use mock components where appropriate
6. Follow MuleSoft testing best practices`;

    const userPrompt = `Create comprehensive MUnit tests for the following Mule flow:
    
Flow Description: ${flowDescription}

Flow Implementation:
${flowImplementation}

Please create ${numberOfScenarios} different test scenarios that thoroughly test this flow.
Provide the complete MUnit XML test suite, with all necessary namespaces and configurations.`;

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
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3
      })
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', responseData);
      throw new Error(`OpenAI API error: ${responseData.error?.message || 'Unknown error'}`);
    }

    let munitContent = responseData.choices[0].message.content.trim();
    
    // Extract code if it's wrapped in markdown code blocks
    const xmlMatch = munitContent.match(/```xml\s*([\s\S]*?)\s*```/);
    if (xmlMatch) {
      munitContent = xmlMatch[1].trim();
    }
    
    return munitContent;
  } catch (error) {
    console.error('Error in generateMunitTests:', error);
    throw error;
  }
}
