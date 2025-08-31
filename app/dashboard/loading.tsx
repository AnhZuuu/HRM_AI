// app/loading.tsx
export default function GlobalLoading() {
  console.log("[loading.tsx] rendered");
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-background/80 backdrop-blur-sm pointer-events-none">
      <div className="text-center space-y-8 pointer-events-none">
        {/* Logo/Brand Section */}
        <div className="space-y-4">
          <div className="relative">
            <div className="w-16 h-16 mx-auto rounded-full border-4 border-muted relative">
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
            <div className="absolute inset-0 w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse" />
              <div
                className="absolute inset-0 rounded-full border-2 border-primary/20 animate-pulse"
                style={{ animationDelay: "1s" }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              HRM<span className="text-primary">_AI</span>
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Human Resource Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
