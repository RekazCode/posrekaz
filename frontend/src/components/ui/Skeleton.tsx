/**
 * Skeleton Components for Loading States
 * Phase F9: Polish & Hardening
 */

import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200',
        className
      )}
    />
  );
};

export const SkeletonText: React.FC<SkeletonProps & { lines?: number }> = ({ 
  className, 
  lines = 1 
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white p-4', className)}>
      <Skeleton className="h-6 w-1/3 mb-4" />
      <SkeletonText lines={3} />
    </div>
  );
};

export const SkeletonTable: React.FC<SkeletonProps & { rows?: number; columns?: number }> = ({
  className,
  rows = 5,
  columns = 4,
}) => {
  return (
    <div className={cn('rounded-lg border border-gray-200 overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-4 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="p-4 flex gap-4 border-b border-gray-100 last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

export const SkeletonProductGrid: React.FC<SkeletonProps & { items?: number }> = ({
  className,
  items = 8,
}) => {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white p-3">
          <Skeleton className="aspect-square rounded-md mb-3" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      ))}
    </div>
  );
};

export const SkeletonForm: React.FC<SkeletonProps & { fields?: number }> = ({
  className,
  fields = 4,
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 mt-4" />
    </div>
  );
};

export const SkeletonDashboard: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div className={cn('space-y-6', className)}>
      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-32 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-64" />
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
