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

    const userPrompt = `Create a DataWeave script (DataWeave 2.0) that transforms the input to the expected output.

Input:\n${formattedInputSamples}\n\nExpected Output:\n${formattedOutputSamples}
    
${notes ? `Additional requirements: ${notes}\n\n` : ''}

IMPORTANT: Return ONLY the DataWeave script with the following requirements:
1. Start with "%dw 2.0" line
2. Include "output application/json" line
3. Include the "---" separator
4. Then write the transformation logic
5. DO NOT include any explanations, comments (except for inline code comments), or markdown formatting
6. DO NOT prefix or suffix your response with any additional text, ONLY provide the script

The script must be optimized for production use in MuleSoft Anypoint Studio.`;
    
    console.log("User prompt:", userPrompt);

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
    } else if (generatedScript.includes('```dw')) {
      generatedScript = generatedScript.replace(/```dw\n([\s\S]*?)```/g, '$1').trim();
    } else if (generatedScript.includes('```')) {
      generatedScript = generatedScript.replace(/```\n?([\s\S]*?)```/g, '$1').trim();
    }

    // Strip any remaining explanation text
    const dwIndex = generatedScript.indexOf('%dw 2.0');
    if (dwIndex > 0) {
      generatedScript = generatedScript.substring(dwIndex);
    }
    
    // Ensure there are no duplicate %dw declarations
    const dwLines = generatedScript.split('\n').filter(line => line.trim().startsWith('%dw'));
    if (dwLines.length > 1) {
      // Keep only the first %dw line
      const firstDwLine = dwLines[0];
      const restOfScript = generatedScript.substring(generatedScript.indexOf(firstDwLine) + firstDwLine.length);
      generatedScript = firstDwLine + restOfScript;
    }

    // Ensure script starts with %dw if not present
    if (!generatedScript.startsWith('%dw')) {
      generatedScript = `%dw 2.0\noutput application/json\n---\n${generatedScript}`;
    }

    // Clean up any double separators
    generatedScript = generatedScript.replace(/---\s*---/g, '---');

    // Remove any text after the script
    const lines = generatedScript.split('\n');
    let endIndex = lines.length;
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line === '' || line.startsWith('//')) continue;
      if (line.startsWith('Note:') || line.startsWith('Explanation:') || 
          line.toLowerCase().includes('this script') || line.startsWith('In this')) {
        endIndex = i;
      } else {
        break;
      }
    }
    generatedScript = lines.slice(0, endIndex).join('\n');

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
