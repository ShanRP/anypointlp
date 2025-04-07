
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const mistralApiKey = Deno.env.get('MISTRAL_API_KEY') || 'gxZ7ckfclmIryLjoCFW0XT3erqtEFEoX';
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    const { inputFormat, inputSamples, outputSamples, notes, previousScript } = await req.json();
    
    const formattedInputSamples = inputSamples.map((sample: any, i: number) => 
      `Input Sample ${i+1}:\n${JSON.stringify(sample.value, null, 2)}`).join('\n\n');
    
    const formattedOutputSamples = outputSamples.map((sample: any, i: number) => 
      `Expected Output ${i+1}:\n${JSON.stringify(sample.value, null, 2)}`).join('\n\n');

    const userPrompt = `Create the DataWeave script with the given input and expected output.

Input:\n${formattedInputSamples}\n\nExpected Output:\n${formattedOutputSamples}
    
${notes ? `Additional requirements: ${notes}\n\n` : ''}

Always follow this exact format:
%dw 2.0
output application/json
---
// Your transformation logic here

Make sure the script is optimized and includes comments explaining the logic.`;
    
    // Log the prompts for debugging
    console.log("User prompt:", userPrompt);

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mistralApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-large-latest', // Using Mistral's large model
        messages: [
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Mistral API error response:", errorData);
      throw new Error(`Mistral API error: ${errorData.error?.message || JSON.stringify(errorData) || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log("Mistral API response:", data);
    
    let generatedScript = data.choices[0].message.content.trim();

    // Extract actual DataWeave code if wrapped in markdown code blocks
    if (generatedScript.includes('```dataweave')) {
      generatedScript = generatedScript.replace(/```dataweave\n([\s\S]*?)```/g, '$1').trim();
    } else if (generatedScript.includes('```')) {
      generatedScript = generatedScript.replace(/```\n?([\s\S]*?)```/g, '$1').trim();
    }

    // Ensure script starts with %dw if not present
    if (!generatedScript.startsWith('%dw')) {
      generatedScript = `%dw 2.0\noutput application/json\n---\n${generatedScript}`;
    }

    // Post-process the script to optimize
    generatedScript = processScript(generatedScript);

    return new Response(JSON.stringify({ script: generatedScript }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating DataWeave script:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function processScript(script: string): string {
  // Split script into sections
  const [header, ...rest] = script.split('---');
  let body = rest.join('---').trim();

  // Clean up extra whitespace and empty lines
  body = body
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '');

  return `${header}---\n${body}`;
}
