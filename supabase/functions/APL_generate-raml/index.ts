
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { ramlGeneratorPrompt } from "./prompt";


const mistralApiKey = Deno.env.get('MISTRAL_API_KEY') || 'EbjQ32KdE7j8qv1wTZWEZZyq0XQPqtiX';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    console.log('Received request for RAML generation');
    
    // Parse the request body
    const requestData = await req.json();
    const { 
      apiName, 
      apiVersion,
      baseUri,
      apiDescription, 
      types = [],
      endpoints = [], 
      mediaTypes = ["application/json"],
      protocols = ["HTTPS"],
      workspaceId = '' // Add workspaceId to the destructured parameters
    } = requestData;
    
    // Log the received data including workspace ID
    console.log('Request data:', { 
      apiName, 
      apiVersion,
      baseUri,
      apiDescription, 
      types: types.length,
      endpoints: endpoints.length,
      workspaceId // Log the workspace ID
    });
    
    // Generate RAML specification using Mistral
    let ramlSpec;
    try {
      ramlSpec = await generateWithMistral(
        apiName, 
        apiVersion,
        baseUri,
        apiDescription, 
        types,
        endpoints,
        mediaTypes,
        protocols
      );
    } catch (mistralError) {
      console.error('Error generating with Mistral, falling back to local generation:', mistralError);
      ramlSpec = APL_generateRamlSpec(
        apiName, 
        apiVersion,
        baseUri,
        apiDescription, 
        types,
        endpoints,
        mediaTypes,
        protocols
      );
    }
    
    // Return the generated RAML
    return new Response(
      JSON.stringify({ 
        raml: ramlSpec 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error generating RAML:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate RAML specification' 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

async function generateWithMistral(
  apiName: string, 
  apiVersion: string = 'v1',
  baseUri: string = 'https://api.example.com/v1',
  apiDescription: string = '', 
  types: any[] = [],
  endpoints: any[] = [], 
  mediaTypes: string[] = ["application/json"],
  protocols: string[] = ["HTTPS"],
  securitySchemes: any = {},
  documentation: any = {},
  termsOfService: string = ''
) {
  console.log('Generating RAML with Mistral AI');
  
  // Prepare detailed data for Mistral prompt
  const typesSummary = types.map(type => ({
    name: type.name,
    baseType: type.baseType,
    properties: type.properties?.map((prop: any) => ({
      name: prop.name,
      type: prop.type,
      required: prop.required,
      description: prop.description,
      example: prop.example
    })),
    example: type.example
  }));
  
  const endpointsSummary = endpoints.map(endpoint => ({
    path: endpoint.path,
    description: endpoint.description,
    uriParameters: endpoint.uriParams,
    methods: endpoint.methods.map((method: any) => ({
      type: method.type,
      description: method.description,
      queryParams: method.queryParams,
      headers: method.headers,
      requestBody: method.requestBody,
      responses: method.responses
    }))
  }));
  
  // Create an enhanced prompt for Mistral
  const prompt = `
  ${ramlGeneratorPrompt}\n
  
  API DETAILS:
  - Name: ${apiName}
  - Version: ${apiVersion}
  - Base URI: ${baseUri}
  - Description: ${apiDescription}
  - Media Types: ${JSON.stringify(mediaTypes)}
  - Protocols: ${JSON.stringify(protocols)}
  - Security Schemes: ${JSON.stringify(securitySchemes)}
  - Documentation URL: ${documentation.url || ''}
  - Terms of Service: ${termsOfService}
  
  TYPES:
  ${JSON.stringify(typesSummary, null, 2)}
  
  ENDPOINTS:
  ${JSON.stringify(endpointsSummary, null, 2)}
  
  Requirements:
  1. Start with '#%RAML 1.0' header
  2. Include comprehensive documentation
  3. Define all types with properties, examples, and validations
  4. Detail all endpoints with methods, parameters, request/response bodies
  5. Include security schemes configuration
  6. Add proper annotations and descriptions
  7. Use proper YAML indentation (2 spaces)
  8. Include examples for requests and responses
  9. Add proper error responses for each endpoint
  10. Include rate limiting headers if applicable
  
  Format the output as a complete RAML specification without any additional text or explanations.

  API Name: ${apiName}
  API Version: ${apiVersion || 'v1'}
  Base URI: ${baseUri || 'https://api.example.com/v1'}
  API Description: ${apiDescription || ''}
  Media Types: ${JSON.stringify(mediaTypes)}
  Protocols: ${JSON.stringify(protocols)}
  
  Types Information:
  ${JSON.stringify(types, null, 2)}
  
  Endpoints Information:
  ${JSON.stringify(endpoints, null, 2)}

  Generate a complete, properly formatted RAML 1.0 specification. Make sure:
  1. Start with the '#%RAML 1.0' header
  2. Include all provided types with their properties
  3. Include all endpoints with their methods, request bodies, and responses
  4. Use proper YAML indentation (2 spaces)
  5. Format examples correctly with appropriate indentation
  6. Return ONLY the RAML content with no explanations or additional text
  `;
  
  try {
    // Call Mistral AI API
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mistralApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 4000,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mistral API error response:', errorText);
      throw new Error(`Mistral API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Mistral response received');
    
    // Extract the generated RAML from the response
    const generatedRaml = data.choices[0].message.content.trim();
    
    // Validate basic RAML structure
    if (!generatedRaml.startsWith('#%RAML 1.0')) {
      console.warn('Mistral response does not start with RAML header, adding it');
      return '#%RAML 1.0\n' + generatedRaml;
    }
    
    return generatedRaml;
  } catch (error) {
    console.error('Error calling Mistral API:', error);
    throw error;
  }
}

function APL_generateRamlSpec(
  apiName: string, 
  apiVersion: string = 'v1',
  baseUri: string = 'https://api.example.com/v1',
  apiDescription: string = '', 
  types: any[] = [],
  endpoints: any[] = [], 
  mediaTypes: string[] = ["application/json"],
  protocols: string[] = ["HTTPS"]
): string {
  // Start with RAML header and metadata
  let raml = `#%RAML 1.0
title: ${apiName}
`;

  if (apiVersion) {
    raml += `version: ${apiVersion}\n`;
  }
  
  if (baseUri) {
    raml += `baseUri: ${baseUri}\n`;
  }
  
  if (protocols && protocols.length > 0) {
    raml += `protocols: [ ${protocols.join(', ')} ]\n`;
  }
  
  if (mediaTypes && mediaTypes.length > 0) {
    if (mediaTypes.length === 1) {
      raml += `mediaType: ${mediaTypes[0]}\n`;
    } else {
      raml += `mediaType: [ ${mediaTypes.join(', ')} ]\n`;
    }
  }
  
  if (apiDescription) {
    raml += `description: ${apiDescription}\n`;
  }

  // Add types
  if (types && types.length > 0) {
    raml += `\ntypes:\n`;
    types.forEach(type => {
      raml += `  ${type.name}:\n`;
      raml += `    type: ${type.baseType || 'object'}\n`;
      
      if (type.properties && type.properties.length > 0) {
        raml += `    properties:\n`;
        type.properties.forEach((prop: any) => {
          raml += `      ${prop.name}: ${prop.type}\n`;
        });
      }
      
      // Add example if provided
      if (type.example) {
        raml += `    example:\n`;
        raml += `      ${type.example.replace(/\n/g, '\n      ')}\n`;
      }
    });
  }

  // Process endpoints
  if (endpoints && endpoints.length > 0) {
    endpoints.forEach(endpoint => {
      const path = endpoint.path || '/';
      raml += `\n/${path.replace(/^\/+/, '')}:\n`;
      
      if (endpoint.description) {
        raml += `  description: ${endpoint.description}\n`;
      }
      
      // Add methods
      const methods = endpoint.methods || [];
      methods.forEach((method: any) => {
        const methodName = method.type?.toLowerCase() || 'get';
        raml += `  ${methodName}:\n`;
        
        if (method.description) {
          raml += `    description: ${method.description}\n`;
        }
        
        // Add request body if available
        if (method.requestBody) {
          raml += `    body:\n`;
          raml += `      application/json:\n`;
          
          if (method.requestType) {
            raml += `        type: ${method.requestType}\n`;
          }
          
          if (method.requestExample) {
            raml += `        example:\n`;
            raml += `          ${method.requestExample.replace(/\n/g, '\n          ')}\n`;
          }
        }
        
        // Add responses
        if (method.responses && method.responses.length > 0) {
          raml += `    responses:\n`;
          method.responses.forEach((response: any) => {
            raml += `      ${response.code}:\n`;
            
            if (response.description) {
              raml += `        description: ${response.description}\n`;
            }
            
            if (response.body) {
              raml += `        body:\n`;
              raml += `          application/json:\n`;
              
              if (response.bodyType) {
                raml += `            type: ${response.bodyType}\n`;
              }
              
              if (response.example) {
                raml += `            example:\n`;
                raml += `              ${response.example.replace(/\n/g, '\n              ')}\n`;
              }
            }
          });
        }
      });
    });
  }

  return raml;
}
