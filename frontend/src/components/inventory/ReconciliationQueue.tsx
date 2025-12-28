/**
 * Reconciliation Queue Component
 * Displays pending stock reconciliation conflicts
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocaleStore, toast } from '../../stores';
import { Modal, LoadingSpinner, Badge, EmptyState } from '../ui';
import { FormField } from '../forms';
import { inventoryApi } from '../../lib/apiClient';
import type { ReconciliationItem } from '../../types';

interface ReconciliationQueueProps {
  isOpen: boolean;
  onClose: () => void;
  onResolved?: () => void;
}

export function ReconciliationQueue({
  isOpen,
  onClose,
  onResolved,
}: ReconciliationQueueProps) {
  const { t, locale } = useLocaleStore();

  const [items, setItems] = useState<ReconciliationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ReconciliationItem | null>(null);
  const [resolutionAction, setResolutionAction] = useState<'accept' | 'adjust' | 'ignore'>('accept');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  // Load pending reconciliations
  const loadItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await inventoryApi.pendingReconciliations();
      setItems(data);
    } catch {
      toast.error(t('error.load_failed', 'Failed to load reconciliation queue'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isOpen) {
      loadItems();
    }
  }, [isOpen, loadItems]);

  // Handle resolution
  const handleResolve = async () => {
    if (!selectedItem) return;

    setIsResolving(true);
    try {
      await inventoryApi.resolveReconciliation(selectedItem.id, {
        action: resolutionAction,
        notes: resolutionNotes || undefined,
      });
      toast.success(t('inventory.reconciliation_resolved', 'Conflict resolved'));
      setSelectedItem(null);
      setResolutionNotes('');
      loadItems();
      onResolved?.();
    } catch {
      toast.error(t('error.save_failed', 'Failed to resolve conflict'));
    } finally {
      setIsResolving(false);
    }
  };

  // Get action label
  const getActionLabel = (action: 'accept' | 'adjust' | 'ignore') => {
    switch (action) {
      case 'accept':
        return t('inventory.accept_actual', 'Accept Actual Count');
      case 'adjust':
        return t('inventory.adjust_to_expected', 'Adjust to Expected');
      case 'ignore':
        return t('inventory.ignore_difference', 'Ignore Difference');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('inventory.reconciliation_queue', 'Reconciliation Queue')}
      size="xl"
    >
      {isLoading ? (
        <div className="py-12">
          <LoadingSpinner />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="✅"
          title={t('inventory.no_conflicts', 'No Conflicts')}
          description={t('inventory.no_conflicts_desc', 'All stock levels are synchronized')}
        />
      ) : selectedItem ? (
        // Resolution form
        <div className="space-y-4">
          <button
            onClick={() => setSelectedItem(null)}
            className="flex items-center gap-2 text-sm"
            style={{ color: 'var(--color-primary-600)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('common.back', 'Back')}
          </button>

          {/* Item details */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-gray-50)' }}>
            <div className="font-medium mb-2" style={{ color: 'var(--color-gray-900)' }}>
              {selectedItem.product?.name}
            </div>
            <div className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
              {selectedItem.warehouse?.name}
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <div className="text-xs" style={{ color: 'var(--color-gray-500)' }}>
                  {t('inventory.expected', 'Expected')}
                </div>
                <div className="text-xl font-semibold" style={{ color: 'var(--color-gray-900)' }}>
                  {selectedItem.expected_quantity}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs" style={{ color: 'var(--color-gray-500)' }}>
                  {t('inventory.actual', 'Actual')}
                </div>
                <div className="text-xl font-semibold" style={{ color: 'var(--color-primary-600)' }}>
                  {selectedItem.actual_quantity}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs" style={{ color: 'var(--color-gray-500)' }}>
                  {t('inventory.difference', 'Difference')}
                </div>
                <div
                  className="text-xl font-semibold"
                  style={{
                    color: selectedItem.difference > 0
                      ? 'var(--color-success-600)'
                      : 'var(--color-error-600)',
                  }}
                >
                  {selectedItem.difference > 0 ? '+' : ''}{selectedItem.difference}
                </div>
              </div>
            </div>
          </div>

          {/* Resolution options */}
          <FormField label={t('inventory.resolution_action', 'Resolution Action')}>
            <div className="space-y-2">
              {(['accept', 'adjust', 'ignore'] as const).map((action) => (
                <label
                  key={action}
                  className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                  style={{
                    borderColor: resolutionAction === action
                      ? 'var(--color-primary-500)'
                      : 'var(--color-gray-200)',
                    backgroundColor: resolutionAction === action
                      ? 'var(--color-primary-50)'
                      : 'transparent',
                  }}
                >
                  <input
                    type="radio"
                    name="resolution"
                    value={action}
                    checked={resolutionAction === action}
                    onChange={() => setResolutionAction(action)}
                    className="w-4 h-4"
                    style={{ accentColor: 'var(--color-primary-600)' }}
                  />
                  <div>
                    <div className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
                      {getActionLabel(action)}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
                      {action === 'accept' && t('inventory.accept_desc', 'Use the actual counted quantity as the new stock level')}
                      {action === 'adjust' && t('inventory.adjust_desc', 'Create an adjustment to restore the expected quantity')}
                      {action === 'ignore' && t('inventory.ignore_desc', 'Mark as reviewed but take no action')}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </FormField>

          {/* Notes */}
          <FormField label={t('inventory.resolution_notes', 'Notes')}>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="input"
              rows={2}
              placeholder={t('inventory.resolution_notes_placeholder', 'Explain the resolution...')}
            />
          </FormField>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setSelectedItem(null)}
              className="btn btn-secondary flex-1"
              disabled={isResolving}
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              onClick={handleResolve}
              className="btn btn-primary flex-1"
              disabled={isResolving}
            >
              {isResolving ? (
                <LoadingSpinner size="sm" />
              ) : (
                t('inventory.resolve', 'Resolve')
              )}
            </button>
          </div>
        </div>
      ) : (
        // Items list
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
              {items.length} {t('inventory.pending_conflicts', 'pending conflicts')}
            </span>
            <Badge variant="warning">{items.length}</Badge>
          </div>

          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="w-full p-4 rounded-lg border text-start transition-colors hover:border-primary-300"
              style={{ borderColor: 'var(--color-gray-200)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
                    {item.product?.name}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
                    {item.product?.sku} • {item.warehouse?.name}
                  </div>
                </div>
                <div className="text-end">
                  <Badge
                    variant={item.difference > 0 ? 'success' : 'danger'}
                  >
                    {item.difference > 0 ? '+' : ''}{item.difference}
                  </Badge>
                  <div className="text-xs mt-1" style={{ color: 'var(--color-gray-400)' }}>
                    {new Date(item.created_at).toLocaleDateString(locale)}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}

export default ReconciliationQueue;
