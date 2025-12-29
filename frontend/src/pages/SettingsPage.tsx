/**
 * Settings Page - Full implementation
 * System configuration management
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocaleStore, toast } from '../stores';
import { usePermissions } from '../hooks';
import { LoadingSpinner } from '../components/ui';
import { FormField, FormError } from '../components/forms';
import { SyncStatusCard } from '../components/offline';
import { SystemUpdateCard } from '../components/system';
import { settingsApi, systemApi } from '../lib/apiClient';
import type { Settings } from '../types';
import { Download, Trash2 } from 'lucide-react';

export function SettingsPage() {
  const { t, locale, setLocale } = useLocaleStore();
  const { hasPermission } = usePermissions();

  const canEdit = hasPermission('settings.edit');
  const canManageSystem = hasPermission('system.manage');

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Settings>>({});

  // Load settings
  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await settingsApi.get();
      setFormData(data);
    } catch {
      toast.error(t('error.load_failed', 'Failed to load settings'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Save settings
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      await settingsApi.update(formData);
      toast.success(t('settings.saved', 'Settings saved successfully'));
      loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.save_failed', 'Failed to save'));
    } finally {
      setIsSaving(false);
    }
  };

  // Clear Cache
  const handleClearCache = async () => {
    try {
      const result = await systemApi.clearCache();
      toast.success(result.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('system.clear_cache_failed', 'Failed to clear cache'));
    }
  };

  // Database Backup
  const handleBackup = async () => {
    try {
      const result = await systemApi.backup();
      toast.success(result.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('system.backup_failed', 'Backup failed'));
    }
  };

  // Initial load
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingSpinner fullPage />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-gray-900)' }}>
          {t('nav.settings', 'Settings')}
        </h1>
      </div>

      {error && (
        <div className="card">
          <FormError message={error} />
        </div>
      )}

      {/* General Settings */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-gray-900)' }}>
          {t('settings.general', 'General Settings')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label={t('settings.company_name', 'Company Name')}>
            <input
              type="text"
              value={formData.company_name || ''}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="input"
              disabled={!canEdit}
              placeholder={t('settings.company_placeholder', 'Your Company Name')}
            />
          </FormField>

          <FormField label={t('settings.phone', 'Phone Number')}>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input"
              disabled={!canEdit}
              placeholder="+218 XX XXX XXXX"
            />
          </FormField>

          <FormField label={t('settings.email', 'Email')}>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              disabled={!canEdit}
              placeholder="contact@company.com"
            />
          </FormField>

          <FormField label={t('settings.address', 'Address')}>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input"
              disabled={!canEdit}
              placeholder={t('settings.address_placeholder', 'Business address')}
            />
          </FormField>
        </div>
      </div>

      {/* Regional Settings */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-gray-900)' }}>
          {t('settings.regional', 'Regional Settings')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label={t('settings.language', 'Language')}>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as 'en' | 'ar')}
              className="input"
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </FormField>

          <FormField label={t('settings.currency', 'Currency')}>
            <input
              type="text"
              value={formData.currency || 'LYD'}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="input"
              disabled={!canEdit}
            />
          </FormField>

          <FormField label={t('settings.timezone', 'Timezone')}>
            <select
              value={formData.timezone || 'Africa/Tripoli'}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="input"
              disabled={!canEdit}
            >
              <option value="Africa/Tripoli">Africa/Tripoli (Libya)</option>
              <option value="UTC">UTC</option>
              <option value="Africa/Cairo">Africa/Cairo (Egypt)</option>
              <option value="Africa/Tunis">Africa/Tunis (Tunisia)</option>
            </select>
          </FormField>

          <FormField label={t('settings.date_format', 'Date Format')}>
            <select
              value={formData.date_format || 'DD/MM/YYYY'}
              onChange={(e) => setFormData({ ...formData, date_format: e.target.value })}
              className="input"
              disabled={!canEdit}
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </FormField>
        </div>
      </div>

      {/* POS Settings */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-gray-900)' }}>
          {t('settings.pos', 'POS Settings')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label={t('settings.receipt_header', 'Receipt Header')}>
            <textarea
              value={formData.receipt_header || ''}
              onChange={(e) => setFormData({ ...formData, receipt_header: e.target.value })}
              className="input"
              rows={3}
              disabled={!canEdit}
              placeholder={t('settings.receipt_header_placeholder', 'Text shown at top of receipts')}
            />
          </FormField>

          <FormField label={t('settings.receipt_footer', 'Receipt Footer')}>
            <textarea
              value={formData.receipt_footer || ''}
              onChange={(e) => setFormData({ ...formData, receipt_footer: e.target.value })}
              className="input"
              rows={3}
              disabled={!canEdit}
              placeholder={t('settings.receipt_footer_placeholder', 'Text shown at bottom of receipts')}
            />
          </FormField>

          <FormField label={t('settings.low_stock_threshold', 'Low Stock Threshold')}>
            <input
              type="number"
              min="0"
              value={formData.low_stock_threshold || 10}
              onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) || 10 })}
              className="input"
              disabled={!canEdit}
            />
          </FormField>
        </div>

        {/* Boolean toggles */}
        <div className="mt-6 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.allow_negative_stock || false}
              onChange={(e) => setFormData({ ...formData, allow_negative_stock: e.target.checked })}
              className="w-5 h-5 rounded"
              style={{ accentColor: 'var(--color-primary-600)' }}
              disabled={!canEdit}
            />
            <div>
              <span className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
                {t('settings.allow_negative', 'Allow Negative Stock')}
              </span>
              <p className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
                {t('settings.allow_negative_desc', 'Allow sales even when stock is zero or below')}
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.require_customer || false}
              onChange={(e) => setFormData({ ...formData, require_customer: e.target.checked })}
              className="w-5 h-5 rounded"
              style={{ accentColor: 'var(--color-primary-600)' }}
              disabled={!canEdit}
            />
            <div>
              <span className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
                {t('settings.require_customer', 'Require Customer Selection')}
              </span>
              <p className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
                {t('settings.require_customer_desc', 'Require a customer to be selected before checkout')}
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.print_receipt_auto || false}
              onChange={(e) => setFormData({ ...formData, print_receipt_auto: e.target.checked })}
              className="w-5 h-5 rounded"
              style={{ accentColor: 'var(--color-primary-600)' }}
              disabled={!canEdit}
            />
            <div>
              <span className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
                {t('settings.auto_print', 'Auto-Print Receipts')}
              </span>
              <p className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
                {t('settings.auto_print_desc', 'Automatically print receipt after each sale')}
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Offline & Sync Settings */}
      <SyncStatusCard />

      {/* System Updates - New Enhanced Component */}
      {canManageSystem && (
        <SystemUpdateCard onUpdateComplete={() => loadSettings()} />
      )}

      {/* System Management */}
      {canManageSystem && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-gray-900)' }}>
            {t('system.management', 'System Management')}
          </h2>
          
          <div className="space-y-4">
            {/* Clear Cache */}
            <div className="flex items-start justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--color-gray-50)' }}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Trash2 className="w-5 h-5" style={{ color: 'var(--color-orange-600)' }} />
                  <span className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
                    {t('system.clear_cache', 'Clear Cache')}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
                  {t('system.clear_cache_desc', 'Clear application cache and compiled views')}
                </p>
              </div>
              <button
                onClick={handleClearCache}
                className="btn btn-secondary"
              >
                <Trash2 className="w-4 h-4" />
                {t('system.clear', 'Clear')}
              </button>
            </div>

            {/* Database Backup */}
            <div className="flex items-start justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--color-gray-50)' }}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Download className="w-5 h-5" style={{ color: 'var(--color-green-600)' }} />
                  <span className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
                    {t('system.backup', 'Database Backup')}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
                  {t('system.backup_desc', 'Create a backup of the database')}
                </p>
              </div>
              <button
                onClick={handleBackup}
                className="btn btn-secondary"
              >
                <Download className="w-4 h-4" />
                {t('system.backup_now', 'Backup')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      {canEdit && (
        <div className="card">
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-primary"
            >
              {isSaving ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('settings.save', 'Save Settings')}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
