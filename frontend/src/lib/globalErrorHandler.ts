/**
 * Global Error Handler
 * Phase F9: Polish & Hardening
 * 
 * Handles unhandled promise rejections and global errors
 */

import { useEffect } from 'react';
import { toast } from '../stores';

interface ErrorInfo {
  message: string;
  stack?: string;
  timestamp: Date;
}

// Store recent errors for debugging
const errorLog: ErrorInfo[] = [];
const MAX_ERROR_LOG = 50;

function logError(error: ErrorInfo) {
  errorLog.unshift(error);
  if (errorLog.length > MAX_ERROR_LOG) {
    errorLog.pop();
  }
  
  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('[GlobalError]', error);
  }
}

export function getErrorLog(): ErrorInfo[] {
  return [...errorLog];
}

export function clearErrorLog(): void {
  errorLog.length = 0;
}

/**
 * Hook to set up global error handlers
 * Should be called once at app root level
 */
export function useGlobalErrorHandler() {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      
      const error = event.reason;
      const message = error instanceof Error ? error.message : String(error);
      
      logError({
        message: `Unhandled Promise Rejection: ${message}`,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date(),
      });

      // Show user-friendly message
      if (message.includes('Network') || message.includes('fetch')) {
        toast.error('Network error. Please check your connection.');
      } else if (message.includes('401') || message.includes('Unauthorized')) {
        // Auth errors handled by interceptor
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    };

    // Handle global errors
    const handleError = (event: ErrorEvent) => {
      logError({
        message: event.message,
        stack: event.error?.stack,
        timestamp: new Date(),
      });

      // Don't show toast for script errors as they're usually development issues
      if (import.meta.env.PROD) {
        toast.error('An error occurred. Please refresh the page.');
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);
}

/**
 * Format error message for display
 */
export function formatErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  if (error instanceof Error) {
    // Handle axios-style errors
    if ('response' in error && (error as Record<string, unknown>).response) {
      const response = (error as Record<string, unknown>).response as Record<string, unknown>;
      const data = response.data as Record<string, unknown> | undefined;
      if (data?.message) {
        return String(data.message);
      }
      if (data?.error) {
        return String(data.error);
      }
    }
    return error.message || fallback;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  
  return fallback;
}

/**
 * Extract validation errors from API response
 */
export function extractValidationErrors(error: unknown): Record<string, string[]> | null {
  if (error instanceof Error && 'response' in error) {
    const response = (error as Record<string, unknown>).response as Record<string, unknown>;
    if (response?.status === 422 && response.data) {
      const data = response.data as Record<string, unknown>;
      if (data.errors && typeof data.errors === 'object') {
        return data.errors as Record<string, string[]>;
      }
    }
  }
  return null;
}

export default useGlobalErrorHandler;
