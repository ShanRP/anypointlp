
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const ApiAnimation: React.FC = () => {
  const [activePath, setActivePath] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePath((prev) => (prev + 1) % 4);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  const apiPaths = [
    { method: 'GET', path: '/api/customers', response: '200 OK', color: 'bg-green-500' },
    { method: 'POST', path: '/api/orders', response: '201 Created', color: 'bg-blue-500' },
    { method: 'PUT', path: '/api/products/{id}', response: '200 OK', color: 'bg-yellow-500' },
    { method: 'DELETE', path: '/api/items/{id}', response: '204 No Content', color: 'bg-red-500' },
  ];
  
  const ramlCode = `#%RAML 1.0
title: E-Commerce API
version: v1
baseUri: https://api.example.com/{version}
mediaType: application/json

types:
  Customer:
    properties:
      id: string
      name: string
      email: string
      
  Product:
    properties:
      id: string
      name: string
      price: number
      description: string
      
  Order:
    properties:
      id: string
      customerId: string
      items:
        type: array
        items:
          properties:
            productId: string
            quantity: number
      status: string
      
/customers:
  get:
    description: Get all customers
    responses:
      200:
        body:
          type: array
          items: Customer
  post:
    description: Create a new customer
    body:
      type: Customer
    responses:
      201:
        body:
          type: Customer
          
  /{customerId}:
    get:
      description: Get customer by ID
      responses:
        200:
          body:
            type: Customer
            
/products:
  get:
    description: Get all products
    responses:
      200:
        body:
          type: array
          items: Product
          
  /{productId}:
    put:
      description: Update a product
      body:
        type: Product
      responses:
        200:
          body:
            type: Product
            
/orders:
  post:
    description: Create a new order
    body:
      type: Order
    responses:
      201:
        body:
          type: Order`;
          
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2 bg-black/40 backdrop-blur-sm rounded-xl border border-purple-500/20 overflow-hidden p-6">
        <h3 className="text-xl font-bold text-white mb-4">API Endpoints</h3>
        
        <div className="space-y-4">
          {apiPaths.map((api, index) => (
            <motion.div
              key={index}
              className={`p-4 rounded-lg border ${index === activePath ? 'border-purple-500 bg-purple-900/20' : 'border-gray-700 bg-black/40'} transition-colors duration-300`}
              animate={index === activePath ? { scale: [1, 1.03, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center space-x-3 mb-2">
                <span className={`px-2 py-1 rounded text-xs font-bold ${api.method === 'GET' ? 'bg-green-800 text-green-200' : api.method === 'POST' ? 'bg-blue-800 text-blue-200' : api.method === 'PUT' ? 'bg-yellow-800 text-yellow-200' : 'bg-red-800 text-red-200'}`}>
                  {api.method}
                </span>
                <span className="text-gray-300 font-mono text-sm">{api.path}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Response:</span>
                <span className="text-xs font-medium text-white bg-gray-800 px-2 py-1 rounded">{api.response}</span>
              </div>
              
              {index === activePath && (
                <motion.div
                  className={`h-0.5 mt-2 ${api.method === 'GET' ? 'bg-green-500' : api.method === 'POST' ? 'bg-blue-500' : api.method === 'PUT' ? 'bg-yellow-500' : 'bg-red-500'}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1 }}
                />
              )}
            </motion.div>
          ))}
        </div>
        
        <motion.div
          className="mt-4 p-4 rounded-lg border border-gray-700 bg-black/40"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">API Activity:</span>
            <span className="flex items-center">
              <motion.span
                className="w-2 h-2 rounded-full bg-green-500 mr-2"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-green-400">Live</span>
            </span>
          </div>
          <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden mt-2">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500"
              animate={{ x: ['-100%', '0%'] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </div>
      
      <div className="lg:col-span-3 bg-black/40 backdrop-blur-sm rounded-xl border border-purple-500/20 overflow-hidden p-6">
        <h3 className="text-xl font-bold text-white mb-4">RAML Specification</h3>
        
        <div className="overflow-auto max-h-[500px] p-4 bg-black/60 rounded-lg border border-gray-800">
          <pre className="text-xs text-gray-300 font-mono">
            <code>
              {ramlCode}
            </code>
          </pre>
          
          <motion.div
            className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-black to-transparent"
            initial={{ opacity: 0.7 }}
            animate={{ opacity: [0.7, 0.9, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
        
        {/* Dynamic connection lines */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: -1 }}>
          <motion.path
            d="M100,100 C150,50 250,150 300,100"
            stroke="rgba(147, 51, 234, 0.2)"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'loop', repeatDelay: 1 }}
          />
          <motion.path
            d="M150,200 C200,150 300,250 350,200"
            stroke="rgba(59, 130, 246, 0.2)"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'loop', repeatDelay: 0.5 }}
          />
        </svg>
        
        <motion.div
          className="absolute -bottom-20 -right-20 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      </div>
    </div>
  );
};

export default ApiAnimation;
