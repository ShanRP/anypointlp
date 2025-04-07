
import React from 'react';
import { AgentCard } from './AgentCard';
import { Code, FileCode2, TestTube2, FileText, Eye, Database, ArrowRight } from 'lucide-react';
import { motion } from "framer-motion";

export const Features: React.FC = () => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <section id="tools" className="py-20 relative bg-white">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmMGYwZjAiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNGMwIDIuMjEtMS43OSA0LTQgNHMtNC0xLjc5LTQtNHptMC0xM2MwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0YzAgMi4yMS0xLjc5IDQtNCA0cy00LTEuNzktNC00em0wLTEzYzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDRjMCAyLjIxLTEuNzkgNC00IDRzLTQtMS43OS00LTR6TTIxIDM0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDRjMCAyLjIxLTEuNzkgNC00IDRzLTQtMS43OS00LTR6bTAtMTNjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNGMwIDIuMjEtMS43OSA0LTQgNHMtNC0xLjc5LTQtNHptMC0xM2MwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0YzAgMi4yMS0xLjc5IDQtNCA0cy00LTEuNzktNC00eiI+PC9wYXRoPjwvZz48L2c+PC9zdmc+')] opacity-10"></div>
      
      <div className="container px-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="inline-block px-3 py-1 mb-4 text-sm font-medium text-purple-700 bg-purple-100 rounded-full">
            PRODUCT
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            The most comprehensive suite of AI agents
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Designed for IT integrations with any skill level, our AI agents streamline your development workflow
          </p>
          <a 
            href="#explore" 
            className="group inline-flex items-center text-lg text-purple-600 font-medium mt-6 relative overflow-hidden"
          >
            <span>Explore now</span>
            <span className="inline-block ml-2 transition-transform duration-300 group-hover:translate-x-1">
              <ArrowRight size={16} />
            </span>
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 origin-left transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
          </a>
        </motion.div>
        
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12"
        >
          <AgentCard 
            title="Coding Agents"
            description="Generate new integrations, data weave code and enhance existing integrations and code."
            icon={<Code size={24} className="text-purple-600" />}
            color="bg-gradient-to-br from-purple-50 to-purple-100"
            link="#coding"
          />
          
          <AgentCard 
            title="Testing Agents"
            description="Everything you need to generate test data and unit tests."
            icon={<TestTube2 size={24} className="text-purple-600" />}
            color="bg-gradient-to-br from-purple-50 to-purple-100"
            link="#testing"
          />
          
          <AgentCard 
            title="Documentation Agents"
            description="Generate the documentation, mapping tables, and diagrams."
            icon={<FileText size={24} className="text-purple-600" />}
            color="bg-gradient-to-br from-purple-50 to-purple-100"
            link="#documentation"
          />
          
          <AgentCard 
            title="Code Review Agents"
            description="Get answers to anything related to flows, APIs, and code."
            icon={<Eye size={24} className="text-purple-600" />}
            color="bg-gradient-to-br from-purple-50 to-purple-100"
            link="#codereview"
          />
          
          <AgentCard 
            title="Migration Documentation Agent"
            description="Generate specifications from source code."
            icon={<FileCode2 size={24} className="text-purple-600" />}
            color="bg-gradient-to-br from-purple-50 to-purple-100"
            link="#migration"
          />
          
          <AgentCard 
            title="Connector Hub"
            description="Find, share, and use custom connectors for various systems."
            icon={<Database size={24} className="text-purple-600" />}
            color="bg-gradient-to-br from-purple-50 to-purple-100"
            link="#connectors"
          />
        </motion.div>
      </div>
    </section>
  );
};
