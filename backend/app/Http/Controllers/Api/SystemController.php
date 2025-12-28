<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class SystemController extends Controller
{
    /**
     * Get system information
     */
    public function info(): JsonResponse
    {
        return response()->json([
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'environment' => app()->environment(),
            'debug_mode' => config('app.debug'),
            'timezone' => config('app.timezone'),
            'locale' => config('app.locale'),
        ]);
    }

    /**
     * Trigger system update from GitHub
     */
    public function update(): JsonResponse
    {
        try {
            $basePath = base_path('..');
            $updateBatPath = $basePath . DIRECTORY_SEPARATOR . 'update.bat';

            // Check if update.bat exists
            if (!File::exists($updateBatPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Update script not found. Please contact support.',
                ], 404);
            }

            // Get the latest log file to return to user
            $logsPath = $basePath . DIRECTORY_SEPARATOR . 'logs';
            
            // Execute update.bat in background
            if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                // Windows
                $command = 'start /B cmd /c "' . $updateBatPath . '"';
                pclose(popen($command, 'r'));
            } else {
                // Linux/Mac (if needed in future)
                $command = 'nohup sh ' . escapeshellarg($updateBatPath) . ' > /dev/null 2>&1 &';
                exec($command);
            }

            Log::info('System update triggered by user: ' . auth()->id());

            return response()->json([
                'success' => true,
                'message' => 'System update started. The application will restart automatically. Please wait 30-60 seconds.',
            ]);

        } catch (\Exception $e) {
            Log::error('System update failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Update failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get latest update log
     */
    public function updateLog(): JsonResponse
    {
        try {
            $logsPath = base_path('..') . DIRECTORY_SEPARATOR . 'logs';
            
            if (!File::exists($logsPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Logs directory not found.',
                ], 404);
            }

            // Get all update log files
            $logFiles = File::glob($logsPath . DIRECTORY_SEPARATOR . 'update_*.log');
            
            if (empty($logFiles)) {
                return response()->json([
                    'success' => true,
                    'log' => 'No update logs found.',
                ]);
            }

            // Get the latest log file
            usort($logFiles, function($a, $b) {
                return filemtime($b) - filemtime($a);
            });

            $latestLog = File::get($logFiles[0]);

            return response()->json([
                'success' => true,
                'log' => $latestLog,
                'file' => basename($logFiles[0]),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to read log: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Clear application cache
     */
    public function clearCache(): JsonResponse
    {
        try {
            Artisan::call('cache:clear');
            Artisan::call('config:clear');
            Artisan::call('route:clear');
            Artisan::call('view:clear');

            Log::info('Cache cleared by user: ' . auth()->id());

            return response()->json([
                'success' => true,
                'message' => 'All caches cleared successfully.',
            ]);

        } catch (\Exception $e) {
            Log::error('Cache clear failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear cache: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Run database backup
     */
    public function backup(): JsonResponse
    {
        try {
            // Check if backup command exists
            try {
                Artisan::call('db:backup');
                $output = Artisan::output();

                Log::info('Database backup created by user: ' . auth()->id());

                return response()->json([
                    'success' => true,
                    'message' => 'Database backup created successfully.',
                    'output' => $output,
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Backup command not available. Please create backup manually.',
                ], 404);
            }

        } catch (\Exception $e) {
            Log::error('Backup failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Backup failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
