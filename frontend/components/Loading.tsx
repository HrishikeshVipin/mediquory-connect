export default function Loading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
        <p className="text-lg text-gray-600 animate-pulse">{message}</p>
      </div>
    </div>
  );
}

export function LoadingSpinner({ size = 'md', message }: { size?: 'sm' | 'md' | 'lg'; message?: string }) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`inline-block animate-spin rounded-full ${sizes[size]} border-blue-600 border-t-transparent`}></div>
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </div>
  );
}
