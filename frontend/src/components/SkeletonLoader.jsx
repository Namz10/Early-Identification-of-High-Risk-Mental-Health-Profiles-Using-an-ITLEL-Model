import React from 'react';

/**
 * Skeleton loader that mimics the shape of content blocks.
 * Pass 'lines' to render multiple text line skeletons.
 * Pass 'type' of 'table' to render a table-like skeleton.
 */
const SkeletonLoader = ({ type = 'lines', lines = 4 }) => {
  if (type === 'table') {
    return (
      <div className="animate-pulse">
        {/* Header row */}
        <div className="flex gap-4 mb-3">
          {[30, 20, 15, 18, 17].map((w, i) => (
            <div key={i} className="h-3 bg-slate-200 rounded" style={{ width: `${w}%` }} />
          ))}
        </div>
        {/* Data rows */}
        {Array.from({ length: 8 }).map((_, row) => (
          <div key={row} className="flex gap-4 mb-3 py-2 border-t border-slate-100">
            {[30, 20, 15, 18, 17].map((w, i) => (
              <div key={i} className="h-3 bg-slate-100 rounded" style={{ width: `${w}%` }} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card-row') {
    return (
      <div className="grid grid-cols-4 gap-4 animate-pulse">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-slate-200 p-6">
            <div className="h-2 bg-slate-200 rounded w-1/2 mb-4" />
            <div className="h-8 bg-slate-100 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="animate-pulse bg-white border border-slate-200 p-6">
        <div className="h-2 bg-slate-200 rounded w-1/3 mb-4" />
        <div className="h-48 bg-slate-100 rounded" />
      </div>
    );
  }

  if (type === 'paragraph') {
    return (
      <div className="animate-pulse space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 bg-slate-100 rounded"
            style={{ width: i === lines - 1 ? '60%' : '100%' }}
          />
        ))}
      </div>
    );
  }

  // Default: lines
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-slate-100 rounded w-full" />
      ))}
    </div>
  );
};

export default SkeletonLoader;
