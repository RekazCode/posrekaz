/**
 * usePrinter Hook
 * Manages printer status, thermal printer support, and offline print queue
 */

import { useState, useCallback, useEffect } from 'react';

export interface PrintJob {
  id: string;
  html: string;
  invoiceNumber: string;
  createdAt: Date;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  retries: number;
}

export interface PrinterStatus {
  isAvailable: boolean;
  isOnline: boolean;
  name?: string;
  type: 'thermal' | 'standard' | 'unknown';
}

interface UsePrinterOptions {
  thermalWidth?: number; // Default 80mm = 288px at 96 DPI
  maxRetries?: number;
  autoRetry?: boolean;
}

const STORAGE_KEY = 'pos_print_queue';
const THERMAL_WIDTH_MM = 80;
const THERMAL_WIDTH_PX = 288; // 80mm at 96 DPI
const CHAR_WIDTH_PX = 7; // Approximate for 12px monospace
const MAX_CHARS_PER_LINE = Math.floor(THERMAL_WIDTH_PX / CHAR_WIDTH_PX); // ~41-42 chars

export function usePrinter(options: UsePrinterOptions = {}) {
  const {
    thermalWidth = THERMAL_WIDTH_PX,
    maxRetries = 3,
    autoRetry = true,
  } = options;

  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>({
    isAvailable: true,
    isOnline: true,
    type: 'unknown',
  });
  const [printQueue, setPrintQueue] = useState<PrintJob[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);

  // Load print queue from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const jobs = JSON.parse(stored) as PrintJob[];
        // Convert date strings back to Date objects
        const parsedJobs = jobs.map(job => ({
          ...job,
          createdAt: new Date(job.createdAt),
        }));
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Initializing state from localStorage on mount is a valid pattern
        setPrintQueue(parsedJobs.filter(j => j.status === 'pending' || j.status === 'failed'));
      }
    } catch (e) {
      console.error('Failed to load print queue:', e);
    }
  }, []);

  // Save print queue to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(printQueue));
    } catch (e) {
      console.error('Failed to save print queue:', e);
    }
  }, [printQueue]);

  // Check printer availability (browser-based detection)
  const checkPrinterStatus = useCallback(async (): Promise<PrinterStatus> => {
    // In browser, we can only check if print dialog is available
    const isAvailable = typeof window !== 'undefined' && typeof window.print === 'function';
    const isOnline = navigator.onLine;

    const status: PrinterStatus = {
      isAvailable,
      isOnline,
      type: 'unknown', // Cannot detect thermal vs standard in browser
    };

    setPrinterStatus(status);
    return status;
  }, []);

  // Generate thermal-optimized HTML
  const generateThermalHTML = useCallback((html: string, invoiceNumber: string, direction: 'ltr' | 'rtl' = 'ltr'): string => {
    return `
<!DOCTYPE html>
<html dir="${direction}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=${thermalWidth}">
  <title>Receipt - ${invoiceNumber}</title>
  <style>
    @page {
      size: ${THERMAL_WIDTH_MM}mm auto;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Courier New', 'Lucida Console', Monaco, monospace;
      font-size: 12px;
      line-height: 1.3;
      width: ${thermalWidth}px;
      max-width: ${thermalWidth}px;
      padding: 8px;
      direction: ${direction};
      background: white;
      color: black;
    }
    .receipt-header {
      text-align: center;
      margin-bottom: 8px;
      border-bottom: 1px dashed #000;
      padding-bottom: 8px;
    }
    .receipt-header h1 {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .receipt-header p {
      font-size: 11px;
    }
    .receipt-info {
      margin: 8px 0;
      font-size: 11px;
    }
    .receipt-info-row {
      display: flex;
      justify-content: space-between;
    }
    .receipt-divider {
      border-top: 1px dashed #000;
      margin: 8px 0;
    }
    .receipt-items {
      margin: 8px 0;
    }
    .receipt-item {
      margin-bottom: 4px;
      font-size: 11px;
    }
    .receipt-item-name {
      font-weight: bold;
    }
    .receipt-item-details {
      display: flex;
      justify-content: space-between;
      padding-${direction === 'rtl' ? 'right' : 'left'}: 8px;
    }
    .receipt-totals {
      border-top: 1px dashed #000;
      margin-top: 8px;
      padding-top: 8px;
    }
    .receipt-total-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
    }
    .receipt-total-row.grand-total {
      font-size: 14px;
      font-weight: bold;
      margin-top: 4px;
      padding-top: 4px;
      border-top: 1px solid #000;
    }
    .receipt-footer {
      text-align: center;
      margin-top: 12px;
      padding-top: 8px;
      border-top: 1px dashed #000;
      font-size: 10px;
    }
    .receipt-qr {
      text-align: center;
      margin: 12px 0;
    }
    .receipt-qr img {
      max-width: 100px;
      height: auto;
    }
    .tabular-nums {
      font-variant-numeric: tabular-nums;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      @page {
        size: ${THERMAL_WIDTH_MM}mm auto;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  ${html}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
        window.onafterprint = function() {
          window.close();
        };
      }, 100);
    };
  </script>
</body>
</html>`;
  }, [thermalWidth]);

  // Add job to print queue (defined before print to avoid reference error)
  const addToQueue = useCallback((html: string, invoiceNumber: string) => {
    const job: PrintJob = {
      id: `print-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      html,
      invoiceNumber,
      createdAt: new Date(),
      status: 'pending',
      retries: 0,
    };
    setPrintQueue(prev => [...prev, job]);
  }, []);

  // Print receipt
  const print = useCallback(async (
    html: string,
    invoiceNumber: string,
    direction: 'ltr' | 'rtl' = 'ltr'
  ): Promise<boolean> => {
    setIsPrinting(true);

    try {
      const thermalHTML = generateThermalHTML(html, invoiceNumber, direction);
      
      // Open print window
      const printWindow = window.open('', '_blank', `width=${thermalWidth},height=600,scrollbars=yes`);
      
      if (!printWindow) {
        // Popup blocked - add to queue
        console.warn('Print popup blocked, adding to queue');
        addToQueue(html, invoiceNumber);
        return false;
      }

      printWindow.document.write(thermalHTML);
      printWindow.document.close();
      
      setIsPrinting(false);
      return true;
    } catch (error) {
      console.error('Print failed:', error);
      addToQueue(html, invoiceNumber);
      setIsPrinting(false);
      return false;
    }
  }, [generateThermalHTML, thermalWidth, addToQueue]);

  // Process print queue
  const processQueue = useCallback(async () => {
    const pendingJobs = printQueue.filter(j => j.status === 'pending' || (j.status === 'failed' && j.retries < maxRetries));
    
    for (const job of pendingJobs) {
      setPrintQueue(prev => 
        prev.map(j => j.id === job.id ? { ...j, status: 'printing' as const } : j)
      );

      const success = await print(job.html, job.invoiceNumber);
      
      setPrintQueue(prev => 
        prev.map(j => j.id === job.id ? { 
          ...j, 
          status: success ? 'completed' as const : 'failed' as const,
          retries: j.retries + (success ? 0 : 1),
        } : j)
      );
    }
  }, [printQueue, maxRetries, print]);

  // Remove job from queue
  const removeFromQueue = useCallback((jobId: string) => {
    setPrintQueue(prev => prev.filter(j => j.id !== jobId));
  }, []);

  // Clear completed jobs
  const clearCompleted = useCallback(() => {
    setPrintQueue(prev => prev.filter(j => j.status !== 'completed'));
  }, []);

  // Clear all jobs
  const clearQueue = useCallback(() => {
    setPrintQueue([]);
  }, []);

  // Retry failed job
  const retryJob = useCallback((jobId: string) => {
    setPrintQueue(prev => 
      prev.map(j => j.id === jobId ? { ...j, status: 'pending' as const, retries: 0 } : j)
    );
  }, []);

  // Auto-process queue when online
  useEffect(() => {
    if (autoRetry && printerStatus.isOnline && printQueue.some(j => j.status === 'pending')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- processQueue is async and updates state based on external print result
      processQueue();
    }
  }, [autoRetry, printerStatus.isOnline, printQueue, processQueue]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setPrinterStatus(prev => ({ ...prev, isOnline: true }));
    };
    const handleOffline = () => {
      setPrinterStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    // Status
    printerStatus,
    isPrinting,
    printQueue,
    pendingCount: printQueue.filter(j => j.status === 'pending').length,
    failedCount: printQueue.filter(j => j.status === 'failed').length,
    
    // Constants
    THERMAL_WIDTH_MM,
    THERMAL_WIDTH_PX,
    MAX_CHARS_PER_LINE,
    
    // Actions
    print,
    checkPrinterStatus,
    addToQueue,
    processQueue,
    removeFromQueue,
    clearCompleted,
    clearQueue,
    retryJob,
    generateThermalHTML,
  };
}

export default usePrinter;
