
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Trash, Plus, Copy, PlayCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import MonacoEditor from './MonacoEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { BackButton } from './ui/BackButton';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';

// Define interfaces for our data types
interface APIType {
  name: string;
  baseType: string;
  properties: Array<{
    name: string;
    type: string;
    required?: boolean;
    description?: string;
  }>;
  example?: string;
}

interface APIMethod {
  type: string;
  description?: string;
  requestBody?: boolean;
  requestType?: string;
  requestExample?: string;
  responses: Array<{
    code: number;
    description?: string;
    body?: boolean;
    bodyType?: string;
    example?: string;
  }>;
}

interface APIEndpoint {
  path: string;
  description?: string;
  methods: APIMethod[];
}

interface RAMLGeneratorProps {
  onBack: () => void;
  selectedWorkspaceId?: string;
}

const RAMLGenerator: React.FC<RAMLGeneratorProps> = ({ onBack, selectedWorkspaceId }) => {
  const { user } = useAuth();
  const { selectedWorkspace } = useWorkspaces();
  const [apiName, setApiName] = useState('My API');
  const [apiVersion, setApiVersion] = useState('v1');
  const [baseUri, setBaseUri] = useState('https://api.example.com/v1');
  const [apiDescription, setApiDescription] = useState('');
  const [types, setTypes] = useState<APIType[]>([]);
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [currentType, setCurrentType] = useState<APIType>({
    name: '',
    baseType: 'object',
    properties: []
  });
  const [currentEndpoint, setCurrentEndpoint] = useState<APIEndpoint>({
    path: '',
    methods: []
  });
  const [currentMethod, setCurrentMethod] = useState<APIMethod>({
    type: 'get',
    responses: [{ code: 200 }]
  });
  const [currentProperty, setCurrentProperty] = useState({
    name: '',
    type: 'string'
  });
  const [currentResponse, setCurrentResponse] = useState({
    code: 200,
    description: 'Success response'
  });
  const [activeTab, setActiveTab] = useState<'types' | 'endpoints' | 'raml'>('types');
  const [generatedRAML, setGeneratedRAML] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  
  // Handle adding a new type
  const handleAddType = () => {
    if (!currentType.name) {
      toast.error('Type name is required');
      return;
    }
    
    if (types.some(t => t.name === currentType.name)) {
      toast.error(`Type '${currentType.name}' already exists`);
      return;
    }
    
    setTypes([...types, {...currentType}]);
    setCurrentType({
      name: '',
      baseType: 'object',
      properties: []
    });
    toast.success(`Type '${currentType.name}' added`);
  };
  
  // Handle adding a property to the current type
  const handleAddProperty = () => {
    if (!currentProperty.name) {
      toast.error('Property name is required');
      return;
    }
    
    if (currentType.properties.some(p => p.name === currentProperty.name)) {
      toast.error(`Property '${currentProperty.name}' already exists on this type`);
      return;
    }
    
    setCurrentType({
      ...currentType,
      properties: [...currentType.properties, {...currentProperty}]
    });
    
    setCurrentProperty({
      name: '',
      type: 'string'
    });
  };
  
  // Handle deleting a property from the current type
  const handleDeleteProperty = (index: number) => {
    const updatedProperties = [...currentType.properties];
    updatedProperties.splice(index, 1);
    setCurrentType({
      ...currentType,
      properties: updatedProperties
    });
  };
  
  // Handle deleting a type
  const handleDeleteType = (index: number) => {
    const updatedTypes = [...types];
    updatedTypes.splice(index, 1);
    setTypes(updatedTypes);
    toast.success('Type deleted');
  };
  
  // Handle adding a new endpoint
  const handleAddEndpoint = () => {
    if (!currentEndpoint.path) {
      toast.error('Endpoint path is required');
      return;
    }
    
    if (endpoints.some(e => e.path === currentEndpoint.path)) {
      toast.error(`Endpoint '${currentEndpoint.path}' already exists`);
      return;
    }
    
    setEndpoints([...endpoints, {...currentEndpoint}]);
    setCurrentEndpoint({
      path: '',
      methods: []
    });
    toast.success(`Endpoint '${currentEndpoint.path}' added`);
  };
  
  // Handle adding a method to the current endpoint
  const handleAddMethod = () => {
    if (currentEndpoint.methods.some(m => m.type === currentMethod.type)) {
      toast.error(`Method '${currentMethod.type}' already exists on this endpoint`);
      return;
    }
    
    setCurrentEndpoint({
      ...currentEndpoint,
      methods: [...currentEndpoint.methods, {...currentMethod}]
    });
    
    setCurrentMethod({
      type: 'get',
      responses: [{ code: 200 }]
    });
    
    toast.success(`${currentMethod.type.toUpperCase()} method added`);
  };
  
  // Handle adding a response to the current method
  const handleAddResponse = () => {
    if (currentMethod.responses.some(r => r.code === currentResponse.code)) {
      toast.error(`Response code ${currentResponse.code} already exists for this method`);
      return;
    }
    
    setCurrentMethod({
      ...currentMethod,
      responses: [...currentMethod.responses, {...currentResponse}]
    });
    
    setCurrentResponse({
      code: 200,
      description: 'Success response'
    });
  };
  
  // Handle deleting a response from the current method
  const handleDeleteResponse = (index: number) => {
    const updatedResponses = [...currentMethod.responses];
    updatedResponses.splice(index, 1);
    setCurrentMethod({
      ...currentMethod,
      responses: updatedResponses
    });
  };
  
  // Handle deleting a method from the current endpoint
  const handleDeleteMethod = (index: number) => {
    const updatedMethods = [...currentEndpoint.methods];
    updatedMethods.splice(index, 1);
    setCurrentEndpoint({
      ...currentEndpoint,
      methods: updatedMethods
    });
  };
  
  // Handle deleting an endpoint
  const handleDeleteEndpoint = (index: number) => {
    const updatedEndpoints = [...endpoints];
    updatedEndpoints.splice(index, 1);
    setEndpoints(updatedEndpoints);
    toast.success('Endpoint deleted');
  };
  
  // Generate RAML
  const handleGenerateRAML = async () => {
    setGenerationError('');
    setIsGenerating(true);
    try {
      // Get workspace ID for contextual data
      const workspaceId = selectedWorkspaceId || selectedWorkspace?.id || '';
      console.log("Using workspace ID for RAML generation:", workspaceId);
      
      const response = await fetch('/api/apl_generate-raml', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiName,
          apiVersion,
          baseUri,
          apiDescription,
          types,
          endpoints,
          mediaTypes: ["application/json"],
          protocols: ["HTTPS"],
          workspaceId // Pass the workspace ID to the function
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.raml) {
        setGeneratedRAML(data.raml);
        setActiveTab('raml');
        toast.success('RAML generated successfully');
      } else {
        throw new Error('Failed to generate RAML');
      }
    } catch (error) {
      console.error('Error generating RAML:', error);
      setGenerationError(error.message || 'Failed to generate RAML');
      toast.error(`RAML generation failed: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedRAML);
    toast.success('RAML copied to clipboard');
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BackButton onBack={onBack} label="Back to Dashboard" />
      
      <Card className="mt-4 border border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-xl font-semibold">RAML API Specification Generator</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <motion.div 
            className="mb-6 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.5 }}
          />
          
          {/* API Metadata Section */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="apiName">API Name</Label>
              <Input 
                id="apiName"
                value={apiName} 
                onChange={(e) => setApiName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="apiVersion">API Version</Label>
              <Input 
                id="apiVersion"
                value={apiVersion} 
                onChange={(e) => setApiVersion(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="baseUri">Base URI</Label>
              <Input 
                id="baseUri"
                value={baseUri} 
                onChange={(e) => setBaseUri(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="apiDescription">API Description</Label>
              <Textarea 
                id="apiDescription"
                value={apiDescription} 
                onChange={(e) => setApiDescription(e.target.value)}
                className="mt-1 h-20"
              />
            </div>
          </div>
          
          {/* Workspace Info */}
          {selectedWorkspace && (
            <div className="mb-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                Using workspace: {selectedWorkspace.name} (ID: {selectedWorkspace.id.substring(0, 8)}...)
              </p>
            </div>
          )}
          
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'types' | 'endpoints' | 'raml')} className="w-full">
            <TabsList className="mb-4 grid grid-cols-3">
              <TabsTrigger value="types">Types</TabsTrigger>
              <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
              <TabsTrigger value="raml">Generated RAML</TabsTrigger>
            </TabsList>
            
            {/* Types Tab */}
            <TabsContent value="types" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">API Types</h3>
                
                {/* Add new type form */}
                <div className="border border-gray-200 rounded-md p-4 space-y-4">
                  <h4 className="text-md font-medium">Add New Type</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="typeName">Type Name</Label>
                      <Input 
                        id="typeName"
                        value={currentType.name} 
                        onChange={(e) => setCurrentType({...currentType, name: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="baseType">Base Type</Label>
                      <select 
                        id="baseType"
                        value={currentType.baseType}
                        onChange={(e) => setCurrentType({...currentType, baseType: e.target.value})}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="object">object</option>
                        <option value="array">array</option>
                        <option value="string">string</option>
                        <option value="number">number</option>
                        <option value="boolean">boolean</option>
                        <option value="date">date</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="typeExample">Example (JSON)</Label>
                    <Textarea 
                      id="typeExample"
                      value={currentType.example || ''} 
                      onChange={(e) => setCurrentType({...currentType, example: e.target.value})}
                      className="mt-1 h-20 font-mono"
                      placeholder='{"id": 123, "name": "Example"}'
                    />
                  </div>
                  
                  {/* Properties section */}
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Properties</h5>
                    
                    {currentType.properties.length > 0 && (
                      <div className="border border-gray-200 rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                              </th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {currentType.properties.map((prop, index) => (
                              <tr key={index}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">{prop.name}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">{prop.type}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-right text-sm">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteProperty(index)}
                                  >
                                    <Trash className="h-4 w-4 text-red-500" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    
                    {/* Add property form */}
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <Input 
                          placeholder="Property Name"
                          value={currentProperty.name} 
                          onChange={(e) => setCurrentProperty({...currentProperty, name: e.target.value})}
                        />
                      </div>
                      <div className="w-40">
                        <select 
                          value={currentProperty.type}
                          onChange={(e) => setCurrentProperty({...currentProperty, type: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="string">string</option>
                          <option value="number">number</option>
                          <option value="integer">integer</option>
                          <option value="boolean">boolean</option>
                          <option value="date">date</option>
                          <option value="datetime">datetime</option>
                          <option value="object">object</option>
                          <option value="array">array</option>
                        </select>
                      </div>
                      <Button 
                        variant="outline"
                        onClick={handleAddProperty}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full"
                    onClick={handleAddType}
                  >
                    Add Type
                  </Button>
                </div>
                
                {/* List of defined types */}
                {types.length > 0 && (
                  <div className="border border-gray-200 rounded-md p-4 space-y-4">
                    <h4 className="text-md font-medium">Defined Types</h4>
                    <div className="space-y-2">
                      {types.map((type, index) => (
                        <div key={index} className="border border-gray-200 rounded-md p-3 flex justify-between items-center">
                          <div>
                            <span className="font-medium">{type.name}</span>
                            <span className="text-gray-500 text-sm ml-2">({type.baseType})</span>
                            <span className="text-gray-500 text-sm ml-2">{type.properties.length} properties</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteType(index)}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Endpoints Tab */}
            <TabsContent value="endpoints" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">API Endpoints</h3>
                
                {/* Add new endpoint form */}
                <div className="border border-gray-200 rounded-md p-4 space-y-4">
                  <h4 className="text-md font-medium">Add New Endpoint</h4>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="endpointPath">Path</Label>
                      <Input 
                        id="endpointPath"
                        value={currentEndpoint.path} 
                        onChange={(e) => setCurrentEndpoint({...currentEndpoint, path: e.target.value})}
                        className="mt-1"
                        placeholder="users/{userId}"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endpointDescription">Description</Label>
                      <Textarea 
                        id="endpointDescription"
                        value={currentEndpoint.description || ''} 
                        onChange={(e) => setCurrentEndpoint({...currentEndpoint, description: e.target.value})}
                        className="mt-1 h-20"
                      />
                    </div>
                  </div>
                  
                  {/* Methods section */}
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Methods</h5>
                    
                    {currentEndpoint.methods.length > 0 && (
                      <div className="border border-gray-200 rounded-md p-3 space-y-2">
                        {currentEndpoint.methods.map((method, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                            <div>
                              <span className="uppercase font-medium">{method.type}</span>
                              <span className="text-gray-500 text-sm ml-2">{method.responses.length} responses</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMethod(index)}
                            >
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Add method form */}
                    <div className="border border-gray-200 rounded-md p-3 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="methodType">Method Type</Label>
                          <select 
                            id="methodType"
                            value={currentMethod.type}
                            onChange={(e) => setCurrentMethod({...currentMethod, type: e.target.value})}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="get">GET</option>
                            <option value="post">POST</option>
                            <option value="put">PUT</option>
                            <option value="delete">DELETE</option>
                            <option value="patch">PATCH</option>
                            <option value="options">OPTIONS</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="methodDescription">Description</Label>
                          <Input 
                            id="methodDescription"
                            value={currentMethod.description || ''} 
                            onChange={(e) => setCurrentMethod({...currentMethod, description: e.target.value})}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center mt-2">
                        <input 
                          type="checkbox" 
                          id="requestBody"
                          checked={currentMethod.requestBody || false}
                          onChange={(e) => setCurrentMethod({...currentMethod, requestBody: e.target.checked})}
                          className="mr-2 rounded"
                        />
                        <Label htmlFor="requestBody" className="text-sm">Has Request Body</Label>
                      </div>
                      
                      {currentMethod.requestBody && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                          <div>
                            <Label htmlFor="requestType">Request Type</Label>
                            <select 
                              id="requestType"
                              value={currentMethod.requestType || ''}
                              onChange={(e) => setCurrentMethod({...currentMethod, requestType: e.target.value})}
                              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                            >
                              <option value="">Select Type</option>
                              {types.map((type, idx) => (
                                <option key={idx} value={type.name}>{type.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label htmlFor="requestExample">Request Example</Label>
                            <Textarea 
                              id="requestExample"
                              value={currentMethod.requestExample || ''} 
                              onChange={(e) => setCurrentMethod({...currentMethod, requestExample: e.target.value})}
                              className="mt-1 h-20 font-mono"
                              placeholder='{"key": "value"}'
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Responses */}
                      <div className="space-y-2 mt-3">
                        <h6 className="text-sm font-medium">Responses</h6>
                        
                        {currentMethod.responses.length > 0 && (
                          <div className="border border-gray-200 rounded-md overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Code
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Description
                                  </th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {currentMethod.responses.map((response, index) => (
                                  <tr key={index}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{response.code}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{response.description || '-'}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteResponse(index)}
                                      >
                                        <Trash className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        
                        {/* Add response form */}
                        <div className="flex space-x-2">
                          <div className="w-24">
                            <Input 
                              type="number"
                              placeholder="Status"
                              value={currentResponse.code} 
                              onChange={(e) => setCurrentResponse({...currentResponse, code: parseInt(e.target.value)})}
                            />
                          </div>
                          <div className="flex-1">
                            <Input 
                              placeholder="Description"
                              value={currentResponse.description || ''} 
                              onChange={(e) => setCurrentResponse({...currentResponse, description: e.target.value})}
                            />
                          </div>
                          <Button 
                            variant="outline"
                            onClick={handleAddResponse}
                          >
                            <Plus className="h-4 w-4 mr-1" /> Add
                          </Button>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full mt-3"
                        onClick={handleAddMethod}
                      >
                        Add Method
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full"
                    onClick={handleAddEndpoint}
                  >
                    Add Endpoint
                  </Button>
                </div>
                
                {/* List of defined endpoints */}
                {endpoints.length > 0 && (
                  <div className="border border-gray-200 rounded-md p-4 space-y-4">
                    <h4 className="text-md font-medium">Defined Endpoints</h4>
                    <div className="space-y-2">
                      {endpoints.map((endpoint, index) => (
                        <div key={index} className="border border-gray-200 rounded-md p-3 flex justify-between items-center">
                          <div>
                            <span className="font-medium">/{endpoint.path}</span>
                            <span className="text-gray-500 text-sm ml-2">{endpoint.methods.length} methods</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEndpoint(index)}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Generated RAML Tab */}
            <TabsContent value="raml" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Generated RAML</h3>
                
                <div className="flex space-x-2">
                  <Button 
                    variant={generatedRAML ? "default" : "outline"} 
                    onClick={handleGenerateRAML}
                    disabled={isGenerating}
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    {isGenerating ? 'Generating...' : generatedRAML ? 'Regenerate' : 'Generate RAML'}
                  </Button>
                  
                  {generatedRAML && (
                    <Button onClick={copyToClipboard}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  )}
                </div>
              </div>
              
              {generationError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                  Error: {generationError}
                </div>
              )}
              
              {!generatedRAML && !isGenerating && !generationError && (
                <div className="p-8 bg-gray-50 border border-gray-200 rounded-md text-center">
                  <p className="text-gray-500">
                    {types.length === 0 && endpoints.length === 0 
                      ? 'Start by adding some types and endpoints, then generate RAML'
                      : 'Click "Generate RAML" to create your API specification'}
                  </p>
                </div>
              )}
              
              {generatedRAML && (
                <div className="border border-gray-200 rounded-md" style={{ minHeight: '500px' }}>
                  <MonacoEditor
                    value={generatedRAML}
                    language="yaml"
                    height="500px"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 flex justify-center">
            <Button 
              size="lg"
              onClick={handleGenerateRAML}
              disabled={isGenerating || (types.length === 0 && endpoints.length === 0)}
              className="px-8"
            >
              {isGenerating ? (
                <span className="flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating RAML...
                </span>
              ) : (
                <span className="flex items-center">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Generate RAML
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RAMLGenerator;
