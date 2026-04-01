import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { pipelineApi, type PipelineCard } from "../lib/api";
import { toast } from "sonner";

const STAGES = ["sourcing", "diligence", "ic", "closing", "won", "lost"] as const;

export default function Pipeline() {
  const [cards, setCards] = useState<PipelineCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setCards(await pipelineApi.list());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load pipeline");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await pipelineApi.create({ title: title.trim(), stage: "sourcing" });
      setTitle("");
      await load();
      toast.success("Deal added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const move = async (c: PipelineCard, stage: string) => {
    try {
      await pipelineApi.move(c.id, { stage });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Move failed");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Remove this card?")) return;
    try {
      await pipelineApi.remove(id);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20 gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        Loading pipeline…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Deal pipeline</h1>
        <p className="text-muted-foreground mt-1">Drag-free board: move cards between stages (mobile-friendly horizontal scroll).</p>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">New deal</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Company or deal name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <Button
            className="shrink-0 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            onClick={add}
            disabled={busy}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add
          </Button>
        </CardContent>
      </Card>
      <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-3 lg:grid-cols-6 md:overflow-visible">
        {STAGES.map((stage) => (
          <div
            key={stage}
            className="min-w-[min(100%,280px)] md:min-w-0 snap-start flex-shrink-0 border border-border rounded-lg bg-card/50 p-2 flex flex-col gap-2"
          >
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">{stage}</h3>
            <div className="space-y-2 flex-1">
              {cards
                .filter((c) => c.stage === stage)
                .map((c) => (
                  <div
                    key={c.id}
                    className="rounded-md border border-border bg-background p-2 text-sm shadow-xs space-y-2"
                  >
                    <p className="font-medium leading-tight">{c.title}</p>
                    <div className="flex flex-wrap gap-1">
                      {STAGES.filter((s) => s !== stage).map((s) => (
                        <Button
                          key={s}
                          variant="secondary"
                          size="sm"
                          className="h-7 text-xs px-2 transition-transform hover:scale-105 active:scale-95"
                          onClick={() => move(c, s)}
                        >
                          → {s}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-destructive hover:text-destructive w-full"
                      onClick={() => remove(c.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
