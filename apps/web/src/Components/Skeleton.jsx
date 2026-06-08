import React from "react";

// Pulse base wrapper
export function SkeletonPulse({ className = "", children }) {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded ${className}`}>
      {children || <div className="h-full w-full opacity-0">placeholder</div>}
    </div>
  );
}

// Stats Card Skeleton
export function CardSkeleton() {
  return (
    <div className="p-6 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <SkeletonPulse className="h-4 w-24" />
        <SkeletonPulse className="h-8 w-8 rounded-full" />
      </div>
      <SkeletonPulse className="h-8 w-32" />
      <SkeletonPulse className="h-3 w-48" />
    </div>
  );
}

// Data Grid / Table Skeleton
export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <div className="flex space-x-4 p-4 border-b border-slate-200 dark:border-white/10">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonPulse key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex space-x-4 p-4 border-b border-slate-100 dark:border-white/5">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonPulse key={c} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Chart Placeholder Skeleton
export function ChartSkeleton() {
  return (
    <div className="w-full h-72 border border-slate-200 dark:border-white/10 rounded-2xl p-6 bg-white dark:bg-slate-900/60 flex flex-col justify-between">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <SkeletonPulse className="h-4 w-36" />
          <SkeletonPulse className="h-3 w-48" />
        </div>
        <SkeletonPulse className="h-6 w-20" />
      </div>
      {/* Grid lines mockup */}
      <div className="flex-1 flex flex-col justify-between py-6 space-y-4">
        <SkeletonPulse className="h-0.5 w-full opacity-40" />
        <SkeletonPulse className="h-0.5 w-full opacity-40" />
        <SkeletonPulse className="h-0.5 w-full opacity-40" />
        <SkeletonPulse className="h-0.5 w-full opacity-40" />
      </div>
      {/* Legend mockup */}
      <div className="flex justify-center space-x-6">
        <SkeletonPulse className="h-3 w-16" />
        <SkeletonPulse className="h-3 w-16" />
      </div>
    </div>
  );
}

// Map Loading Skeleton
export function MapSkeleton() {
  return (
    <div className="relative w-full h-[450px] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950/40">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="space-y-4 text-center">
          <SkeletonPulse className="h-10 w-10 mx-auto rounded-full" />
          <SkeletonPulse className="h-4 w-48 mx-auto" />
          <SkeletonPulse className="h-3 w-64 mx-auto" />
        </div>
      </div>
      {/* Map toolbars skeleton */}
      <div className="absolute top-4 left-4 space-y-2">
        <SkeletonPulse className="h-8 w-8 rounded-lg" />
        <SkeletonPulse className="h-8 w-8 rounded-lg" />
      </div>
      <div className="absolute top-4 right-4">
        <SkeletonPulse className="h-8 w-32 rounded-lg" />
      </div>
    </div>
  );
}
