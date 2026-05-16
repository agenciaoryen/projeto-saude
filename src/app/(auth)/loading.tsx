export default function AuthLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 bg-muted rounded-lg animate-pulse" />
          <div className="h-4 w-48 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="grid gap-3">
        <div className="h-28 bg-muted rounded-2xl animate-pulse" />
        <div className="h-24 bg-muted rounded-2xl animate-pulse" />
        <div className="h-20 bg-muted rounded-2xl animate-pulse" />
        <div className="h-32 bg-muted rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}
