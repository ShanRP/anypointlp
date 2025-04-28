
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { munitTestGeneratorPrompt } from "./prompt";


const mistralApiKey = Deno.env.get('MISTRAL_API_KEY') || 'VQMG3mvcRrjf3UsHQMbjY0P6dbaonXil';
if (!mistralApiKey) {
  console.error("MISTRAL_API_KEY is not set");
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request for CORS preflight');
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    // Validate Content-Type
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Invalid Content-Type, expected application/json');
      return new Response(JSON.stringify({ 
        error: 'Invalid Content-Type, expected application/json',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("Received request body:", JSON.stringify(body));

    const { description, notes, flowImplementation, runtime, numberOfScenarios } = body;
    
    // Validate required fields with detailed logging
    if (!description) {
      console.error('Missing required field: description');
      return new Response(JSON.stringify({ 
        error: 'Missing required field: description',
        success: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!flowImplementation) {
      console.error('Missing required field: flowImplementation');
      return new Response(JSON.stringify({ 
        error: 'Missing required field: flowImplementation',
        success: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Log inputs for debugging
    console.log('Received request for MUnit test generation:');
    console.log('Description:', description);
    console.log('Notes:', notes || 'Not provided');
    console.log('Flow Implementation length:', flowImplementation?.length || 0);
    console.log('Flow Implementation preview:', flowImplementation?.substring(0, 100) || 'Not provided');
    console.log('Runtime:', runtime);
    console.log('Number of Scenarios:', numberOfScenarios);

    // Construct the prompt for the Mistral API
    const userPrompt = `
${munitTestGeneratorPrompt}/n

Your task is to generate a complete, production-ready MUnit test suite based on the following flow implementation:

FLOW IMPLEMENTATION:
${flowImplementation}

DESCRIPTION:
${description}

${notes ? `ADDITIONAL NOTES:\n${notes}` : ''}

NUMBER OF TEST SCENARIOS: ${numberOfScenarios || 1}

RUNTIME ENVIRONMENT: ${runtime || 'Java 8.0, Maven 3.8'}

Please generate an MUnit test XML file that:
1. Includes all necessary MUnit namespaces and configurations
2. Properly tests the primary flows in the implementation
3. Includes appropriate mock components to simulate the real environment
4. Implements thorough assertions to validate the expected behavior
5. Follows MuleSoft MUnit best practices
6. Includes appropriate comments explaining the test approach
7. Is fully compatible with the specified runtime environment
8. Implements ${numberOfScenarios || 1} distinct test scenario(s)

The output should be complete XML that can be directly added to a MuleSoft project's test directory.
`;
    
    console.log("Sending request to Mistral AI");
    
    try {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mistralApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          messages: [
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: { message: errorText } };
        }
        
        console.error('Mistral AI API error:', errorData);
        
        return new Response(JSON.stringify({ 
          error: `Mistral AI API error: ${errorData.error?.message || 'Unknown error'}`,
          success: false 
        }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await response.json();
      console.log("Mistral AI response status:", response.status);
      
      // Extract the generated code from the response
      let generatedCode = data.choices[0].message.content.trim();
      
      // Log a sample of the response
      console.log("Response preview (first 300 chars):", generatedCode.substring(0, 300));
      
      // Extract XML if wrapped in markdown code blocks
      if (generatedCode.includes("```xml")) {
        const xmlMatch = generatedCode.match(/```xml\s*([\s\S]*?)```/);
        if (xmlMatch && xmlMatch[1]) {
          generatedCode = xmlMatch[1].trim();
        }
      }
      
      // Return the generated MUnit test code with stable structure
      return new Response(JSON.stringify({ 
        code: generatedCode,
        success: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (mistralError) {
      console.error('Error calling Mistral AI API:', mistralError);
      return new Response(JSON.stringify({ 
        error: `Error calling Mistral AI API: ${mistralError.message}`,
        success: false 
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Fatal error in generate-munit function:', error);
    return new Response(JSON.stringify({ 
      error: `Server error: ${error.message}`,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
