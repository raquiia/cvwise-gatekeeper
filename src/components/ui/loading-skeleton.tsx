import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = '',
  lines = 1
}) => {
  return (
    <div className={cn("animate-pulse", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-4 bg-muted rounded",
            index > 0 && "mt-2",
            index === lines - 1 && lines > 1 && "w-3/4"
          )}
        />
      ))}
    </div>
  );
};

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  className = ''
}) => {
  return (
    <div className={cn("w-full", className)}>
      {/* Header skeleton */}
      <div className="flex gap-4 p-4 border-b border-border">
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className="flex-1">
            <LoadingSkeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
      
      {/* Rows skeleton */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4 border-b border-border">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="flex-1">
              {colIndex === 0 ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                  <div className="flex-1">
                    <LoadingSkeleton className="h-4 w-32 mb-1" />
                    <LoadingSkeleton className="h-3 w-24" />
                  </div>
                </div>
              ) : (
                <LoadingSkeleton lines={Math.random() > 0.5 ? 2 : 1} />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};