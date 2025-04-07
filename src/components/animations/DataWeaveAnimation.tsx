
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AnimatedCodeBlock from './AnimatedCodeBlock';
import LoadingSpinner from '../animations/LoadingSpinner';

export const DataWeaveAnimation: React.FC = () => {
  const [animationStep, setAnimationStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    const interval = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % 3);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(loadingTimer);
    };
  }, []);

  const inputJson = `{
  "order": {
    "id": "ORD-123456",
    "items": [
      {
        "productId": "PROD-001",
        "name": "Widget A",
        "quantity": 2,
        "price": 29.99
      },
      {
        "productId": "PROD-002",
        "name": "Widget B",
        "quantity": 1,
        "price": 49.99
      }
    ],
    "customer": {
      "id": "CUST-789",
      "name": "John Doe",
      "email": "john.doe@example.com"
    },
    "shipping": {
      "method": "express",
      "address": {
        "street": "123 Main St",
        "city": "Anytown",
        "state": "CA",
        "zip": "12345"
      }
    },
    "payment": {
      "method": "credit_card",
      "amount": 109.97,
      "status": "approved"
    }
  }
}`;

  const dataWeaveCode = `%dw 2.0
output application/json
---
{
  "orderId": payload.order.id,
  "customerInfo": {
    "customerId": payload.order.customer.id,
    "name": payload.order.customer.name,
    "contactEmail": payload.order.customer.email
  },
  "items": payload.order.items map ( item ) -> {
    "id": item.productId,
    "name": item.name,
    "quantity": item.quantity,
    "unitPrice": item.price,
    "total": item.quantity * item.price
  },
  "shippingDetails": {
    "method": payload.order.shipping.method,
    "deliveryAddress": {
      "street": payload.order.shipping.address.street,
      "city": payload.order.shipping.address.city,
      "state": payload.order.shipping.address.state,
      "zipCode": payload.order.shipping.address.zip
    }
  },
  "paymentInfo": {
    "method": payload.order.payment.method,
    "totalAmount": payload.order.payment.amount,
    "status": payload.order.payment.status
  },
  "metadata": {
    "transformedAt": now(),
    "source": "MuleSoft"
  }
}`;

  const outputJson = `{
  "orderId": "ORD-123456",
  "customerInfo": {
    "customerId": "CUST-789",
    "name": "John Doe",
    "contactEmail": "john.doe@example.com"
  },
  "items": [
    {
      "id": "PROD-001",
      "name": "Widget A",
      "quantity": 2,
      "unitPrice": 29.99,
      "total": 59.98
    },
    {
      "id": "PROD-002",
      "name": "Widget B",
      "quantity": 1,
      "unitPrice": 49.99,
      "total": 49.99
    }
  ],
  "shippingDetails": {
    "method": "express",
    "deliveryAddress": {
      "street": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zipCode": "12345"
    }
  },
  "paymentInfo": {
    "method": "credit_card",
    "totalAmount": 109.97,
    "status": "approved"
  },
  "metadata": {
    "transformedAt": "2023-08-15T14:30:45.123Z",
    "source": "MuleSoft"
  }
}`;

  if (isLoading) {
    return (
      <div className="relative bg-black/40 backdrop-blur-sm rounded-xl border border-purple-500/20 overflow-hidden p-6 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center">
          <LoadingSpinner size="lg" color="purple" />
          <p className="mt-4 text-purple-300">Loading DataWeave Animation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-black/40 backdrop-blur-sm rounded-xl border border-purple-500/20 overflow-hidden p-6">
      <h3 className="text-xl font-bold text-white mb-4">DataWeave Transformation</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {/* Input JSON */}
        <div className={`md:col-span-2 ${animationStep !== 0 ? 'opacity-40' : ''} transition-opacity duration-500`}>
          <div className="text-purple-300 font-medium mb-2">Input Data</div>
          <AnimatedCodeBlock code={inputJson} language="json" typingSpeed={1} />
        </div>
        
        {/* DataWeave Transformation */}
        <div className={`md:col-span-2 ${animationStep !== 1 ? 'opacity-40' : ''} transition-opacity duration-500`}>
          <div className="text-purple-300 font-medium mb-2">DataWeave Script</div>
          <AnimatedCodeBlock code={dataWeaveCode} language="dw" delay={100} typingSpeed={1} />
          
          {/* Animation arrows */}
          <div className="hidden md:flex justify-between mt-4">
            <motion.div
              animate={{ x: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-purple-400"
            >
              ←
            </motion.div>
            <motion.div
              animate={{ x: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-purple-400"
            >
              →
            </motion.div>
          </div>
        </div>
        
        {/* Output JSON */}
        <div className={`md:col-span-2 ${animationStep !== 2 ? 'opacity-40' : ''} transition-opacity duration-500`}>
          <div className="text-purple-300 font-medium mb-2">Transformed Output</div>
          <AnimatedCodeBlock code={outputJson} language="json" delay={200} typingSpeed={1} />
        </div>
      </div>
      
      {/* Flow animation */}
      <motion.div
        className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-green-500"
        animate={{
          scaleX: [0, 1],
          x: ['-100%', '0%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: 'loop',
          repeatDelay: 1
        }}
      />
      
      {/* Background animations */}
      <motion.div
        className="absolute -top-20 -right-20 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
    </div>
  );
};

export default DataWeaveAnimation;
