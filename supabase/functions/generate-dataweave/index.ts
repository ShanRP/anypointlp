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

IMPORTANT: Return ONLY the DataWeave script with the following strict requirements:
1. Start with "%dw 2.0" line
2. Include "output application/json" line
3. Include the "---" separator line
4. Write the transformation logic
5. DO NOT include any explanations, markdown formatting, or additional text
6. DO NOT include multiple %dw 2.0 directives
7. STRICTLY PROVIDE ONLY the executable script - nothing else before or after

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
          { role: 'system', content: 'You are a DataWeave expert that provides only clean, executable DataWeave code without any additional text, comments, or formatting.' },
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
      generatedScript = generatedScript.replace(/```dataweave\n([\s\S]*?)\n```/g, '$1').trim();
    } else if (generatedScript.includes('```dw')) {
      generatedScript = generatedScript.replace(/```dw\n([\s\S]*?)\n```/g, '$1').trim();
    } else if (generatedScript.includes('```')) {
      generatedScript = generatedScript.replace(/```\n?([\s\S]*?)\n```/g, '$1').trim();
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
      // Find the position of the first and second %dw lines
      const firstIndex = generatedScript.indexOf(firstDwLine);
      const secondIndex = generatedScript.indexOf(dwLines[1], firstIndex + firstDwLine.length);
      // Keep the script up to the second %dw line
      generatedScript = generatedScript.substring(0, secondIndex).trim();
    }

    // Ensure script starts with %dw if not present
    if (!generatedScript.startsWith('%dw')) {
      generatedScript = `%dw 2.0\noutput application/json\n---\n${generatedScript}`;
    }

    // Clean up any double separators
    generatedScript = generatedScript.replace(/---\s*---/g, '---');

    // Remove any text after the script by finding the last meaningful line of code
    const lines = generatedScript.split('\n');
    let endIndex = lines.length;
    
    // Find where the actual script ends
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line === '' || line.startsWith('//')) continue;
      
      // Check for common explanation markers
      if (line.startsWith('Note:') || 
          line.startsWith('Explanation:') || 
          line.toLowerCase().includes('this script') || 
          line.startsWith('In this') ||
          line.startsWith('The script')) {
        endIndex = i;
      } else {
        break;
      }
    }
    
    generatedScript = lines.slice(0, endIndex).join('\n');
    
    // Final cleanup - remove any trailing comments or explanations
    const cleanedScript = generatedScript
      .replace(/\/\*[\s\S]*?\*\/$/gm, '') // Remove trailing multiline comments
      .replace(/\/\/.*?explanation.*$/gim, '') // Remove trailing single line comments about explanations
      .trim();

    return new Response(JSON.stringify({ script: cleanedScript }), {
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
