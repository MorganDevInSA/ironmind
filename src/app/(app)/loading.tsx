export default function AppLoading() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <div className="skeleton w-48 h-8 rounded-lg" />
        <div className="skeleton w-24 h-6 rounded-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-panel p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="skeleton w-24 h-2.5 rounded" />
              <div className="skeleton w-16 h-5 rounded-full" />
            </div>
            <div className="skeleton w-20 h-9 rounded" />
            <div className="skeleton w-32 h-3 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
