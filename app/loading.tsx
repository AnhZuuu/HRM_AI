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

        {/* Loading Message */}
        <div className="space-y-3">
          <p className="text-foreground font-medium text-balance">
            Initializing your workspace...
          </p>
          <div className="w-48 mx-auto">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Please wait while we prepare your dashboard
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-4 pt-4 max-w-md mx-auto">
          {["Secure", "Efficient", "Smart"].map((label) => (
            <div key={label} className="text-center space-y-1">
              <div className="w-8 h-8 mx-auto rounded-lg bg-card border flex items-center justify-center">
                <div className="w-4 h-4 rounded bg-primary/20" />
              </div>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
