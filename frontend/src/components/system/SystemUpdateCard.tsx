/**
 * System Update Card Component
 * Provides a comprehensive UI for checking, downloading, and installing system updates
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Shield,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
  ArrowRight,
  Database,
  Package
} from 'lucide-react';
import { useLocaleStore, toast } from '../../stores';
import { systemApi } from '../../lib/apiClient';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Modal } from '../ui/Modal';

// Types for Update System
export interface VersionInfo {
  current_version: string;
  latest_version: string;
  is_update_available: boolean;
  release_date?: string;
  changelog?: ChangelogEntry[];
  download_size?: string;
  requires_migration?: boolean;
  min_php_version?: string;
  breaking_changes?: string[];
}

export interface ChangelogEntry {
  version: string;
  date: string;
  type: 'feature' | 'fix' | 'security' | 'improvement' | 'breaking';
  description: string;
}

export interface UpdateProgress {
  stage: 'idle' | 'checking' | 'downloading' | 'backing_up' | 'installing' | 'migrating' | 'completing' | 'done' | 'error';
  progress: number; // 0-100
  message: string;
  details?: string;
}

// Update Stage Labels
const STAGE_LABELS: Record<UpdateProgress['stage'], { label: string; icon: React.ReactNode }> = {
  idle: { label: 'Ready', icon: <Package className="w-5 h-5" /> },
  checking: { label: 'Checking for updates...', icon: <RefreshCw className="w-5 h-5 animate-spin" /> },
  downloading: { label: 'Downloading update...', icon: <Download className="w-5 h-5 animate-pulse" /> },
  backing_up: { label: 'Creating backup...', icon: <Database className="w-5 h-5 animate-pulse" /> },
  installing: { label: 'Installing update...', icon: <Loader2 className="w-5 h-5 animate-spin" /> },
  migrating: { label: 'Running migrations...', icon: <Database className="w-5 h-5 animate-pulse" /> },
  completing: { label: 'Finalizing...', icon: <Loader2 className="w-5 h-5 animate-spin" /> },
  done: { label: 'Update complete!', icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
  error: { label: 'Update failed', icon: <AlertCircle className="w-5 h-5 text-red-500" /> },
};

// Changelog type colors
const CHANGELOG_TYPE_COLORS: Record<ChangelogEntry['type'], string> = {
  feature: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  fix: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  security: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  improvement: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  breaking: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

interface SystemUpdateCardProps {
  onUpdateComplete?: () => void;
}

export function SystemUpdateCard({ onUpdateComplete }: SystemUpdateCardProps) {
  const { t } = useLocaleStore();
  
  // State
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [updateProgress, setUpdateProgress] = useState<UpdateProgress>({
    stage: 'idle',
    progress: 0,
    message: '',
  });
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Check for updates
  const checkForUpdates = useCallback(async () => {
    setIsCheckingUpdate(true);
    setUpdateError(null);
    setUpdateProgress({ stage: 'checking', progress: 10, message: t('system.checking_updates', 'Checking for updates...') });

    try {
      const info = await systemApi.checkForUpdates();
      setVersionInfo(info);
      setLastChecked(new Date());
      setUpdateProgress({ stage: 'idle', progress: 0, message: '' });
      
      if (info.is_update_available) {
        toast.info(t('system.update_available', 'A new version is available: {{version}}').replace('{{version}}', info.latest_version));
      } else {
        toast.success(t('system.up_to_date', 'Your system is up to date!'));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('system.check_failed', 'Failed to check for updates');
      setUpdateError(message);
      setUpdateProgress({ stage: 'error', progress: 0, message });
      toast.error(message);
    } finally {
      setIsCheckingUpdate(false);
    }
  }, [t]);

  // Start update process
  const startUpdate = async () => {
    setShowConfirmModal(false);
    setUpdateError(null);

    const stages: Array<{ stage: UpdateProgress['stage']; progress: number; duration: number }> = [
      { stage: 'backing_up', progress: 20, duration: 2000 },
      { stage: 'downloading', progress: 40, duration: 3000 },
      { stage: 'installing', progress: 60, duration: 3000 },
      { stage: 'migrating', progress: 80, duration: 2000 },
      { stage: 'completing', progress: 95, duration: 1500 },
    ];

    try {
      // Simulate progress through stages (in real implementation, this would be SSE or polling)
      for (const { stage, progress, duration } of stages) {
        setUpdateProgress({
          stage,
          progress,
          message: STAGE_LABELS[stage].label,
        });
        
        // If it's the installing stage, actually call the API
        if (stage === 'installing') {
          const result = await systemApi.update();
          if (!result.success) {
            throw new Error(result.message);
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, duration));
      }

      // Complete
      setUpdateProgress({
        stage: 'done',
        progress: 100,
        message: t('system.update_success', 'Update completed successfully!'),
      });

      toast.success(t('system.update_success', 'System updated successfully!'));
      
      // Refresh version info
      setTimeout(async () => {
        await checkForUpdates();
        onUpdateComplete?.();
      }, 2000);

    } catch (error) {
      const message = error instanceof Error ? error.message : t('system.update_failed', 'Update failed');
      setUpdateError(message);
      setUpdateProgress({
        stage: 'error',
        progress: 0,
        message,
        details: t('system.rollback_info', 'The system has been rolled back to the previous version.'),
      });
      toast.error(message);
    }
  };

  // Initial check on mount
  useEffect(() => {
    checkForUpdates();
  }, []);

  // Format last checked time
  const formatLastChecked = () => {
    if (!lastChecked) return null;
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastChecked.getTime()) / 1000);
    
    if (diff < 60) return t('system.just_now', 'Just now');
    if (diff < 3600) return t('system.minutes_ago', '{{count}} minutes ago').replace('{{count}}', String(Math.floor(diff / 60)));
    if (diff < 86400) return t('system.hours_ago', '{{count}} hours ago').replace('{{count}}', String(Math.floor(diff / 3600)));
    return lastChecked.toLocaleDateString();
  };

  const isUpdating = ['downloading', 'backing_up', 'installing', 'migrating', 'completing'].includes(updateProgress.stage);

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle>{t('system.updates', 'System Updates')}</CardTitle>
                <CardDescription>
                  {t('system.updates_desc', 'Keep your system up to date with the latest features and security patches')}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Version Information */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('system.current_version', 'Current Version')}
                </span>
                <span className="px-2 py-0.5 text-sm font-semibold rounded-full bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-gray-200">
                  {versionInfo?.current_version || '...'}
                </span>
              </div>
              {lastChecked && (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {t('system.last_checked', 'Last checked')}: {formatLastChecked()}
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={checkForUpdates}
              disabled={isCheckingUpdate || isUpdating}
              leftIcon={<RefreshCw className={`w-4 h-4 ${isCheckingUpdate ? 'animate-spin' : ''}`} />}
            >
              {t('system.check_now', 'Check Now')}
            </Button>
          </div>

          {/* Update Available Banner */}
          <AnimatePresence mode="wait">
            {versionInfo?.is_update_available && updateProgress.stage === 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/50">
                    <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                      {t('system.new_version', 'New Version Available')}
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      {t('system.version_info', 'Version {{version}} is ready to install').replace('{{version}}', versionInfo.latest_version)}
                      {versionInfo.download_size && ` (${versionInfo.download_size})`}
                    </p>
                    
                    {/* Breaking Changes Warning */}
                    {versionInfo.breaking_changes && versionInfo.breaking_changes.length > 0 && (
                      <div className="mt-3 p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800">
                        <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200 font-medium text-sm">
                          <AlertCircle className="w-4 h-4" />
                          {t('system.breaking_changes', 'Breaking Changes')}
                        </div>
                        <ul className="mt-2 space-y-1 text-sm text-orange-700 dark:text-orange-300">
                          {versionInfo.breaking_changes.map((change, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="mt-1.5 w-1 h-1 rounded-full bg-orange-500 flex-shrink-0" />
                              {change}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Changelog Toggle */}
                    {versionInfo.changelog && versionInfo.changelog.length > 0 && (
                      <button
                        onClick={() => setShowChangelog(!showChangelog)}
                        className="flex items-center gap-1 mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        {t('system.view_changelog', 'View Changelog')}
                        {showChangelog ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}

                    {/* Changelog Content */}
                    <AnimatePresence>
                      {showChangelog && versionInfo.changelog && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                            {versionInfo.changelog.map((entry, idx) => (
                              <div key={idx} className="flex items-start gap-3 p-2 rounded-lg bg-white/50 dark:bg-zinc-800/50">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${CHANGELOG_TYPE_COLORS[entry.type]}`}>
                                  {entry.type}
                                </span>
                                <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                                  {entry.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 mt-4">
                      <Button
                        variant="primary"
                        onClick={() => setShowConfirmModal(true)}
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        {t('system.install_update', 'Install Update')}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Up to Date Message */}
            {versionInfo && !versionInfo.is_update_available && updateProgress.stage === 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100">
                      {t('system.up_to_date_title', 'System is Up to Date')}
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {t('system.running_latest', 'You are running the latest version of the system.')}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Update Progress */}
            {isUpdating && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {STAGE_LABELS[updateProgress.stage].icon}
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">
                        {STAGE_LABELS[updateProgress.stage].label}
                      </h4>
                      {updateProgress.message && (
                        <p className="text-sm text-blue-700 dark:text-blue-300">{updateProgress.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="h-2 rounded-full bg-blue-200 dark:bg-blue-900 overflow-hidden">
                      <motion.div
                        className="h-full bg-blue-600 dark:bg-blue-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${updateProgress.progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400">
                      <span>{updateProgress.progress}%</span>
                      <span>{t('system.do_not_close', 'Please do not close this window')}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Update Complete */}
            {updateProgress.stage === 'done' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/50">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-900 dark:text-green-100">
                      {t('system.update_complete', 'Update Complete!')}
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {t('system.refresh_page', 'The page will refresh automatically to apply changes.')}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error State */}
            {updateProgress.stage === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/50">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900 dark:text-red-100">
                      {t('system.update_failed_title', 'Update Failed')}
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {updateError || updateProgress.message}
                    </p>
                    {updateProgress.details && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                        {updateProgress.details}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={checkForUpdates}
                      className="mt-3"
                      leftIcon={<RefreshCw className="w-4 h-4" />}
                    >
                      {t('system.try_again', 'Try Again')}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info Section */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-sm">
            <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="text-gray-600 dark:text-gray-400">
              <p>{t('system.update_info', 'Updates are downloaded from a secure server and include the latest features, bug fixes, and security patches. A backup of your database is automatically created before each update.')}</p>
            </div>
          </div>

          {/* Database Migration Info */}
          {versionInfo?.requires_migration && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm">
              <Database className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-amber-700 dark:text-amber-300">
                <p className="font-medium">{t('system.migration_required', 'Database migration required')}</p>
                <p className="mt-1">{t('system.migration_info', 'This update includes database changes. Your data will be automatically migrated to the new structure.')}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={t('system.confirm_update', 'Confirm Update')}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button variant="primary" onClick={startUpdate} leftIcon={<Download className="w-4 h-4" />}>
              {t('system.start_update', 'Start Update')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                {t('system.update_version', 'Updating to version {{version}}').replace('{{version}}', versionInfo?.latest_version || '')}
              </p>
              {versionInfo?.download_size && (
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {t('system.download_size', 'Download size')}: {versionInfo.download_size}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              {t('system.what_happens', 'What will happen:')}
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                {t('system.step_backup', 'A backup of your database will be created')}
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                {t('system.step_download', 'The update will be downloaded and verified')}
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                {t('system.step_install', 'New files will be installed')}
              </li>
              {versionInfo?.requires_migration && (
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {t('system.step_migrate', 'Database will be migrated')}
                </li>
              )}
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                {t('system.step_restart', 'The application will restart automatically')}
              </li>
            </ul>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>{t('system.update_warning', 'Please do not close the browser or turn off your computer during the update process.')}</p>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default SystemUpdateCard;
