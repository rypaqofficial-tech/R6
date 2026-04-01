import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import BrandLockup from "../components/BrandLockup";
import { useAuth } from "../contexts/AuthContext";
import { api, API_BASE } from "../lib/api";
import { toast } from "sonner";

export default function Login() {
  const [, setLocation] = useLocation();
  const { refresh, user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      setLocation(user.role === "lp" ? "/lp" : "/dashboard");
    }
  }, [authLoading, user, setLocation]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.postJson<{ user: { role: string } }>("/api/auth/login", { email, password });
      await refresh();
      toast.success("Signed in");
      setLocation(res.user.role === "lp" ? "/lp" : "/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const demo = async () => {
    setLoading(true);
    try {
      await api.postJson("/api/auth/demo-login", {});
      await refresh();
      toast.success("Demo mode — sample data only");
      setLocation("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 gap-6">
      <button
        type="button"
        onClick={() => setLocation("/")}
        className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <BrandLockup
          markClassName="h-12 w-auto max-h-12 max-w-[min(85vw,280px)]"
          wordmarkClassName="text-2xl font-bold tracking-tight text-foreground"
        />
      </button>
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use your email and password, or try the demo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full transition-transform hover:scale-[1.01] active:scale-[0.99]" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
            </Button>
          </form>
          <Button
            type="button"
            variant="secondary"
            className="w-full transition-transform hover:scale-[1.01] active:scale-[0.99]"
            onClick={demo}
            disabled={loading}
          >
            Demo login (sample data)
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full transition-transform hover:scale-[1.01] active:scale-[0.99]"
            onClick={() => {
              const base = API_BASE.replace(/\/$/, "");
              window.location.href = base ? `${base}/api/auth/google/start` : "/api/auth/google/start";
            }}
          >
            Continue with Google
          </Button>
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <button type="button" className="underline hover:text-foreground" onClick={() => setLocation("/register")}>
              Create an account
            </button>
            <span className="mx-2">·</span>
            <button type="button" className="underline hover:text-foreground" onClick={() => setLocation("/forgot-password")}>
              Forgot password
            </button>
          </div>
          <Button variant="ghost" className="w-full" onClick={() => setLocation("/")}>
            Back to home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
