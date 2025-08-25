import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  componentMounts: number;
  reRenders: number;
  lastRenderTime: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const metricsRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    componentMounts: 0,
    reRenders: 0,
    lastRenderTime: Date.now()
  });
  
  const renderStartTime = useRef<number>(Date.now());

  // Track component mount
  useEffect(() => {
    metricsRef.current.componentMounts++;
    console.log(`📊 [${componentName}] Component mounted (${metricsRef.current.componentMounts} times)`);
    
    return () => {
      console.log(`📊 [${componentName}] Component unmounted`);
    };
  }, [componentName]);

  // Track re-renders
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastRender = now - metricsRef.current.lastRenderTime;
    
    metricsRef.current.reRenders++;
    metricsRef.current.renderTime = now - renderStartTime.current;
    metricsRef.current.lastRenderTime = now;

    if (metricsRef.current.reRenders > 1) {
      console.log(`📊 [${componentName}] Re-render #${metricsRef.current.reRenders} (${timeSinceLastRender}ms since last render)`);
      
      // Warn about frequent re-renders
      if (timeSinceLastRender < 100 && metricsRef.current.reRenders > 5) {
        console.warn(`⚠️ [${componentName}] Frequent re-renders detected! Consider optimizing.`);
      }
    }
  });

  const logMetrics = () => {
    console.log(`📊 [${componentName}] Performance Metrics:`, metricsRef.current);
  };

  return {
    metrics: metricsRef.current,
    logMetrics
  };
};

// Performance monitoring utility for API calls
export const measureAPICall = async <T>(
  name: string,
  apiCall: () => Promise<T>
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const result = await apiCall();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`🚀 [API] ${name} completed in ${duration.toFixed(2)}ms`);
    
    // Warn about slow API calls
    if (duration > 2000) {
      console.warn(`⚠️ [API] ${name} took ${duration.toFixed(2)}ms - consider optimization`);
    }
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.error(`❌ [API] ${name} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
};