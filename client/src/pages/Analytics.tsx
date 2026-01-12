import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, Target, Users } from "lucide-react";

const COLORS = ["#2563eb", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#0891b2"];

export default function Analytics() {
  const { user, isAuthenticated } = useAuth();
  
  const { data: opportunities } = trpc.opportunities.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: leads } = trpc.leads.list.useQuery(undefined, {
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

        {/* Key Metrics */}
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
