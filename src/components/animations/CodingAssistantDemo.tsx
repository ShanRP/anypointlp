
import React from 'react';
import { motion } from 'framer-motion';
import { Code, MessageSquare, Copy, Terminal } from 'lucide-react';
import AnimatedCodeBlock from './AnimatedCodeBlock';

const CodingAssistantDemo = () => {
  const sampleConversation = [
    {
      role: 'user',
      content: 'How do I implement error handling in a Mule flow?'
    },
    {
      role: 'assistant',
      content: `Here's an example of error handling in a Mule flow:


<error-handler>
    <on-error-propagate type="ANY">
        <ee:transform>
            <ee:message>
                <ee:set-payload><![CDATA[
                    %dw 2.0
                    output application/json
                    ---
                    {
                        "error": {
                            "type": error.errorType.identifier,
                            "message": error.description,
                            "timestamp": now()
                        }
                    }
                ]]></ee:set-payload>
            </ee:message>
        </ee:transform>
        <logger level="ERROR" 
                message="Error occurred: #[error.description]"/>
    </on-error-propagate>
</error-handler>
`
    }
  ];

  return (
    <section className="py-20 relative overflow-hidden bg-black">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-block px-4 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm font-medium mb-4 font-geistSans">
            AI-Powered Assistant
          </div>
          <h2 className="text-4xl font-bold text-white mb-6 font-display">
            Your Personal MuleSoft Expert
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto font-geistSans">
            Get instant help with code, best practices, and troubleshooting from our AI assistant
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden"
          >
            <div className="border-b border-gray-800 p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500/20 p-2 rounded-lg">
                  <Code className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium font-geistSans">Coding Assistant</h3>
                  <p className="text-sm text-gray-400 font-geistSans">Ask anything about MuleSoft development</p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-6">
              {sampleConversation.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      msg.role === 'user'
                        ? 'bg-purple-600 text-white ml-auto'
                        : 'bg-gray-800 text-gray-100'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <AnimatedCodeBlock
                        code={msg.content}
                        language="markdown"
                        delay={500}
                        typingSpeed={5}
                      />
                    ) : (
                      <div className="flex items-start gap-2 font-geistSans">
                        <MessageSquare className="w-4 h-4 mt-1" />
                        <span>{msg.content}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="border-t border-gray-800 p-4">
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 rounded-lg text-white font-geistSans"
                >
                  <Terminal className="w-4 h-4" />
                  <span>Try It Now</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-gray-300 font-geistSans"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Sample</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CodingAssistantDemo;
