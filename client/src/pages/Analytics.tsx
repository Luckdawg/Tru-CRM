import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, Target, Users, Clock, CheckCircle2, AlertTriangle } from "lucide-react";

const COLORS = ["#2563eb", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#0891b2"];

export default function Analytics() {
  const { user, isAuthenticated } = useAuth();
  
  const { data: opportunities } = trpc.opportunities.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: leads } = trpc.leads.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: salesMetrics } = trpc.analytics.salesCycleMetrics.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: forecast } = trpc.analytics.weightedPipelineForecast.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: healthScores } = trpc.analytics.dealHealthScores.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }

  // Pipeline by stage
  const pipelineByStage = opportunities?.reduce((acc, opp) => {
    const existing = acc.find(item => item.stage === opp.stage);
    if (existing) {
      existing.value += parseFloat(opp.amount);
      existing.count += 1;
    } else {
      acc.push({ stage: opp.stage, value: parseFloat(opp.amount), count: 1 });
    }
    return acc;
  }, [] as Array<{ stage: string; value: number; count: number }>);

  // Lead source distribution
  const leadsBySource = leads?.reduce((acc, lead) => {
    const existing = acc.find(item => item.source === lead.leadSource);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ source: lead.leadSource, count: 1 });
    }
    return acc;
  }, [] as Array<{ source: string; count: number }>);

  // Group health scores by status
  const healthyDeals = healthScores?.filter(d => d.healthStatus === 'Healthy') || [];
  const atRiskDeals = healthScores?.filter(d => d.healthStatus === 'At Risk') || [];
  const criticalDeals = healthScores?.filter(d => d.healthStatus === 'Critical') || [];

  // Win rate calculation
  const wonOpps = opportunities?.filter(opp => opp.stage === "Closed Won").length || 0;
  const lostOpps = opportunities?.filter(opp => opp.stage === "Closed Lost").length || 0;
  const winRate = wonOpps + lostOpps > 0 ? ((wonOpps / (wonOpps + lostOpps)) * 100).toFixed(1) : "0.0";

  // Total pipeline value
  const totalPipeline = opportunities?.reduce((sum, opp) => sum + parseFloat(opp.amount), 0) || 0;

  // Average deal size
  const avgDealSize = opportunities && opportunities.length > 0 
    ? (totalPipeline / opportunities.length).toFixed(0)
    : "0";

  // Lead score distribution
  const leadScoreRanges = leads?.reduce((acc, lead) => {
    const score = lead.score || 0;
    let range = "";
    if (score >= 80) range = "80-100 (Hot)";
    else if (score >= 60) range = "60-79 (Warm)";
    else if (score >= 40) range = "40-59 (Medium)";
    else if (score >= 20) range = "20-39 (Cold)";
    else range = "0-19 (Very Cold)";

    const existing = acc.find(item => item.range === range);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ range, count: 1 });
    }
    return acc;
  }, [] as Array<{ range: string; count: number }>);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <img src="/visium-v-logo.png" alt="Visium" className="h-10 cursor-pointer" />
            </Link>
            <h1 className="text-2xl font-bold text-primary">Sales Analytics</h1>
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
            <Button variant="ghost" size="sm" asChild><Link href="/pipeline">Pipeline</Link></Button>
            <Button variant="default" size="sm" asChild><Link href="/analytics">Analytics</Link></Button>
          </div>
        </div>
      </nav>

      <main className="container py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Sales Performance & Forecasting</h2>
          <p className="text-muted-foreground">Comprehensive analytics and insights</p>
        </div>

        {/* Sales Cycle Metrics from Analytics API */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Sales Cycle Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{salesMetrics?.winRate.toFixed(1) || '0.0'}%</div>
                <p className="text-xs text-muted-foreground">
                  {salesMetrics?.closedWon || 0} won / {(salesMetrics?.closedWon || 0) + (salesMetrics?.closedLost || 0)} closed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(salesMetrics?.avgDealSize || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  From {salesMetrics?.closedWon || 0} won deals
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Sales Cycle</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{salesMetrics?.avgCycleLength || 0} days</div>
                <p className="text-xs text-muted-foreground">From opportunity to close</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Pipeline</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{salesMetrics?.openOpportunities || 0}</div>
                <p className="text-xs text-muted-foreground">Active opportunities</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Weighted Forecast */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Weighted Pipeline Forecast</h3>
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Summary</CardTitle>
              <CardDescription>Probability-weighted revenue forecast by stage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pipeline Value</p>
                  <p className="text-3xl font-bold">
                    ${(forecast?.totalPipeline || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Weighted Forecast</p>
                  <p className="text-3xl font-bold text-primary">
                    ${(forecast?.totalWeighted || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {forecast?.byStage.map((stage) => (
                  <div key={stage.stage} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{stage.stage}</span>
                        <Badge variant="outline">{stage.count} deals</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Pipeline: ${stage.totalAmount.toLocaleString()} → 
                        Weighted: ${stage.weightedAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deal Health Dashboard */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Deal Health Dashboard</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Healthy Deals</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{healthyDeals.length}</div>
                <p className="text-xs text-muted-foreground">Score ≥ 70</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">At Risk</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{atRiskDeals.length}</div>
                <p className="text-xs text-muted-foreground">Score 40-69</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{criticalDeals.length}</div>
                <p className="text-xs text-muted-foreground">Score &lt; 40</p>
              </CardContent>
            </Card>
          </div>

          {(criticalDeals.length > 0 || atRiskDeals.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Deals Requiring Attention</CardTitle>
                <CardDescription>
                  Focus on these opportunities to improve win probability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...criticalDeals, ...atRiskDeals]
                    .sort((a, b) => a.healthScore - b.healthScore)
                    .slice(0, 10)
                    .map((deal) => (
                      <Link key={deal.opportunityId} href={`/opportunities/${deal.opportunityId}`}>
                        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{deal.opportunityName}</span>
                              <Badge 
                                variant={deal.healthStatus === 'Critical' ? 'destructive' : 'outline'}
                                className={deal.healthStatus === 'At Risk' ? 'bg-yellow-100 text-yellow-800' : ''}
                              >
                                {deal.healthStatus}
                              </Badge>
                              <Badge variant="outline">{deal.stage}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              ${parseFloat(deal.amount as any).toLocaleString()} • 
                              Score: {deal.healthScore}/100 • 
                              Closes in {deal.daysToClose} days
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {deal.factors.slice(0, 3).join(' • ')}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Original Charts Section */}
        <h3 className="text-lg font-semibold mb-4">Additional Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPipeline.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{opportunities?.length || 0} opportunities</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{winRate}%</div>
              <p className="text-xs text-muted-foreground">{wonOpps} won / {lostOpps} lost</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${avgDealSize}</div>
              <p className="text-xs text-muted-foreground">Per opportunity</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leads?.length || 0}</div>
              <p className="text-xs text-muted-foreground">In pipeline</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline by Stage</CardTitle>
              <CardDescription>Deal value distribution across sales stages</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pipelineByStage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Bar dataKey="value" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lead Sources</CardTitle>
              <CardDescription>Distribution of leads by acquisition channel</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={leadsBySource}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.source}: ${entry.count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {leadsBySource?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lead Score Distribution</CardTitle>
              <CardDescription>Lead quality segmentation by score ranges</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={leadScoreRanges}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#7c3aed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Opportunity Count by Stage</CardTitle>
              <CardDescription>Number of deals in each stage</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={pipelineByStage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
