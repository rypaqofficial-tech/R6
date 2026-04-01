import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { reportsApi } from "../lib/api";
import { toast } from "sonner";

export default function QuarterlyReport() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi
      .quarterly()
      .then(setData)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20 gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        Generating snapshot…
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Quarterly portfolio report</h1>
      {data && (
        <Card>
          <CardHeader>
            <CardTitle>{String(data.portfolio_name ?? "Portfolio")}</CardTitle>
            <CardDescription>
              {String(data.period ?? "")} · {String(data.generated_at ?? "").slice(0, 19)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Total AUM: ${Number(data.total_aum ?? 0).toLocaleString()}</p>
            <p>Average IRR (proxy): {String(data.avg_irr ?? "—")}%</p>
            <p>Holdings: {String(data.holdings ?? "—")}</p>
            <p>Performing / at risk: {String(data.performing ?? "—")} / {String(data.at_risk ?? "—")}</p>
            <p className="text-muted-foreground pt-2">{String(data.narrative ?? "")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
