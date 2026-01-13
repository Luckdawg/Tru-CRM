import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Link } from "wouter";
import { FileText, Plus, Play, Trash2, Download, TrendingUp, BarChart3 } from "lucide-react";
import { toast } from "sonner";

export default function Reports() {
  const { user, isAuthenticated } = useAuth();
  const [showBuilder, setShowBuilder] = useState(false);
  const [showForecastReport, setShowForecastReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportResults, setReportResults] = useState<any>(null);

  // Custom Report Builder State
  const [reportName, setReportName] = useState("");
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [filters, setFilters] = useState<Array<{ field: string; operator: string; value: string }>>([]);
  const [newFilter, setNewFilter] = useState({ field: "", operator: ">", value: "" });

  const { data: savedReports, refetch: refetchReports } = trpc.reports.getSavedReports.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: availableFields } = trpc.reports.getAvailableFields.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const executeCustomReportMutation = trpc.reports.executeCustomReport.useQuery(
    {
      modules: selectedModules,
      fields: [],
      filters: filters.map(f => ({ ...f, value: parseFloat(f.value) || f.value })),
      sorting: [],
    },
    {
      enabled: false,
    }
  );

  const saveReportMutation = trpc.reports.saveReport.useMutation({
    onSuccess: () => {
      toast.success("Report saved successfully");
      refetchReports();
      setShowBuilder(false);
      setReportName("");
      setFilters([]);
      setSelectedModules([]);
    },
  });

  const deleteReportMutation = trpc.reports.deleteReport.useMutation({
    onSuccess: () => {
      toast.success("Report deleted");
      refetchReports();
    },
  });

  const handleAddFilter = () => {
    if (newFilter.field && newFilter.value) {
      setFilters([...filters, newFilter]);
      setNewFilter({ field: "", operator: ">", value: "" });
    }
  };

  const handleRemoveFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const handleRunCustomReport = async () => {
    if (selectedModules.length === 0) {
      toast.error("Please select at least one module");
      return;
    }

    try {
      const result = await trpc.reports.executeCustomReport.query({
        modules: selectedModules,
        fields: [],
        filters: filters.map(f => ({ ...f, value: parseFloat(f.value) || f.value })),
        sorting: [],
      });
      setReportResults(result);
      toast.success(`Report executed: ${result.rowCount} rows in ${result.executionTime}ms`);
    } catch (error) {
      toast.error("Failed to execute report");
    }
  };

  const handleSaveReport = () => {
    if (!reportName) {
      toast.error("Please enter a report name");
      return;
    }

    saveReportMutation.mutate({
      reportName,
      reportType: "Custom",
      category: "Custom Reports",
      description: `Custom report with ${filters.length} filters`,
      queryConfig: { modules: selectedModules },
      columns: [],
      filters: filters,
      isPublic: false,
      isFavorite: false,
    });
  };

  const handleDeleteReport = (reportId: number) => {
    if (confirm("Are you sure you want to delete this report?")) {
      deleteReportMutation.mutate({ reportId });
    }
  };

  const exportToCSV = (data: any[]) => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(","),
      ...data.map(row => headers.map(h => row[h]).join(","))
    ].join("\\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${Date.now()}.csv`;
    a.click();
  };

  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <img src="/visium-v-logo.png" alt="Visium" className="h-10 cursor-pointer" />
            </Link>
            <h1 className="text-2xl font-bold text-primary">Reports</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
          </div>
        </div>
      </header>

      <nav className="border-b bg-card">
        <div className="container">
          <div className="flex gap-1 py-2">
            <Button variant="ghost" size="sm" asChild><Link href="/dashboard">Dashboard</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/leads">Leads</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/accounts">Accounts</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/contacts">Contacts</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/opportunities">Opportunities</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/projects">Projects</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/cases">Support</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/analytics">Analytics</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/engagement">Engagement</Link></Button>
            <Button variant="default" size="sm" asChild><Link href="/reports">Reports</Link></Button>
          </div>
        </div>
      </nav>

      <main className="container py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Reports & Analytics</h2>
            <p className="text-muted-foreground">Pre-built reports and custom report builder</p>
          </div>
          <Button onClick={() => setShowBuilder(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Build Custom Report
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Pre-built Reports */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowForecastReport(true)}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <Badge>Pre-built</Badge>
              </div>
              <CardTitle>Forecast Accuracy Tracking</CardTitle>
              <CardDescription>
                Compare forecasted vs actual closed deals by period. Measure prediction accuracy and refine probability weights.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm">
                <Play className="h-4 w-4 mr-2" />
                Run Report
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <BarChart3 className="h-8 w-8 text-green-600" />
                <Badge>Pre-built</Badge>
              </div>
              <CardTitle>Pipeline Health Report</CardTitle>
              <CardDescription>
                Analyze pipeline distribution, deal health scores, and identify at-risk opportunities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm">
                <Play className="h-4 w-4 mr-2" />
                Run Report
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Saved Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Saved Reports</CardTitle>
            <CardDescription>Your custom and favorite reports</CardDescription>
          </CardHeader>
          <CardContent>
            {savedReports && savedReports.length > 0 ? (
              <div className="space-y-3">
                {savedReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{report.reportName}</span>
                        <Badge variant="outline">{report.reportType}</Badge>
                        {report.isFavorite && <Badge variant="secondary">Favorite</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteReport(report.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No saved reports yet. Create your first custom report!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Custom Report Builder Dialog */}
        <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Custom Report Builder</DialogTitle>
              <DialogDescription>
                Build cross-module queries with custom filters
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Report Name</Label>
                <Input
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="e.g., High-value Low-engagement Accounts"
                />
              </div>

              <div>
                <Label>Select Modules</Label>
                <div className="flex gap-2 mt-2">
                  {['accounts', 'opportunities', 'engagement'].map(module => (
                    <Button
                      key={module}
                      variant={selectedModules.includes(module) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (selectedModules.includes(module)) {
                          setSelectedModules(selectedModules.filter(m => m !== module));
                        } else {
                          setSelectedModules([...selectedModules, module]);
                        }
                      }}
                    >
                      {module.charAt(0).toUpperCase() + module.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Filters</Label>
                <div className="space-y-2 mt-2">
                  {filters.map((filter, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      <span className="text-sm">{filter.field} {filter.operator} {filter.value}</span>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveFilter(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <div className="flex items-center gap-2">
                    <Select value={newFilter.field} onValueChange={(value) => setNewFilter({ ...newFilter, field: value })}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pipelineValue">Pipeline Value</SelectItem>
                        <SelectItem value="engagementScore">Engagement Score</SelectItem>
                        <SelectItem value="opportunityCount">Opportunity Count</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={newFilter.operator} onValueChange={(value) => setNewFilter({ ...newFilter, operator: value })}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=">">{">"}</SelectItem>
                        <SelectItem value="<">{"<"}</SelectItem>
                        <SelectItem value="=">{"="}</SelectItem>
                        <SelectItem value=">=">{">="}</SelectItem>
                        <SelectItem value="<=">{"<="}</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      type="text"
                      value={newFilter.value}
                      onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
                      placeholder="Value"
                      className="w-[150px]"
                    />

                    <Button onClick={handleAddFilter} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {reportResults && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Results ({reportResults.rowCount} rows)</Label>
                    <Button variant="outline" size="sm" onClick={() => exportToCSV(reportResults.results)}>
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                  <div className="border rounded max-h-[300px] overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          {reportResults.results.length > 0 && Object.keys(reportResults.results[0]).map((key) => (
                            <th key={key} className="p-2 text-left font-medium">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reportResults.results.map((row: any, index: number) => (
                          <tr key={index} className="border-t">
                            {Object.values(row).map((value: any, i) => (
                              <td key={i} className="p-2">{String(value)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowBuilder(false)}>Cancel</Button>
                <Button variant="outline" onClick={handleRunCustomReport}>
                  <Play className="h-4 w-4 mr-2" />
                  Run Report
                </Button>
                <Button onClick={handleSaveReport}>
                  Save Report
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Forecast Report Dialog - Placeholder */}
        <Dialog open={showForecastReport} onOpenChange={setShowForecastReport}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Forecast Accuracy Tracking</DialogTitle>
              <DialogDescription>
                Compare forecasted vs actual results
              </DialogDescription>
            </DialogHeader>
            <div className="py-8 text-center text-muted-foreground">
              <p>Forecast accuracy report will be displayed here.</p>
              <p className="text-sm mt-2">This feature requires historical forecast snapshots to be created.</p>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
