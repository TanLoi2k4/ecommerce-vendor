interface LoadingSkeletonProps {
  variant?: 'card' | 'table' | 'list' | 'text' | 'detail' | 'stats' | 'shipment' | 'shipment-tracking';
  count?: number;
}

export function LoadingSkeleton({ variant = 'card', count = 1 }: LoadingSkeletonProps) {
  const skeletons = {
    card: (
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="skeleton w-16 h-16 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-4 w-1/2" />
          </div>
        </div>
        <div className="skeleton h-20 w-full" />
      </div>
    ),

    table: (
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th><div className="skeleton h-4 w-20" /></th>
              <th><div className="skeleton h-4 w-24" /></th>
              <th><div className="skeleton h-4 w-16" /></th>
              <th><div className="skeleton h-4 w-20" /></th>
              <th><div className="skeleton h-4 w-24" /></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td><div className="skeleton h-4 w-full" /></td>
                <td><div className="skeleton h-4 w-full" /></td>
                <td><div className="skeleton h-4 w-full" /></td>
                <td><div className="skeleton h-4 w-full" /></td>
                <td><div className="skeleton h-4 w-full" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),

    list: (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 card">
            <div className="skeleton w-12 h-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
            </div>
            <div className="skeleton h-8 w-20 rounded" />
          </div>
        ))}
      </div>
    ),

    text: (
      <div className="space-y-2">
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-5/6" />
        <div className="skeleton h-4 w-4/6" />
      </div>
    ),

    detail: (
      <div className="card p-6 space-y-6">
        <div className="flex items-start gap-6">
          <div className="skeleton w-32 h-32 rounded-lg" />
          <div className="flex-1 space-y-3">
            <div className="skeleton h-6 w-3/4" />
            <div className="skeleton h-4 w-1/2" />
            <div className="skeleton h-4 w-2/3" />
            <div className="skeleton h-8 w-24 rounded-lg" />
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    ),

    stats: (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="skeleton h-4 w-24 mb-2" />
                <div className="skeleton h-8 w-32" />
              </div>
              <div className="skeleton h-12 w-12 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    ),

    shipment: (
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="skeleton h-6 w-40" />
          <div className="skeleton h-6 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-2/3 sm:col-span-2" />
        </div>
        <div className="space-y-3 pt-2">
          <div className="skeleton h-4 w-28" />
          <div className="skeleton h-16 w-full" />
          <div className="skeleton h-16 w-full" />
        </div>
      </div>
    ),

    'shipment-tracking': (
      <div className="space-y-3">
        <div className="skeleton h-4 w-28" />
        <div className="skeleton h-14 w-full" />
        <div className="skeleton h-14 w-full" />
      </div>
    ),
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{skeletons[variant]}</div>
      ))}
    </>
  );
}
