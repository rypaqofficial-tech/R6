import { Loader2 } from "lucide-react";
import { useRequireAuth } from "../contexts/AuthContext";

export default function Protected({
  children,
  gpOnly,
  lpOnly,
}: {
  children: React.ReactNode;
  gpOnly?: boolean;
  lpOnly?: boolean;
}) {
  const { user, loading } = useRequireAuth(!!gpOnly, !!lpOnly);

  if (loading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Loading…</span>
      </div>
    );
  }

  if (gpOnly && user.role === "lp") return null;
  if (lpOnly && user.role !== "lp") return null;

  return <>{children}</>;
}
