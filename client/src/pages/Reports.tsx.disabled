import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart3, Download, Calendar } from "lucide-react";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useState, useMemo, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Reports() {
  const { user, isAuthenticated } = useAuth();
  const [dateRange, setDateRange] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`visium-crm-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };
  
  const { data: pipelineData, isLoading: loadingPipeline } = trpc.reports.opportunitiesByCloseDate.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: revenueData, isLoading: loadingRevenue } = trpc.reports.revenueByMonth.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: typeData, isLoading: loadingType } = trpc.reports.opportunitiesByType.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: stageData, isLoading: loadingStage } = trpc.dashboard.pipelineByStage.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: leadSourceData, isLoading: loadingLeads } = trpc.reports.leadsBySource.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: forecastData, isLoading: loadingForecast } = trpc.reports.forecastProjection.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }

  const isLoading = loadingPipeline || loadingRevenue || loadingType || loadingStage || loadingLeads || loadingForecast;

  // Format data for charts
  const formattedPipelineData = pipelineData?.map((item: any) => ({
    month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    opportunities: Number(item.count),
    value: Number(item.totalValue) / 1000, // Convert to thousands
  })) || [];

  const formattedRevenueData = revenueData?.map((item: any) => ({
    month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    revenue: Number(item.revenue) / 1000, // Convert to thousands
    deals: Number(item.count),
  })) || [];

  const formattedStageData = stageData?.map((item: any) => ({
    stage: item.stage,
    count: Number(item.count),
    value: Number(item.totalValue) / 1000,
  })) || [];

  const formattedTypeData = typeData?.map((item: any) => ({
    type: item.type || 'Unknown',
    count: Number(item.count),
    value: Number(item.totalValue) / 1000,
  })) || [];

  const formattedLeadData = leadSourceData?.map((item: any) => ({
    source: item.source,
    count: Number(item.count),
  })) || [];

  const formattedForecastData = forecastData?.pipeline.map((item: any) => ({
    month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    pipelineValue: item.pipelineValue / 1000,
    forecastedRevenue: item.forecastedRevenue / 1000,
  })) || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <img src="/visium-v-logo.png" alt="Visium" className="h-10 cursor-pointer" />
            </Link>
            <h1 className="text-2xl font-bold text-primary">Reports & Analytics</h1>
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
          </div>
        </div>
      </nav>

      <main className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Sales Reports & Analytics</h2>
            <p className="text-muted-foreground">Comprehensive insights into your sales performance</p>
          </div>
          <BarChart3 className="h-8 w-8 text-primary" />
        </div>

        {/* Filters and Export */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="dateRange">Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger id="dateRange">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="90">Last Quarter</SelectItem>
                    <SelectItem value="365">Last Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {dateRange === "custom" && (
                <>
                  <div className="flex-1 min-w-[150px]">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}
              
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={handleExportPDF}
                disabled={isExporting}
              >
                <Download className="h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading reports...</p>
          </div>
        ) : (
          <div ref={reportRef} className="space-y-6">
            {/* Pipeline by Stage */}
            <Card>
              <CardHeader>
                <CardTitle>Pipeline by Stage</CardTitle>
                <CardDescription>Current opportunities grouped by sales stage</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={formattedStageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" angle={-45} textAnchor="end" height={100} />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === 'value') return [`$${value.toFixed(0)}K`, 'Total Value'];
                        return [value, 'Count'];
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="count" fill="#8884d8" name="Opportunities" />
                    <Bar yAxisId="right" dataKey="value" fill="#82ca9d" name="Value ($K)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Closed won deals by month</CardDescription>
              </CardHeader>
              <CardContent>
                {formattedRevenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={formattedRevenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip 
                        formatter={(value: number, name: string) => {
                          if (name === 'revenue') return [`$${value.toFixed(0)}K`, 'Revenue'];
                          return [value, 'Deals'];
                        }}
                      />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue ($K)" strokeWidth={2} />
                      <Line yAxisId="right" type="monotone" dataKey="deals" stroke="#82ca9d" name="Deals" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No revenue data available yet. Close some deals to see trends!
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Two column layout for smaller charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Opportunities by Close Date */}
              <Card>
                <CardHeader>
                  <CardTitle>Opportunities by Close Date</CardTitle>
                  <CardDescription>Expected close dates for open opportunities</CardDescription>
                </CardHeader>
                <CardContent>
                  {formattedPipelineData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={formattedPipelineData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number, name: string) => {
                            if (name === 'value') return [`$${value.toFixed(0)}K`, 'Total Value'];
                            return [value, 'Opportunities'];
                          }}
                        />
                        <Legend />
                        <Bar dataKey="opportunities" fill="#8884d8" name="Opportunities" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No upcoming opportunities
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Opportunities by Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Opportunities by Type</CardTitle>
                  <CardDescription>Distribution of opportunity types</CardDescription>
                </CardHeader>
                <CardContent>
                  {formattedTypeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={formattedTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.type}: ${entry.count}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {formattedTypeData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No opportunity data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Leads by Source */}
              <Card>
                <CardHeader>
                  <CardTitle>Leads by Source</CardTitle>
                  <CardDescription>Lead generation channel performance</CardDescription>
                </CardHeader>
                <CardContent>
                  {formattedLeadData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={formattedLeadData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="source" type="category" width={120} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#0088FE" name="Leads" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No lead data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Revenue Forecast */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Forecast</CardTitle>
                <CardDescription>
                  Projected revenue based on pipeline and {forecastData ? `${Math.round(forecastData.winRate * 100)}%` : '--'} historical win rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                {formattedForecastData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={formattedForecastData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [`$${value.toFixed(0)}K`]}
                      />
                      <Legend />
                      <Bar dataKey="pipelineValue" fill="#8884d8" name="Pipeline Value ($K)" />
                      <Bar dataKey="forecastedRevenue" fill="#82ca9d" name="Forecasted Revenue ($K)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No forecast data available. Add opportunities with future close dates to see projections.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
