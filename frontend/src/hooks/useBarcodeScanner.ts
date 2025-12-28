/**
 * Barcode Scanner Hook
 * Listens for barcode scanner input at the page level
 * Barcode scanners typically type characters quickly and end with Enter
 */

import { useEffect, useRef, useCallback } from 'react';

interface UseBarcodeSccannerOptions {
  onScan: (barcode: string) => void;
  enabled?: boolean;
  minLength?: number;
  maxDelay?: number; // Max delay between keystrokes (ms)
}

export function useBarcodeScanner({
  onScan,
  enabled = true,
  minLength = 3,
  maxDelay = 50, // Barcode scanners type very fast, usually < 50ms between chars
}: UseBarcodeSccannerOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if user is typing in an input field (except for Enter)
      const target = e.target as HTMLElement;
      const isInputField = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable;

      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTimeRef.current;

      // Reset buffer if too much time has passed (user is typing manually)
      if (timeSinceLastKey > maxDelay && bufferRef.current.length > 0) {
        bufferRef.current = '';
      }

      lastKeyTimeRef.current = now;

      // Handle Enter key - process the barcode
      if (e.key === 'Enter') {
        if (bufferRef.current.length >= minLength) {
          e.preventDefault();
          e.stopPropagation();
          onScan(bufferRef.current);
        }
        bufferRef.current = '';
        return;
      }

      // Only capture printable characters for barcode
      // Barcode scanners send single printable characters
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // If typing in input field with slow typing, let it through
        if (isInputField && timeSinceLastKey > maxDelay) {
          return;
        }
        
        // Fast typing (barcode scanner) - capture it
        if (timeSinceLastKey <= maxDelay || bufferRef.current.length === 0) {
          // Prevent default only for fast typing (barcode scanner)
          if (!isInputField || timeSinceLastKey <= maxDelay) {
            bufferRef.current += e.key;
          }
        }
      }
    },
    [enabled, minLength, maxDelay, onScan]
  );

  useEffect(() => {
    if (!enabled) return;

    // Use capture phase to intercept before other handlers
    document.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [enabled, handleKeyDown]);

  // Clear buffer on disable
  useEffect(() => {
    if (!enabled) {
      bufferRef.current = '';
    }
  }, [enabled]);

  return {
    clearBuffer: () => {
      bufferRef.current = '';
    },
  };
}
