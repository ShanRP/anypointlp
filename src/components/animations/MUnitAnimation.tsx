
import React, { Suspense, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AnimatedCodeBlock from './AnimatedCodeBlock';
import { TestTube2 } from 'lucide-react';
import { isWebGLAvailable } from '@/utils/webGLUtil';
import ErrorBoundary from '@/components/ErrorBoundary';

const munitCode = `<munit:test name="test-suite" >
  <munit:behavior>
    <munit:when description="When">
      <munit:set-event>
        <munit:payload value="#[{
          'name': 'test',
          'value': 123
        }]" />
      </munit:set-event>
    </munit:when>
    <munit:then description="Then">
      <munit:assertion-collection>
        <munit:assert-that expression="#[payload.name]" is="#[equalTo('test')]" />
        <munit:assert-that expression="#[payload.value]" is="#[equalTo(123)]" />
      </munit:assertion-collection>
    </munit:then>
  </munit:behavior>
</munit:test>`;

export const MUnitAnimation = () => {
  const [webGLSupported, setWebGLSupported] = useState(true);

  useEffect(() => {
    setWebGLSupported(isWebGLAvailable());
  }, []);

  return (
    <div className="relative bg-black/40 backdrop-blur-sm rounded-xl border border-purple-500/20 overflow-hidden p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex items-center gap-2 mb-6"
      >
        <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
          <TestTube2 className="w-4 h-4 text-purple-400" />
        </div>
        <h3 className="text-xl font-bold text-white font-display">MUnit Test Generation</h3>
      </motion.div>

      <ErrorBoundary suppressToast={true}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="rounded-lg overflow-hidden border border-white/10"
        >
          <AnimatedCodeBlock code={munitCode} language="xml" typingSpeed={1} />
        </motion.div>
      </ErrorBoundary>

      <motion.div
        className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500"
        animate={{
          scaleX: [0, 1],
          x: ['-100%', '0%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: 1
        }}
      />
    </div>
  );
};

export default MUnitAnimation;
