
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { generateRAMLPrompt } from "./prompt.ts";

console.log("APL_generate-raml function started");

serve(async (req) => {
  try {
    const apiDetails = await req.json();
    
    // Generate RAML specification based on the provided API details
    const ramlPrompt = generateRAMLPrompt(apiDetails);
    
    return new Response(
      JSON.stringify({
        prompt: ramlPrompt
      }),
      {
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error in APL_generate-raml function:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "An unexpected error occurred"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});
