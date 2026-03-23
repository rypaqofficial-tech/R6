import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { TrendingUp, ArrowRight, FileText, Target, Zap, Eye, EyeOff, ChevronDown } from "lucide-react";
import { dealApi } from "../lib/api";
import { toast } from "sonner";

export default function SmartDealSourcing() {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPDFComparison, setShowPDFComparison] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const dealsData = await dealApi.getOpportunities();
        if (dealsData && dealsData.length > 0) {
          setDeals(dealsData);
          setSelectedCompany(dealsData[0].company_name);
        }
      } catch (error) {
        console.error("Error fetching deals:", error);
        toast.error("Failed to load deals");
      } finally {
        setLoading(false);
      }
    };
    fetchDeals();
  }, []);

  // Target Matrix data — all from uploaded PDF data
  const targetMatrixData = deals.map((deal) => ({
    x: deal.probability_3x_return || 0,
    y: deal.sector_momentum || 0,
    size: Math.max(20, (deal.revenue || 100000000) / 250000),
    company: deal.company_name,
    industry: deal.sector,
    revenue: (deal.revenue || 0) / 1000000,
    id: deal.id,
  }));

  // Alpha Score bar chart — derived from real deal data, no hardcoded months
  const alphaBarData = deals.map((deal) => ({
    name: deal.company_name.length > 12 ? deal.company_name.slice(0, 12) + "…" : deal.company_name,
    fullName: deal.company_name,
    alpha: parseFloat((deal.alpha_score || 0).toFixed(2)),
    sector: deal.sector,
  }));

  const selectedDeal = deals.find((d) => d.company_name === selectedCompany);
  const selectedCompanyData = targetMatrixData.find((d) => d.company === selectedCompany) || targetMatrixData[0];
  const companySignals = selectedDeal?.signals || [];

  const handleConnectToDueDiligence = () => {
    if (selectedDeal) {
      setLocation(`/due-diligence?company=${selectedDeal.id}`);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-muted-foreground">Loading deals...</div>;
  }

  if (deals.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Smart Deal Sourcing</h1>
          <p className="text-muted-foreground mt-2">High-velocity discovery with AI-powered deal matrix</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
          <FileText className="h-16 w-16 opacity-30" />
          <p className="text-lg font-medium">No deals found</p>
          <p className="text-sm text-center max-w-sm">Upload deal PDFs from the Dashboard to populate the target matrix and alpha scores.</p>
          <Button onClick={() => setLocation("/dashboard")} variant="outline" className="gap-2 mt-2">
            <ArrowRight className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Smart Deal Sourcing</h1>
          <p className="text-muted-foreground mt-2">High-velocity discovery with AI-powered deal matrix</p>
        </div>
        <Badge variant="outline" className="self-start sm:self-auto text-cyan-600 border-cyan-600 gap-1">
          <Zap className="h-3 w-3" />
          {deals.length} deal{deals.length !== 1 ? "s" : ""} from uploaded PDFs
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Target Matrix — Responsive */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-cyan-500" />
                    Target Matrix
                  </CardTitle>
                  <CardDescription>Probability of 3x Return vs Sector Momentum — click a dot to select</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPDFComparison(!showPDFComparison)}
                  className="gap-1.5"
                  title={showPDFComparison ? "Hide PDF comparison" : "Show PDF comparison"}
                >
                  {showPDFComparison ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  <span className="text-xs hidden sm:inline">{showPDFComparison ? "Hide" : "Show"}</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="h-[320px] sm:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 30, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                  <XAxis
                    dataKey="x"
                    name="Probability of 3x Return (%)"
                    type="number"
                    domain={[0, 100]}
                    stroke="currentColor"
                    tick={{ fontSize: 11 }}
                    label={{ value: "Probability of 3x Return (%)", position: "insideBottom", offset: -15, fontSize: 11 }}
                  />
                  <YAxis
                    dataKey="y"
                    name="Sector Momentum"
                    type="number"
                    domain={[0, 100]}
                    stroke="currentColor"
                    tick={{ fontSize: 11 }}
                    width={45}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload[0]) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border border-border rounded p-2 text-sm shadow-lg">
                            <p className="font-semibold text-foreground">{data.company}</p>
                            <p className="text-xs text-muted-foreground">{data.industry}</p>
                            <p className="text-cyan-500 text-xs">3x Probability: {data.x.toFixed(1)}%</p>
                            <p className="text-muted-foreground text-xs">Momentum: {data.y.toFixed(1)}</p>
                            <p className="text-muted-foreground text-xs">Revenue: ${data.revenue.toFixed(1)}M</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {showPDFComparison && (
                    <Scatter
                      name="Deals"
                      data={targetMatrixData}
                      onClick={(data: any) => setSelectedCompany(data.company)}
                    >
                      {targetMatrixData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.company === selectedCompany ? "#00d4ff" : entry.x > 70 ? "#10b981" : "#f59e0b"}
                          opacity={entry.company === selectedCompany ? 1 : 0.7}
                          stroke={entry.company === selectedCompany ? "#fff" : "none"}
                          strokeWidth={2}
                        />
                      ))}
                    </Scatter>
                  )}
                  {!showPDFComparison && (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                      PDF comparison hidden — click eye icon to show
                    </div>
                  )}
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Right panel: Alpha Score + Company Details */}
        <div className="space-y-6">
          {/* Alpha Score — Responsive bar chart from real data */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-cyan-500" />
                Alpha Score
              </CardTitle>
              <CardDescription>By company (from uploaded PDFs)</CardDescription>
            </CardHeader>
            <CardContent className="h-[180px] sm:h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={alphaBarData} margin={{ top: 5, right: 5, bottom: 30, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                  <XAxis
                    dataKey="name"
                    stroke="currentColor"
                    tick={{ fontSize: 10 }}
                    angle={-35}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis stroke="currentColor" tick={{ fontSize: 10 }} width={35} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload[0]) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-background border border-border rounded p-2 text-xs">
                            <p className="font-semibold">{d.fullName}</p>
                            <p className="text-cyan-500">Alpha: {d.alpha}%</p>
                            <p className="text-muted-foreground">{d.sector}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="alpha" radius={[3, 3, 0, 0]}>
                    {alphaBarData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fullName === selectedCompany ? "#00d4ff" : "#3b82f6"}
                        opacity={entry.fullName === selectedCompany ? 1 : 0.6}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Selected Company Details */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="space-y-2">
                <div className="relative">
                  <Button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    variant="outline"
                    className="w-full justify-between"
                  >
                    <span className="truncate font-semibold text-foreground">
                      {selectedCompanyData?.company || "Select a company"}
                    </span>
                    <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
                  </Button>
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {deals.map((deal) => (
                        <button
                          key={deal.id}
                          onClick={() => {
                            setSelectedCompany(deal.company_name);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors ${
                            deal.company_name === selectedCompany ? "bg-cyan-600/20 text-cyan-600 font-semibold" : ""
                          }`}
                        >
                          {deal.company_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <CardDescription className="text-xs">{selectedCompanyData?.industry}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedDeal && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-background rounded border border-border">
                    <p className="text-muted-foreground">3x Probability</p>
                    <p className="font-bold text-cyan-500">{selectedDeal.probability_3x_return?.toFixed(1)}%</p>
                  </div>
                  <div className="p-2 bg-background rounded border border-border">
                    <p className="text-muted-foreground">Alpha Score</p>
                    <p className="font-bold text-emerald-500">{selectedDeal.alpha_score?.toFixed(2)}%</p>
                  </div>
                  <div className="p-2 bg-background rounded border border-border">
                    <p className="text-muted-foreground">Revenue</p>
                    <p className="font-bold">${((selectedDeal.revenue || 0) / 1000000).toFixed(1)}M</p>
                  </div>
                  <div className="p-2 bg-background rounded border border-border">
                    <p className="text-muted-foreground">Momentum</p>
                    <p className="font-bold">{selectedDeal.sector_momentum?.toFixed(1)}</p>
                  </div>
                </div>
              )}
              {companySignals.length > 0 && (
                <div className="space-y-1.5">
                  {companySignals.map((signal: string, idx: number) => (
                    <div key={idx} className="text-xs text-muted-foreground border-l-2 border-cyan-600 pl-2">
                      {signal}
                    </div>
                  ))}
                </div>
              )}
              <Button
                onClick={handleConnectToDueDiligence}
                className="w-full gap-2 bg-cyan-600 hover:bg-cyan-700"
                disabled={!selectedDeal}
              >
                Connect to Due Diligence
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
