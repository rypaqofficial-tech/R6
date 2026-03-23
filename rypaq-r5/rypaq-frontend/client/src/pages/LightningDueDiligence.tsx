import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { diligenceApi, dealApi } from "../lib/api";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, ArrowLeft, Download, FileText, Loader } from "lucide-react";

export default function LightningDueDiligence() {
  const [, setLocation] = useLocation();
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [report, setReport] = useState<any>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const companyFromUrl = params.get("company");
    if (companyFromUrl) {
      setSelectedCompany(companyFromUrl);
    }
  }, []);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const dealsData = await dealApi.getOpportunities();
        if (dealsData && dealsData.length > 0) {
          setDeals(dealsData);
          // If no company selected yet, default to first
          if (!selectedCompany) {
            setSelectedCompany(dealsData[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching deals:", error);
        toast.error("Failed to load companies");
      } finally {
        setLoading(false);
      }
    };
    fetchDeals();
  }, []);

  useEffect(() => {
    if (!selectedCompany) return;
    const fetchReport = async () => {
      setReportLoading(true);
      setReport(null);
      try {
        const reportData = await diligenceApi.getReport(selectedCompany);
        if (reportData) setReport(reportData);
      } catch (error: any) {
        if (error?.message?.includes("404")) {
          toast.error("No due diligence report found for this company. Upload a PDF first.");
        } else {
          console.error("Error fetching diligence report:", error);
          toast.error("Failed to load diligence report");
        }
      } finally {
        setReportLoading(false);
      }
    };
    fetchReport();
  }, [selectedCompany]);

  const selectedDeal = deals.find((d) => d.id === selectedCompany || d.company_name === selectedCompany);

  // Score data — ONLY from real report, no hardcoded fallbacks
  const scoreData = report
    ? [
        { category: "Market Risk", value: report.market_risk, color: report.market_risk > 7 ? "#ef4444" : report.market_risk > 5 ? "#f59e0b" : "#10b981" },
        { category: "Financial Health", value: report.financial_health, color: report.financial_health > 7 ? "#10b981" : report.financial_health > 5 ? "#f59e0b" : "#ef4444" },
        { category: "Operational", value: report.operational_efficiency, color: report.operational_efficiency > 7 ? "#10b981" : report.operational_efficiency > 5 ? "#f59e0b" : "#ef4444" },
        { category: "Customer Conc.", value: report.customer_concentration, color: report.customer_concentration > 7 ? "#ef4444" : report.customer_concentration > 5 ? "#f59e0b" : "#10b981" },
        { category: "Macro Sensitivity", value: report.macro_sensitivity, color: report.macro_sensitivity > 7 ? "#ef4444" : report.macro_sensitivity > 5 ? "#f59e0b" : "#10b981" },
      ]
    : [];

  const handleGenerateReport = async () => {
    if (!report || !selectedDeal) {
      toast.error("No report data available to export");
      return;
    }
    setGeneratingReport(true);
    try {
      const companyName = report.company_name || selectedDeal?.company_name || "Company";
      const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

      const redFlagsHtml = (report.red_flags || [])
        .map((f: string) => `<li style="color:#dc2626;margin-bottom:4px;">&#9888; ${f}</li>`)
        .join("");
      const greenFlagsHtml = (report.green_flags || [])
        .map((f: string) => `<li style="color:#16a34a;margin-bottom:4px;">&#10003; ${f}</li>`)
        .join("");

      const scoreRows = scoreData
        .map(
          (s) =>
            `<tr>
              <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${s.category}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">
                <span style="font-weight:bold;color:${s.color};">${s.value.toFixed(1)}/10</span>
              </td>
            </tr>`
        )
        .join("");

      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Due Diligence Report — ${companyName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; margin: 0; padding: 0; background: #fff; }
    .page { max-width: 800px; margin: 0 auto; padding: 48px 40px; }
    .header { border-bottom: 3px solid #0891b2; padding-bottom: 24px; margin-bottom: 32px; }
    .header h1 { font-size: 28px; font-weight: 800; color: #0891b2; margin: 0 0 4px; }
    .header .subtitle { font-size: 14px; color: #6b7280; }
    .section { margin-bottom: 32px; }
    .section h2 { font-size: 18px; font-weight: 700; color: #1f2937; border-left: 4px solid #0891b2; padding-left: 12px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { background: #f3f4f6; padding: 10px 12px; text-align: left; font-weight: 600; color: #374151; }
    .integrity-box { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 20px; text-align: center; }
    .integrity-score { font-size: 48px; font-weight: 800; color: #0891b2; }
    .flags-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .flag-box { border-radius: 8px; padding: 16px; }
    .flag-box.red { background: #fef2f2; border: 1px solid #fecaca; }
    .flag-box.green { background: #f0fdf4; border: 1px solid #bbf7d0; }
    .flag-box h3 { margin: 0 0 12px; font-size: 15px; font-weight: 700; }
    .flag-box.red h3 { color: #dc2626; }
    .flag-box.green h3 { color: #16a34a; }
    ul { margin: 0; padding-left: 16px; font-size: 13px; line-height: 1.7; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>Lightning Due Diligence Report</h1>
      <div class="subtitle">${companyName} &nbsp;|&nbsp; ${selectedDeal?.sector || ""} &nbsp;|&nbsp; Generated ${date}</div>
    </div>

    <div class="section">
      <h2>Risk Assessment Scores</h2>
      <table>
        <thead><tr><th>Category</th><th style="text-align:center;">Score (0–10)</th></tr></thead>
        <tbody>${scoreRows}</tbody>
      </table>
    </div>

    <div class="section">
      <h2>Data Integrity</h2>
      <div class="integrity-box">
        <div class="integrity-score">${(report.data_integrity_score || 0).toFixed(1)}</div>
        <div style="color:#6b7280;font-size:14px;margin-top:4px;">out of 10 — ${(report.data_integrity_score || 0) >= 8 ? "High confidence in data quality" : "Moderate data quality — verify key figures"}</div>
      </div>
    </div>

    <div class="section">
      <h2>Risk Flags</h2>
      <div class="flags-grid">
        <div class="flag-box red">
          <h3>&#9888; Red Flags</h3>
          <ul>${redFlagsHtml || "<li>None identified</li>"}</ul>
        </div>
        <div class="flag-box green">
          <h3>&#10003; Green Flags</h3>
          <ul>${greenFlagsHtml || "<li>None identified</li>"}</ul>
        </div>
      </div>
    </div>

    ${selectedDeal ? `
    <div class="section">
      <h2>Financial Summary</h2>
      <table>
        <thead><tr><th>Metric</th><th>Value</th></tr></thead>
        <tbody>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">Revenue</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">$${((selectedDeal.revenue || 0) / 1000000).toFixed(2)}M</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">Enterprise Value</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">$${((selectedDeal.enterprise_value || 0) / 1000000).toFixed(2)}M</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">Alpha Score</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${(selectedDeal.alpha_score || 0).toFixed(2)}%</td></tr>
          <tr><td style="padding:8px 12px;">3x Return Probability</td><td style="padding:8px 12px;">${(selectedDeal.probability_3x_return || 0).toFixed(1)}%</td></tr>
        </tbody>
      </table>
    </div>
    ` : ""}

    <div class="footer">
      Generated by Rypaq R1 — AI-Powered Private Equity Intelligence &nbsp;|&nbsp; ${date}
    </div>
  </div>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `due-diligence-${companyName.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Report downloaded successfully");
    } catch (error) {
      console.error("Report generation failed:", error);
      toast.error("Failed to generate report");
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-muted-foreground">Loading report...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lightning Due Diligence</h1>
          {selectedDeal && (
            <p className="text-lg font-semibold text-cyan-600 mt-1">{selectedDeal.company_name}</p>
          )}
          <p className="text-muted-foreground text-sm mt-1">AI-powered risk assessment from uploaded PDF data</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {report && (
            <Button
              onClick={handleGenerateReport}
              variant="outline"
              className="gap-2 border-cyan-600 text-cyan-600 hover:bg-cyan-600 hover:text-white"
              disabled={generatingReport}
            >
              {generatingReport ? <Loader className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export Report
            </Button>
          )}
          <Button onClick={() => setLocation("/smart-deal-sourcing")} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Sourcing
          </Button>
        </div>
      </div>

      {/* Company Selector */}
      {deals.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Select Company</CardTitle>
            <CardDescription className="text-xs">All companies are sourced from uploaded PDFs</CardDescription>
          </CardHeader>
          <CardContent>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full p-2 border border-border rounded bg-background text-foreground text-sm"
            >
              {deals.map((deal) => (
                <option key={deal.id} value={deal.id}>
                  {deal.company_name} — {deal.sector}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      )}

      {/* No report state */}
      {!reportLoading && !report && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <FileText className="h-12 w-12 opacity-30" />
          <p className="text-base font-medium">No report available</p>
          <p className="text-sm text-center max-w-sm">Upload a PDF for this company from the Dashboard to generate a due diligence report.</p>
          <Button onClick={() => setLocation("/dashboard")} variant="outline" className="gap-2 mt-2">
            <ArrowLeft className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>
      )}

      {reportLoading && (
        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader className="h-6 w-6 animate-spin" />
          <p>Loading report...</p>
        </div>
      )}

      {report && !reportLoading && (
        <>
          {/* Risk Assessment + Data Integrity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
                <CardDescription>Key risk factors (0–10 scale) — from PDF analysis</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px] sm:h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreData} margin={{ top: 5, right: 10, bottom: 50, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                    <XAxis
                      dataKey="category"
                      stroke="currentColor"
                      tick={{ fontSize: 11 }}
                      angle={-35}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis stroke="currentColor" domain={[0, 10]} tick={{ fontSize: 11 }} width={30} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload[0]) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-background border border-border rounded p-2 text-xs">
                              <p className="font-semibold">{d.category}</p>
                              <p style={{ color: d.color }}>Score: {d.value.toFixed(1)}/10</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {scoreData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Data Integrity</CardTitle>
                <CardDescription>Quality of extracted PDF data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 bg-background rounded-lg border border-border text-center">
                  <p className="text-xs text-muted-foreground mb-1">Overall Score</p>
                  <p className="text-5xl font-bold text-cyan-600">{(report.data_integrity_score || 0).toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground mt-1">out of 10</p>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground">Data Completeness</span>
                    <span className="font-semibold">{((report.data_integrity_score || 0) * 10).toFixed(0)}%</span>
                  </div>
                  <Progress value={(report.data_integrity_score || 0) * 10} className="h-2" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Assessment:</p>
                  <p className="text-xs text-muted-foreground">
                    {(report.data_integrity_score || 0) >= 8
                      ? "High confidence — all key financial fields extracted from PDF"
                      : (report.data_integrity_score || 0) >= 6
                      ? "Moderate confidence — some fields may need manual verification"
                      : "Low confidence — limited data extracted; consider re-uploading a more complete PDF"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Red Flags + Green Flags */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Red Flags
                  {report.red_flags?.length > 0 && (
                    <Badge variant="destructive" className="ml-auto text-xs">{report.red_flags.length}</Badge>
                  )}
                </CardTitle>
                <CardDescription>Risks identified from PDF analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.red_flags && report.red_flags.length > 0 ? (
                  report.red_flags.map((flag: string, idx: number) => (
                    <div key={idx} className="p-3 bg-red-500/5 border-l-2 border-red-600 rounded">
                      <p className="text-sm text-red-600">{flag}</p>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-green-500/5 border border-green-200 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-green-600">No red flags identified in this document</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Green Flags
                  {report.green_flags?.length > 0 && (
                    <Badge className="ml-auto text-xs bg-green-600">{report.green_flags.length}</Badge>
                  )}
                </CardTitle>
                <CardDescription>Strengths identified from PDF analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.green_flags && report.green_flags.length > 0 ? (
                  report.green_flags.map((flag: string, idx: number) => (
                    <div key={idx} className="p-3 bg-green-500/5 border-l-2 border-green-600 rounded">
                      <p className="text-sm text-green-600">{flag}</p>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-muted/30 border border-border rounded">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No green flags identified in this document</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Export CTA */}
          <Card className="bg-gradient-to-r from-cyan-500/10 to-transparent border-cyan-200">
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
              <div>
                <p className="font-semibold text-foreground">Export Full Due Diligence Report</p>
                <p className="text-sm text-muted-foreground">Download a complete HTML report with all risk scores, flags, and financial data</p>
              </div>
              <Button
                onClick={handleGenerateReport}
                className="gap-2 bg-cyan-600 hover:bg-cyan-700 shrink-0"
                disabled={generatingReport}
              >
                {generatingReport ? <Loader className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
