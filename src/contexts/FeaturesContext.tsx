
import React, { createContext, useContext, useState } from 'react';

type Feature = 
  | 'dataweave' 
  | 'integration'
  | 'raml'
  | 'munit'
  | 'sampleData'
  | 'document'
  | 'diagram'
  | 'exchange'
  | 'jobBoard'
  | 'codingAssistant';

interface FeaturesContextType {
  enabledFeatures: Feature[];
}

const FeaturesContext = createContext<FeaturesContextType>({
  enabledFeatures: [],
});

export function FeaturesProvider({ children }: { children: React.ReactNode }) {
  // In production, this would come from your backend/API
  const [enabledFeatures] = useState<Feature[]>([
    'dataweave',
    'integration',
    'raml',
    // Comment out features that should be disabled
    // 'munit',
    // 'sampleData',
    // 'document',
    // 'diagram',
    // 'exchange',
    // 'jobBoard',
    // 'codingAssistant'
  ]);

  return (
    <FeaturesContext.Provider value={{ enabledFeatures }}>
      {children}
    </FeaturesContext.Provider>
  );
}

export const useFeatures = () => {
  const context = useContext(FeaturesContext);
  if (!context) {
    throw new Error('useFeatures must be used within a FeaturesProvider');
  }
  return context;
};
