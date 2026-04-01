import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useAuth } from "../contexts/AuthContext";
import { lpApi } from "../lib/api";
import { toast } from "sonner";

export default function LpPortal() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    lpApi
      .summary()
      .then(setData)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: unknown) =>
    typeof n === "number"
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
      : "—";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 h-14 flex items-center justify-between">
        <h1 className="font-bold text-lg">Rypaq — Investor portal</h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{user?.email}</span>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            onClick={async () => {
              await logout();
              setLocation("/login");
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-20 gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            Loading summary…
          </div>
        ) : data ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{String(data.fund_name ?? "Fund")}</CardTitle>
                <CardDescription>{String(data.quarter ?? "")}</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Reported NAV</p>
                  <p className="text-xl font-semibold">{fmt(data.reported_nav)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Distributions to date</p>
                  <p className="text-xl font-semibold">{fmt(data.distributed_to_date)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Unrealized value</p>
                  <p className="text-xl font-semibold">{fmt(data.unrealized_value)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">TVPI / DPI</p>
                  <p className="text-xl font-semibold">
                    {data.tvpi as number}× / {data.dpi as number}×
                  </p>
                </div>
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground">{String(data.note ?? "")}</p>
          </>
        ) : null}
      </main>
    </div>
  );
}
