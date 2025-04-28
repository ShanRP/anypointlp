
/**
 * Generates a properly formatted RAML prompt for API specification generation
 */
export const generateRAMLPrompt = (apiDetails: any): string => {
  const prompt = `
Generate a complete RAML 1.0 specification for an API with the following details:

API Name: ${apiDetails.name || 'Sample API'}
API Version: ${apiDetails.version || '1.0'}
Base URI: ${apiDetails.baseUri || '{baseUri}'}

Description:
${apiDetails.description || 'This API provides access to resources.'}

Endpoints:
${JSON.stringify(apiDetails.endpoints || [], null, 2)}

Include proper:
- Data types
- Request and response examples
- Query parameters
- Headers
- Response codes
- Security schemes

Please format the RAML 1.0 specification with proper indentation.
`;

  return prompt;
};
