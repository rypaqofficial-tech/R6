import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Slider } from "../components/ui/slider";
import { Badge } from "../components/ui/badge";
import { AlertTriangle, Save, RotateCcw, FileText, Trash2, Loader, Upload } from "lucide-react";
import { uploadApi } from "../lib/api";
import type { UploadedPDFItem } from "../lib/api";
import { toast } from "sonner";

/**
 * Settings Page - "The Engine Room"
 * Tune the machine's risk appetite and model parameters
 * Model calibration, data connectivity, strategic constraints
 */
export default function Settings() {
  const [, setLocation] = useLocation();
  const [lagSensitivity, setLagSensitivity] = useState("lag-1");
  const [distressThreshold, setDistressThreshold] = useState(25);
  const [benchmark, setBenchmark] = useState("russell-2000");
  const [bloombergConnected, setBloombergConnected] = useState(true);
  const [capitalIQConnected, setCapitalIQConnected] = useState(false);
  const [pitchbookConnected, setPitchbookConnected] = useState(true);
  const [storageLimit, setStorageLimit] = useState(50);
  const [autoDeleteDays, setAutoDeleteDays] = useState(90);
  const [excludedSectors, setExcludedSectors] = useState(["Tobacco", "Retail"]);
  const [targetHorizon, setTargetHorizon] = useState("5-7");
  const [newExcludedSector, setNewExcludedSector] = useState("");
  const [uploadedPDFs, setUploadedPDFs] = useState<UploadedPDFItem[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pdfsLoading, setPdfsLoading] = useState(true);

  useEffect(() => {
    const fetchPDFs = async () => {
      try {
        const pdfs = await uploadApi.listUploads();
        setUploadedPDFs(pdfs || []);
      } catch (error) {
        console.error("Failed to load PDFs:", error);
      } finally {
        setPdfsLoading(false);
      }
    };
    fetchPDFs();
  }, []);

  const handleDeletePDF = async (uploadId: number, filename: string) => {
    if (!confirm(`Delete "${filename}" and all associated data?`)) return;
    setDeletingId(uploadId);
    try {
      await uploadApi.deleteUpload(uploadId);
      toast.success(`"${filename}" deleted successfully`);
      setUploadedPDFs((prev) => prev.filter((p) => p.id !== uploadId));
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete upload");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddExcludedSector = () => {
    if (newExcludedSector && !excludedSectors.includes(newExcludedSector)) {
      setExcludedSectors([...excludedSectors, newExcludedSector]);
      setNewExcludedSector("");
    }
  };

  const handleRemoveExcludedSector = (sector: string) => {
    setExcludedSectors(excludedSectors.filter(s => s !== sector));
  };

  const handleSave = () => {
    toast.success("Settings saved successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">The Engine Room - Tune your machine's risk appetite</p>
      </div>

      {/* A. Model Calibration */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Model Calibration</CardTitle>
          <CardDescription>Configure how the backend prioritizes predictions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Lag Sensitivity */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Lag Sensitivity</Label>
            <p className="text-xs text-muted-foreground">Choose whether to prioritize immediate reactions or long-term trends</p>
            <div className="flex gap-3 mt-3">
              <Button
                variant={lagSensitivity === "lag-1" ? "default" : "outline"}
                onClick={() => setLagSensitivity("lag-1")}
                className="flex-1"
              >
                Lag-1 (Immediate)
              </Button>
              <Button
                variant={lagSensitivity === "lag-2" ? "default" : "outline"}
                onClick={() => setLagSensitivity("lag-2")}
                className="flex-1"
              >
                Lag-2 (Trend)
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {lagSensitivity === "lag-1"
                ? "Reacting quickly to market changes"
                : "Following long-term structural trends"}
            </p>
          </div>

          {/* Risk Thresholds */}
          <div className="space-y-3 pt-4 border-t border-border">
            <Label className="text-sm font-semibold">Distress Threshold</Label>
            <p className="text-xs text-muted-foreground">Flag companies if probability of covenant breach exceeds this level</p>
            <div className="flex items-center gap-4 mt-3">
              <Slider
                value={[distressThreshold]}
                onValueChange={(value) => setDistressThreshold(value[0])}
                min={10}
                max={50}
                step={1}
                className="flex-1"
              />
              <span className="text-lg font-bold text-cyan-600 w-16 text-right">{distressThreshold}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Companies with {distressThreshold}%+ covenant breach probability will be flagged as distressed
            </p>
          </div>

          {/* Benchmark Selection */}
          <div className="space-y-3 pt-4 border-t border-border">
            <Label className="text-sm font-semibold">Benchmark Index</Label>
            <p className="text-xs text-muted-foreground">Select which index to use for alpha calculations</p>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { id: "russell-2000", label: "Russell 2000" },
                { id: "sp-500", label: "S&P 500" },
                { id: "msci-world", label: "MSCI World" },
              ].map((option) => (
                <Button
                  key={option.id}
                  variant={benchmark === option.id ? "default" : "outline"}
                  onClick={() => setBenchmark(option.id)}
                  className="text-sm"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* B. Data Connectivity */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Data Connectivity</CardTitle>
          <CardDescription>Manage external data feed integrations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Integrations */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">API Integrations</Label>
            <p className="text-xs text-muted-foreground">Toggle data feeds on/off</p>

            <div className="space-y-3 mt-3">
              <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                <div>
                  <p className="font-semibold text-foreground">Bloomberg Terminal</p>
                  <p className="text-xs text-muted-foreground">Real-time market data</p>
                </div>
                <Switch checked={bloombergConnected} onCheckedChange={setBloombergConnected} />
              </div>

              <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                <div>
                  <p className="font-semibold text-foreground">Capital IQ</p>
                  <p className="text-xs text-muted-foreground">Company fundamentals & comparables</p>
                </div>
                <Switch checked={capitalIQConnected} onCheckedChange={setCapitalIQConnected} />
              </div>

              <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                <div>
                  <p className="font-semibold text-foreground">PitchBook</p>
                  <p className="text-xs text-muted-foreground">M&A and private equity data</p>
                </div>
                <Switch checked={pitchbookConnected} onCheckedChange={setPitchbookConnected} />
              </div>
            </div>
          </div>

          {/* Local File Vault */}
          <div className="space-y-3 pt-4 border-t border-border">
            <Label className="text-sm font-semibold">Local File Vault</Label>
            <p className="text-xs text-muted-foreground">Manage uploaded PDFs and CIMs</p>

            <div className="space-y-3 mt-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs">Storage Limit (GB)</Label>
                  <span className="text-sm font-semibold text-cyan-600">{storageLimit} GB</span>
                </div>
                <Slider
                  value={[storageLimit]}
                  onValueChange={(value) => setStorageLimit(value[0])}
                  min={10}
                  max={500}
                  step={10}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs">Auto-Delete After (days)</Label>
                  <span className="text-sm font-semibold text-cyan-600">{autoDeleteDays} days</span>
                </div>
                <Slider
                  value={[autoDeleteDays]}
                  onValueChange={(value) => setAutoDeleteDays(value[0])}
                  min={30}
                  max={365}
                  step={30}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* C. Strategic Constraints */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Strategic Constraints</CardTitle>
          <CardDescription>Define sourcing parameters and investment horizon</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Inclusion/Exclusion Zones */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Excluded Sectors</Label>
            <p className="text-xs text-muted-foreground">The sourcing engine won't waste compute on these sectors</p>

            <div className="space-y-3 mt-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Add sector (e.g., Gaming)"
                  value={newExcludedSector}
                  onChange={(e) => setNewExcludedSector(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddExcludedSector()}
                  className="bg-background border-border"
                />
                <Button onClick={handleAddExcludedSector} variant="outline">
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {excludedSectors.map((sector) => (
                  <Badge
                    key={sector}
                    variant="secondary"
                    className="cursor-pointer hover:bg-red-500 hover:text-white transition-colors"
                    onClick={() => handleRemoveExcludedSector(sector)}
                  >
                    {sector} ✕
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Target Horizon */}
          <div className="space-y-3 pt-4 border-t border-border">
            <Label className="text-sm font-semibold">Target Exit Horizon</Label>
            <p className="text-xs text-muted-foreground">Default investment timeline for new deals</p>

            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { id: "3-5", label: "3-5 Years" },
                { id: "5-7", label: "5-7 Years" },
                { id: "10+", label: "10+ Years" },
              ].map((option) => (
                <Button
                  key={option.id}
                  variant={targetHorizon === option.id ? "default" : "outline"}
                  onClick={() => setTargetHorizon(option.id)}
                  className="text-sm"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* D. PDF Vault Management */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-500" />
            PDF Vault Management
          </CardTitle>
          <CardDescription>
            {uploadedPDFs.length > 0
              ? `${uploadedPDFs.length} document${uploadedPDFs.length !== 1 ? "s" : ""} — all data is sourced from these files`
              : "No PDFs uploaded yet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pdfsLoading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading uploads...</span>
            </div>
          ) : uploadedPDFs.length > 0 ? (
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
                    onClick={() => handleDeletePDF(pdf.id, pdf.filename)}
                    disabled={deletingId === pdf.id}
                  >
                    {deletingId === pdf.id ? <Loader className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-muted-foreground">
              <Upload className="h-8 w-8 opacity-30" />
              <p className="text-sm">No PDFs uploaded yet</p>
              <Button onClick={() => setLocation("/dashboard")} variant="outline" size="sm" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload from Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-red-500/5 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-red-500/10 rounded-lg border border-red-200">
            <p className="text-sm text-red-700 font-semibold mb-2">Reset All Settings</p>
            <p className="text-sm text-red-600 mb-4">
              Restore all settings to factory defaults. This action cannot be undone.
            </p>
            <Button variant="destructive" className="gap-2 bg-red-600 hover:bg-red-700">
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSave} className="gap-2 bg-cyan-600 text-white hover:bg-cyan-700">
          <Save className="h-4 w-4" />
          Save Configuration
        </Button>
      </div>
    </div>
  );
}
