/**
 * Keyboard Shortcuts Hook
 * Phase F9: Polish & Hardening
 * 
 * Provides keyboard shortcuts for POS and navigation
 */

import { useEffect, useCallback, useRef } from 'react';

export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  disabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

/**
 * Hook for registering keyboard shortcuts
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, preventDefault = true } = options;
  const shortcutsRef = useRef(shortcuts);
  
  // Update ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      const isContentEditable = target.isContentEditable;

      // Allow F1-F12 even in inputs
      const isFunctionKey = event.key.startsWith('F') && event.key.length <= 3;
      
      if ((isInput || isContentEditable) && !isFunctionKey) {
        return;
      }

      for (const shortcut of shortcutsRef.current) {
        if (shortcut.disabled) continue;

        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = !!shortcut.ctrl === (event.ctrlKey || event.metaKey);
        const shiftMatches = !!shortcut.shift === event.shiftKey;
        const altMatches = !!shortcut.alt === event.altKey;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          if (preventDefault) {
            event.preventDefault();
          }
          shortcut.action();
          return;
        }
      }
    },
    [enabled, preventDefault]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * POS-specific keyboard shortcuts hook
 */
export function usePOSShortcuts(handlers: {
  onNewSale?: () => void;
  onHoldSale?: () => void;
  onRecallSale?: () => void;
  onCheckout?: () => void;
  onClearCart?: () => void;
  onSearch?: () => void;
  onCustomer?: () => void;
  onDiscount?: () => void;
  onVoid?: () => void;
  onReprint?: () => void;
  onSettings?: () => void;
  onHelp?: () => void;
}) {
  const shortcuts: ShortcutConfig[] = [
    {
      key: 'F1',
      action: handlers.onHelp || (() => {}),
      description: 'Help / Show shortcuts',
      disabled: !handlers.onHelp,
    },
    {
      key: 'F2',
      action: handlers.onSearch || (() => {}),
      description: 'Search products',
      disabled: !handlers.onSearch,
    },
    {
      key: 'F3',
      action: handlers.onCustomer || (() => {}),
      description: 'Select customer',
      disabled: !handlers.onCustomer,
    },
    {
      key: 'F4',
      action: handlers.onDiscount || (() => {}),
      description: 'Apply discount',
      disabled: !handlers.onDiscount,
    },
    {
      key: 'F5',
      action: handlers.onHoldSale || (() => {}),
      description: 'Hold current sale',
      disabled: !handlers.onHoldSale,
    },
    {
      key: 'F6',
      action: handlers.onRecallSale || (() => {}),
      description: 'Recall held sale',
      disabled: !handlers.onRecallSale,
    },
    {
      key: 'F7',
      action: handlers.onVoid || (() => {}),
      description: 'Void item',
      disabled: !handlers.onVoid,
    },
    {
      key: 'F8',
      action: handlers.onClearCart || (() => {}),
      description: 'Clear cart',
      disabled: !handlers.onClearCart,
    },
    {
      key: 'F9',
      action: handlers.onReprint || (() => {}),
      description: 'Reprint last receipt',
      disabled: !handlers.onReprint,
    },
    {
      key: 'F10',
      action: handlers.onSettings || (() => {}),
      description: 'POS settings',
      disabled: !handlers.onSettings,
    },
    {
      key: 'F12',
      action: handlers.onCheckout || (() => {}),
      description: 'Checkout / Pay',
      disabled: !handlers.onCheckout,
    },
    {
      key: 'n',
      ctrl: true,
      action: handlers.onNewSale || (() => {}),
      description: 'New sale',
      disabled: !handlers.onNewSale,
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts.filter((s) => !s.disabled);
}

/**
 * Format shortcut key for display
 */
export function formatShortcutKey(shortcut: ShortcutConfig): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.shift) parts.push('Shift');
  parts.push(shortcut.key.toUpperCase());
  return parts.join(' + ');
}

export default useKeyboardShortcuts;
