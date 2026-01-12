import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

export default function Reports() {
  const { user, isAuthenticated } = useAuth();
  
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

  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }

  const isLoading = loadingPipeline || loadingRevenue || loadingType || loadingStage || loadingLeads;

  // Format data for charts
  const formattedPipelineData = pipelineData?.map(item => ({
    month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    opportunities: Number(item.count),
    value: Number(item.totalValue) / 1000, // Convert to thousands
  })) || [];

  const formattedRevenueData = revenueData?.map(item => ({
    month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    revenue: Number(item.revenue) / 1000, // Convert to thousands
    deals: Number(item.count),
  })) || [];

  const formattedStageData = stageData?.map(item => ({
    stage: item.stage,
    count: Number(item.count),
    value: Number(item.totalValue) / 1000,
  })) || [];

  const formattedTypeData = typeData?.map(item => ({
    type: item.type || 'Unknown',
    count: Number(item.count),
    value: Number(item.totalValue) / 1000,
  })) || [];

  const formattedLeadData = leadSourceData?.map(item => ({
    source: item.source,
    count: Number(item.count),
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

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading reports...</p>
          </div>
        ) : (
          <div className="space-y-6">
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
                          {formattedTypeData.map((entry, index) => (
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
          </div>
        )}
      </main>
    </div>
  );
}
