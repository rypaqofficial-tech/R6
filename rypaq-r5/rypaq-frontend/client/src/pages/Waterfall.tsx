import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { reportsApi } from "../lib/api";
import { toast } from "sonner";

export default function Waterfall() {
  const [total, setTotal] = useState("10000000");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const run = async () => {
    const n = parseFloat(total);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Enter a positive distribution amount");
      return;
    }
    setLoading(true);
    try {
      const res = await reportsApi.waterfall({
        total_distribution: n,
        tiers: [
          { name: "LP — return of capital", committed: 8_000_000, carry_rate: 0 },
          { name: "GP carry", committed: 0, carry_rate: 0.2 },
        ],
      });
      setResult(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  const steps = (result?.steps as { tier?: string; type?: string; amount?: number }[]) || [];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Waterfall calculator</h1>
        <p className="text-muted-foreground mt-1">Illustrative sequential split — confirm with fund counsel.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Distribution</CardTitle>
          <CardDescription>Default tiers: LP capital return then 20% carry on profit pool.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Total distribution (USD)</Label>
            <Input value={total} onChange={(e) => setTotal(e.target.value)} type="text" inputMode="decimal" />
          </div>
          <Button
            onClick={run}
            disabled={loading}
            className="transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Calculate"}
          </Button>
        </CardContent>
      </Card>
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {steps.map((s, i) => (
              <div key={i} className="flex justify-between border-b border-border/50 py-1">
                <span className="text-muted-foreground">
                  {s.tier} — {s.type}
                </span>
                <span className="font-mono">${(s.amount ?? 0).toLocaleString()}</span>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-2">{String(result.note ?? "")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
