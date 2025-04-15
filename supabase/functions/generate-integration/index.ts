
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const mistralApiKey = Deno.env.get('MISTRAL_API_KEY') || 'Ecm8fxCceYTwvPf9FoPkmZBlW4D1OejY';
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
  // Handle CORS preflight requests - this is critical for browser requests
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

    const { description, runtime, diagrams } = body;
    
    // Validate required fields
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
    
    // Log inputs for debugging
    console.log('Received request for integration generation:');
    console.log('Description:', description);
    console.log('Runtime:', runtime);
    console.log('Diagrams:', diagrams ? 'Provided' : 'Not provided');

    // Enhanced strict system prompt with explicit section requirements
    const userPrompt = `
You are an expert MuleSoft developer responsible for generating complete, production-ready integration solutions.

YOUR RESPONSE MUST INCLUDE ALL FIVE SECTIONS BELOW WITH DETAILED CONTENT:

1. Flow Summary - 3-4 paragraphs explaining the implementation in business terms
2. Flow Implementation - Complete Mule XML configuration with all namespaces
3. Flow Constants - List of all hostnames, ports, credentials, and environment variables
4. POM Dependencies - All required Maven dependencies with versions
5. Compilation Check - Troubleshooting steps for common issues

Create a detailed MuleSoft integration flow based on this description:

${description}

YOU MUST FOLLOW THIS EXACT FORMAT WITH ALL FIVE SECTIONS CLEARLY LABELED:

# Flow Summary
[Provide 3-4 paragraphs explaining the integration purpose, approach, and benefits]

# Flow Implementation
[Provide complete, valid Mule 4.x XML with all required namespaces]

# Flow Constants
[List all hostnames, ports, credentials placeholders, and environment variables]

# POM Dependencies
[List all Maven dependencies with groupId, artifactId, and version]

# Compilation Check
[Provide detailed troubleshooting steps for common issues]

STRICT REQUIREMENTS:
1. Every section MUST have substantial, detailed content
2. Use the exact headings shown above (with the # prefix)
3. Include complete XML namespace declarations
4. List at least 3-5 constants even if basic ones
5. Include at least 3 dependencies with full Maven coordinates
6. Provide at least 5 compilation checks/troubleshooting steps

DO NOT SKIP OR ABBREVIATE ANY SECTION. If you only provide XML code, you will fail this task.
`;
    
    console.log("Sending request to Mistral AI with enhanced prompt");
    
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
          temperature: 0.2, // Lower temperature for more deterministic and complete responses
          max_tokens: 4000, // Increased token count for more comprehensive output
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
          status: 502, // Bad Gateway for upstream service failures
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await response.json();
      console.log("Mistral AI response status:", response.status);
      
      // Extract the generated code from the response
      let generatedCode = data.choices[0].message.content.trim();
      
      // Log a sample of the response to verify all sections are present
      console.log("Response preview (first 300 chars):", generatedCode.substring(0, 300));
      
      // Define required sections with strict heading format
      const requiredSections = [
        { name: "Flow Summary", pattern: /# Flow Summary\n/i },
        { name: "Flow Implementation", pattern: /# Flow Implementation\n/i },
        { name: "Flow Constants", pattern: /# Flow Constants\n/i },
        { name: "POM Dependencies", pattern: /# POM Dependencies\n/i },
        { name: "Compilation Check", pattern: /# Compilation Check\n/i }
      ];
      
      // Check if all required sections are present
      const missingSections = requiredSections.filter(section => !section.pattern.test(generatedCode)).map(section => section.name);

      // If sections are missing, add placeholder content
      if (missingSections.length > 0) {
        console.warn(`Error: Response is missing required sections: ${missingSections.join(", ")}`);

        // Create an enhanced version of the code with all sections
        let enhancedCode = generatedCode;

        // Extract the XML content if response is XML-only
        if (!enhancedCode.includes("# Flow Summary") && 
            (enhancedCode.startsWith("```xml") || enhancedCode.includes("<mule") || enhancedCode.startsWith("<?xml"))) {
          
          console.log("Detected XML-only response, extracting XML content");
          let xmlContent = enhancedCode;
          
          // If wrapped in markdown code blocks, extract the content
          if (enhancedCode.startsWith("```xml")) {
            const xmlMatch = enhancedCode.match(/```xml\s*([\s\S]*?)```/);
            if (xmlMatch && xmlMatch[1]) {
              xmlContent = xmlMatch[1].trim();
            }
          }
          
          // Reset the enhanced code to start with a clean slate
          enhancedCode = "";
          
          // Add the missing sections with the extracted XML in implementation
          enhancedCode += `# Flow Summary
This integration flow implements a ${description.includes("CRUD") ? "CRUD" : "data processing"} service based on the requirements specified. The solution provides a RESTful API interface that handles the necessary business logic and data transformations.

The implementation follows MuleSoft best practices for error handling, modularity, and performance. It includes proper logging and monitoring capabilities to ensure operational visibility and maintenance.

The solution is designed to be scalable and maintainable, with clear separation of concerns and proper configuration management using properties files.

# Flow Implementation
${xmlContent}

# Flow Constants
host: 0.0.0.0
port: 8081
api_path: ${xmlContent.includes('path=') ? xmlContent.match(/path="([^"]+)"/)?.[1] || '/api' : '/api'}
${xmlContent.includes('database') ? 'database_url: ${db.url}\nusername: ${db.username}\npassword: ${db.password}' : 'timeout_ms: 10000\nmax_connections: 10'}
retry_attempts: 3

# POM Dependencies
<dependency>
  <groupId>org.mule.connectors</groupId>
  <artifactId>mule-http-connector</artifactId>
  <version>1.7.1</version>
  <classifier>mule-plugin</classifier>
</dependency>
${xmlContent.includes('db:') ? 
'<dependency>\n  <groupId>org.mule.connectors</groupId>\n  <artifactId>mule-db-connector</artifactId>\n  <version>1.13.6</version>\n  <classifier>mule-plugin</classifier>\n</dependency>' : 
'<dependency>\n  <groupId>org.mule.connectors</groupId>\n  <artifactId>mule-sockets-connector</artifactId>\n  <version>1.2.2</version>\n  <classifier>mule-plugin</classifier>\n</dependency>'}
<dependency>
  <groupId>org.mule.modules</groupId>
  <artifactId>mule-apikit-module</artifactId>
  <version>1.6.1</version>
  <classifier>mule-plugin</classifier>
</dependency>

# Compilation Check
1. Ensure all property placeholders are defined in your properties file (${runtime || 'mule-app.properties'}).
2. Verify connector versions are compatible with your Mule runtime version (${runtime || 'Java 8.0, Maven 3.8'}).
3. Check that all required dependencies are included in your pom.xml.
4. Validate that any referenced configuration files exist in the project structure.
5. Confirm that all required credentials are properly configured for external systems.
6. Ensure XML namespaces are correctly defined and referenced in the implementation.
7. Verify that any DataWeave transformations use the correct syntax and variable references.`;
        } else {
          // Add only the specific missing sections
          for (const section of missingSections) {
            console.log(`Adding placeholder for missing section: ${section}`);

            let placeholderContent = "";
            if (section === "Flow Summary") {
              placeholderContent = `This integration flow implements a solution based on the requirements specified in the description. It provides a RESTful API interface that handles the necessary business logic and data transformations.

The implementation follows MuleSoft best practices for error handling, modularity, and performance. It includes proper logging and monitoring capabilities to ensure operational visibility and maintenance.

The solution is designed to be scalable and maintainable, with clear separation of concerns and proper configuration management using properties files.`;
            } else if (section === "Flow Implementation") {
              placeholderContent = `<?xml version="1.0" encoding="UTF-8"?>
<mule xmlns="http://www.mulesoft.org/schema/mule/core"
      xmlns:http="http://www.mulesoft.org/schema/mule/http"
      xmlns:ee="http://www.mulesoft.org/schema/mule/ee/core"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:schemaLocation="
        http://www.mulesoft.org/schema/mule/core http://www.mulesoft.org/schema/mule/core/current/mule.xsd
        http://www.mulesoft.org/schema/mule/http http://www.mulesoft.org/schema/mule/http/current/mule-http.xsd
        http://www.mulesoft.org/schema/mule/ee/core http://www.mulesoft.org/schema/mule/ee/core/current/mule-ee.xsd">
    <http:listener-config name="HTTP_Listener_config" host="0.0.0.0" port="8081"/>
    <flow name="api-main-flow">
        <http:listener path="/api" config-ref="HTTP_Listener_config"/>
        <ee:transform>
            <ee:message>
                <ee:set-payload><![CDATA[%dw 2.0
output application/json
---
{
  "message": "Implementation required based on: ${description.replace(/"/g, '\\"')}"
}]]></ee:set-payload>
            </ee:message>
        </ee:transform>
    </flow>
</mule>`;
            } else if (section === "Flow Constants") {
              placeholderContent = `host: 0.0.0.0
port: 8081
api_path: /api
timeout_ms: 10000
max_connections: 10
retry_attempts: 3`;
            } else if (section === "POM Dependencies") {
              placeholderContent = `<dependency>
  <groupId>org.mule.connectors</groupId>
  <artifactId>mule-http-connector</artifactId>
  <version>1.7.1</version>
  <classifier>mule-plugin</classifier>
</dependency>
<dependency>
  <groupId>org.mule.connectors</groupId>
  <artifactId>mule-sockets-connector</artifactId>
  <version>1.2.2</version>
  <classifier>mule-plugin</classifier>
</dependency>
<dependency>
  <groupId>org.mule.modules</groupId>
  <artifactId>mule-apikit-module</artifactId>
  <version>1.6.1</version>
  <classifier>mule-plugin</classifier>
</dependency>`;
            } else if (section === "Compilation Check") {
              placeholderContent = `1. Ensure all property placeholders are defined in your properties file.
2. Verify connector versions are compatible with your Mule runtime version (${runtime || 'Java 8.0, Maven 3.8'}).
3. Check that all required dependencies are included in your pom.xml.
4. Validate that any referenced configuration files exist in the project structure.
5. Confirm that all required credentials are properly configured for external systems.
6. Ensure XML namespaces are correctly defined and referenced in the implementation.
7. Verify that any DataWeave transformations use the correct syntax and variable references.`;
            }

            enhancedCode += `\n\n# ${section}\n${placeholderContent}`;
          }
        }

        console.log("Using enhanced code with added missing sections");
        return new Response(JSON.stringify({ 
          code: enhancedCode,
          success: true,
          sectionsAdded: missingSections
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      else {
        console.log("All required sections are present in the response");
      }
      
      // Return the generated MuleSoft integration code
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
        status: 502, // Bad Gateway for upstream service failures
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Fatal error in generate-integration function:', error);
    return new Response(JSON.stringify({ 
      error: `Server error: ${error.message}`,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
