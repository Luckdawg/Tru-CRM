import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { BarChart3, Building2, DollarSign, TrendingUp, Users, FileText, Briefcase, AlertTriangle, AlertCircle, Activity } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const { data: pipelineData } = trpc.dashboard.pipelineByStage.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: activeAccountsCount } = trpc.dashboard.activeAccountsCount.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: winRate } = trpc.dashboard.winRate.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: avgDealSize } = trpc.dashboard.averageDealSize.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Widget data
  const { data: topAtRiskOpps } = trpc.widgets.topAtRiskOpportunities.useQuery({ limit: 5 }, {
    enabled: isAuthenticated,
  });
  const { data: lowEngagementAccounts } = trpc.widgets.lowEngagementAccounts.useQuery({ limit: 5 }, {
    enabled: isAuthenticated,
  });
  const { data: winRateTrend } = trpc.widgets.winRateTrend.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: projects } = trpc.projects.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Calculate at-risk and critical projects
  const atRiskProjects = projects?.filter((p: any) => p.healthStatus === "At Risk") || [];
  const criticalProjects = projects?.filter((p: any) => p.healthStatus === "Critical") || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <img src="/visium-logo.png" alt="Visium Technologies" className="h-16 mx-auto mb-4" />
            <CardTitle className="text-2xl">Welcome to Visium CRM</CardTitle>
            <CardDescription>
              Please sign in to access your customer relationship management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" size="lg">
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/visium-v-logo.png" alt="Visium" className="h-10" />
            <h1 className="text-2xl font-bold text-primary">Visium CRM</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
            <Button variant="outline" size="sm" onClick={() => trpc.auth.logout.useMutation()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-card">
        <div className="container">
          <div className="flex gap-1 py-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/leads">Leads</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/accounts">Accounts</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/contacts">Contacts</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/opportunities">Opportunities</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/projects">Projects</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/cases">Support</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Sales Dashboard</h2>
          <p className="text-muted-foreground">Overview of your sales pipeline and key metrics</p>
        </div>

        {/* Health Alert Banner */}
        {(criticalProjects.length > 0 || atRiskProjects.length > 0) && (
          <Card className="mb-6 border-l-4 border-l-red-500 bg-red-50">
            <CardHeader>
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <CardTitle className="text-red-900">Project Health Alerts</CardTitle>
                  <CardDescription className="text-red-700">
                    {criticalProjects.length > 0 && (
                      <span className="font-medium">
                        {criticalProjects.length} critical project{criticalProjects.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {criticalProjects.length > 0 && atRiskProjects.length > 0 && ' and '}
                    {atRiskProjects.length > 0 && (
                      <span className="font-medium">
                        {atRiskProjects.length} at-risk project{atRiskProjects.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {' require immediate attention'}
                  </CardDescription>
                </div>
                <Button asChild variant="outline" size="sm" className="bg-white">
                  <Link href="/projects">View Projects</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {criticalProjects.slice(0, 3).map((project: any) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="flex items-center gap-2 p-2 rounded hover:bg-red-100 transition-colors cursor-pointer">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-900">{project.projectName}</span>
                      <span className="text-xs text-red-700 ml-auto">Critical</span>
                    </div>
                  </Link>
                ))}
                {atRiskProjects.slice(0, 3).map((project: any) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="flex items-center gap-2 p-2 rounded hover:bg-yellow-100 transition-colors cursor-pointer">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-900">{project.projectName}</span>
                      <span className="text-xs text-yellow-700 ml-auto">At Risk</span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/opportunities?filter=open">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Pipeline</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${pipelineData?.reduce((sum, stage) => sum + Number(stage.totalValue || 0), 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {pipelineData?.reduce((sum, stage) => sum + Number(stage.count || 0), 0)} opportunities
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/accounts">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Accounts</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeAccountsCount ?? '--'}</div>
                <p className="text-xs text-muted-foreground mt-1">Across all regions</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/analytics">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{winRate !== null ? `${winRate}%` : '--'}</div>
                <p className="text-xs text-muted-foreground mt-1">Last 90 days</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/analytics">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Deal Size</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgDealSize ? `$${Math.round(avgDealSize).toLocaleString()}` : '--'}</div>
                <p className="text-xs text-muted-foreground mt-1">This quarter</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Dashboard Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top At-Risk Opportunities Widget */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>At-Risk Opportunities</CardTitle>
                  <CardDescription>Deals requiring immediate attention</CardDescription>
                </div>
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              {topAtRiskOpps && topAtRiskOpps.length > 0 ? (
                <div className="space-y-3">
                  {topAtRiskOpps.map((opp: any) => (
                    <Link key={opp.id} href={`/opportunities/${opp.id}`}>
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex-1">
                          <p className="font-medium">{opp.opportunityName}</p>
                          <p className="text-sm text-muted-foreground">{opp.accountName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${opp.amount ? parseFloat(opp.amount.toString()).toLocaleString() : '0'}</p>
                          <p className="text-xs text-red-600">Health: {opp.healthScore || 0}/100</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No at-risk opportunities</p>
              )}
            </CardContent>
          </Card>

          {/* Low Engagement Accounts Widget */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Low Engagement Accounts</CardTitle>
                  <CardDescription>Accounts needing attention</CardDescription>
                </div>
                <Activity className="h-5 w-5 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              {lowEngagementAccounts && lowEngagementAccounts.length > 0 ? (
                <div className="space-y-3">
                  {lowEngagementAccounts.map((account: any) => (
                    <Link key={account.id} href={`/accounts/${account.id}`}>
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex-1">
                          <p className="font-medium">{account.accountName}</p>
                          <p className="text-sm text-muted-foreground">{account.industry || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{account.engagementScore}/100</p>
                          <p className="text-xs text-yellow-600">{account.daysSinceLastActivity} days</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">All accounts engaged</p>
              )}
            </CardContent>
          </Card>

          {/* Win Rate Trend Widget */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Win Rate Trend</CardTitle>
                  <CardDescription>Last 6 months performance</CardDescription>
                </div>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              {winRateTrend && winRateTrend.length > 0 ? (
                <div className="space-y-2">
                  {winRateTrend.map((trend: any, index: number) => (
                    <div key={index} className="flex items-center gap-4">
                      <span className="text-sm font-medium w-24">{trend.month}</span>
                      <div className="flex-1">
                        <div className="h-8 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-600 flex items-center justify-end pr-2"
                            style={{ width: `${trend.winRate}%` }}
                          >
                            <span className="text-xs text-white font-medium">{trend.winRate}%</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground w-24 text-right">
                        {trend.won}W / {trend.lost}L
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/leads">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Manage Leads</CardTitle>
                <CardDescription>Track and qualify new leads</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/opportunities">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Briefcase className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Pipeline</CardTitle>
                <CardDescription>View and manage opportunities</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/accounts">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Building2 className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Accounts</CardTitle>
                <CardDescription>Manage customer accounts</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/contacts">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Contacts</CardTitle>
                <CardDescription>View all contacts</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/projects">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <FileText className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Projects</CardTitle>
                <CardDescription>Track onboarding and implementations</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/cases">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <FileText className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Support Cases</CardTitle>
                <CardDescription>Manage customer support tickets</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
