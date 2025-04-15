
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
    const { apiName, apiVersion, baseUri, endpoints } = await req.json();
    
    if (!apiName || !apiVersion) {
      return new Response(
        JSON.stringify({ error: 'API name and version are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Generating RAML for API: ${apiName}, Version: ${apiVersion}`);

    const ramlContent = await generateRAML(apiName, apiVersion, baseUri, endpoints);

    return new Response(
      JSON.stringify({ raml: ramlContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error generating RAML:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function generateRAML(apiName: string, apiVersion: string, baseUri: string, endpoints: any[]): Promise<string> {
  try {
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const systemPrompt = `You are a RAML API specification generator. 
    Generate a complete, valid RAML 1.0 specification based on the following details:
    - API Name: ${apiName}
    - API Version: ${apiVersion}
    - Base URI: ${baseUri}
    - Include appropriate documentation sections
    - Generate good examples and schema definitions 
    - Use proper RAML 1.0 syntax with appropriate indentation`;

    const endpointsText = endpoints && endpoints.length > 0 
      ? `Endpoints: ${JSON.stringify(endpoints, null, 2)}` 
      : 'Create sensible endpoints for this API based on its name.';

    const userPrompt = `Please create a complete RAML 1.0 specification for an API with the following details:
    API Name: ${apiName}
    API Version: ${apiVersion}
    Base URI: ${baseUri}
    ${endpointsText}
    
    Return ONLY the complete RAML content, no explanations or markdown formatting.`;

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
        temperature: 0.7
      })
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', responseData);
      throw new Error(`OpenAI API error: ${responseData.error?.message || 'Unknown error'}`);
    }

    const ramlContent = responseData.choices[0].message.content.trim();
    return ramlContent;
  } catch (error) {
    console.error('Error in generateRAML:', error);
    throw error;
  }
}
