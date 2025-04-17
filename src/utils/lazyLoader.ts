
import { lazy, Suspense, LazyExoticComponent, ComponentType } from 'react';

interface LazyLoaderOptions {
  fallback?: JSX.Element;
  onLoad?: () => void;
  errorFallback?: (error: Error) => JSX.Element;
}

/**
 * Creates a lazily loaded component that only triggers the import when the component
 * is actually needed. This helps prevent unnecessary API calls from being triggered
 * when components are imported but not used.
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoaderOptions = {}
) {
  // Create the lazy component with React's lazy function
  const LazyComponent = lazy(importFn);
  
  // Return a wrapped component that includes Suspense and error handling
  return (props: React.ComponentProps<T>) => {
    // Call onLoad callback if provided
    if (options.onLoad) {
      options.onLoad();
    }
    
    // Return the lazy component wrapped in Suspense
    return (
      <Suspense fallback={options.fallback || <div>Loading...</div>}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Registry to store and manage lazy components
 */
export class LazyComponentRegistry {
  private static components: Map<string, LazyExoticComponent<any>> = new Map();
  private static loadedComponents: Set<string> = new Set();
  
  /**
   * Register a component to be lazily loaded
   */
  static register<T extends ComponentType<any>>(
    id: string,
    importFn: () => Promise<{ default: T }>
  ): LazyExoticComponent<T> {
    // If already registered, return the existing component
    if (this.components.has(id)) {
      return this.components.get(id) as LazyExoticComponent<T>;
    }
    
    // Create a new lazy component
    const lazyComponent = lazy(() => {
      // Mark as loaded when imported
      this.loadedComponents.add(id);
      return importFn();
    });
    
    // Store in registry
    this.components.set(id, lazyComponent);
    return lazyComponent;
  }
  
  /**
   * Check if a component has been loaded
   */
  static isLoaded(id: string): boolean {
    return this.loadedComponents.has(id);
  }
  
  /**
   * Reset the loaded state (useful for testing)
   */
  static reset() {
    this.loadedComponents.clear();
  }
}
