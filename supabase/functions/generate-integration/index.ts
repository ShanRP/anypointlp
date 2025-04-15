
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
      description,
      runtime,
      ramlSpec,
      implementationDetails,
      flowConstants
    } = await req.json();
    
    if (!description) {
      return new Response(
        JSON.stringify({ error: 'Integration description is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Generating Mule integration for: ${description}`);

    const result = await generateIntegration(
      description,
      runtime || '4.4',
      ramlSpec,
      implementationDetails,
      flowConstants
    );

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error generating integration:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function generateIntegration(
  description: string,
  runtime: string,
  ramlSpec?: string,
  implementationDetails?: string,
  flowConstants?: string
): Promise<any> {
  try {
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const systemPrompt = `You are a MuleSoft integration expert. Create complete, functional Mule applications based on requirements.
Follow these guidelines:
1. Generate XML configurations that are valid for Mule ${runtime}
2. Include all necessary namespaces and configurations
3. Follow MuleSoft best practices for error handling and structure
4. Provide clear documentation within the code
5. Include API specifications if relevant
6. Generate supporting files like POM dependencies when needed`;

    const userPrompt = `Create a complete MuleSoft integration for the following:
    
Description: ${description}

Runtime: Mule ${runtime}

${ramlSpec ? `RAML Specification: ${ramlSpec}` : ''}

${implementationDetails ? `Implementation Details: ${implementationDetails}` : ''}

${flowConstants ? `Flow Constants: ${flowConstants}` : ''}

Please provide:
1. The main flow implementation (XML)
2. A summary of what the flow does
3. Required dependencies for pom.xml
4. Any constants or configuration needed
5. A brief explanation of how the flow works`;

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

    const content = responseData.choices[0].message.content.trim();

    // Extract different parts of the response
    const flowImplementationMatch = content.match(/```xml\s*([\s\S]*?)\s*```/);
    const pomDependenciesMatch = content.match(/```xml\s*(?:<dependencies>)?\s*([\s\S]*?)(?:<\/dependencies>)?\s*```/g);
    
    const flowImplementation = flowImplementationMatch ? flowImplementationMatch[1].trim() : '';
    
    // Filter out the flow implementation match from pom dependencies
    let pomDependencies = '';
    if (pomDependenciesMatch && pomDependenciesMatch.length > 1) {
      // Take the second XML block, assuming it's for POM
      pomDependencies = pomDependenciesMatch[1].replace(/```xml\s*/, '').replace(/\s*```/, '').trim();
    }
    
    // Get summary by removing code blocks
    const summary = content
      .replace(/```xml[\s\S]*?```/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .trim();

    return {
      flowImplementation,
      summary,
      pomDependencies,
      flowConstants: flowConstants || '',
      compilationCheck: 'Integration generated successfully'
    };
  } catch (error) {
    console.error('Error in generateIntegration:', error);
    throw error;
  }
}
