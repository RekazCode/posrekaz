/**
 * SyncStatusCard Component
 * Phase F8: Offline & Sync
 * 
 * Detailed sync status and controls for admin view
 */

import React, { useState } from 'react';
import { useOfflineStore } from '../../stores/offlineStore';
import {
  Cloud,
  CloudOff,
  Database,
  RefreshCw,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  HardDrive,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import type { OfflineSale } from '../../lib/offlineDb';

interface SyncStatusCardProps {
  className?: string;
}

export const SyncStatusCard: React.FC<SyncStatusCardProps> = ({ className }) => {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    isCatalogReady,
    isLoadingCatalog,
    lastCatalogSync,
    syncCatalog,
    syncPendingSales,
    clearOfflineData,
    getPendingSales,
  } = useOfflineStore();

  const [pendingSales, setPendingSales] = useState<OfflineSale[]>([]);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Use a ref to track the pending count and trigger re-fetch
  const prevPendingCountRef = React.useRef(pendingCount);

  // Fetch pending sales
  const fetchSales = React.useCallback(async () => {
    const sales = await getPendingSales();
    setPendingSales(sales);
  }, [getPendingSales]);

  // Fetch on mount
  React.useEffect(() => {
    fetchSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when pending count changes (from external sync)
  React.useEffect(() => {
    if (prevPendingCountRef.current !== pendingCount) {
      prevPendingCountRef.current = pendingCount;
      fetchSales();
    }
  }, [pendingCount, fetchSales]);

  const handleSyncCatalog = async () => {
    try {
      await syncCatalog();
    } catch (error) {
      console.error('Failed to sync catalog:', error);
    }
  };

  const handleSyncSales = async () => {
    const result = await syncPendingSales();
    // The useEffect will re-fetch sales when pendingCount changes
    if (result.synced > 0) {
      // Show success notification (could integrate with toast)
      console.log(`Synced ${result.synced} sales, ${result.failed} failed`);
    }
  };

  const handleClearData = async () => {
    await clearOfflineData();
    setPendingSales([]);
    setShowConfirmClear(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'syncing':
        return <Badge variant="info">Syncing</Badge>;
      case 'synced':
        return <Badge variant="success">Synced</Badge>;
      case 'failed':
        return <Badge variant="danger">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Offline Storage & Sync
          </span>
          <Badge variant={isOnline ? 'success' : 'danger'}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Cloud className="h-5 w-5 text-green-600" />
            ) : (
              <CloudOff className="h-5 w-5 text-red-600" />
            )}
            <div>
              <p className="font-medium">
                {isOnline ? 'Connected to server' : 'No connection'}
              </p>
              <p className="text-sm text-gray-500">
                {isOnline
                  ? 'Sales will sync automatically'
                  : 'Sales will be saved locally'}
              </p>
            </div>
          </div>
        </div>

        {/* Catalog Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Database
              className={cn(
                'h-5 w-5',
                isCatalogReady ? 'text-green-600' : 'text-yellow-600'
              )}
            />
            <div>
              <p className="font-medium">Product Catalog</p>
              <p className="text-sm text-gray-500">
                {isCatalogReady
                  ? `Cached ${lastCatalogSync ? formatDate(lastCatalogSync) : ''}`
                  : 'Not cached - offline mode limited'}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSyncCatalog}
            disabled={!isOnline || isLoadingCatalog}
          >
            <RefreshCw
              className={cn('h-4 w-4 mr-1', isLoadingCatalog && 'animate-spin')}
            />
            {isLoadingCatalog ? 'Syncing...' : 'Sync'}
          </Button>
        </div>

        {/* Pending Sales */}
        <div className="border rounded-lg">
          <div className="flex items-center justify-between p-3 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Pending Sales</span>
              {pendingCount > 0 && (
                <Badge variant="warning">{pendingCount}</Badge>
              )}
            </div>
            {pendingCount > 0 && (
              <Button
                size="sm"
                onClick={handleSyncSales}
                disabled={!isOnline || isSyncing}
              >
                <RefreshCw
                  className={cn('h-4 w-4 mr-1', isSyncing && 'animate-spin')}
                />
                {isSyncing ? 'Syncing...' : 'Sync All'}
              </Button>
            )}
          </div>

          {pendingSales.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p>No pending sales</p>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {pendingSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {sale.items.length} item{sale.items.length !== 1 ? 's' : ''} •{' '}
                      ${sale.total.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(sale.created_at).toLocaleString()}
                    </p>
                    {sale.error_message && (
                      <p className="text-xs text-red-500 mt-1">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />
                        {sale.error_message}
                      </p>
                    )}
                  </div>
                  {getStatusBadge(sale.status)}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4">
        {showConfirmClear ? (
          <div className="flex items-center justify-between w-full gap-2">
            <span className="text-sm text-red-600">
              This will delete all cached data and pending sales!
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowConfirmClear(false)}
              >
                Cancel
              </Button>
              <Button size="sm" variant="destructive" onClick={handleClearData}>
                Confirm Delete
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:bg-red-50"
            onClick={() => setShowConfirmClear(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All Offline Data
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default SyncStatusCard;
