
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE } from "./prompt.ts";

const OPENAI_API_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-4o";

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get API key from environment
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not found" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const requestData = await req.json();
    const { 
      flowDescription = "",
      flowImplementation = "", 
      numScenarios = 3,
      runtime = "4.4.0"
    } = requestData;

    // Validate inputs
    if (!flowImplementation || flowImplementation.trim() === "") {
      return new Response(
        JSON.stringify({ error: "Flow implementation is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the prompt by replacing placeholders
    const userPrompt = USER_PROMPT_TEMPLATE
      .replace("{{flow_description}}", flowDescription || "No description provided")
      .replace("{{flow_implementation}}", flowImplementation)
      .replace("{{number_of_scenarios}}", numScenarios.toString())
      .replace("{{runtime}}", runtime);

    // Prepare the OpenAI request
    const openAIRequest = {
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2048
    };

    // Call OpenAI API
    console.log("Sending request to OpenAI...");
    const openAIResponse = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(openAIRequest)
    });

    // Process the response
    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error("OpenAI API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to generate MUnit tests", details: errorData }),
        { status: openAIResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await openAIResponse.json();
    const munitTestContent = data.choices[0]?.message?.content || "";

    // Return the generated MUnit content
    return new Response(
      JSON.stringify({ munitContent: munitTestContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-munit function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
