
export const generateRAMLPrompt = (apiDetails: any): string => {
  return `
Generate a comprehensive RAML (RESTful API Modeling Language) specification based on the following API details:

API Name: ${apiDetails.name || 'API'}
API Version: ${apiDetails.version || '1.0.0'}
Base URI: ${apiDetails.baseUri || 'https://api.example.com/{version}'}

${apiDetails.description ? `API Description: ${apiDetails.description}` : ''}

Include the following in your RAML specification:
- Proper RAML header with version specification
- Title, version, and baseUri
- Media types (application/json)
- Appropriate security schemes if provided
- Well-defined resources with URIs
- Methods (GET, POST, PUT, DELETE) for each resource as appropriate
- Request and response examples
- Data types/schemas for request and response bodies
- Query parameters, URI parameters, and headers where needed
- HTTP response codes with descriptions

Format the RAML in proper YAML syntax that is valid and parseable.
`;
};

export default generateRAMLPrompt;
