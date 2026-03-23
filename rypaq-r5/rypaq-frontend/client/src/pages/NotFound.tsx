import { Button } from "../components/ui/button";
import { Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
          <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
        </div>
        <Button onClick={() => setLocation("/")} className="gap-2">
          <Home className="h-4 w-4" />
          Back to Home
        </Button>
      </div>
    </div>
  );
}
