import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { 
  TrendingUp, 
  AlertTriangle, 
  PieChart, 
  Upload, 
  ArrowRight,
  ShieldAlert,
  Activity,
  Target,
  Loader,
  MoreHorizontal,
  Trash2,
  FileText,
  Zap
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  CartesianGrid
} from "recharts";
import { macroApi, dealApi, alertsApi, portfolioApi, uploadApi } from "../lib/api";
import type { UploadedPDFItem } from "../lib/api";
import { toast } from "sonner";
import type { MacroIndicators, DealOpportunity, Alert, Portfolio } from "../lib/api";

type TopSourcingTarget = {
  id: number;
  name: string;
  sector: string;
  alpha: number;
  probability: number;
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [macroData, setMacroData] = useState<MacroIndicators | null>(null);
  const [deals, setDeals] = useState<DealOpportunity[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [topTargets, setTopTargets] = useState<TopSourcingTarget[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<TopSourcingTarget | null>(null);
  const [uploadedPDFs, setUploadedPDFs] = useState<UploadedPDFItem[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const [macro, dealList, alertList, portfolioList, topList, pdfList] = await Promise.all([
        macroApi.getLive(),
        dealApi.getOpportunities(),
        alertsApi.getAll(),
        portfolioApi.getAll(),
        portfolioApi.getTopSourcingTargets(),
        uploadApi.listUploads(),
      ]);

      setMacroData(macro);
      setDeals(dealList);
      setAlerts(alertList);
      setPortfolios(portfolioList);
      setTopTargets(topList || []);
      setUploadedPDFs(pdfList || []);

      if (topList?.length > 0 && !selectedTarget) {
        setSelectedTarget(topList[0]);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to sync with live data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast.error("File too large (max 50MB)"); return; }
    if (file.type !== "application/pdf") { toast.error("Only PDF files are supported"); return; }

    setUploading(true);
    const toastId = toast.loading("Uploading and analyzing PDF...");
    try {
      const response = await uploadApi.uploadPdf(file);
      toast.success(`Analysis complete: ${response.extracted_data.company_name}`, { id: toastId });
      await fetchData();
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to process PDF", { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteUpload = async (uploadId: number, filename: string) => {
    if (!confirm(`Delete "${filename}" and all associated data?`)) return;
    setDeletingId(uploadId);
    try {
      await uploadApi.deleteUpload(uploadId);
      toast.success(`"${filename}" deleted successfully`);
      await fetchData();
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete upload");
    } finally {
      setDeletingId(null);
    }
  };

  const handleTargetClick = (target: TopSourcingTarget) => setSelectedTarget(target);
  const displayAlpha = selectedTarget ? selectedTarget.alpha : (macroData?.model_alpha || 0);

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-muted-foreground">Loading dashboard...</div>;
  }

  const totalAUM = portfolios.reduce((sum, p) => sum + (p.total_aum || 0), 0);
  const aumAtRisk = macroData?.aum_at_risk || 0;
  const dryPowderEfficiency = macroData?.dry_powder_efficiency || 0;

  const macroMicroData = deals.map(deal => ({
    name: deal.company_name,
    x: deal.sector_momentum,
    y: deal.probability_3x_return,
    z: deal.enterprise_value / 1000000,
    alpha: deal.alpha_score
  }));

  return (
    <div className="space-y-6">
      {/* Header & Upload */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Executive Dashboard</h1>
          <p className="text-muted-foreground">Real-time predictive insights and deal flow</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input ref={fileInputRef} type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={uploading} />
          <Button onClick={() => setLocation("/smart-deal-sourcing")} variant="outline" className="gap-2">
            <Zap className="h-4 w-4 text-cyan-500" />
            Smart Deal Sourcing
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} variant="default" className="gap-2" disabled={uploading}>
            {uploading ? (<><Loader className="h-4 w-4 animate-spin" />Processing...</>) : (<><Upload className="h-4 w-4" />Upload Deal PDF</>)}
          </Button>
        </div>
      </div>

      {/* KPI Cards - Responsive grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total AUM</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">${(totalAUM / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">Live portfolio valuation</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-destructive/10 to-transparent border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AUM at Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-destructive">${(aumAtRisk / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">Companies with &lt;85% probability</p>
            <Badge variant="destructive" className="mt-2">Critical</Badge>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dry Powder Efficiency</CardTitle>
            <Activity className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-cyan-600">{dryPowderEfficiency}%</div>
            <Progress value={dryPowderEfficiency} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-2">Capital vs Buy Signals</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1 flex-wrap">
              <Target className="h-4 w-4 text-emerald-600" />
              Model Alpha
              {selectedTarget && <span className="text-xs text-muted-foreground hidden sm:inline">({selectedTarget.name})</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600">+{displayAlpha}%</div>
            <p className="text-xs text-muted-foreground">Avg alpha vs benchmark</p>
          </CardContent>
        </Card>
      </div>

      {/* Macro Bridge + Top Targets */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Macro-Micro Bridge</CardTitle>
            <CardDescription>Sector Momentum vs. 3x Probability</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] sm:h-[320px]">
            {macroMicroData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 30, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis type="number" dataKey="x" name="Momentum" unit="x" stroke="currentColor" tick={{ fontSize: 11 }} label={{ value: "Momentum", position: "insideBottom", offset: -15, fontSize: 11 }} />
                  <YAxis type="number" dataKey="y" name="Probability" unit="%" stroke="currentColor" tick={{ fontSize: 11 }} width={45} />
                  <ZAxis type="number" dataKey="z" range={[40, 300]} name="Value" unit="M" />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-background border border-border rounded p-2 text-xs">
                          <p className="font-semibold">{d.name}</p>
                          <p className="text-cyan-500">Momentum: {d.x}</p>
                          <p className="text-emerald-500">Probability: {d.y}%</p>
                          <p className="text-muted-foreground">Alpha: {d.alpha}%</p>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Scatter name="Deals" data={macroMicroData}>
                    {macroMicroData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.y > 70 ? "#10b981" : "#f59e0b"} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <FileText className="h-8 w-8 opacity-40" />
                <p className="text-sm">Upload PDFs to populate the chart</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Top Sourcing Targets
            </CardTitle>
            <CardDescription>Highest alpha opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topTargets.length > 0 ? (
                topTargets.map((target) => (
                  <div
                    key={target.id}
                    onClick={() => handleTargetClick(target)}
                    className={`group flex justify-between items-center p-3 rounded-xl border transition-all cursor-pointer hover:border-cyan-400 ${
                      selectedTarget?.id === target.id ? "border-cyan-500 bg-[#252B3D]" : "border-gray-800 hover:bg-[#252B3D]"
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate">{target.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{target.sector}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-500">+{target.alpha}% Alpha</p>
                        <p className="text-xs text-muted-foreground">{target.probability}% Prob.</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setLocation(`/due-diligence?company=${target.id}`); }}
                        className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-gray-700 rounded-lg transition-opacity"
                        title="View Due Diligence"
                      >
                        <MoreHorizontal className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">Upload PDFs to see real targets</div>
              )}
            </div>
            {topTargets.length > 0 && (
              <Button variant="ghost" className="w-full mt-4 text-xs gap-2" onClick={() => setLocation("/smart-deal-sourcing")}>
                View All Opportunities <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts + Portfolio Health */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div key={alert.id} className="flex gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-destructive">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">No critical alerts.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Portfolio Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <p className="text-xl sm:text-2xl font-bold">{portfolios[0]?.avg_irr || 0}%</p>
                <p className="text-xs text-muted-foreground">Avg IRR</p>
              </div>
              <div className="space-y-1">
                <p className="text-xl sm:text-2xl font-bold text-emerald-500">{portfolios[0]?.performing || 0}</p>
                <p className="text-xs text-muted-foreground">Performing</p>
              </div>
              <div className="space-y-1">
                <p className="text-xl sm:text-2xl font-bold text-destructive">{portfolios[0]?.at_risk || 0}</p>
                <p className="text-xs text-muted-foreground">At Risk</p>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex justify-between text-xs mb-1">
                <span>Portfolio Stability</span>
                <span>{portfolios[0]?.diversification_score || 0}/10</span>
              </div>
              <Progress value={(portfolios[0]?.diversification_score || 0) * 10} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Uploaded PDFs Section with Delete */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Uploaded Deal PDFs
          </CardTitle>
          <CardDescription>
            {uploadedPDFs.length > 0
              ? `${uploadedPDFs.length} document${uploadedPDFs.length !== 1 ? "s" : ""} uploaded — all dashboard data is sourced from these files`
              : "No PDFs uploaded yet. Upload a deal PDF to populate the dashboard."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uploadedPDFs.length > 0 ? (
            <div className="space-y-2">
              {uploadedPDFs.map((pdf) => (
                <div key={pdf.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-4 w-4 text-cyan-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{pdf.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {pdf.company_name && <span className="text-cyan-600 mr-2">{pdf.company_name}</span>}
                        {pdf.file_size_mb.toFixed(2)} MB · {new Date(pdf.upload_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                    onClick={() => handleDeleteUpload(pdf.id, pdf.filename)}
                    disabled={deletingId === pdf.id}
                  >
                    {deletingId === pdf.id ? <Loader className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
              <Upload className="h-10 w-10 opacity-30" />
              <p className="text-sm">Upload a Deal PDF to get started</p>
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm" className="gap-2" disabled={uploading}>
                <Upload className="h-4 w-4" />
                Upload PDF
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
