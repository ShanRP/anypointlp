
/**
 * Utility functions for WebGL and 3D rendering
 */

// Check if WebGL is available in the browser
export const isWebGLAvailable = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (context instanceof WebGLRenderingContext) {
      const extensions = context.getSupportedExtensions();
      return !!extensions;
    }
    
    return false;
  } catch (e) {
    console.error('WebGL detection error:', e);
    return false;
  }
};

// Check if fonts are loaded (used by some 3D text components)
export const areFontsLoaded = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        resolve(true);
      }).catch(() => {
        resolve(false);
      });
    } else {
      // Fallback for browsers without Font Loading API
      setTimeout(() => resolve(true), 1000);
    }
  });
};

// Handle WebGL context loss
export const handleContextLoss = (canvas: HTMLCanvasElement): void => {
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    console.warn('WebGL context lost. Attempting to restore...');
    
    // Attempt to restore context after a brief delay
    setTimeout(() => {
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl instanceof WebGLRenderingContext) {
        // Check if WEBGL_lose_context extension is available
        const ext = gl.getExtension('WEBGL_lose_context');
        if (ext) {
          console.log('Attempting to restore WebGL context...');
          ext.restoreContext();
        }
      }
    }, 1000);
  });
};

// Get device performance level (used to adjust 3D quality)
export const getDevicePerformanceLevel = (): 'high' | 'medium' | 'low' => {
  // Simple heuristic based on user agent and screen resolution
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isHighRes = window.innerWidth * window.innerHeight > 2000000; // More than 2M pixels
  
  if (isMobile && isHighRes) return 'medium';
  if (isMobile) return 'low';
  if (isHighRes) return 'medium';
  return 'high';
};
