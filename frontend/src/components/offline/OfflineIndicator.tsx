/**
 * OfflineIndicator Component
 * Phase F8: Offline & Sync
 * 
 * Shows connection status and pending sync count
 */

import React from 'react';
import { useOfflineStore } from '../../stores/offlineStore';
import {
  WifiOff,
  Wifi,
  CloudOff,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';

interface OfflineIndicatorProps {
  variant?: 'banner' | 'compact' | 'badge';
  showPendingCount?: boolean;
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  variant = 'compact',
  showPendingCount = true,
  className,
}) => {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    syncPendingSales,
    lastCatalogSync,
    isCatalogReady,
  } = useOfflineStore();

  const handleSync = async () => {
    if (!isOnline || isSyncing) return;
    await syncPendingSales();
  };

  // Badge variant - minimal indicator
  if (variant === 'badge') {
    if (isOnline && pendingCount === 0) return null;

    return (
      <Badge
        variant={isOnline ? 'warning' : 'danger'}
        className={cn('inline-flex items-center gap-1', className)}
      >
        {!isOnline ? (
          <>
            <WifiOff className="h-3 w-3" />
            <span>Offline</span>
          </>
        ) : (
          <>
            <CloudOff className="h-3 w-3" />
            <span>{pendingCount} pending</span>
          </>
        )}
      </Badge>
    );
  }

  // Compact variant - small icon with optional badge
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <button
          onClick={handleSync}
          disabled={!isOnline || isSyncing || pendingCount === 0}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors',
            isOnline
              ? 'text-green-600 hover:bg-green-50'
              : 'text-red-600 bg-red-50'
          )}
          title={isOnline ? 'Online' : 'Offline - Some features unavailable'}
        >
          {isSyncing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : isOnline ? (
            <Wifi className="h-4 w-4" />
          ) : (
            <WifiOff className="h-4 w-4" />
          )}

          {showPendingCount && pendingCount > 0 && (
            <Badge variant="warning" className="text-xs px-1.5 py-0">
              {pendingCount}
            </Badge>
          )}
        </button>
      </div>
    );
  }

  // Banner variant - full width notification bar
  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-2 text-sm',
        isOnline
          ? pendingCount > 0
            ? 'bg-yellow-50 border-b border-yellow-200 text-yellow-800'
            : 'bg-green-50 border-b border-green-200 text-green-800'
          : 'bg-red-50 border-b border-red-200 text-red-800',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {isOnline ? (
          pendingCount > 0 ? (
            <>
              <AlertCircle className="h-4 w-4" />
              <span>
                <strong>{pendingCount}</strong> sale{pendingCount !== 1 ? 's' : ''} pending sync
              </span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>All data synced</span>
              {lastCatalogSync && (
                <span className="text-xs opacity-70">
                  • Catalog updated {formatRelativeTime(lastCatalogSync)}
                </span>
              )}
            </>
          )
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>
              <strong>Offline Mode</strong> - Sales will be saved locally and synced when
              connection is restored
            </span>
          </>
        )}

        {!isCatalogReady && (
          <Badge variant="danger" className="text-xs">
            No product cache
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isOnline && pendingCount > 0 && (
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded text-sm font-medium transition-colors',
              isSyncing
                ? 'bg-yellow-200 text-yellow-700 cursor-not-allowed'
                : 'bg-yellow-600 text-white hover:bg-yellow-700'
            )}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isSyncing && 'animate-spin')} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
      </div>
    </div>
  );
};

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default OfflineIndicator;
