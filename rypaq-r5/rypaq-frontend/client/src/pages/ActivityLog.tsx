import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { activityApi, type ActivityEntry } from "../lib/api";
import { toast } from "sonner";

export default function ActivityLog() {
  const [rows, setRows] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    activityApi
      .list()
      .then(setRows)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20 gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        Loading activity…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Activity log</h1>
        <p className="text-muted-foreground mt-1">Recent actions on your account.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>Newest first</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            rows.map((r) => (
              <div
                key={r.id}
                className="text-sm border-b border-border/60 pb-3 last:border-0 flex flex-col sm:flex-row sm:justify-between gap-1"
              >
                <div>
                  <span className="font-medium text-foreground">{r.action}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {r.entity_type}
                    {r.entity_id ? ` #${r.entity_id}` : ""}
                  </span>
                </div>
                <time className="text-xs text-muted-foreground shrink-0" dateTime={r.created_at}>
                  {new Date(r.created_at).toLocaleString()}
                </time>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
