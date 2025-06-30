
import { useCallback } from 'react';
import { toast } from 'sonner';

export function useErrorHandler() {
  const handleError = useCallback((error: unknown, customMessage?: string) => {
    console.error('Error occurred:', error);
    
    let message = customMessage || 'An unexpected error occurred';
    
    if (error instanceof Error) {
      // Don't expose technical error messages to users in production
      if (process.env.NODE_ENV === 'development') {
        message = error.message;
      }
    }
    
    toast.error(message);
  }, []);

  return { handleError };
}
